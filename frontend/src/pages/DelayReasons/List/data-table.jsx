"use client";

import { useState } from "react";
import { flexRender, getSortedRowModel, getFilteredRowModel, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { useDelayReasonsStore } from "@/store/delayReasons/delayReasonsStore";
import DelayReasonForm from "../form";

export function DataTableDelayReasons({ columns, isOpen, setIsOpen, updateData, setUpdateData }) {
	const { user } = useAuthContext();
	const { delayReasons: data, delayReasonsLoading } = useDelayReasonsStore();
	const [sorting, setSorting] = useState([]);
	const [columnFilters, setColumnFilters] = useState([]);
	const [columnVisibility, setColumnVisibility] = useState([]);
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
	});

	return (
		<div className="w-full scrollbar-custom">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60  z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<div className="flex flex-col md:flex-row py-4">
				<Input
					placeholder={"filter name..."}
					value={table.getColumn("name")?.getFilterValue() || ""}
					onChange={(delayReason) => table.getColumn("name")?.setFilterValue(delayReason.target.value)}
					className="max-w-sm"
				/>
				<div className="w-full md:w-fit flex flex-row justify-between gap-2 ml-auto">
					<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
						{delayReasonsLoading ||
							(user?.data?.role !== "Employee" && (
								<SheetTrigger asChild>
									<Button variant="">Add Delay Reason</Button>
								</SheetTrigger>
							))}
						<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
							<SheetHeader>
								<SheetTitle>{updateData?.id ? "Update Delay Reason" : "Add Delay Reason"}</SheetTitle>
								<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
							</SheetHeader>
							<DelayReasonForm setIsOpen={setIsOpen} updateData={updateData} setUpdateData={setUpdateData} />
						</SheetContent>
					</Sheet>
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
						{delayReasonsLoading ? (
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
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
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
