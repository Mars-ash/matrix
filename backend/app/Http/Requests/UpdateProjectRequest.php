<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isController() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'customer' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'in:BMI,BKP'],
        ];
    }
}
