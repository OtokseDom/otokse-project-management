import { X } from "lucide-react";

export default function FilterTags({ filters, onRemove }) {
	return (
		<div className="flex flex-wrap gap-2">
			{Object.entries(filters).map(([key, value]) => {
				let displayValue = value;
				// Format date range dates to "Jan 1, 2025" format if applicable
				if (key.toLowerCase().includes("date range") && typeof value === "string") {
					const match = value.match(/^(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})$/);
					if (match) {
						const [_, start, end] = match;
						const format = (dateStr) =>
							new Date(dateStr).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
							});
						displayValue = `${format(start)} to ${format(end)}`;
					}
				}
				// Skip if value is falsy or an empty array
				if (!value || (Array.isArray(value) && value.length === 0)) return null;
				return (
					<div key={key} className="flex items-center gap-1 bg-primary/80 text-background text-sm px-3 py-1 rounded-md">
						<span>
							{key}: {displayValue}
						</span>
						<button onClick={() => onRemove(key)} className="hover:text-red-500">
							<X size={14} />
						</button>
					</div>
				);
			})}
		</div>
	);
}
