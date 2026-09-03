<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJORequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isController() ?? false;
    }

    public function rules(): array
    {
        return [
            'joNumber' => ['required', 'string', 'max:255', 'unique:jos,jo_number'],
            'product' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'targetDate' => ['nullable', 'date'],
            'categories' => ['nullable', 'array'],
            'categories.*.label' => ['required_with:categories', 'string', 'max:255'],
            'categories.*.kind' => ['required_with:categories', 'in:Part,Component'],
            'categories.*.isCustom' => ['nullable', 'boolean'],
        ];
    }
}
