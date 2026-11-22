import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';
import { addDays, todayString } from '../src/utils/date.js';

let db;
let app;

beforeEach(() => {
  db = createDatabase(':memory:');
  app = createApp(db);
});

afterEach(() => {
  db.close();
});

async function createHabit(overrides = {}) {
  const response = await request(app)
    .post('/api/habits')
    .send({ name: 'Morning walk', color: '#4f46e5', ...overrides })
    .expect(201);

  return response.body.habit;
}

describe('health and API errors', () => {
  it('reports API health', async () => {
    const response = await request(app).get('/api/health').expect(200);
    assert.equal(response.body.status, 'ok');
  });

  it('returns a structured 404 for unknown API routes', async () => {
    const response = await request(app).get('/api/missing').expect(404);
    assert.equal(response.body.error, 'API endpoint not found');
  });

  it('returns a structured error for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/habits')
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400);

    assert.equal(response.body.error, 'Malformed JSON body');
  });
});

describe('habit validation and CRUD', () => {
  it('rejects an empty name and an invalid color', async () => {
    const response = await request(app)
      .post('/api/habits')
      .send({ name: '   ', color: 'red' })
      .expect(400);

    assert.equal(response.body.error, 'Validation failed');
    assert.deepEqual(
      response.body.details.map((detail) => detail.field).sort(),
      ['color', 'name']
    );
  });

  it('creates, lists, reads, updates and deletes a habit', async () => {
    const habit = await createHabit({
      description: 'Walk for 20 minutes',
      category: 'Health'
    });

    assert.equal(habit.name, 'Morning walk');
    assert.equal(habit.category, 'Health');
    assert.equal(habit.createdDate, todayString());

    const list = await request(app).get('/api/habits').expect(200);
    assert.equal(list.body.habits.length, 1);
    assert.equal(list.body.habits[0].id, habit.id);

    const single = await request(app).get(`/api/habits/${habit.id}`).expect(200);
    assert.equal(single.body.habit.description, 'Walk for 20 minutes');

    const updated = await request(app)
      .put(`/api/habits/${habit.id}`)
      .send({ name: 'Evening walk', category: 'Fitness', color: '#10b981' })
      .expect(200);
    assert.equal(updated.body.habit.name, 'Evening walk');
    assert.equal(updated.body.habit.category, 'Fitness');

    await request(app).delete(`/api/habits/${habit.id}`).expect(204);
    await request(app).get(`/api/habits/${habit.id}`).expect(404);
  });

  it('returns 404 when updating or deleting an unknown habit', async () => {
    await request(app)
      .put('/api/habits/999')
      .send({ name: 'Missing' })
      .expect(404);
    await request(app).delete('/api/habits/999').expect(404);
  });

  it('rejects an invalid habit id', async () => {
    await request(app).get('/api/habits/not-a-number').expect(400);
  });
});

describe('completions and streaks', () => {
  it('toggles daily completion and calculates the current streak', async () => {
    const habit = await createHabit();
    const yesterday = addDays(todayString(), -1);

    await request(app)
      .put(`/api/habits/${habit.id}/completions/${yesterday}`)
      .send({ completed: true })
      .expect(200);

    const today = await request(app)
      .put(`/api/habits/${habit.id}/completions/${todayString()}`)
      .send({ completed: true })
      .expect(200);

    assert.equal(today.body.currentStreak, 2);
    assert.equal(today.body.totalCompletions, 2);

    const list = await request(app).get('/api/habits').expect(200);
    assert.equal(list.body.habits[0].completedToday, true);
    assert.equal(list.body.habits[0].currentStreak, 2);

    const unchecked = await request(app)
      .put(`/api/habits/${habit.id}/completions/${todayString()}`)
      .send({ completed: false })
      .expect(200);
    assert.equal(unchecked.body.completion.completed, false);
    assert.equal(unchecked.body.totalCompletions, 1);
  });

  it('rejects future dates and non-boolean completion values', async () => {
    const habit = await createHabit();
    const future = addDays(todayString(), 1);

    await request(app)
      .put(`/api/habits/${habit.id}/completions/${future}`)
      .send({ completed: true })
      .expect(400);

    await request(app)
      .put(`/api/habits/${habit.id}/completions/${todayString()}`)
      .send({ completed: 'yes' })
      .expect(400);
  });

  it('returns monthly history for a habit', async () => {
    const habit = await createHabit();
    await request(app)
      .put(`/api/habits/${habit.id}/completions/${todayString()}`)
      .send({ completed: true })
      .expect(200);

    const response = await request(app)
      .get(`/api/habits/${habit.id}/completions?month=${todayString().slice(0, 7)}`)
      .expect(200);

    assert.equal(response.body.habit.id, habit.id);
    assert.ok(response.body.days.length >= 28);
    assert.equal(
      response.body.days.find((day) => day.date === todayString()).completed,
      true
    );
    assert.equal(response.body.stats.monthCompleted, 1);
  });
});

describe('dashboard statistics', () => {
  it('returns weekly, calendar and summary data from the database', async () => {
    const habit = await createHabit();
    await request(app)
      .put(`/api/habits/${habit.id}/completions/${todayString()}`)
      .send({ completed: true })
      .expect(200);

    const response = await request(app).get('/api/stats').expect(200);

    assert.equal(response.body.week.length, 7);
    assert.equal(response.body.summary.totalHabits, 1);
    assert.equal(response.body.summary.completedToday, 1);
    assert.equal(response.body.summary.todayRate, 100);
    assert.equal(response.body.calendar.month, todayString().slice(0, 7));
    assert.equal(response.body.habits[0].completedToday, true);
  });

  it('validates date and month query parameters', async () => {
    await request(app).get('/api/stats?date=01-01-2026').expect(400);
    await request(app).get('/api/stats?month=2026-13').expect(400);
  });
});

describe('SQLite persistence', () => {
  it('keeps habits and completion history after reopening the database', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-tracker-'));
    const dbPath = path.join(directory, 'habits.db');
    let first;
    let second;

    try {
      first = createDatabase(dbPath);
      const created = first
        .prepare(
          `INSERT INTO habits (name, description, category, color, created_date)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('Persistent habit', 'Survives restarts', 'Health', '#6366f1', todayString());
      first
        .prepare('INSERT INTO completions (habit_id, date) VALUES (?, ?)')
        .run(created.lastInsertRowid, todayString());
      first.close();
      first = null;

      second = createDatabase(dbPath);
      const persisted = second.prepare('SELECT name FROM habits').get();
      const completion = second.prepare('SELECT date FROM completions').get();
      assert.equal(persisted.name, 'Persistent habit');
      assert.equal(completion.date, todayString());
    } finally {
      if (first) first.close();
      if (second) second.close();
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
