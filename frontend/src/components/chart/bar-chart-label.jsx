"use client";

import { ArrowBigDownDash, ArrowBigUpDash } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

export function ChartBarLabel({ report, variant, config = {} }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();

	// Default configurations per variant
	const defaultConfig = {
		delay: {
			title: "Delays per User",
			label: "Delay",
			labelKey: "assignee",
			valueKey: "delay",
			color: "hsl(270 70% 50%)", // Purple
		},
		tasks_completed: {
			title: config.title || "Tasks Completed",
			label: "Tasks Completed",
			labelKey: config.labelKey || "date",
			valueKey: config.valueKey || "tasks_completed",
			color: "hsl(270 70% 50%)", // Purple
			total: report?.data_count || 0,
		},
	};

	const chartConfig = defaultConfig[variant] || config;

	const chartData = report?.chart_data || [];
	const filters = report?.filters || {};
	const valueKey = chartConfig.valueKey;
	const labelKey = chartConfig.labelKey;
	const dataCount = report?.data_count ?? 0;

	return (
		<Card className="flex flex-col relative h-full justify-between rounded-2xl">
			<CardHeader className="text-center">
				<CardTitle className="text-lg">{chartConfig.title}</CardTitle>
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
						<BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey={labelKey}
								tickLine={false}
								tickMargin={10}
								axisLine={false}
								tickFormatter={(value) => (value?.length > 8 ? value.slice(0, 8) + "…" : value)}
							/>
							<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
							<Bar dataKey={valueKey} fill={chartConfig.color} radius={8}>
								<LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
							</Bar>
						</BarChart>
					)}
				</ChartContainer>
			</CardContent>

			{/* Optional footer (only for delay variant) */}
			<CardFooter className="flex-col items-start gap-2 text-sm">
				{dashboardReportsLoading || userReportsLoading ? (
					<div className="flex flex-col gap-2 items-center justify-center h-full w-full">
						<Skeleton className="w-full h-4 rounded-full" />
						<Skeleton className="w-full h-4 rounded-full" />
					</div>
				) : dataCount === 0 ? (
					""
				) : variant === "tasks_completed" ? (
					<div className="leading-none font-medium">
						Total Tasks Completed: <b>{report?.data_count ?? report?.chart_data?.reduce((sum, item) => sum + (item.tasks_completed || 0), 0)}</b>
					</div>
				) : variant === "delay" && report?.data_count > 0 ? (
					<>
						<div className="leading-none font-medium">
							<ArrowBigUpDash size={16} className="inline text-green-500" /> <b>{report?.highest_delay?.assignee}</b> has the most delays (
							<b>{report?.highest_delay?.delay}</b> days)
						</div>
						<div className="leading-none font-medium">
							<ArrowBigDownDash size={16} className="inline text-red-500" /> <b>{report?.lowest_delay?.assignee}</b> has the least delays (
							<b>{report?.lowest_delay?.delay}</b> days)
						</div>
						<div className="text-muted-foreground leading-none">Showing all {report?.data_count} tasks</div>
					</>
				) : null}
			</CardFooter>
		</Card>
	);
}
