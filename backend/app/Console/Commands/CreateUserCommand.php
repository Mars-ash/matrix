<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateUserCommand extends Command
{
    protected $signature = 'user:create 
                            {name? : Full name of the user} 
                            {email? : Email address} 
                            {password? : Plain text password} 
                            {--role=controller : Role (controller or viewer)}';

    protected $description = 'Create a new user with controller or viewer role';

    public function handle(): int
    {
        $name = $this->argument('name') ?? $this->ask('Name');
        $email = $this->argument('email') ?? $this->ask('Email');
        $password = $this->argument('password') ?? $this->secret('Password');
        $role = $this->option('role') ?? $this->choice('Role', ['controller', 'viewer'], 0);

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => $role,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:controller,viewer'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => $role,
        ]);

        $this->info("User [{$user->name}] with role [{$user->role}] created successfully!");
        $this->table(
            ['ID', 'Name', 'Email', 'Role', 'Created At'],
            [[$user->id, $user->name, $user->email, $user->role, $user->created_at->toDateTimeString()]]
        );

        return self::SUCCESS;
    }
}
