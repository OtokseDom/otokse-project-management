<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskDiscussionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or add policies if needed
    }

    public function rules(): array
    {
        return [
            'task_id'   => 'required|exists:tasks,id',
            'content'   => 'required|string',
            'parent_id' => 'nullable|exists:task_discussions,id',
            'attachments.*' => 'nullable|file|max:5120', // each attachment max 5MB
        ];
    }
}
