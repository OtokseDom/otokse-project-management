"use client";

import { Square, TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useUserStore } from "@/store/user/userStore";

export function ChartPieLabel({ report, title = "Overrun / Underrun / On Time" }) {
	const { dashboardReportsLoading } = useDashboardStore();
	const { userReportsLoading } = useUserStore();

	const chartConfig = {
		value: {
			label: "Tasks",
		},
		underrun: {
			label: "Underrun",
			color: "hsl(0, 0%, 60%)", // Changed from solid white to gray-400
		},
		overrun: {
			label: "Overrun",
			color: "hsl(0, 0%, 40%)", // Gray-600
		},
		on_time: {
			label: "On Time",
			color: "hsl(270 70% 50%)", // Purple
		},
	};
	const chartData =
		report && Array.isArray(report.chart_data)
			? report.chart_data.map((d, i) => ({
					name: d.label ?? `Slice ${i + 1}`,
					value: typeof d.value !== "undefined" ? d.value : d.count ?? 0,
					count: d.count ?? 0,
					// Map colors based on label
					fill: d.label === "Underrun" ? chartConfig.underrun.color : d.label === "Overrun" ? chartConfig.overrun.color : chartConfig.on_time.color,
			  }))
			: [];
	const total = report?.total_tasks ?? chartData.reduce((s, it) => s + (it.count || 0), 0);

	const underrunCount = chartData.find((c) => c.name === chartConfig.underrun.label)?.value ?? 0;
	const overrunCount = chartData.find((c) => c.name === chartConfig.overrun.label)?.value ?? 0;
	const onTimeCount = chartData.find((c) => c.name === chartConfig.on_time.label)?.value ?? 0;

	return (
		<Card className={`flex flex-col relative w-full h-full justify-between rounded-2xl`}>
			<CardHeader className="items-center text-center pb-0">
				<CardTitle className="text-lg">{title}</CardTitle>
				<CardDescription>
					{report?.filters && report.filters.from && report.filters.to
						? `${new Date(report.filters.from).toLocaleDateString()} - ${new Date(report.filters.to).toLocaleDateString()}`
						: "All Time"}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer config={chartConfig} className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0">
					{dashboardReportsLoading || userReportsLoading ? (
						<div className="flex items-center justify-center h-full w-full p-8">
							<Skeleton className=" w-full h-full rounded-full" />
						</div>
					) : total === 0 ? (
						<div className="flex items-center justify-center fw-full h-full text-lg text-gray-500">No Tasks Yet</div>
					) : (
						<PieChart>
							<ChartTooltip content={<ChartTooltipContent hideLabel />} />
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								label={{
									fill: "var(--foreground)",
									fontSize: 12,
								}}
							/>
						</PieChart>
					)}
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm">
				{dashboardReportsLoading || userReportsLoading ? (
					<div className="flex flex-col gap-2 items-center justify-center h-full w-full p-8">
						<Skeleton className=" w-full h-4" />
						<Skeleton className=" w-full h-4" />
					</div>
				) : total === 0 ? (
					""
				) : (
					<div className="flex flex-col justify-center items-center gap-4 leading-none text-muted-foreground">
						<div className="flex items-center gap-1">
							<div className="flex gap-8 text-sm">
								<span className="flex gap-2">
									<Square size={16} className="text-gray-400 bg-gray-400 rounded" /> Underrun: {underrunCount}%{" "}
								</span>
								<span className="flex gap-2">
									<Square size={16} className="text-gray-600 bg-gray-600 rounded" /> Overrun: {overrunCount}%
								</span>
								<span className="flex gap-2">
									<Square size={16} className="text-purple-700 bg-purple-700 rounded" /> On Time: {onTimeCount}%
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 leading-none font-medium">Total tasks: {total}</div>
					</div>
				)}
				{/* <div className="text-muted-foreground leading-none">Showing overrun / underrun distribution</div> */}
			</CardFooter>
		</Card>
	);
}
