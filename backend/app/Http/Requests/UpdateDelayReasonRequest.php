<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDelayReasonRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            // 'code' => 'required|string|max:100|unique:delay_reasons,code',
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('delay_reasons', 'code')
                    ->where('organization_id', $this->organization_id)
                    ->ignore($this->delay_reason->id),
            ],
            'category' => 'required|string|max:100',
            'impact_level' => 'required|in:positive,neutral,negative',
            'severity' => 'required|integer|min:1|max:5',
            'is_valid' => 'boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
