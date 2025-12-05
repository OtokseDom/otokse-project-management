import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export default function DateInput({ field, label, placeholder, disabled = false, disableFuture = false, className }) {
	const currentDate = field.value ? new Date(field.value) : null;

	const [month, setMonth] = useState(currentDate ? currentDate.getMonth() : new Date().getMonth());
	const [year, setYear] = useState(currentDate ? currentDate.getFullYear() : new Date().getFullYear());

	// Sync month/year whenever field.value changes
	useEffect(() => {
		if (field.value) {
			const d = new Date(field.value);
			setMonth(d.getMonth());
			setYear(d.getFullYear());
		}
	}, [field.value]);

	const years = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
	}, []);

	const months = useMemo(() => {
		return eachMonthOfInterval({
			start: startOfYear(new Date(year, 0, 1)),
			end: endOfYear(new Date(year, 0, 1)),
		});
	}, [year]);

	const handleYearChange = (selectedYear) => {
		const newYear = parseInt(selectedYear, 10);
		setYear(newYear);
		if (currentDate) {
			const newDate = new Date(currentDate);
			newDate.setFullYear(newYear);
			field.onChange(newDate);
		}
	};

	const handleMonthChange = (selectedMonth) => {
		const newMonth = parseInt(selectedMonth, 10);
		setMonth(newMonth);
		if (currentDate) {
			const newDate = new Date(currentDate);
			newDate.setMonth(newMonth);
			field.onChange(newDate);
		} else {
			field.onChange(new Date(year, newMonth, 1));
		}
	};

	const handleClear = () => {
		field.onChange(null);
		// Also trigger validation
		field.onBlur();
	};

	return (
		<FormItem className={className}>
			<FormLabel>{label}</FormLabel>
			<div className="relative flex gap-2 w-full">
				<Popover>
					<PopoverTrigger asChild>
						<FormControl>
							<Button
								disabled={disabled}
								variant="outline"
								className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
							>
								{field.value ? format(field.value, "PPP") : <span>{placeholder}</span>}
								<CalendarIcon className={`ml-auto h-4 w-4 ${!field.value ? "opacity-50" : "opacity-0"}`} />
							</Button>
						</FormControl>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<div className="flex justify-between p-2 space-x-1">
							<Select onValueChange={handleYearChange} value={year.toString()}>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="Year" />
								</SelectTrigger>
								<SelectContent>
									{years.map((y) => (
										<SelectItem key={y} value={y.toString()}>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select onValueChange={handleMonthChange} value={month.toString()}>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="Month" />
								</SelectTrigger>
								<SelectContent>
									{months.map((m, index) => (
										<SelectItem key={index} value={index.toString()}>
											{format(m, "MMMM")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Calendar
							mode="single"
							className="pointer-events-auto"
							selected={currentDate}
							onSelect={(date) => field.onChange(date || null)}
							month={new Date(year, month)}
							onMonthChange={(newMonth) => {
								setMonth(newMonth.getMonth());
								setYear(newMonth.getFullYear());
							}}
							disabled={(d) => (disableFuture && d > new Date()) || d < new Date("1900-01-01") || disabled}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
				{field.value && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
						onClick={handleClear}
						disabled={disabled}
					>
						✕
					</Button>
				)}
			</div>
			<FormMessage />
		</FormItem>
	);
}
