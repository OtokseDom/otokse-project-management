import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "./button";
import { useEffect } from "react";
import { List, ListOrdered } from "lucide-react";

export default function RichTextEditor({ value, onChange, onImageDrop }) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Highlight,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Table.configure({ resizable: true }),
			TableRow,
			TableHeader,
			TableCell,
		],
		content: value,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		// editorProps: {
		// 	handleDrop(view, event, _slice, moved) {
		// 		// Don't handle if this is a move operation within the editor
		// 		if (moved) return false;

		// 		// Check if there are files being dropped
		// 		if (!event.dataTransfer || !event.dataTransfer.files) return false;

		// 		const files = Array.from(event.dataTransfer.files);
		// 		const imageFiles = files.filter((file) => file.type.startsWith("image/"));

		// 		if (imageFiles.length > 0 && onImageDrop) {
		// 			event.preventDefault();
		// 			event.stopPropagation();

		// 			// Call the parent handler
		// 			onImageDrop(imageFiles);
		// 			return true;
		// 		}

		// 		return false;
		// 	},
		// 	handlePaste(view, event) {
		// 		// Check if there are clipboard items
		// 		if (!event.clipboardData || !event.clipboardData.items) return false;

		// 		const items = Array.from(event.clipboardData.items);
		// 		const imageItems = items.filter((item) => item.type.startsWith("image/"));

		// 		if (imageItems.length > 0 && onImageDrop) {
		// 			event.preventDefault();
		// 			event.stopPropagation();

		// 			const files = imageItems.map((item) => item.getAsFile()).filter((file) => file !== null);

		// 			if (files.length > 0) {
		// 				// Call the parent handler
		// 				onImageDrop(files);
		// 			}
		// 			return true;
		// 		}

		// 		return false;
		// 	},
		// },
	});

	// Populate richtext editor on update
	useEffect(() => {
		if (editor && value !== undefined && value !== editor.getHTML()) {
			editor.commands.setContent(value || "");
		}
	}, [value, editor]);

	return (
		<div>
			{/* Toolbar */}
			<div className="flex flex-wrap gap-2 mb-2">
				<Button
					type="button"
					size="sm"
					onClick={() => editor?.chain().focus().toggleBold().run()}
					variant={editor?.isActive("bold") ? "default" : "outline"}
					// disabled={!editor}
				>
					B
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => editor?.chain().focus().toggleItalic().run()}
					variant={editor?.isActive("italic") ? "default" : "outline"}
					// disabled={!editor}
				>
					I
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => editor?.chain().focus().toggleStrike().run()}
					variant={editor?.isActive("strike") ? "default" : "outline"}
					// disabled={!editor}
				>
					S
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => editor?.chain().focus().toggleHighlight().run()}
					variant={editor?.isActive("highlight") ? "default" : "outline"}
					// disabled={!editor}
				>
					H
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => editor?.chain().focus().toggleBulletList().run()}
					variant={editor?.isActive("bulletList") ? "default" : "outline"}
					// disabled={!editor}
				>
					<List />
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => editor?.chain().focus().toggleOrderedList().run()}
					variant={editor?.isActive("orderedList") ? "default" : "outline"}
					// disabled={!editor}
				>
					<ListOrdered />
				</Button>
				<Button type="button" size="sm" onClick={() => editor?.chain().focus().setHorizontalRule().run()} variant="outline" disabled={!editor}>
					—
				</Button>
			</div>
			{/* Editor */}
			<div className="border rounded w-full min-h-[200px] p-2 bg-background prose prose-sm max-w-none">
				<style>
					{`
                        .ProseMirror {
                            min-height: 180px;
                            height: 100%;
                            width: 100%;
                            outline: none;
                            background: transparent;
                            resize: vertical;
                            overflow-y: auto;
                            box-sizing: border-box;
                            white-space: pre-wrap;
                        }
                        .ProseMirror ul, .ProseMirror ol {
                            padding-left: 2rem;
                            margin: 0 0 1em 0;
                        }
                        .ProseMirror ul {
                            list-style-type: disc;
                        }
                        .ProseMirror ol {
                            list-style-type: decimal;
                        }
                        .ProseMirror li {
                            margin-bottom: 0.25em;
                        }
                    `}
				</style>
				<EditorContent editor={editor} />
			</div>
			{/* {onImageDrop && (
				<p className="text-xs text-muted-foreground mt-1">💡 You can drag & drop or paste images here - they'll be added to the image gallery below</p>
			)} */}
		</div>
	);
}
