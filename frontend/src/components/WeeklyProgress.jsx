import Icon from './Icon.jsx';
import { dayNumber, weekdayLabel } from '../lib/date.js';

export default function WeeklyProgress({ week }) {
  return (
    <section className="panel weekly-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Consistency overview</p>
          <h2>Weekly progress</h2>
          <p className="panel__subtitle">Daily completion across all active habits.</p>
        </div>
        <div className="panel__badge">
          <Icon name="chart" size={16} /> Last 7 days
        </div>
      </div>

      <div className="weekly-grid">
        {week.map((day) => (
          <div key={day.date} className={`weekly-day${day.isToday ? ' is-today' : ''}${day.isFuture ? ' is-future' : ''}`}>
            <div className="weekly-day__top">
              <span className="weekly-day__weekday">{weekdayLabel(day.date)}</span>
              <span className="weekly-day__number">{dayNumber(day.date)}</span>
            </div>
            <div className="weekly-day__bar">
              <div className="weekly-day__fill" style={{ height: `${day.rate}%` }} />
            </div>
            <div className="weekly-day__footer">
              <strong>{day.rate}%</strong>
              <span>{day.completed}/{day.total}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
