<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Resources\UserResource;
use App\Models\Organization;
use App\Models\User;
use App\Services\MasterDataGeneratorService;
use Dotenv\Exception\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function signup(SignupRequest $request)
    {
        $data = $request->validated();
        $status = "pending";
        $organization = null;
        if (!empty($data['organization_name']) && empty($data['organization_code'])) {
            // If creating new organization
            $organization = Organization::create([
                'name' => $data['organization_name'],
                'description' => '',
                'code' => strtoupper(uniqid('DOM')),
            ]);
            $status = "active";
            if ($organization) {
                MasterDataGeneratorService::generate($organization->id);
            }
        } elseif (!empty($data['organization_code'] && empty($data['organization_name']))) {
            // If has existing organization code
            $organization = Organization::select('id')
                ->where('code', $data['organization_code'])
                ->first();
            if (!$organization)
                return apiResponse(null, 'Organization not found', false, 404, ['organization' => ['Organization not Found']]);
        }
        /** @var User $user */
        $user = User::create([
            'organization_id' => $organization->id,
            'name' => $data['name'],
            'role' => $data['role'],
            'email' => $data['email'],
            'position' => $data['position'],
            'dob' => $data['dob'],
            'password' => bcrypt($data['password']),
            'status' => $status,
        ]);

        $token = $user->createToken('main')->plainTextToken;
        $user->load('organization'); // eager load org data

        return apiResponse([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Successfully Registered');
    }

    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        if (!Auth::attempt($credentials)) {
            return response([
                'message' => 'Provided email address or password is incorrect'
            ], 422);
        }
        /** @var User $user */
        $user = Auth::user();
        $token = $user->createToken('main')->plainTextToken;

        return response(compact('user', 'token'));
    }

    public function logout(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $user->currentAccessToken()->delete();
        return response('', 204);
    }
}
