import {
  addDays,
  calendarDays,
  daysBetween,
  eachDay,
  monthRange,
  startOfWeek,
  todayString
} from '../utils/date.js';

export function toHabit(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    color: row.color,
    createdDate: row.created_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function completionSet(rows) {
  return new Set(rows.map((row) => row.date));
}

export function currentStreak(dates, today = todayString()) {
  const set = dates instanceof Set ? dates : new Set(dates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function longestStreak(dates) {
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let previous = null;

  for (const date of sorted) {
    run = previous && daysBetween(previous, date) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  return best;
}

function percentage(completed, total) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function datesForHabit(db, habitId) {
  return db
    .prepare('SELECT date FROM completions WHERE habit_id = ? ORDER BY date')
    .all(habitId)
    .map((row) => row.date);
}

function habitWithProgress(row, dates, date) {
  const set = dates instanceof Set ? dates : new Set(dates);
  const weekStart = startOfWeek(date);
  const week = eachDay(weekStart, 7).map((day) => ({
    date: day,
    completed: set.has(day)
  }));

  return {
    ...toHabit(row),
    completedToday: set.has(date),
    currentStreak: currentStreak(set, date),
    longestStreak: longestStreak(set),
    totalCompletions: set.size,
    weekCompleted: week.filter((day) => day.completed).length,
    week
  };
}

export function listHabits(db, date = todayString()) {
  const rows = db
    .prepare('SELECT * FROM habits ORDER BY created_at DESC, id DESC')
    .all();
  const allCompletions = db
    .prepare('SELECT habit_id, date FROM completions ORDER BY date')
    .all();
  const grouped = new Map();

  for (const completion of allCompletions) {
    if (!grouped.has(completion.habit_id)) grouped.set(completion.habit_id, new Set());
    grouped.get(completion.habit_id).add(completion.date);
  }

  return rows.map((row) =>
    habitWithProgress(row, grouped.get(row.id) || new Set(), date)
  );
}

export function getHabit(db, id) {
  return toHabit(db.prepare('SELECT * FROM habits WHERE id = ?').get(id));
}

export function requireHabit(db, id) {
  const habit = getHabit(db, id);
  if (!habit) {
    const error = new Error('Habit not found');
    error.status = 404;
    throw error;
  }
  return habit;
}

export function createHabit(db, input) {
  const today = todayString();
  const result = db
    .prepare(
      `INSERT INTO habits (name, description, category, color, created_date)
       VALUES (@name, @description, @category, @color, @created_date)`
    )
    .run({
      name: input.name,
      description: input.description || '',
      category: input.category || 'General',
      color: input.color || '#6366f1',
      created_date: today
    });

  return getHabit(db, result.lastInsertRowid);
}

export function updateHabit(db, id, input) {
  requireHabit(db, id);
  db.prepare(
    `UPDATE habits
     SET name = @name, description = @description, category = @category,
         color = @color, updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    name: input.name,
    description: input.description || '',
    category: input.category || 'General',
    color: input.color || '#6366f1'
  });

  return getHabit(db, id);
}

export function deleteHabit(db, id) {
  requireHabit(db, id);
  db.prepare('DELETE FROM habits WHERE id = ?').run(id);
  return true;
}

export function setCompletion(db, id, date, completed) {
  requireHabit(db, id);
  const existing = db
    .prepare('SELECT 1 FROM completions WHERE habit_id = ? AND date = ?')
    .get(id, date);

  if (completed) {
    if (existing) {
      db.prepare(
        "UPDATE completions SET completed_at = datetime('now') WHERE habit_id = ? AND date = ?"
      ).run(id, date);
    } else {
      db.prepare(
        "INSERT INTO completions (habit_id, date) VALUES (?, ?)"
      ).run(id, date);
    }
  } else if (existing) {
    db.prepare('DELETE FROM completions WHERE habit_id = ? AND date = ?').run(id, date);
  }

  const row = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  const dates = completionSet(
    db.prepare('SELECT date FROM completions WHERE habit_id = ?').all(id)
  );

  return {
    habit: toHabit(row),
    completion: { date, completed },
    currentStreak: currentStreak(dates),
    totalCompletions: dates.size
  };
}

export function getHabitHistory(db, id, month) {
  const habit = requireHabit(db, id);
  const dates = new Set(datesForHabit(db, id));
  const { first } = monthRange(`${month}-01`);
  const days = calendarDays(first).map((date) => ({
    date,
    completed: dates.has(date),
    isCurrentMonth: date.slice(0, 7) === month
  }));
  const monthDays = days.filter((day) => day.isCurrentMonth);
  const eligibleDays = monthDays.filter((day) => day.date <= habit.createdDate);

  return {
    habit: toHabit(habit),
    month,
    days,
    stats: {
      monthCompleted: monthDays.filter((day) => day.completed).length,
      monthRate: percentage(
        monthDays.filter((day) => day.completed).length,
        eligibleDays.length
      ),
      totalCompletions: dates.size,
      currentStreak: currentStreak(dates),
      longestStreak: longestStreak(dates)
    }
  };
}

export function getDashboardStats(db, date = todayString(), month = date.slice(0, 7)) {
  const habits = listHabits(db, date);
  const today = todayString();
  const weekStart = startOfWeek(date);
  const week = eachDay(weekStart, 7).map((day) => {
    const total = habits.filter(
      (habit) => habit.createdDate <= day && day <= today
    ).length;
    const completedByDate = db
      .prepare('SELECT COUNT(*) AS count FROM completions WHERE date = ?')
      .get(day).count;
    const cappedCompleted = Math.min(completedByDate, total);

    return {
      date: day,
      total,
      completed: cappedCompleted,
      rate: percentage(cappedCompleted, total),
      isToday: day === today,
      isFuture: day > today
    };
  });

  const { first } = monthRange(`${month}-01`);
  const calendar = calendarDays(first).map((day) => {
    const total = habits.filter(
      (habit) => habit.createdDate <= day && day <= today
    ).length;
    const rawCompleted = db
      .prepare('SELECT COUNT(*) AS count FROM completions WHERE date = ?')
      .get(day).count;
    const completed = Math.min(rawCompleted, total);

    return {
      date: day,
      total,
      completed,
      rate: percentage(completed, total),
      isCurrentMonth: day.slice(0, 7) === month,
      isFuture: day > today
    };
  });

  const activeDays = calendar.filter(
    (day) => day.isCurrentMonth && day.total > 0 && !day.isFuture
  );
  const totalCompletions = habits.reduce((sum, habit) => sum + habit.totalCompletions, 0);
  const eligibleWeekDays = week.reduce((sum, day) => sum + day.total, 0);
  const completedWeekDays = week.reduce((sum, day) => sum + day.completed, 0);

  return {
    date,
    weekStart,
    summary: {
      totalHabits: habits.length,
      completedToday: habits.filter((habit) => habit.completedToday).length,
      todayRate: percentage(
        habits.filter((habit) => habit.completedToday).length,
        habits.length
      ),
      completedThisWeek: completedWeekDays,
      weeklyRate: percentage(completedWeekDays, eligibleWeekDays),
      currentStreak: Math.max(0, ...habits.map((habit) => habit.currentStreak)),
      bestStreak: Math.max(0, ...habits.map((habit) => habit.longestStreak)),
      perfectDays: activeDays.filter((day) => day.completed === day.total).length,
      totalCompletions
    },
    week,
    calendar: {
      month,
      days: calendar,
      completed: activeDays.reduce((sum, day) => sum + day.completed, 0),
      total: activeDays.reduce((sum, day) => sum + day.total, 0)
    },
    habits: habits.map(({ week: habitWeek, ...habit }) => ({
      ...habit,
      week: habitWeek
    }))
  };
}
