const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(value) {
  return String(value).padStart(2, '0');
}

export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateString(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayString() {
  return toDateString(new Date());
}

export function addDays(value, amount) {
  const date = fromDateString(value);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
}

export function shiftMonth(value, amount) {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatLongDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(fromDateString(value));
}

export function formatMonth(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(fromDateString(`${value}-01`));
}

export function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(fromDateString(value));
}

export function weekdayLabel(value) {
  const date = fromDateString(value);
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export function dayNumber(value) {
  return fromDateString(value).getDate();
}

export function relativeDay(value) {
  const today = todayString();
  if (value === today) return 'Today';
  if (value === addDays(today, -1)) return 'Yesterday';
  if (value === addDays(today, 1)) return 'Tomorrow';
  return formatShortDate(value);
}
