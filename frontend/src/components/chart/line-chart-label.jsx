"use client";

import { RefreshCcw, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

export const description = "A line chart with a label";
const chartConfig = {
	rating: {
		label: "Rating",
		color: "hsl(270 70% 50%)", // Purple
	},
};

// accept optional title and metricLabel props
export function ChartLineLabel({ report, variant, title = null, metricLabel = null }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();

	// determine total count (supports reports with task_count or data_count)
	const totalCount = report ? report.task_count ?? report.data_count ?? 0 : 0;

	// default title/metric when not provided
	const resolvedTitle = title ?? (metricLabel ? `${metricLabel} Trend` : "Performance Trends");
	const resolvedMetricLabel = metricLabel ?? "Performance Rating";

	return (
		<Card className={`flex flex-col relative h-full justify-between rounded-2xl`}>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">{resolvedTitle}</CardTitle>
				<CardDescription>
					{resolvedMetricLabel} for{" "}
					{report?.filters?.from && report?.filters?.to
						? `${new Date(report.filters.from).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(
								report.filters.to
						  ).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`
						: "the last 6 months"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex flex-col gap-2 items-center justify-center h-full w-full p-8">
							<Skeleton className=" w-full h-10 rounded-full" />
							<Skeleton className=" w-full h-10 rounded-full" />
							<Skeleton className=" w-full h-10 rounded-full" />
							<Skeleton className=" w-full h-10 rounded-full" />
						</div>
					) : totalCount == 0 ? (
						<div className="flex items-center justify-center fw-full h-full text-lg text-gray-500">No Tasks Yet</div>
					) : (
						<LineChart
							accessibilityLayer
							data={report?.chart_data}
							margin={{
								top: 20,
								left: 12,
								right: 12,
							}}
						>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
							<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
							<Line
								dataKey="rating"
								type="natural"
								stroke="var(--color-rating)"
								strokeWidth={2}
								dot={{
									fill: "var(--color-rating)",
								}}
								activeDot={{
									r: 6,
								}}
							>
								<LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
							</Line>
						</LineChart>
					)}
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				{dashboardReportsLoading || userReportsLoading ? (
					<div className="flex flex-col gap-2 items-center justify-center h-full w-full">
						<Skeleton className=" w-full h-4 rounded-full" />
						<Skeleton className=" w-full h-4 rounded-full" />
					</div>
				) : totalCount == 0 ? (
					""
				) : (
					<>
						<div className="flex gap-2 leading-none font-medium">
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
						<div className="text-muted-foreground leading-none">
							{report?.filters?.from && report?.filters?.to
								? `${new Date(report.filters.from).toLocaleDateString("en-CA", {
										month: "short",
										day: "numeric",
										year: "numeric",
								  })} - ${new Date(report.filters.to).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`
								: report?.chart_data?.length > 0 && (
										<div className="flex items-center gap-2 leading-none text-muted-foreground">
											{report?.chart_data[0].month}{" "}
											{report?.chart_data[0].year == report?.chart_data[5].year ? "" : report?.chart_data[0].year} -{" "}
											{report?.chart_data[5].month} {report?.chart_data[5].year}
										</div>
								  )}
						</div>
					</>
				)}
			</CardFooter>
		</Card>
	);
}
