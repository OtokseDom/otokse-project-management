"use client";

import { ArrowBigDownDash, ArrowBigUpDash } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

export function ChartBarHorizontal({ report, title = "Report", variant }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();

	// ✅ extract dynamic data based on reportKey
	const chartData = report?.chart_data ?? [];
	const highest = report?.highest ?? null;
	const lowest = report?.lowest ?? null;
	const dataCount = report?.data_count ?? 0;
	const filters = report?.filters ?? {};

	const chartConfig = {
		task: {
			label: "Task",
			color: "hsl(var(--chart-1))",
		},
	};

	return (
		<Card className="flex flex-col relative w-full h-full justify-between rounded-2xl">
			<CardHeader className="text-center">
				<CardTitle className="text-lg">{title || "Bar Chart Report"}</CardTitle>
				<CardDescription>
					{filters?.from && filters?.to
						? `${new Date(filters.from).toLocaleDateString("en-CA", {
								month: "short",
								day: "numeric",
								year: "numeric",
						  })} - ${new Date(filters.to).toLocaleDateString("en-CA", {
								month: "short",
								day: "numeric",
								year: "numeric",
						  })}`
						: "All Time"}
				</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer config={chartConfig}>
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex flex-col gap-2 items-center justify-center h-full w-full p-8">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="w-full h-10 rounded-full" />
							))}
						</div>
					) : dataCount === 0 ? (
						<div className="flex items-center justify-center fw-full h-full text-lg text-gray-500">No Tasks Yet</div>
					) : (
						<BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ right: 16 }}>
							<CartesianGrid horizontal={false} />
							<YAxis dataKey="user" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100} />
							<XAxis dataKey="task" type="number" hide />
							<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
							<Bar dataKey="task" layout="vertical" fill="var(--color-task)" radius={4}>
								<LabelList dataKey="user" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
								<LabelList dataKey="task" position="right" offset={8} className="fill-foreground" fontSize={12} />
							</Bar>
						</BarChart>
					)}
				</ChartContainer>
			</CardContent>

			<CardFooter className="flex-col items-start gap-2 text-sm">
				{dashboardReportsLoading || userReportsLoading ? (
					<div className="flex flex-col gap-2 items-center justify-center h-full w-full">
						<Skeleton className="w-full h-4 rounded-full" />
						<Skeleton className="w-full h-4 rounded-full" />
					</div>
				) : dataCount === 0 ? (
					""
				) : (
					<>
						{highest && (
							<div className="leading-none font-medium">
								<ArrowBigUpDash size={16} className="inline text-green-500" /> <b>{highest.user}</b> has the{" "}
								{title === "Tasks Completed per User" ? (
									<>
										most completed tasks <b>({highest.task})</b>
									</>
								) : (
									<>
										highest task load of <b>{highest.task}</b> tasks
									</>
								)}
							</div>
						)}
						{lowest && (
							<div className="leading-none font-medium">
								<ArrowBigDownDash size={16} className="inline text-red-500" /> <b>{lowest.user}</b> has the{" "}
								{title === "Tasks Completed per User" ? (
									<>
										least completed tasks of <b>({lowest.task})</b>
									</>
								) : (
									<>
										lowest task load of <b>{lowest.task}</b> tasks
									</>
								)}
							</div>
						)}
						<div className="text-muted-foreground leading-none">Showing {dataCount} tasks total</div>
					</>
				)}
			</CardFooter>
		</Card>
	);
}
