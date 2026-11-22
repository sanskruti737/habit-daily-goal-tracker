import { useCallback, useEffect, useMemo, useState } from 'react';
import CalendarPanel from './components/CalendarPanel.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import HabitCard from './components/HabitCard.jsx';
import HabitForm from './components/HabitForm.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import Icon from './components/Icon.jsx';
import StatCard from './components/StatCard.jsx';
import WeeklyProgress from './components/WeeklyProgress.jsx';
import { api } from './lib/api.js';
import { formatLongDate, todayString } from './lib/date.js';
import './styles.css';

function TopBar({ selectedDate, today, refreshing, onDateChange, onNewHabit, onRefresh }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark"><Icon name="check" size={20} /></span>
        <div>
          <strong>Habit Flow</strong>
          <small>Daily goals, measurable progress</small>
        </div>
      </div>
      <div className="topbar__actions">
        <label className="date-picker">
          <Icon name="calendar" size={16} />
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(event) => onDateChange(event.target.value)}
            aria-label="Select progress date"
          />
        </label>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh dashboard" title="Refresh dashboard" disabled={refreshing}>
          <Icon name="refresh" size={17} />
        </button>
        <button className="button button--primary" type="button" onClick={onNewHabit}>
          <Icon name="plus" size={17} /> New habit
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const today = useMemo(() => todayString(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [data, setData] = useState({ habits: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({ open: false, habit: null });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [toast, setToast] = useState('');

  const load = useCallback(async (options = {}) => {
    if (options.silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [habitResponse, statsResponse] = await Promise.all([
        api.getHabits(selectedDate),
        api.getStats(selectedDate, month)
      ]);
      setData({ habits: habitResponse.habits, stats: statsResponse });
    } catch (cause) {
      setError(cause.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleDateChange(value) {
    if (!value || value > today) return;
    setSelectedDate(value);
    setMonth(value.slice(0, 7));
  }

  async function handleToggle(habit, date, completed) {
    if (busyIds.has(habit.id)) return;

    setBusyIds((current) => new Set(current).add(habit.id));
    setData((current) => ({
      ...current,
      habits: current.habits.map((item) => {
        if (item.id !== habit.id) return item;
        return {
          ...item,
          completedToday: date === selectedDate ? completed : item.completedToday,
          week: item.week.map((day) =>
            day.date === date ? { ...day, completed } : day
          )
        };
      })
    }));

    try {
      await api.setCompletion(habit.id, date, completed);
      await load({ silent: true });
    } catch (cause) {
      setError(cause.message || 'Unable to update completion.');
      await load({ silent: true });
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(habit.id);
        return next;
      });
    }
  }

  function openCreate() {
    setFormError('');
    setFormState({ open: true, habit: null });
  }

  function openEdit(habit) {
    setFormError('');
    setFormState({ open: true, habit });
  }

  async function handleSubmit(formValues) {
    setSubmitting(true);
    setFormError('');

    try {
      if (formState.habit) {
        await api.updateHabit(formState.habit.id, formValues);
        setToast('Habit updated successfully.');
      } else {
        await api.createHabit(formValues);
        setToast('Habit created successfully.');
      }
      setFormState({ open: false, habit: null });
      await load({ silent: true });
    } catch (cause) {
      setFormError(cause.message || 'Unable to save habit.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteHabit(deleteTarget.id);
      setToast('Habit and its history were deleted.');
      setDeleteTarget(null);
      await load({ silent: true });
    } catch (cause) {
      setError(cause.message || 'Unable to delete habit.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const stats = data.stats;
  const summary = stats?.summary || {
    totalHabits: 0,
    completedToday: 0,
    todayRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    perfectDays: 0
  };

  return (
    <div className="app-shell">
      <TopBar
        selectedDate={selectedDate}
        today={today}
        refreshing={refreshing}
        onDateChange={handleDateChange}
        onNewHabit={openCreate}
        onRefresh={() => load({ silent: true })}
      />

      <main className="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">Your progress, in one place</p>
            <h1>Build better days, one habit at a time.</h1>
            <p className="hero__text">
              Create habits, check off daily goals, and watch your streaks grow.
              Every checkpoint is stored permanently in SQLite.
            </p>
          </div>
          <div className="hero__date">
            <Icon name="calendar" size={18} />
            <div>
              <small>Viewing</small>
              <strong>{formatLongDate(selectedDate)}</strong>
            </div>
            {selectedDate !== today && (
              <button type="button" className="text-button" onClick={() => handleDateChange(today)}>
                Back to today
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" className="button button--small" onClick={() => load()}>
              <Icon name="refresh" size={14} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-panel" role="status">
            <span className="spinner" />
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            <section className="stats-grid" aria-label="Progress statistics">
              <StatCard icon="target" label="Total habits" value={summary.totalHabits} detail="Currently being tracked" tone="indigo" />
              <StatCard icon="check" label="Completed" value={summary.completedToday} detail={formatLongDate(selectedDate)} tone="emerald" />
              <StatCard icon="chart" label="Daily rate" value={`${summary.todayRate}%`} detail="Checkpoints done today" tone="cyan" />
              <StatCard icon="flame" label="Best streak" value={summary.currentStreak} detail={`All-time best: ${summary.bestStreak} days`} tone="amber" />
              <StatCard icon="trophy" label="Perfect days" value={summary.perfectDays} detail="Every habit completed" tone="violet" />
              <StatCard icon="calendar" label="Total checkpoints" value={summary.totalCompletions} detail="Saved in your database" tone="rose" />
            </section>

            <div className="dashboard-grid">
              <section className="panel habits-panel">
                <div className="panel__header">
                  <div>
                    <p className="eyebrow">Your routines</p>
                    <h2>Daily habits</h2>
                    <p className="panel__subtitle">
                      {data.habits.length === 0
                        ? 'Start by adding your first habit.'
                        : `${data.habits.length} habit${data.habits.length === 1 ? '' : 's'} tracked`}
                    </p>
                  </div>
                  <button className="button button--secondary" type="button" onClick={openCreate}>
                    <Icon name="plus" size={16} /> Add habit
                  </button>
                </div>

                {data.habits.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state__icon"><Icon name="target" size={26} /></span>
                    <h3>No habits yet</h3>
                    <p>Add a habit to start tracking daily progress, streaks and history.</p>
                    <button className="button button--primary" type="button" onClick={openCreate}>
                      <Icon name="plus" size={16} /> Create your first habit
                    </button>
                  </div>
                ) : (
                  <div className="habit-list">
                    {data.habits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        selectedDate={selectedDate}
                        busy={busyIds.has(habit.id)}
                        onToggle={handleToggle}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                        onHistory={setHistoryTarget}
                      />
                    ))}
                  </div>
                )}
              </section>

              <CalendarPanel
                calendar={stats?.calendar || { month, days: [] }}
                month={month}
                selectedDate={selectedDate}
                onMonthChange={setMonth}
                onSelectDate={handleDateChange}
              />
            </div>

            <WeeklyProgress week={stats?.week || []} />
          </>
        )}
      </main>

      <footer className="footer">
        <span>Habit Flow</span>
        <span>React + Express + SQLite</span>
      </footer>

      {formState.open && (
        <HabitForm
          habit={formState.habit}
          onSubmit={handleSubmit}
          onClose={() => setFormState({ open: false, habit: null })}
          submitting={submitting}
          error={formError}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          habit={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}

      {historyTarget && (
        <HistoryModal
          habit={historyTarget}
          initialMonth={month}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} aria-label="Dismiss notification">
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
