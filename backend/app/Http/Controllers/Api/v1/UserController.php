<?php

namespace App\Http\Controllers\Api\v1;

use App\Actions\Users\DeleteUser;
use App\Actions\Users\GetUsers;
use App\Actions\Users\ShowUser;
use App\Actions\Users\StoreUser;
use App\Actions\Users\UpdateUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
   protected User $user;
   protected $userData;
   public function __construct(User $user)
   {
      $this->user = $user;
      $this->userData = Auth::user();
   }
   public function index(GetUsers $getUsers)
   {
      $users = $getUsers->execute($this->userData->organization_id);
      return apiResponse($users, 'Users fetched successfully');
   }

   public function store(StoreUserRequest $request, StoreUser $storeUser)
   {
      $user = $storeUser->execute($request->validated(), $this->userData->organization_id);
      if ($user === "not found") {
         return apiResponse(null, 'Organization not found.', false, 404);
      }
      if (!$user) {
         return apiResponse(null, 'User creation failed', false, 404);
      }
      return apiResponse(new UserResource($user), 'User created successfully', true, 201);
   }

   public function show($id, ShowUser $showUser) //changed User $user to $id to prevent laravel from throwing 404 when no user found instantly after the query
   {
      $user = $showUser->execute($id, $this->userData->organization_id);
      if (!$user) {
         return apiResponse(null, 'User not found within your organization', false, 404);
      }
      return apiResponse($user, 'User details fetched successfully');
   }

   public function update(UpdateUserRequest $request, User $user, UpdateUser $updateUser)
   {
      $updated = $updateUser->execute($user, $request->validated(), $this->userData->organization_id);
      if ($updated === "not found") {
         return apiResponse(null, 'User not found.', false, 404);
      }
      if (!$updated) {
         return apiResponse(null, 'Failed to update user.', false, 500);
      }
      return apiResponse(new UserResource($user), 'User updated successfully');
   }

   public function destroy(User $user, DeleteUser $deleteUser)
   {
      $result = $deleteUser->execute($user, $this->userData->organization_id);
      if ($result === "not found") {
         return apiResponse(null, 'User not found.', false, 404);
      }
      if ($result === false) {
         return apiResponse(null, 'User cannot be deleted because they have assigned tasks.', false, 400);
      }
      if ($result === null) {
         return apiResponse(null, 'Failed to delete user.', false, 500);
      }
      return apiResponse('', 'User deleted successfully');
   }
}
