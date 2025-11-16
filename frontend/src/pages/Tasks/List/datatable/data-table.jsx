"use client";

import { useEffect, useState } from "react";
import { flexRender, getSortedRowModel, getFilteredRowModel, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	ChevronRight,
	FileCheck,
	FileQuestion,
	FolderKanban,
	Trash2,
	UserCheck2,
	BellRing,
	CalendarCheck,
	CalendarClock,
	CalendarCheck2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useTasksStore } from "@/store/tasks/tasksStore";
import UpdateDialog from "../updateDialog";
import DeleteDialog from "../deleteDialog";
export function DataTableTasks({ columns, data, showLess = true }) {
	const { loading } = useLoadContext();
	const [sorting, setSorting] = useState([]);
	const [columnFilters, setColumnFilters] = useState([]);
	const [selectedColumn, setSelectedColumn] = useState(null);
	const [filterValue, setFilterValue] = useState("");
	const [bulkAction, setBulkAction] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	// TODO: Task datatable filter

	// Helper to clear selection and reset dialogs
	const clearSelection = () => {
		table.resetRowSelection();
		setBulkAction(null);
		setDeleteDialogOpen(false);
	};
	// When bulkAction is "delete", just open the dialog
	useEffect(() => {
		if (bulkAction === "delete") {
			setDeleteDialogOpen(true);
		}
	}, [bulkAction]);

	const handleDeleteDialogClose = (open) => {
		setDeleteDialogOpen(open);
		if (!open) setBulkAction(null);
	};

	// Select what column to filter
	const handleColumnChange = (columnId) => {
		setSelectedColumn(columnId);
		setFilterValue("");
	};
	// Apply filter as value changes
	const handleFilterChange = (value) => {
		setFilterValue(value);
		if (selectedColumn) {
			table.getColumn(selectedColumn)?.setFilterValue(value);
		}
	};
	// Initially hides some column, showing only the main details
	const [columnVisibility, setColumnVisibility] = useState(
		showLess
			? {
					// status: false,
					id: false,
					category: false,
					"start date": false,
					"end date": true,
					"start time": false,
					"end time": false,
					"delay reason": false,
					"performance rating": false,
					"actual date": true,
					"actual time": false,
					remarks: false,
					action: true,
			  }
			: {
					id: false,
					"delay reason": false,
					remarks: false,
					action: true,
			  }
	);
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
		enableRowSelection: true,
	});

	// Only render the dialog for the current action
	let dialog = null;
	if (bulkAction === "delete" && deleteDialogOpen) {
		dialog = (
			<DeleteDialog
				dialogOpen={deleteDialogOpen}
				setDialogOpen={handleDeleteDialogClose}
				selectedTasks={table.getFilteredSelectedRowModel().rows.map((r) => r.original)}
				clearSelection={clearSelection} // Pass the callback
			/>
		);
	} else {
		dialog = (
			<UpdateDialog
				open={!!bulkAction}
				onClose={() => setBulkAction(null)}
				action={bulkAction}
				selectedTasks={table.getFilteredSelectedRowModel().rows.map((r) => r.original)}
			/>
		);
	}
	// Keep "All" selection synced with data length
	useEffect(() => {
		const { pageSize } = table.getState().pagination;
		if (pageSize === data.length - 1) table.setPageSize(data.length);
	}, [data.length]);
	// toggle actions column automatically
	useEffect(() => {
		const hasSelection = table.getSelectedRowModel().rows.length > 0;

		setColumnVisibility((prev) => ({
			...prev,
			actions: !hasSelection,
		}));
	}, [table.getSelectedRowModel().rows.length]);
	return (
		<div className="w-full scrollbar-custom">
			<div className="flex flex-col md:flex-row justify-between py-4">
				<div className="flex flex-row gap-4 max-w-sm w-full">
					<Input
						placeholder={"filter title ..."}
						value={table.getColumn("title")?.getFilterValue() || ""}
						onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
						className="w-full"
					/>
				</div>
				<div className="flex flex-row justify-between gap-2">
					<div className="flex gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">Columns</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{table
									.getAllColumns()
									.filter((column) => column.getCanHide())
									.map((column) => {
										return (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value) => column.toggleVisibility(!!value)}
											>
												{column.id}
											</DropdownMenuCheckboxItem>
										);
									})}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
							<ChevronLeft />
						</Button>
						<Button variant="outline" size="" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
							<ChevronRight />
						</Button>
					</div>
				</div>
			</div>

			{table.getFilteredSelectedRowModel().rows.length > 0 && (
				<div className="flex flex-wrap justify-end bg-muted/50 gap-2 p-3 rounded-lg border border-primary/50 mb-2">
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("status")}>
						<FileCheck /> Update Status
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("assignees")}>
						<UserCheck2 /> Update Assignees
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("project")}>
						<FolderKanban /> Update Project
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("category")}>
						<FileQuestion /> Update Category
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("priority")}>
						<BellRing /> Update Priority
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("start_date")}>
						<CalendarCheck /> Update Start Date
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("end_date")}>
						<CalendarClock /> Update End Date
					</Button>
					<Button size="sm" className="text-xs" onClick={() => setBulkAction("actual_date")}>
						<CalendarCheck2 /> Update Actual Date
					</Button>
					<Button size="sm" className="text-xs" variant="destructive" onClick={() => setBulkAction("delete")}>
						<Trash2 className="text-destructive-foreground" /> Delete
					</Button>
				</div>
			)}
			<div className="flex justify-between items-center w-full m-0">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Show</p>
					<Select
						value={table.getState().pagination.pageSize === data.length ? "all" : `${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							if (value === "all") {
								table.setPageSize(data.length);
							} else {
								table.setPageSize(Number(value));
							}
						}}
					>
						<SelectTrigger className="h-8 w-[90px]">
							{/* <SelectValue placeholder={table.getState().pagination.pageSize} /> */}
							<SelectValue
								placeholder={table.getState().pagination.pageSize === data.length ? "All" : `${table.getState().pagination.pageSize}`}
							/>
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
							<SelectItem value="all">All</SelectItem>
						</SelectContent>
					</Select>

					{table.getFilteredSelectedRowModel().rows.length > 0 ? (
						<div className="text-muted-foreground flex-1 text-sm">
							{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} task(s) selected.
						</div>
					) : (
						<span></span>
					)}
				</div>
				<Button variant="link" className="text-muted-foreground" onClick={() => setSorting([])}>
					Reset sort
				</Button>
			</div>
			<div className="rounded-md">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24">
									<div className="flex items-center justify-center">
										<div className="flex flex-col space-y-3 w-full">
											{Array.from({ length: 6 }).map((_, i) => (
												<Skeleton key={i} index={i * 0.9} className="h-24 w-full" />
											))}
										</div>
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows.length ? (
							// Show table data if available
							table.getRowModel().rows.map((row) => {
								// Determine if row is a parent task (depth 0 with subtasks) or a leaf (no subtasks)
								const hasSubtasks =
									(Array.isArray(row.original?.children) && row.original.children.length > 0) || !!row.original?.has_children || false;
								const isParent = row.original?.depth === 0;
								const isLeaf = !hasSubtasks;

								// Choose a slightly stronger background for emphasis
								// Parent tasks get slightly stronger emphasis than leaves
								const rowBgClass = isParent ? "bg-muted/10" : isLeaf ? "bg-muted/80" : "";

								return (
									<TableRow
										key={row.id}
										className={rowBgClass}
										//  onClick={() => handleUpdate(row.original)} className="cursor-pointer"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
										))}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No Results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				{table.getFilteredSelectedRowModel().rows.length > 0 ? (
					<div className="text-muted-foreground flex-1 text-sm">
						{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} task(s) selected.
					</div>
				) : (
					<div className="text-muted-foreground flex-1 text-sm">
						Showing {table.getState().pagination.pageSize} out of {table.getFilteredRowModel().rows.length} task(s).
					</div>
				)}
				<Button variant="outline" size="" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
					<ChevronLeft />
				</Button>
				<Button variant="outline" size="" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
					<ChevronRight />
				</Button>
			</div>
			{dialog}
		</div>
	);
}
