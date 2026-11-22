import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { dayNumber, formatMonth, shiftMonth, weekdayLabel } from '../lib/date.js';
import Icon from './Icon.jsx';

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HistoryModal({ habit, initialMonth, onClose }) {
  const [month, setMonth] = useState(initialMonth);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api.getHabitHistory(habit.id, month)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [habit.id, month]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal modal--history" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="modal__header">
          <div>
            <p className="eyebrow">Historical calendar</p>
            <h2 id="history-title">{habit.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close history">
            <Icon name="close" />
          </button>
        </div>

        <div className="history-summary">
          <div><strong>{history?.stats.monthCompleted ?? '--'}</strong><span>This month</span></div>
          <div><strong>{history?.stats.monthRate ?? '--'}%</strong><span>Month rate</span></div>
          <div><strong>{history?.stats.currentStreak ?? '--'}</strong><span>Current streak</span></div>
          <div><strong>{history?.stats.longestStreak ?? '--'}</strong><span>Best streak</span></div>
          <div><strong>{history?.stats.totalCompletions ?? '--'}</strong><span>All time</span></div>
        </div>

        <div className="month-controls history-month">
          <button className="icon-button" type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
            <Icon name="chevronLeft" size={16} />
          </button>
          <span>{formatMonth(month)}</span>
          <button className="icon-button" type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>

        {loading && <div className="inline-loader">Loading history...</div>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {!loading && history && (
          <div className="calendar calendar--history">
            <div className="calendar__weekdays">
              {WEEKDAY_HEADERS.map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="calendar__grid">
              {history.days.map((day) => (
                <div
                  key={day.date}
                  className={[
                    'calendar-day',
                    day.isCurrentMonth ? '' : 'is-outside',
                    day.completed ? 'is-complete' : ''
                  ].filter(Boolean).join(' ')}
                  title={`${weekdayLabel(day.date)}, ${day.date}${day.completed ? ' - completed' : ''}`}
                >
                  <span className="calendar-day__number">{dayNumber(day.date)}</span>
                  {day.completed && <Icon name="check" size={13} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
