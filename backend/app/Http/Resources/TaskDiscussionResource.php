<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TaskDiscussionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'task_id'    => $this->task_id,
            'user'       => new UserResource($this->whenLoaded('user')),
            'content'    => $this->content,
            'parent_id'  => $this->parent_id,
            'replies'    => TaskDiscussionResource::collection($this->whenLoaded('replies')),
            'attachments' => TaskDiscussionAttachmentResource::collection($this->whenLoaded('attachments')),
            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
        ];
    }
}
