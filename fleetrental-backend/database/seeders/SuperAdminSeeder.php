<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@fleetrental.com',
            'password' => Hash::make('admin123'),
        ]);

        $this->command->info('✓ Super Admin créé avec succès !');
        $this->command->info('  Email    : admin@fleetrental.com');
        $this->command->info('  Password : admin123');
    }
}