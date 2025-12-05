<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskPositionRequest extends FormRequest
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
            'task_id' => 'required|integer|exists:tasks,id',
            'context' => 'required|string|in:project,all_projects,kanban_status',
            'context_id' => 'nullable|integer',
            'position' => 'required|integer|min:1',
            'task_ids' => 'nullable|array',
            'task_ids.*' => 'integer|exists:tasks,id',
        ];
    }
}
