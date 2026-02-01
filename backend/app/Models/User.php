<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
// TOOD: Role based restrictions
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Somehow not working without these 2 lines
    protected $table = 'users';
    protected $connection = 'mysql';
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'organization_id',
        'name',
        'dob',
        'position',
        'role',
        'email',
        'password',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relationship with Organization
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeForOrganization($query, $organization_id)
    {
        return $query->where('organization_id', $organization_id);
    }
}
