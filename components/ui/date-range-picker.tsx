"use client";

import * as React from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { CalendarIcon, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";

dayjs.locale("pt-br");

interface DateRangePickerProps {
	startDate?: Date;
	endDate?: Date;
	onRangeChange?: (start: Date | undefined, end: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	showTime?: boolean;
}

export function DateRangePicker({
	startDate,
	endDate,
	onRangeChange,
	placeholder = "Selecione o período",
	disabled = false,
	className,
	showTime = true,
}: DateRangePickerProps) {
	const [open, setOpen] = React.useState(false);
	const [range, setRange] = React.useState<DateRange | undefined>({
		from: startDate,
		to: endDate,
	});
	const [startHour, setStartHour] = React.useState<string>(
		startDate ? dayjs(startDate).format("HH") : "00",
	);
	const [startMinute, setStartMinute] = React.useState<string>(
		startDate ? dayjs(startDate).format("mm") : "00",
	);
	const [endHour, setEndHour] = React.useState<string>(
		endDate ? dayjs(endDate).format("HH") : "23",
	);
	const [endMinute, setEndMinute] = React.useState<string>(
		endDate ? dayjs(endDate).format("mm") : "59",
	);

	// Atualiza o estado interno quando os valores externos mudam
	React.useEffect(() => {
		setRange({
			from: startDate,
			to: endDate,
		});
		if (startDate) {
			setStartHour(dayjs(startDate).format("HH"));
			setStartMinute(dayjs(startDate).format("mm"));
		}
		if (endDate) {
			setEndHour(dayjs(endDate).format("HH"));
			setEndMinute(dayjs(endDate).format("mm"));
		}
	}, [startDate, endDate]);

	const handleRangeSelect = (newRange: DateRange | undefined) => {
		setRange(newRange);
	};

	const handleConfirm = () => {
		let finalStart: Date | undefined;
		let finalEnd: Date | undefined;

		if (range?.from) {
			finalStart = dayjs(range.from)
				.hour(parseInt(startHour))
				.minute(parseInt(startMinute))
				.second(0)
				.toDate();
		}

		if (range?.to) {
			finalEnd = dayjs(range.to)
				.hour(parseInt(endHour))
				.minute(parseInt(endMinute))
				.second(59)
				.toDate();
		}

		onRangeChange?.(finalStart, finalEnd);
		setOpen(false);
	};

	const handleClear = () => {
		setRange(undefined);
		setStartHour("00");
		setStartMinute("00");
		setEndHour("23");
		setEndMinute("59");
		onRangeChange?.(undefined, undefined);
		setOpen(false);
	};

	const hours = Array.from({ length: 24 }, (_, i) =>
		i.toString().padStart(2, "0"),
	);
	const minutes = Array.from({ length: 60 }, (_, i) =>
		i.toString().padStart(2, "0"),
	);

	const displayValue = React.useMemo(() => {
		if (!startDate && !endDate) return placeholder;

		const format = showTime ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY";
		const start = startDate ? dayjs(startDate).format(format) : "...";
		const end = endDate ? dayjs(endDate).format(format) : "...";

		return `${start} → ${end}`;
	}, [startDate, endDate, placeholder, showTime]);

	// Atalhos de período
	const handleQuickSelect = (days: number) => {
		const now = dayjs();
		const from = now.subtract(days, "day").startOf("day").toDate();
		const to = now.endOf("day").toDate();
		setRange({ from, to });
		setStartHour("00");
		setStartMinute("00");
		setEndHour("23");
		setEndMinute("59");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!startDate && !endDate && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
					<span className="truncate">{displayValue}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[500px] p-0 bg-card border-border"
				align="start"
				side="bottom"
				sideOffset={4}
			>
				<div className="flex flex-col">
					{/* Atalhos rápidos */}
					<div className="flex flex-wrap gap-1 p-3 border-b border-border bg-muted/50">
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => handleQuickSelect(0)}
						>
							Hoje
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => handleQuickSelect(1)}
						>
							Ontem
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => handleQuickSelect(7)}
						>
							7 dias
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => handleQuickSelect(30)}
						>
							30 dias
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => handleQuickSelect(90)}
						>
							90 dias
						</Button>
					</div>

					{/* Calendário */}
					<div className="p-3 w-full">
						<Calendar
							mode="range"
							selected={range}
							onSelect={handleRangeSelect}
							numberOfMonths={2}
							fixedWeeks
							pagedNavigation
							defaultMonth={range?.from || new Date()}
						/>
					</div>

					{/* Seleção de horário */}
					{showTime && (
						<div className="border-t border-border p-4 bg-muted/30">
							<div className="grid grid-cols-2 gap-6">
								{/* Horário início */}
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm font-medium text-foreground">
										<Clock className="h-4 w-4 text-primary" />
										<span>Início</span>
									</div>
									<div className="flex items-center gap-2">
										<Select value={startHour} onValueChange={setStartHour}>
											<SelectTrigger className="w-[70px] h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="max-h-[200px]">
												{hours.map((h) => (
													<SelectItem key={h} value={h}>
														{h}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<span className="text-muted-foreground font-medium">:</span>
										<Select value={startMinute} onValueChange={setStartMinute}>
											<SelectTrigger className="w-[70px] h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="max-h-[200px]">
												{minutes.map((m) => (
													<SelectItem key={m} value={m}>
														{m}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* Horário fim */}
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm font-medium text-foreground">
										<ArrowRight className="h-4 w-4 text-primary" />
										<span>Fim</span>
									</div>
									<div className="flex items-center gap-2">
										<Select value={endHour} onValueChange={setEndHour}>
											<SelectTrigger className="w-[70px] h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="max-h-[200px]">
												{hours.map((h) => (
													<SelectItem key={h} value={h}>
														{h}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<span className="text-muted-foreground font-medium">:</span>
										<Select value={endMinute} onValueChange={setEndMinute}>
											<SelectTrigger className="w-[70px] h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="max-h-[200px]">
												{minutes.map((m) => (
													<SelectItem key={m} value={m}>
														{m}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Preview da seleção */}
					{(range?.from || range?.to) && (
						<div className="px-4 py-3 border-t border-border bg-secondary/50">
							<div className="flex items-center justify-center gap-3 text-sm">
								<span className="font-medium text-secondary-foreground">
									{range?.from
										? dayjs(range.from)
												.hour(parseInt(startHour))
												.minute(parseInt(startMinute))
												.format("DD/MM/YYYY HH:mm")
										: "..."}
								</span>
								<ArrowRight className="h-4 w-4 text-primary" />
								<span className="font-medium text-secondary-foreground">
									{range?.to
										? dayjs(range.to)
												.hour(parseInt(endHour))
												.minute(parseInt(endMinute))
												.format("DD/MM/YYYY HH:mm")
										: "..."}
								</span>
							</div>
						</div>
					)}

					{/* Ações */}
					<div className="flex items-center justify-between gap-2 border-t border-border p-3">
						<Button variant="ghost" size="sm" onClick={handleClear}>
							Limpar
						</Button>
						<Button
							size="sm"
							onClick={handleConfirm}
							disabled={!range?.from || !range?.to}
						>
							Aplicar período
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
