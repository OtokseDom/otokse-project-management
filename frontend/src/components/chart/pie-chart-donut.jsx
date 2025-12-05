"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo } from "react";
import { Skeleton } from "../ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

export function PieChartDonut({ report, variant }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();

	const chartConfig = {
		tasks: {
			label: "Tasks",
		},
		completed: {
			label: "Completed",
			color: "hsl(270 70% 50%)", // Purple
			// color: "hsl(160 60% 45%)", // Green
		},
		pending: {
			label: "Pending",
			color: "hsl(var(--chart-5))",
			// color: "hsl(30 80% 55%)", // Yellow
		},
		in_progress: {
			label: "In Progress",
			color: "hsl(var(--chart-1))",
			// color: "hsl(220 70% 50%)", // Blue
		},
		for_review: {
			label: "For Review",
			color: "hsl(var(--chart-3))",
			// color: "hsl(220 70% 50%)", // Blue
		},
		delayed: {
			label: "Delayed",
			color: "hsl(var(--chart-7))",
			// color: "hsl(340 75% 65%)", // Pink
		},
		cancelled: {
			label: "Cancelled",
			color: "hsl(var(--chart-9))",
			// color: "hsl(340 75% 55%)", // Dark Pink
		},
		on_hold: {
			label: "On Hold",
			color: "hsl(var(--chart-11))",
			// color: "hsl(340 75% 45%)", // Darkest Pink
		},
	};
	const totalTasks = useMemo(() => {
		return report?.chart_data?.reduce((acc, curr) => acc + curr.tasks, 0);
	}, [report]);

	return (
		<Card className={`flex flex-col relative w-full h-full justify-between rounded-2xl`}>
			<CardHeader className="items-center text-center pb-0">
				<CardTitle className="text-lg">Tasks by Status</CardTitle>
				<CardDescription>
					{report?.filters?.from && report?.filters?.to
						? `${new Date(report.filters.from).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(
								report.filters.to
						  ).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`
						: "All Time"}
				</CardDescription>
			</CardHeader>
			<CardContent className="pb-0">
				<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex items-center justify-center h-full w-full p-8">
							<Skeleton className=" w-full h-full rounded-full" />
						</div>
					) : totalTasks == 0 ? (
						<div className="flex items-center justify-center fw-full h-full text-lg text-gray-500">No Tasks Yet</div>
					) : (
						<PieChart>
							<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
							<Pie data={report?.chart_data} dataKey="tasks" nameKey="status" innerRadius={60} strokeWidth={5}>
								<Label
									content={({ viewBox }) => {
										if (viewBox && "cx" in viewBox && "cy" in viewBox) {
											return (
												<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
													<tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
														{totalTasks?.toLocaleString()}
													</tspan>
													<tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
														Tasks
													</tspan>
												</text>
											);
										}
									}}
								/>
							</Pie>
						</PieChart>
					)}
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex flex-wrap gap-2 text-sm">
				{dashboardReportsLoading || userReportsLoading ? (
					<div className="flex flex-col gap-2 items-center justify-center h-full w-full p-8">
						<Skeleton className=" w-full h-4" />
						<Skeleton className=" w-full h-4" />
					</div>
				) : totalTasks == 0 ? (
					""
				) : (
					<div className="flex flex-wrap justify-center items-center gap-4 leading-none text-muted-foreground">
						{report?.chart_data?.map((data, index) => (
							<div key={index} className="flex items-center gap-1">
								<span className="font-bold">{data.tasks}</span> {chartConfig[data.status]?.label || data.status}
							</div>
						))}
					</div>
				)}
			</CardFooter>
		</Card>
	);
}
