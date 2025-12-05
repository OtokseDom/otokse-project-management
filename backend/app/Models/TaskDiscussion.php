<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TaskDiscussion extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'parent_id',
        'content',
    ];

    // Relationships
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(TaskDiscussion::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(TaskDiscussion::class, 'parent_id');
    }

    public function attachments()
    {
        return $this->hasMany(TaskDiscussionAttachment::class, 'discussion_id');
    }

    /* -------------------------------------------------------------------------- */
    /*                               Business Logic                               */
    /* -------------------------------------------------------------------------- */

    public function getDiscussions($organization_id)
    {
        return $this->whereHas('task', function ($query) use ($organization_id) {
            $query->where('organization_id', $organization_id);
        })
            ->with(['user', 'replies.user', 'attachments'])
            ->latest()
            ->get();
    }

    // Store a new discussion
    public function storeDiscussion($request, $user)
    {
        $discussion = $this->create(array_merge(
            $request->validated(),
            ['user_id' => $user->id]
        ));

        if (!$discussion) return null;

        if ($request->hasFile('attachments')) {
            $discussion->addAttachments($request->file('attachments'));
        }

        return $discussion->load(['user', 'attachments', 'replies']);
    }

    // Show a single discussion
    public function showDiscussion($id, $user)
    {
        return $this->with(['user', 'replies.user', 'attachments'])
            ->find($id);
    }

    // Update discussion     
    public function updateDiscussion($request, $discussion, $user)
    {
        $discussion->fill([
            'content' => $request->content ?? $discussion->content,
        ]);
        $discussion->save();
        if ($request->hasFile('attachments')) {
            $discussion->addAttachments($request->file('attachments'));
        }

        return $discussion->fresh(['user', 'attachments', 'replies']);
    }

    // Delete discussion (cascade replies & attachments)
    public function deleteDiscussion($discussion, $user)
    {
        // Delete attachments from storage
        foreach ($discussion->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Delete all replies recursively
        foreach ($discussion->replies as $reply) {
            $this->deleteDiscussion($reply, $user);
        }

        return $discussion->delete();
    }

    // Add attachments helper
    public function addAttachments(array $files)
    {
        $orgId = $this->task?->organization_id ?? null;

        if (!$orgId) {
            // fallback or throw exception
            $orgId = 'default';
        }

        foreach ($files as $file) {
            $path = $file->store("task_discussion_attachments/{$orgId}", 'public');

            $this->attachments()->create([
                'file_path'     => $path,
                'original_name' => $file->getClientOriginalName(),
                'file_type'     => $file->getClientMimeType(),
                'file_size'     => $file->getSize(),
            ]);
        }
    }
}
