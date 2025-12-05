<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'status_id' => $this->status_id,
            'title' => $this->title,
            'project_id' => $this->project_id,
            'category_id' => $this->category_id,
            // 'assignee_id' => $this->assignee_id,
            'parent_id' => $this->parent_id,
            'description' => $this->description,
            'expected_output' => $this->expected_output,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'actual_date' => $this->actual_date,
            'days_estimate' => $this->days_estimate,
            'days_taken' => $this->days_taken,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'actual_time' => $this->actual_time,
            'time_estimate' => $this->time_estimate,
            'time_taken' => $this->time_taken,
            'delay' => $this->delay,
            'delay_days' => $this->delay_days,
            'delay_reason' => $this->delay_reason,
            'performance_rating' => $this->performance_rating,
            'remarks' => $this->remarks,
            'priority' => $this->priority,
            'position' => $this->position,
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? $this->updated_at->format('Y-m-d H:i:s') : null,
            'discussions' => TaskDiscussionResource::collection($this->whenLoaded('discussions')),
            'attachments' => TaskAttachmentResource::collection($this->whenLoaded('attachments')),
            'assignees' => $this->assignees && $this->assignees->count() > 0
                ? $this->assignees->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'position' => $user->position,
                    ];
                })
                : null,
            'status' => $this->whenLoaded('status', function () {
                return $this->status ? [
                    'name' => $this->status->name,
                    'color' => $this->status->color
                ] : null;
            }),
            'project' => $this->whenLoaded('project', function () {
                return $this->project ? [
                    'title' => $this->project->title
                ] : null;
            }),
            'category' => $this->category ? new CategoryResource($this->category) : null,
            'parent' => $this->whenLoaded('parent', function () {
                return $this->parent ? [
                    'id' => $this->parent->id,
                    'title' => $this->parent->title,
                ] : null;
            }),
            'children' => $this->whenLoaded('children', function () {
                return $this->children && $this->children->count() > 0
                    ? $this->children->map(function ($child) {
                        // Use the same resource recursively to include full fields
                        return (new self($child))->toArray(request());
                    })
                    : null;
            }),
        ];
    }
}
