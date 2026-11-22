const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const payload = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    const details = payload?.details?.map((detail) => detail.message).join(' ');
    throw new Error(details || payload?.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

export const api = {
  getHabits: (date) => request(`/habits?date=${encodeURIComponent(date)}`),
  getStats: (date, month) =>
    request(`/stats?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}`),
  createHabit: (habit) =>
    request('/habits', { method: 'POST', body: JSON.stringify(habit) }),
  updateHabit: (id, habit) =>
    request(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(habit) }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  setCompletion: (id, date, completed) =>
    request(`/habits/${id}/completions/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ completed })
    }),
  getHabitHistory: (id, month) =>
    request(`/habits/${id}/completions?month=${encodeURIComponent(month)}`)
};
