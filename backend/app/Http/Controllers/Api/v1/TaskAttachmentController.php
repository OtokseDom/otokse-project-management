<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TaskAttachment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TaskAttachmentController extends Controller
{
    public function destroy($id)
    {
        $attachment = TaskAttachment::findOrFail($id);

        // Delete physical file
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        if (!$attachment->delete()) {
            return apiResponse(null, 'Failed to delete attachment.', false, 500);
        }
        return apiResponse('', 'Attachment deleted successfully');
    }
}
