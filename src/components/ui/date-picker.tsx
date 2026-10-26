import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DATE_FORMAT = "yyyy-MM-dd";

export interface DatePickerInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
}

export const DatePickerInput = React.forwardRef<HTMLInputElement, DatePickerInputProps>(
  ({ value, onValueChange, className, onBlur, disabled, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const parsedDate = parse(value, DATE_FORMAT, new Date());
    const selected = value && isValid(parsedDate) ? parsedDate : undefined;

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onBlur}
          className={cn("pr-9", className)}
          disabled={disabled}
          {...props}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {/* Disabling the input alone would leave the calendar as a live
                back door to changing the value. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-accent-foreground"
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                onValueChange(date ? format(date, DATE_FORMAT) : "");
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
DatePickerInput.displayName = "DatePickerInput";
