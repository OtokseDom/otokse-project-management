<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // return parent::toArray($request);
        return [
            'id'            => $this->id,
            'file_url'      => url('storage/' . $this->file_path),
            'original_name' => $this->original_name,
            'file_type'     => $this->file_type,
            'created_at'    => $this->created_at,
        ];
    }
}
