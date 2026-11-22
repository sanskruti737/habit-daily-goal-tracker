import Icon from './Icon.jsx';
import { dayNumber, formatMonth, shiftMonth, todayString, weekdayLabel } from '../lib/date.js';

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPanel({ calendar, month, selectedDate, onMonthChange, onSelectDate }) {
  const today = todayString();

  return (
    <section className="panel calendar-panel">
      <div className="panel__header calendar-panel__header">
        <div>
          <p className="eyebrow">History</p>
          <h2>Activity calendar</h2>
        </div>
        <div className="month-controls">
          <button className="icon-button" type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Previous month">
            <Icon name="chevronLeft" size={16} />
          </button>
          <span>{formatMonth(month)}</span>
          <button className="icon-button" type="button" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>

      <p className="panel__subtitle">Pick a day to view and update its checkpoints.</p>

      <div className="calendar">
        <div className="calendar__weekdays">
          {WEEKDAY_HEADERS.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="calendar__grid">
          {calendar.days.map((day) => (
            <button
              key={day.date}
              type="button"
              className={[
                'calendar-day',
                day.isCurrentMonth ? '' : 'is-outside',
                day.isFuture ? 'is-future' : '',
                day.date === selectedDate ? 'is-selected' : '',
                day.date === today ? 'is-today' : '',
                day.total > 0 && day.completed === day.total ? 'is-complete' : ''
              ].filter(Boolean).join(' ')}
              style={{ '--day-rate': `${day.rate}%` }}
              onClick={() => onSelectDate(day.date)}
              disabled={day.isFuture}
              title={`${weekdayLabel(day.date)}, ${day.date} - ${day.completed}/${day.total} completed`}
              aria-label={`${day.date}, ${day.completed} of ${day.total} habits completed`}
              aria-pressed={day.date === selectedDate}
            >
              <span className="calendar-day__number">{dayNumber(day.date)}</span>
              {day.total > 0 && !day.isFuture && (
                <span className="calendar-day__dot" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar__legend">
        <span><i className="legend-dot legend-dot--complete" /> All done</span>
        <span><i className="legend-dot legend-dot--partial" /> Partial</span>
        <span><i className="legend-dot legend-dot--empty" /> Nothing due</span>
      </div>
    </section>
  );
}
