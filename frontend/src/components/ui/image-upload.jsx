import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useToast } from "@/contexts/ToastContextProvider";

const ImageUpload = ({ taskId, initialImages = [], onChange, disabled = false, maxFiles = 10 }) => {
	const [images, setImages] = useState(initialImages);
	const [uploading, setUploading] = useState(false);
	const [deletingIds, setDeletingIds] = useState(new Set());
	const showToast = useToast();

	useEffect(() => {
		setImages(initialImages);
	}, [initialImages]);

	const handleFileSelect = async (event) => {
		const files = Array.from(event.target.files);
		if (!files.length) return;

		// Check file limit
		if (images.length + files.length > maxFiles) {
			showToast("Error", `Maximum ${maxFiles} images allowed`, 3000, "fail");
			return;
		}

		// Validate file types
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
		const invalidFiles = files.filter((file) => !validTypes.includes(file.type));

		if (invalidFiles.length > 0) {
			showToast("Error", "Only image files (JPEG, PNG, GIF, WebP) are allowed", 3000, "fail");
			return;
		}

		// Check file sizes (5MB limit per file)
		const maxSize = 5 * 1024 * 1024; // 5MB
		const oversizedFiles = files.filter((file) => file.size > maxSize);

		if (oversizedFiles.length > 0) {
			showToast("Error", "Each image must be smaller than 5MB", 3000, "fail");
			return;
		}

		if (!taskId) {
			// If no taskId, store files temporarily for upload after task creation
			const tempImages = files.map((file) => ({
				id: `temp-${Date.now()}-${Math.random()}`,
				file,
				url: URL.createObjectURL(file),
				original_name: file.name,
				isTemp: true,
			}));

			const newImages = [...images, ...tempImages];
			setImages(newImages);
			onChange?.(newImages);
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("task_id", taskId);
			files.forEach((file) => {
				formData.append("images[]", file);
			});

			const response = await axiosClient.post(API().task_upload_image(), formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			const uploadedImages = response.data.data;
			const newImages = [...images, ...uploadedImages];
			setImages(newImages);
			onChange?.(newImages);

			showToast("Success", `${files.length} image(s) uploaded successfully`, 3000);
		} catch (error) {
			console.error("Upload error:", error);
			showToast("Error", error.response?.data?.message || "Failed to upload images", 3000, "fail");
		} finally {
			setUploading(false);
			// Clear the input
			event.target.value = "";
		}
	};

	const handleDelete = async (imageId, isTemp = false) => {
		if (isTemp) {
			// Remove temporary image
			const newImages = images.filter((img) => img.id !== imageId);
			setImages(newImages);
			onChange?.(newImages);

			// Revoke object URL to prevent memory leaks
			const imageToDelete = images.find((img) => img.id === imageId);
			if (imageToDelete && imageToDelete.url) {
				URL.revokeObjectURL(imageToDelete.url);
			}
			return;
		}

		setDeletingIds((prev) => new Set([...prev, imageId]));

		try {
			await axiosClient.delete(API().task_delete_image(imageId));

			const newImages = images.filter((img) => img.id !== imageId);
			setImages(newImages);
			onChange?.(newImages);

			showToast("Success", "Image deleted successfully", 3000);
		} catch (error) {
			console.error("Delete error:", error);
			showToast("Error", error.response?.data?.message || "Failed to delete image", 3000, "fail");
		} finally {
			setDeletingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(imageId);
				return newSet;
			});
		}
	};

	return (
		<div className="space-y-4">
			{/* Upload Button */}
			<div className="flex items-center gap-4">
				<Button type="button" variant="outline" disabled={disabled || uploading || images.length >= maxFiles} className="relative">
					<Input
						type="file"
						multiple
						accept="image/*"
						onChange={handleFileSelect}
						disabled={disabled || uploading || images.length >= maxFiles}
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					/>
					{uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
					{uploading ? "Uploading..." : "Upload Images"}
				</Button>

				{images.length > 0 && (
					<span className="text-sm text-muted-foreground">
						{images.length} of {maxFiles} images
					</span>
				)}
			</div>

			{/* Image Grid */}
			{images.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{images.map((image) => (
						<Card key={image.id} className="relative overflow-hidden">
							<CardContent className="p-2">
								<div className="relative aspect-square">
									<img src={image.url} alt={image.original_name} className="w-full h-full object-cover rounded" />

									{/* Action Buttons */}
									<div className="absolute top-1 right-1 flex gap-1">
										{/* Preview Button */}
										<Dialog>
											<DialogTrigger asChild>
												<Button size="sm" variant="secondary" className="h-6 w-6 p-0 opacity-80 hover:opacity-100">
													<Eye className="w-3 h-3" />
												</Button>
											</DialogTrigger>
											<DialogContent className="max-w-4xl">
												<DialogHeader>
													<DialogTitle>{image.original_name}</DialogTitle>
												</DialogHeader>
												<div className="flex justify-center">
													<img src={image.url} alt={image.original_name} className="max-w-full max-h-[70vh] object-contain" />
												</div>
											</DialogContent>
										</Dialog>

										{/* Delete Button */}
										<Button
											type="button"
											size="sm"
											variant="destructive"
											className="h-6 w-6 p-0 opacity-80 hover:opacity-100"
											onClick={() => handleDelete(image.id, image.isTemp)}
											disabled={deletingIds.has(image.id) || disabled}
										>
											{deletingIds.has(image.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
										</Button>
									</div>

									{/* Temp indicator */}
									{image.isTemp && <div className="absolute bottom-1 left-1 text-xs bg-yellow-500 text-white px-1 rounded">Pending</div>}
								</div>

								{/* File name */}
								<p className="text-xs text-muted-foreground mt-1 truncate" title={image.original_name}>
									{image.original_name}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Helper Text */}
			<p className="text-xs text-muted-foreground">Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB per image. Max {maxFiles} images.</p>
		</div>
	);
};

export default ImageUpload;
