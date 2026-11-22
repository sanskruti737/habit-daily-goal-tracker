import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'General',
  color: COLORS[0]
};

export default function HabitForm({ habit, onSubmit, onClose, submitting, error }) {
  const [form, setForm] = useState(() => (habit ? { ...habit } : EMPTY_FORM));
  const [localError, setLocalError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setLocalError('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setLocalError('Please enter a habit name.');
      nameRef.current?.focus();
      return;
    }

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'General',
      color: form.color
    });
  }

  const message = localError || error;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal modal--form" role="dialog" aria-modal="true" aria-labelledby="habit-form-title">
        <div className="modal__header">
          <div>
            <p className="eyebrow">{habit ? 'Update habit' : 'New habit'}</p>
            <h2 id="habit-form-title">{habit ? 'Edit your habit' : 'Create a habit'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog" disabled={submitting}>
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Habit name</span>
            <input
              ref={nameRef}
              type="text"
              maxLength="80"
              placeholder="e.g. Read for 20 minutes"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Description <em>optional</em></span>
            <textarea
              rows="3"
              maxLength="240"
              placeholder="What does success look like?"
              value={form.description || ''}
              onChange={(event) => update('description', event.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Category</span>
              <input
                type="text"
                maxLength="32"
                placeholder="Health, Work, Mind..."
                value={form.category || ''}
                onChange={(event) => update('category', event.target.value)}
              />
            </label>

            <fieldset className="field color-field">
              <legend>Accent color</legend>
              <div className="color-options">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option${form.color === color ? ' is-selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => update('color', color)}
                    aria-label={`Select color ${color}`}
                    aria-pressed={form.color === color}
                  />
                ))}
              </div>
            </fieldset>
          </div>

          {message && <p className="form-error" role="alert">{message}</p>}

          <div className="modal__actions">
            <button className="button button--ghost" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : habit ? 'Save changes' : 'Create habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
