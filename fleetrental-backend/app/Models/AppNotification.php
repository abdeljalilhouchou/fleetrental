<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read',
    ];

    protected $casts = [
        'data' => 'array',
        'read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Crée une notification pour tous les admins d'une entreprise.
     */
    public static function notifyCompanyAdmins(int $companyId, string $type, string $title, string $body, array $data = []): void
    {
        $admins = User::where('company_id', $companyId)
            ->where('role', 'company_admin')
            ->get();

        foreach ($admins as $admin) {
            self::create([
                'user_id' => $admin->id,
                'type'    => $type,
                'title'   => $title,
                'body'    => $body,
                'data'    => $data,
                'read'    => false,
            ]);
        }
    }
}
