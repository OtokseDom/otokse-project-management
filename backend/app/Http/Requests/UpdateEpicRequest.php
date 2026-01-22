<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEpicRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'organization_id' => 'required|exists:organizations,id',
            'status_id' => 'nullable|exists:task_statuses,id',
            'title'           => 'required|string|max:255',
            'owner_id' => 'nullable|exists:users,id',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('epics')
                    ->where(
                        fn($q) =>
                        $q->where('organization_id', $this->organization_id)
                    ),
            ],
            'description'     => 'nullable|string',
            'start_date'      => 'nullable|date',
            'end_date'        => 'nullable|date',
            'priority'        => 'nullable|in:Low,Medium,High,Urgent,Critical',
            'remarks'         => 'nullable|string',
        ];
    }
}