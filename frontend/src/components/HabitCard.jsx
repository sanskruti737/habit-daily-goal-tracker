import Icon from './Icon.jsx';
import { relativeDay, todayString, weekdayLabel } from '../lib/date.js';

export default function HabitCard({ habit, selectedDate, busy, onToggle, onEdit, onDelete, onHistory }) {
  const completed = habit.completedToday;
  const progress = Math.round((habit.weekCompleted / 7) * 100);
  const today = todayString();

  return (
    <article className="habit-card" style={{ '--habit-color': habit.color }}>
      <div className="habit-card__accent" />
      <div className="habit-card__top">
        <div className="habit-card__heading">
          <span className="habit-card__initial">{habit.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <h3>{habit.name}</h3>
            <p className="habit-card__category">{habit.category}</p>
          </div>
        </div>
        <div className="habit-card__actions">
          <button className="icon-button" type="button" onClick={() => onEdit(habit)} aria-label={`Edit ${habit.name}`}>
            <Icon name="edit" size={16} />
          </button>
          <button className="icon-button icon-button--danger" type="button" onClick={() => onDelete(habit)} aria-label={`Delete ${habit.name}`}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      {habit.description && <p className="habit-card__description">{habit.description}</p>}

      <div className="habit-card__meta">
        <span className="pill pill--streak">
          <Icon name="flame" size={14} /> {habit.currentStreak} day streak
        </span>
        <span className="pill">{habit.totalCompletions} completions</span>
      </div>

      <div className="habit-card__week" aria-label={`Weekly checkpoints for ${habit.name}`}>
        {habit.week.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`day-check${day.completed ? ' is-complete' : ''}${day.date === selectedDate ? ' is-selected' : ''}`}
            onClick={() => onToggle(habit, day.date, !day.completed)}
            disabled={busy || day.date > today}
            title={`${weekdayLabel(day.date)} ${day.date}${day.completed ? ' - completed' : ''}`}
            aria-label={`Mark ${habit.name} ${day.completed ? 'incomplete' : 'complete'} on ${day.date}`}
            aria-pressed={day.completed}
          >
            <span>{weekdayLabel(day.date).slice(0, 1)}</span>
            {day.completed && <Icon name="check" size={12} />}
          </button>
        ))}
      </div>

      <div className="habit-card__progress">
        <div className="progress-label">
          <span>This week</span>
          <span>{habit.weekCompleted}/7</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="habit-card__footer">
        <button
          type="button"
          className={`completion-toggle${completed ? ' is-complete' : ''}`}
          onClick={() => onToggle(habit, selectedDate, !completed)}
          disabled={busy}
          aria-pressed={completed}
        >
          <span className="completion-toggle__box">
            {completed && <Icon name="check" size={15} />}
          </span>
          {completed ? 'Completed' : 'Mark complete'}
          <small>{relativeDay(selectedDate)}</small>
        </button>
        <button type="button" className="text-button" onClick={() => onHistory(habit)}>
          <Icon name="history" size={15} /> History
        </button>
      </div>
    </article>
  );
}
