"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import axiosClient from "@/axios.client";
import { useToast } from "@/contexts/ToastContextProvider";
import { useState } from "react";
import { API } from "@/constants/api";
import { DialogClose } from "@radix-ui/react-dialog";

export default function TaskAttachments({ existingAttachments, setExistingAttachments, attachments, setAttachments }) {
	const showToast = useToast();
	const [deletingId, setDeletingId] = useState(null);

	const handleDeleteAttachment = async (id) => {
		try {
			setDeletingId(id);
			await axiosClient.delete(API().task_attachment_delete(id));
			setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
			showToast("Success!", "Attachment deleted successfully.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div>
			{/* Existing attachments */}
			{existingAttachments.length > 0 && (
				<div className="flex flex-wrap gap-3 mt-2">
					<span className="text-sm text-muted-foreground w-full">Existing Attachments:</span>
					{existingAttachments.map((att) => {
						const isImage = att.original_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
						const extension = att.original_name.split(".").pop().toUpperCase();

						return (
							<div key={att.id} className="relative group rounded border bg-secondary overflow-hidden p-1">
								{/* Delete Button */}
								<Dialog>
									<DialogTrigger asChild>
										<Button
											size="icon"
											variant="ghost"
											className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Delete Attachment?</DialogTitle>
											<DialogDescription>This file will be permanently deleted.</DialogDescription>
										</DialogHeader>
										<DialogFooter>
											<DialogClose>Cancel</DialogClose>
											<Button variant="destructive" onClick={() => handleDeleteAttachment(att.id)} disabled={deletingId === att.id}>
												{deletingId === att.id ? "Deleting..." : "Delete"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								{/* Preview */}
								{isImage ? (
									<Dialog>
										<DialogTrigger asChild>
											<img
												src={att.file_url}
												alt={att.original_name}
												className="rounded-md w-32 h-24 object-cover hover:cursor-pointer"
											/>
										</DialogTrigger>
										<DialogContent className="max-w-4xl">
											<DialogHeader>
												<DialogTitle>{att.original_name}</DialogTitle>
												<DialogDescription className="sr-only">View attachment</DialogDescription>
											</DialogHeader>
											<div className="flex justify-center">
												<img src={att.file_url} alt={att.original_name} className="max-w-full max-h-[70vh] object-contain" />
											</div>
										</DialogContent>
									</Dialog>
								) : (
									<div className="flex items-center gap-2 p-2">
										<a
											href={att.file_url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center min-w-16 aspect-square rounded-md border bg-background text-sm font-semibold"
										>
											{extension}
										</a>
										<span className="font-semibold text-sm truncate max-w-[8rem]">{att.original_name}</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Newly selected files (before upload) */}
			{attachments.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-2">
					<span className="text-sm text-muted-foreground w-full">Files to upload:</span>
					{attachments.map((file, idx) => (
						<div key={idx} className="flex items-center gap-2 p-2 bg-secondary rounded">
							<span className="text-sm">{file.name}</span>
							<button
								type="button"
								onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
								className="text-destructive hover:text-destructive/80"
							>
								✕
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
