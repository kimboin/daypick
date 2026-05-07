type CalendarMonth = {
  key: string;
  label: string;
  cells: Array<{
    date: string;
    day: number;
    weekday: string;
    weekdayIndex: number;
  } | null>;
};

const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

function parseDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function toLocalDate(date: string) {
  const { year, month, day } = parseDateString(date);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDateRange(startDate: string, endDate: string) {
  const result: string[] = [];
  const start = toLocalDate(startDate);
  const end = toLocalDate(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return result;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(toDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export function normalizeDates(dates: string[]) {
  return [...new Set(dates)].sort();
}

export function isDateWithinRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

export function formatDisplayDate(date: string) {
  const localDate = toLocalDate(date);
  const day = localDate.getDate();
  const month = localDate.getMonth() + 1;
  const weekday = weekdayNames[localDate.getDay()];
  return `${month}월 ${day}일(${weekday})`;
}

export function getWeekdayLabels() {
  return weekdayNames;
}

export function buildCalendarMonths(dates: string[]): CalendarMonth[] {
  const months = new Map<string, CalendarMonth>();

  for (const date of dates) {
    const localDate = toLocalDate(date);
    const year = localDate.getFullYear();
    const month = localDate.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const weekdayIndex = localDate.getDay();

    if (!months.has(key)) {
      months.set(key, {
        key,
        label: `${year}년 ${month}월`,
        cells: Array.from({ length: weekdayIndex }, () => null),
      });
    }

    months.get(key)?.cells.push({
      date,
      day: localDate.getDate(),
      weekday: weekdayNames[weekdayIndex],
      weekdayIndex,
    });
  }

  return [...months.values()];
}
