<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    // Used for validating no_grandchildren in AppServiceProvider
    protected function prepareForValidation()
    {
        $this->merge([
            'id' => $this->route('task') ? $this->route('task')->id : null,
        ]);
        if ($this->parent_id === 0 || $this->parent_id === '0') {
            $this->merge(['parent_id' => null]);
        }
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
            'title' => 'required|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'category_id' => 'nullable|exists:categories,id',
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('tasks', 'id'),
                'no_grandchildren',
                function ($attribute, $value, $fail) {
                    if ($value && $this->id && (int) $value === (int) $this->id) {
                        $fail('A task cannot be its own parent.');
                    }
                },
            ],
            'assignees' => 'nullable|array',
            'assignees.*' => 'exists:users,id|distinct',
            'description' => 'nullable|string',
            'expected_output' => 'nullable|string',
            'weight' => 'nullable|integer',
            'effort_estimate' => 'nullable|integer',
            'effort_taken' => 'nullable|integer',
            // 'assignee_id' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'actual_date' => 'nullable|date',
            'days_estimate' => 'nullable|numeric|min:0',
            'days_taken' => 'nullable|numeric|min:0',
            'start_time' => 'nullable|date_format:H:i:s',
            'end_time' => 'nullable|date_format:H:i:s|after:start_time',
            'actual_time' => 'nullable|date_format:H:i:s',
            'time_estimate' => 'nullable|numeric|min:0.1',
            'time_taken' => 'nullable|numeric|min:0',
            'delay' => 'nullable|numeric|min:0',
            'delay_days' => 'nullable|numeric|min:0',
            'delay_reason' => 'nullable|string',
            'performance_rating' => 'nullable|integer|min:0|max:5',
            'remarks' => 'nullable|string',
            'attachments.*' => 'nullable|file|max:5120', // each attachment max 5MB
            'priority' => [
                'nullable',
                Rule::in(['Low', 'Medium', 'High', 'Urgent', 'Critical']),
            ],
            'position' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'organization_id.required' => 'Organization is required.',
            'assignees.*.distinct' => 'Each assignee must be unique for this task.',
            'assignees.*.exists' => 'Selected assignee does not exist.',
            'parent_id.exists' => 'The selected parent task does not exist.',
            'parent_id.no_grandchildren' => 'Tasks can only be a parent or a child, but not both (no grandchildren allowed).',
            'title.required' => 'Title is required.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
            'end_time.after' => 'The end time must be after the start time.',
            'performance_rating.min' => 'Performance rating must be at least 0.',
            'performance_rating.max' => 'Performance rating may not be greater than 5.',
            'time_estimate' => 'Time estimate must be greater than 0',
            'time_taken' => 'Actual time must be greater than 0',
            'delay' => 'Delay time must be greater than 0 or set to null',
        ];
    }
}