"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

const chartConfig = {
	value: {
		label: "AVG Rating",
		// color: "hsl(var(--chart-1))",
		color: "hsl(270 70% 50%)", // Purple
	},
};

export function RadarChartGridFilled({ report }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();
	return (
		<Card className="flex flex-col relative h-full rounded-2xl justify-between">
			<CardHeader className="items-center text-center pb-4">
				<CardTitle className="text-lg">AVG Rating Per Category</CardTitle>
				<CardDescription>Showing all categories</CardDescription>
			</CardHeader>
			<CardContent className="pb-0">
				<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex items-center justify-center h-full w-full p-8">
							<Skeleton className=" w-full h-full rounded-full" />
						</div>
					) : report?.task_count == 0 ? (
						<div className="flex items-center justify-center fw-full h-full text-lg text-gray-500">No Tasks Yet</div>
					) : (
						<RadarChart data={report?.ratings?.length > 0 ? report?.ratings : []} outerRadius={90} width={300} height={300}>
							<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
							<PolarGrid className="fill-[--color-value] opacity-20" />
							<PolarAngleAxis dataKey="category" />
							<Radar dataKey="value" fill="var(--color-value)" fillOpacity={0.5} />
						</RadarChart>
					)}
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm">
				{dashboardReportsLoading || userReportsLoading ? (
					<div className="flex flex-col gap-2 items-center justify-center h-full w-full p-8">
						<Skeleton className=" w-full h-4" />
						<Skeleton className=" w-full h-4" />
					</div>
				) : report?.task_count == 0 ? (
					""
				) : (
					<>
						<div className="flex items-center gap-2 font-medium leading-none">
							{report?.highest_rating?.category} has the highest rating: {report?.highest_rating?.value}
						</div>
						<div className="flex items-center gap-2 leading-none text-muted-foreground">
							{report?.filters?.from && report?.filters?.to
								? `${new Date(report.filters.from).toLocaleDateString("en-CA", {
										month: "short",
										day: "numeric",
										year: "numeric",
								  })} - ${new Date(report.filters.to).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`
								: "All Time"}
						</div>
					</>
				)}
			</CardFooter>
		</Card>
	);
}
