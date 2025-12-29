<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
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
            'id'             => $this->id,
            'organization_id' => $this->organization_id,
            'epic_id' => $this->epic_id,
            'status_id' => $this->status_id,
            'title'          => $this->title,
            'description'    => $this->description,
            // 'target_date'    => $this->target_date,
            // 'estimated_date' => $this->estimated_date,
            'start_date'     => $this->start_date,
            'end_date'       => $this->end_date,
            'actual_date'    => $this->actual_date,
            'days_estimate'  => $this->days_estimate,
            'days_taken'     => $this->days_taken,
            'delay_days'    => $this->delay_days,
            'delay_reason'   => $this->delay_reason,
            'priority'       => $this->priority,
            'remarks'        => $this->remarks,
            'created_at'     => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at->format('Y-m-d H:i:s'),
            'epic' => $this->whenLoaded('epic', function () {
                return $this->epic ? [
                    'title' => $this->epic->title,
                ] : null;
            }),
            'status' => $this->whenLoaded('status', function () {
                return $this->status ? [
                    'name' => $this->status->name,
                    'color' => $this->status->color
                ] : null;
            }),
        ];
    }
}
