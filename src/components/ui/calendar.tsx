import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        month_caption: "flex justify-center pt-1 pb-2 text-sm font-medium",
        nav: "flex items-center justify-between",
        button_previous:
          "size-7 rounded-none border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        button_next:
          "size-7 rounded-none border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        month_grid: "w-full border-collapse",
        weekday: "text-muted-foreground text-xs font-normal",
        day: "text-center text-sm p-0",
        day_button:
          "size-8 rounded-none hover:bg-accent hover:text-accent-foreground",
        selected: "bg-primary text-primary-foreground rounded-none",
        today: "font-semibold text-primary",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        chevron: "fill-current",
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
