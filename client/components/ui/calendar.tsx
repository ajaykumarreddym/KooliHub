import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-6", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6 w-full",
        caption: "flex justify-center pt-2 relative items-center mb-6",
        caption_label: "text-2xl font-bold text-[#1a3b5d] dark:text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-10 w-10 bg-transparent p-0 hover:bg-gray-100 dark:hover:bg-gray-800 border-0 text-[#137fec]",
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse space-y-2",
        head_row: "flex justify-between w-full mb-4",
        head_cell:
          "text-[#1a3b5d] dark:text-gray-300 rounded-md w-14 font-bold text-base flex items-center justify-center",
        row: "flex justify-between w-full mt-3",
        cell: "h-14 w-14 text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-full [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-full last:[&:has([aria-selected])]:rounded-full focus-within:relative focus-within:z-20",
        day: cn(
          "h-14 w-14 p-0 font-semibold text-lg aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#137fec] text-white hover:bg-[#137fec]/90 hover:text-white focus:bg-[#137fec] focus:text-white rounded-full shadow-lg",
        day_today: "bg-transparent text-[#1a3b5d] dark:text-white font-bold",
        day_outside:
          "day-outside text-gray-300 dark:text-gray-600 opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-gray-300 dark:text-gray-600 opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
