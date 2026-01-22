<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DelayReasonResource extends JsonResource
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
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'name' => $this->name,
            'category' => $this->category,
            'impact_level' => $this->impact_level,
            'severity' => $this->severity,
            'is_valid' => $this->is_valid,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}