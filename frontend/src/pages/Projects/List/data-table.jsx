"use client";

import { useEffect, useState } from "react";
import { flexRender, getSortedRowModel, getFilteredRowModel, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
// import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useEpicsStore } from "@/store/epics/epicsStore";

// Convert the DataTable component to JavaScript
export function DataTableProjects({ columns, isOpen, setIsOpen, updateData, setUpdateData }) {
	const inProjects = location.pathname.startsWith("/projects") ? true : false;
	const { selectedEpic } = useEpicsStore();
	const [sorting, setSorting] = useState([]);
	const [columnFilters, setColumnFilters] = useState([]);
	const [columnVisibility, setColumnVisibility] = useState({
		"actual date": false,
		"delay reason": false,
		remarks: false,
	});
	const { projects, projectsLoading } = useProjectsStore();
	const [filteredProjects, setFilteredProjects] = useState([]);

	useEffect(() => {
		if (inProjects) {
			setFilteredProjects(projects);
		} else {
			setFilteredProjects(selectedEpic !== null && selectedEpic !== undefined ? projects.filter((project) => project.epic_id === selectedEpic) : []);
		}
		// console.log(inProjects);
	}, [selectedEpic, inProjects]);
	const table = useReactTable({
		data: filteredProjects,
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
	});

	return (
		<div className="w-full scrollbar-custom">
			<div className="flex flex-col md:flex-row py-4">
				<Input
					placeholder={"filter project title..."}
					value={table.getColumn("title")?.getFilterValue() || ""}
					onChange={(category) => table.getColumn("title")?.setFilterValue(category.target.value)}
					className="max-w-sm"
				/>
				<div className="w-full md:w-fit flex flex-row justify-between gap-2 ml-auto">
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
					<Button variant="outline" size="" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
						<ChevronLeft />
					</Button>
					<Button variant="outline" size="" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
						<ChevronRight />
					</Button>
				</div>
			</div>
			<div className="rounded-md h-fit max-h-screen overflow-auto">
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
						{projectsLoading ? (
							// Show skeleton while loading
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
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							// Show "No Results" only if data has finished loading and is truly empty
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
				<Button variant="outline" size="" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
					<ChevronLeft />
				</Button>
				<Button variant="outline" size="" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}
