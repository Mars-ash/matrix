<?php

namespace App\Policies;

use App\Models\TrialSession;
use App\Models\User;

class TrialPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TrialSession $session): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isController();
    }

    public function update(User $user, TrialSession $session): bool
    {
        return $user->isController();
    }

    public function delete(User $user, TrialSession $session): bool
    {
        return $user->isController();
    }
}
