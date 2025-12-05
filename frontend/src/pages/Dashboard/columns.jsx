"use client";

export const columns = [
	{
		id: "rowNumber",
		header: "#",
		cell: ({ row }) => row.index + 1,
	},
	{
		id: "name",
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => {
			const name = row.original.name;
			const position = row.original.position;
			return (
				<div>
					<b>{name}</b>
					<br />
					<span className="text-sm text-muted-foreground">{position}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "avg_performance_rating",
		header: "Performance Rating",
	},
];
