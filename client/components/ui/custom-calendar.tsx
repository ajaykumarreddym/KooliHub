import { cn } from "@/lib/utils";
import { useState } from "react";
import Calendar from "react-calendar";

interface CustomCalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  className?: string;
}

export function CustomCalendar({
  value,
  onChange,
  minDate,
  className,
}: CustomCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const handleChange = (date: Date | Date[] | null) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      onChange?.(date);
    }
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-3xl p-6", className)}>
      <style>{`
        .react-calendar {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
        }
        
        .react-calendar__navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          position: relative;
        }
        
        .react-calendar__navigation__label {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a3b5d;
          pointer-events: none;
        }
        
        .react-calendar__navigation__arrow {
          height: 2.5rem;
          width: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 9999px;
          color: #137fec;
          font-size: 1.5rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .react-calendar__navigation__arrow:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .react-calendar__navigation__prev-button {
          position: absolute;
          left: 0;
        }
        
        .react-calendar__navigation__next-button {
          position: absolute;
          right: 0;
        }
        
        .react-calendar__month-view__weekdays {
          margin-bottom: 1rem;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }
        
        .react-calendar__month-view__weekdays__weekday {
          text-align: center;
          font-size: 1rem;
          font-weight: 700;
          color: #1a3b5d;
          padding: 0.5rem 0;
        }
        
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
        
        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.75rem;
        }
        
        .react-calendar__tile {
          height: 3.5rem;
          width: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a3b5d;
          border-radius: 9999px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          margin: 0 auto;
          padding: 0;
        }
        
        .react-calendar__tile:hover:enabled {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .react-calendar__tile--active,
        .react-calendar__tile.selected-date {
          background-color: #137fec !important;
          color: white !important;
          box-shadow: 0 4px 6px rgba(19, 127, 236, 0.3);
        }
        
        .react-calendar__tile--active:hover,
        .react-calendar__tile.selected-date:hover {
          background-color: #0f6fd9 !important;
        }
        
        .react-calendar__tile.today-date {
          font-weight: 700;
        }
        
        .react-calendar__tile--now:not(.react-calendar__tile--active) {
          background: transparent;
          font-weight: 700;
        }
        
        .react-calendar__month-view__days__day--neighboringMonth {
          color: #d1d5db;
          opacity: 0.4;
        }
        
        .react-calendar__tile:disabled {
          color: #d1d5db;
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .react-calendar__tile:disabled:hover {
          background: transparent;
        }
        
        .react-calendar__tile:focus {
          outline: none;
        }
        
        .react-calendar__viewContainer {
          margin-top: 0.5rem;
        }
      `}</style>
      <Calendar
        onChange={handleChange}
        value={selectedDate}
        minDate={minDate || new Date()}
        locale="en-US"
        showNeighboringMonth={true}
        formatShortWeekday={(locale, date) =>
          ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]
        }
        tileClassName={({ date, view }) => {
          if (view === "month") {
            const today = new Date();
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();
            
            const isSelected =
              selectedDate &&
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();

            if (isSelected) return "selected-date";
            if (isToday) return "today-date";
          }
          return null;
        }}
      />
    </div>
  );
}

