const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function utcMillis(value) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }

  const date = parseDate(value);
  return (
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() === Number(value.slice(5, 7)) - 1 &&
    date.getDate() === Number(value.slice(8, 10))
  );
}

export function todayString() {
  return formatDate(new Date());
}

export function addDays(value, amount) {
  const date = typeof value === 'string' ? parseDate(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return formatDate(date);
}

export function daysBetween(start, end) {
  return Math.round((utcMillis(end) - utcMillis(start)) / 86400000);
}

export function startOfWeek(value) {
  const date = parseDate(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return formatDate(date);
}

export function eachDay(start, count) {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function monthRange(value) {
  const date = parseDate(value);
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    first: formatDate(new Date(year, month, 1)),
    last: formatDate(new Date(year, month + 1, 0))
  };
}

export function calendarDays(value) {
  const { first, last } = monthRange(value);
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(last), 6);
  return eachDay(start, daysBetween(start, end) + 1);
}

export function isNotFutureDate(value) {
  return isValidDateString(value) && value <= todayString();
}
