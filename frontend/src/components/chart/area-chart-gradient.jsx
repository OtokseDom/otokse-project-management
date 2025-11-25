"use client";

import { RefreshCcw, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

const chartConfig = {
	task: {
		label: "Task",
		// color: "hsl(var(--chart-1))",
		color: "hsl(270 70% 50%)", // Purple
	},
};

export function AreaChartGradient({ report }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();

	return (
		<Card className="flex flex-col relative h-full rounded-2xl justify-between">
			<CardHeader className="items-center text-center">
				<CardTitle className="text-lg">User Task Load</CardTitle>
				<CardDescription>Total tasks assigned (6 months)</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex flex-col gap-2 items-center justify-center h-full w-full p-8">
							<Skeleton className=" w-full h-10 rounded-full" />
							<Skeleton className=" w-full h-10 rounded-full" />
							<Skeleton className=" w-full h-10 rounded-full" />
							<Skeleton className=" w-full h-10 rounded-full" />
						</div>
					) : report?.task_count == 0 ? (
						<div className="flex items-center justify-center fw-full h-full text-lg text-gray-500">No Tasks Yet</div>
					) : (
						<AreaChart
							accessibilityLayer
							data={report?.chart_data}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
							<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
							<defs>
								<linearGradient id="fillTask" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="var(--color-task)" stopOpacity={0.8} />
									<stop offset="95%" stopColor="var(--color-task)" stopOpacity={0.1} />
								</linearGradient>
							</defs>
							<Area dataKey="tasks" type="natural" fill="url(#fillTask)" fillOpacity={0.4} stroke="var(--color-task)" stackId="a" />
						</AreaChart>
					)}
				</ChartContainer>
			</CardContent>
			<CardFooter>
				<div className="flex w-full items-start gap-2 text-sm">
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex flex-col gap-2 items-center justify-center h-full w-full">
							<Skeleton className=" w-full h-4 rounded-full" />
							<Skeleton className=" w-full h-4 rounded-full" />
						</div>
					) : report?.task_count == 0 ? (
						""
					) : (
						<div className="grid gap-2">
							<div className="flex items-center gap-2 font-medium leading-none">
								{report?.percentage_difference?.event == "Increased" ? (
									<div className="flex items-center gap-2 text-green-500">
										<span>Trending up by {report?.percentage_difference?.value}% this month </span>
										<TrendingUp className="h-4 w-4" />
									</div>
								) : report?.percentage_difference?.event == "Decreased" ? (
									<div className="flex items-center gap-2 text-red-500">
										<span>Trending dropped by {report?.percentage_difference?.value}% this month </span>
										<TrendingDown className="h-4 w-4" />
									</div>
								) : report?.percentage_difference?.event == "Same" ? (
									<div className="flex items-center gap-2">
										<span>Same as last month </span>
										<RefreshCcw className="h-4 w-4" />
									</div>
								) : (
									""
								)}
							</div>
							{report?.filters?.from && report?.filters?.to ? (
								`${new Date(report.filters.from).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(
									report.filters.to
								).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`
							) : report?.chart_data?.length > 0 ? (
								<div className="flex items-center gap-2 leading-none text-muted-foreground">
									{report?.chart_data?.length > 0 && report?.chart_data[0].month} -{" "}
									{report?.chart_data?.length > 0 && report?.chart_data[5].month}{" "}
									{report?.chart_data?.length > 0 && report?.chart_data[5].year}
								</div>
							) : (
								""
							)}
						</div>
					)}
				</div>
			</CardFooter>
		</Card>
	);
}
