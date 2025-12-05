<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
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
            // 'organization_id' => 'required|exists:organizations,id',
            'name' => 'required|string|max:255',
            'role' => 'required|in:Superadmin,Admin,Manager,Employee',
            'position' => 'nullable|string|max:255',
            'dob' => 'nullable|date_format:Y-m-d',
            'email' => 'required|email|unique:users,email,' . $this->user->id, // Ignore the current user's email
            'password' => 'sometimes|filled|string|min:8', //sometimes null if value is unchanged
            'status' => 'required|string|in:active,inactive,pending,rejected,banned',
        ];
    }
}
