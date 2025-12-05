"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";

export function DataTable({ columns = [], data = [] }) {
	const { dashboardreportsLoading } = useDashboardStore();
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="rounded-md border">
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
					{dashboardreportsLoading ? (
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
					) : table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
								style={
									row.index === 0
										? { backgroundColor: "hsl(270 70% 50% / 0.6)" }
										: row.index === 1
										? { backgroundColor: "hsl(270 70% 50% / 0.4)" }
										: row.index === 2
										? { backgroundColor: "hsl(270 70% 50% / 0.2)" }
										: {}
								}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
