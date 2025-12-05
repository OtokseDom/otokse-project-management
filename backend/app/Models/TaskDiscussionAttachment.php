<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskDiscussionAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'discussion_id',
        'file_path',
        'original_name',
        'file_type',
    ];

    public function discussion()
    {
        return $this->belongsTo(TaskDiscussion::class);
    }
}
