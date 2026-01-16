// components/task/TaskDiscussions.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useTaskDiscussionsStore } from "@/store/taskDiscussions/taskDiscussionsStore";
import { storeTaskDiscussion, deleteTaskDiscussion } from "@/utils/taskDiscussionHelpers";

// shadcn/ui components
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/ToastContextProvider";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { Skeleton } from "../ui/skeleton";

export const TaskDiscussions = ({ taskId }) => {
	const { user } = useAuthContext();
	const { taskDiscussions, addTaskDiscussion, removeTaskDiscussion, taskDiscussionsLoading, setTaskDiscussionsLoading } = useTaskDiscussionsStore();
	const { fetchTaskDiscussions } = useTaskHelpers();
	const [newContent, setNewContent] = useState("");
	const [attachments, setAttachments] = useState([]);
	const showToast = useToast();
	// TODO: Feat - Low - Edit comments
	// TODO: Feat - Low - Replies
	// TODO: Feat - Low - Mention users

	useEffect(() => {
		if (!taskDiscussions || taskDiscussions.length === 0) fetchTaskDiscussions();
	}, []);
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!newContent.trim()) return;

		const discussion = await storeTaskDiscussion(
			{
				content: newContent,
				task_id: taskId,
				attachments,
			},
			setTaskDiscussionsLoading,
			showToast
		);

		// force type correction
		discussion.task_id = Number(discussion.task_id);
		addTaskDiscussion(discussion);
		setNewContent("");
		setAttachments([]);
	};

	const handleDelete = async (id) => {
		await deleteTaskDiscussion(id, setTaskDiscussionsLoading, showToast);
		removeTaskDiscussion(id);
	};

	return (
		<div className="flex flex-col">
			{/* <ScrollArea className="flex-1 pr-2"> */}
			{taskDiscussionsLoading ? (
				<div className="flex flex-col space-y-2 h-full w-full">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} index={i * 0.9} className="w-full h-28" />
					))}
				</div>
			) : (
				<div className="space-y-8 pb-32">
					{taskDiscussions.filter((d) => d.task_id === taskId).length == 0 ? (
						<div className="w-full h-full text-muted-foreground text-lg text-center p-4">No Discussions</div>
					) : (
						taskDiscussions
							.filter((d) => d.task_id === taskId)
							.map((discussion) => (
								<div key={discussion.id} className="flex flex-col w-full gap-2 items-start">
									<div className="flex items-center gap-2">
										<div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary text-lg font-semibold text-background">
											{discussion.user?.name
												?.split(" ")
												.map((n) => n[0])
												.join("")
												.slice(0, 2)
												.toUpperCase()}
										</div>
										<div className="flex flex-col items-start gap-0">
											<span className="text-muted-foreground font-semibold">{discussion.user?.name}</span>
											<span className="text-xs text-blue-500/90">
												{new Date(discussion.created_at).toLocaleString("en-US", {
													month: "long",
													day: "numeric",
													year: "numeric",
													hour: "numeric",
													minute: "numeric",
												})}
											</span>
										</div>
									</div>
									<Card className="shadow-sm bg-secondary/50 w-full">
										<CardContent className="p-3 space-y-2">
											<p className="text-sm whitespace-pre-line">{discussion.content}</p>

											{/* Attachments */}
											{discussion.attachments?.length > 0 && (
												<div className="flex flex-wrap gap-2 mt-2">
													{discussion.attachments.map((att) => {
														const isImage = att.original_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
														const extension = att.original_name.split(".").pop().toUpperCase();
														return (
															<div key={att.id} className="overflow-hidden">
																{isImage ? (
																	<Dialog>
																		<DialogTrigger asChild>
																			<img
																				src={att.file_url}
																				alt={att.original_name}
																				className="rounded border w-32 h-24 object-cover hover:cursor-pointer"
																			/>
																		</DialogTrigger>
																		<DialogContent className="max-w-4xl">
																			<DialogHeader>
																				<DialogTitle>{att.original_name}</DialogTitle>
																				<DialogDescription className="sr-only">
																					Navigate through the app using the options below.
																				</DialogDescription>
																			</DialogHeader>
																			<div className="flex justify-center">
																				<img
																					src={att.file_url}
																					alt={att.original_name}
																					className="max-w-full max-h-[70vh] object-contain"
																				/>
																			</div>
																		</DialogContent>
																	</Dialog>
																) : (
																	<div className="flex items-center gap-2 group hover:cursor-pointer">
																		<a
																			href={att.file_url}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="flex items-center justify-center min-w-16 aspect-square rounded-md border bg-secondary text-sm font-semibold text-foreground"
																		>
																			{extension}
																		</a>
																		<span className="font-semibold text-muted-foreground group-hover:text-foreground">
																			{att.original_name}
																		</span>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											)}
										</CardContent>
									</Card>
									{user.data.id === discussion.user.id && (
										<div className="flex gap-3 text-foreground/50">
											<span className="hover:cursor-pointer hover:text-foreground">Edit</span>
											<Dialog modal={true}>
												<DialogTrigger>
													<span className="hover:cursor-pointer hover:text-foreground">Delete</span>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle className="flex gap-4">
															Are you absolutely sure?{" "}
															{taskDiscussionsLoading && <Loader2 className="animate-spin text-foreground" />}
														</DialogTitle>
														<DialogDescription>This action cannot be undone.</DialogDescription>
													</DialogHeader>
													<DialogFooter>
														<DialogClose asChild>
															<Button type="button" variant="secondary">
																Close
															</Button>
														</DialogClose>
														<Button
															disabled={taskDiscussionsLoading}
															variant="destructive"
															onClick={() => handleDelete(discussion.id)}
														>
															Delete comment
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>
									)}
								</div>
							))
					)}
				</div>
			)}
			{/* </ScrollArea> */}

			{/* Sticky Input Area */}
			<div className="sticky bottom-0 pt-4 backdrop-blur-sm bg-background/30 backdrop-saturate-150">
				<form onSubmit={handleSubmit} className="flex flex-col gap-2">
					<Textarea
						value={newContent}
						onChange={(e) => setNewContent(e.target.value)}
						placeholder="Write a comment..."
						className="resize-none bg-secondary"
						required
					/>

					<div className="flex items-start justify-between gap-2">
						<Input
							type="file"
							multiple
							onChange={(e) => setAttachments(Array.from(e.target.files))}
							className="cursor-pointer bg-secondary text-foreground"
						/>
						<Button type="submit" className="w-24" disabled={taskDiscussionsLoading}>
							{taskDiscussionsLoading ? <Loader2 className="animate-spin text-background" /> : "Submit"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
