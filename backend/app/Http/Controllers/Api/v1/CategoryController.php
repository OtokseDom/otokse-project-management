<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Actions\Categories\GetCategories;
use App\Actions\Categories\StoreCategory;
use App\Actions\Categories\ShowCategory;
use App\Actions\Categories\UpdateCategory;
use App\Actions\Categories\DeleteCategory;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    protected $userData;

    public function __construct()
    {
        $this->userData = Auth::user();
    }

    public function index(GetCategories $getCategories)
    {
        $categories = $getCategories->execute($this->userData->organization_id);
        return apiResponse($categories, 'Categories fetched successfully');
    }

    public function store(StoreCategoryRequest $request, StoreCategory $storeCategory)
    {
        $category = $storeCategory->execute($request->validated(), $this->userData->organization_id);

        if ($category === "not found") {
            return apiResponse(null, 'Organization not found.', false, 404);
        }
        if (!$category) {
            return apiResponse(null, 'Category creation failed', false, 404);
        }

        return apiResponse(new CategoryResource($category), 'Category created successfully', true, 201);
    }

    public function show(Category $category, ShowCategory $showCategory)
    {
        $details = $showCategory->execute($category->id, $this->userData->organization_id);

        if (!$details) {
            return apiResponse(null, 'Category not found', false, 404);
        }

        return apiResponse(new CategoryResource($details), 'Category details fetched successfully');
    }

    public function update(UpdateCategoryRequest $request, Category $category, UpdateCategory $updateCategory)
    {
        $updated = $updateCategory->execute($category, $request->validated(), $this->userData->organization_id);

        if ($updated === "not found") {
            return apiResponse(null, 'Category not found.', false, 404);
        }
        if (!$updated) {
            return apiResponse(null, 'Failed to update category.', false, 500);
        }

        return apiResponse(new CategoryResource($category), 'Category updated successfully');
    }

    public function destroy(Category $category, DeleteCategory $deleteCategory)
    {
        $result = $deleteCategory->execute($category, $this->userData->organization_id);

        if ($result === "not found") {
            return apiResponse(null, 'Category not found.', false, 404);
        }
        if ($result === false) {
            return apiResponse(null, 'Category cannot be deleted because they have assigned tasks.', false, 400);
        }
        if ($result === null) {
            return apiResponse(null, 'Failed to delete category.', false, 500);
        }

        return apiResponse('', 'Category deleted successfully');
    }
}
