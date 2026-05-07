"use client";

import { buildCalendarMonths, getWeekdayLabels } from "@/lib/date";

type Props = {
  allDates: string[];
  selectedDates: string[];
  onToggle: (date: string) => void;
};

export function DatePicker({ allDates, selectedDates, onToggle }: Props) {
  if (allDates.length === 0) {
    return <p className="help-text">시작일과 종료일을 먼저 입력하면 선택 가능한 날짜가 표시됩니다.</p>;
  }

  const months = buildCalendarMonths(allDates);
  const weekdays = getWeekdayLabels();

  return (
    <div className="calendar-stack">
      {months.map((month) => (
        <section key={month.key} className="calendar-month">
          <div className="calendar-month-header">
            <strong>{month.label}</strong>
          </div>

          <div className="calendar-weekdays">
            {weekdays.map((weekday, index) => (
              <span
                key={weekday}
                className={`calendar-weekday ${
                  index === 0 ? "sunday" : index === 6 ? "saturday" : ""
                }`}
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="calendar-grid">
            {month.cells.map((cell, index) => {
              if (!cell) {
                return <div key={`${month.key}-empty-${index}`} className="calendar-empty" aria-hidden="true" />;
              }

              const active = selectedDates.includes(cell.date);
              return (
                <button
                  type="button"
                  key={cell.date}
                  className={`calendar-day ${active ? "active" : ""}`}
                  onClick={() => onToggle(cell.date)}
                  aria-pressed={active}
                >
                  <span
                    className={`calendar-day-number ${
                      cell.weekdayIndex === 0 ? "sunday" : cell.weekdayIndex === 6 ? "saturday" : ""
                    }`}
                  >
                    {cell.day}일
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
