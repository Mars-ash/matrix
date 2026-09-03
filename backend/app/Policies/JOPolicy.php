<?php

namespace App\Policies;

use App\Models\JO;
use App\Models\User;

class JOPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, JO $jo): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isController();
    }

    public function update(User $user, JO $jo): bool
    {
        return $user->isController();
    }

    public function delete(User $user, JO $jo): bool
    {
        return $user->isController();
    }
}
