<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TaskDiscussionAttachmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'file_url'      => url('storage/' . $this->file_path),
            'original_name' => $this->original_name,
            'file_type'     => $this->file_type,
            'created_at'    => $this->created_at->toDateTimeString(),
        ];
    }
}
