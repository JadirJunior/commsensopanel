"use client";

import * as React from "react";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<
		typeof import("@/components/ui/button").Button
	>["variant"];
};

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = "label",
	buttonVariant = "ghost",
	formatters,
	components,
	...props
}: CalendarProps) {
	const defaultClassNames = getDefaultClassNames();

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			captionLayout={captionLayout}
			weekStartsOn={1}
			fixedWeeks
			className={cn(
				"bg-background group/calendar p-3",
				// 👇 aumenta de verdade (mobile 48px, desktop 56px)
				"[--cell-size:2.5rem] md:[--cell-size:3rem]",
				// 👇 aumenta fonte global do calendário
				"text-base",
				className,
			)}
			formatters={{
				formatMonthDropdown: (date) =>
					date.toLocaleString("pt-BR", { month: "long" }),
				...formatters,
			}}
			classNames={{
				root: cn("w-fit", defaultClassNames.root),

				months: cn(
					"relative flex flex-col gap-6 md:flex-row",
					defaultClassNames.months,
				),
				month: cn("flex w-full flex-col gap-3", defaultClassNames.month),

				nav: cn(
					"absolute inset-x-0 top-0 flex w-full items-center justify-between",
					defaultClassNames.nav,
				),

				button_previous: cn(
					buttonVariants({ variant: buttonVariant }),
					"h-10 w-10 p-0 md:h-11 md:w-11",
					defaultClassNames.button_previous,
				),
				button_next: cn(
					buttonVariants({ variant: buttonVariant }),
					"h-10 w-10 p-0 md:h-11 md:w-11",
					defaultClassNames.button_next,
				),

				month_caption: cn(
					"flex h-11 w-full items-center justify-center px-11",
					defaultClassNames.month_caption,
				),

				caption_label: cn(
					"select-none font-semibold text-base md:text-lg",
					captionLayout !== "label" &&
						"flex h-10 items-center gap-1 rounded-md pl-2 pr-1 [&>svg]:size-4 [&>svg]:text-muted-foreground",
					defaultClassNames.caption_label,
				),

				dropdowns: cn(
					"flex h-11 w-full items-center justify-center gap-2 text-base font-medium",
					defaultClassNames.dropdowns,
				),
				dropdown_root: cn(
					"relative rounded-md border border-input has-focus:border-ring has-focus:ring-ring/50 has-focus:ring-[3px]",
					defaultClassNames.dropdown_root,
				),
				dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),

				// header dias da semana
				weekdays: cn("grid grid-cols-7", defaultClassNames.weekdays),
				weekday: cn(
					"h-9 w-[--cell-size] text-center text-xs md:text-sm font-semibold uppercase text-muted-foreground/80",
					defaultClassNames.weekday,
				),

				// semanas
				week: cn("mt-2 grid grid-cols-7", defaultClassNames.week),

				// célula
				day: cn(
					"relative p-0 text-center",
					"h-[--cell-size] w-[--cell-size]",
					defaultClassNames.day,
				),

				// range: marcadores apenas (background vai no botão)
				range_start: cn("", defaultClassNames.range_start),
				range_middle: cn("", defaultClassNames.range_middle),
				range_end: cn("", defaultClassNames.range_end),

				today: cn("font-semibold", defaultClassNames.today),

				outside: cn(
					// 👇 menos “apagado” pra não parecer minúsculo
					"text-muted-foreground/60 opacity-100",
					defaultClassNames.outside,
				),
				disabled: cn(
					"text-muted-foreground/40 opacity-60",
					defaultClassNames.disabled,
				),
				hidden: cn("invisible", defaultClassNames.hidden),

				...classNames,
			}}
			components={{
				Root: ({ className, rootRef, ...p }: any) => (
					<div ref={rootRef} className={cn(className)} {...p} />
				),

				Chevron: ({ className, orientation, ...p }: any) => {
					if (orientation === "left")
						return (
							<ChevronLeftIcon className={cn("size-5", className)} {...p} />
						);
					if (orientation === "right")
						return (
							<ChevronRightIcon className={cn("size-5", className)} {...p} />
						);
					return <ChevronDownIcon className={cn("size-5", className)} {...p} />;
				},

				// 👇 aqui é a diferença principal: NÃO usar o Button size="icon"
				DayButton: CalendarDayButton as any,

				...components,
			}}
			{...props}
		/>
	);
}

function CalendarDayButton({ className, day, modifiers, ...props }: any) {
	const ref = React.useRef<HTMLButtonElement>(null);

	React.useEffect(() => {
		if (modifiers?.focused) ref.current?.focus();
	}, [modifiers?.focused]);

	const isSelectedSingle =
		modifiers?.selected &&
		!modifiers?.range_start &&
		!modifiers?.range_end &&
		!modifiers?.range_middle;

	return (
		<button
			ref={ref}
			type="button"
			data-day={day?.date?.toLocaleDateString?.("pt-BR")}
			data-selected-single={isSelectedSingle}
			data-range-start={modifiers?.range_start}
			data-range-end={modifiers?.range_end}
			data-range-middle={modifiers?.range_middle}
			data-today={modifiers?.today}
			className={cn(
				// ✅ área clicável grande e óbvia
				"cursor-pointer select-none",
				"h-[--cell-size] w-[--cell-size] min-h-[--cell-size] min-w-[--cell-size]",
				// ✅ padding interno + centralização (tile)
				"p-2 grid place-items-center",
				// ✅ tipografia
				"text-sm md:text-base font-medium leading-none",
				// ✅ estados/visuais
				"rounded-lg hover:bg-accent hover:text-accent-foreground",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
				// ✅ disabled (DayPicker costuma passar disabled via props)
				"disabled:cursor-not-allowed disabled:opacity-60",

				// ✅ hoje (quando NÃO selecionado) - anel para indicar
				"data-[today=true]:ring-2 data-[today=true]:ring-primary data-[today=true]:ring-inset",

				// estados selecionados (sobrescrevem o anel do today)
				"data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:ring-0",
				"data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-l-lg data-[range-start=true]:rounded-r-none data-[range-start=true]:ring-0",
				"data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-r-lg data-[range-end=true]:rounded-l-none data-[range-end=true]:ring-0",
				"data-[range-middle=true]:bg-primary/15 data-[range-middle=true]:text-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:ring-0",

				className,
			)}
			{...props}
		/>
	);
}

export { Calendar, CalendarDayButton };
