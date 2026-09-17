<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isController() ?? false;
    }

    public function rules(): array
    {
        return [
            'id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'customer' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'in:BMI,BKP'],
        ];
    }
}
