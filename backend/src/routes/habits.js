import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createHabit,
  currentStreak,
  deleteHabit,
  getDashboardStats,
  getHabitHistory,
  listHabits,
  requireHabit,
  setCompletion,
  updateHabit
} from '../services/habits.js';
import { isNotFutureDate, isValidDateString, todayString } from '../utils/date.js';
import { validationError } from '../middleware/validation.js';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const habitFields = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Name must be between 1 and 80 characters.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 240 })
    .withMessage('Description must be 240 characters or fewer.'),
  body('category')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 32 })
    .withMessage('Category must be 32 characters or fewer.'),
  body('color')
    .optional({ values: 'falsy' })
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Color must be a hexadecimal value such as #6366f1.')
];

const optionalDateQuery = query('date')
  .optional()
  .custom(isValidDateString)
  .withMessage('Date must use the YYYY-MM-DD format.');
const optionalMonthQuery = query('month')
  .optional()
  .matches(MONTH_PATTERN)
  .withMessage('Month must use the YYYY-MM format.');

export function createHabitRoutes(db) {
  const router = Router();

  router.get('/', optionalDateQuery, validationError, (req, res) => {
    res.json({
      date: req.query.date || todayString(),
      habits: listHabits(db, req.query.date || todayString())
    });
  });

  router.get('/:id', param('id').isInt({ min: 1 }), validationError, (req, res) => {
    const habit = requireHabit(db, Number(req.params.id));
    res.json({ habit });
  });

  router.post('/', habitFields, validationError, (req, res) => {
    const habit = createHabit(db, req.body);
    res.status(201).json({ habit });
  });

  router.put('/:id', param('id').isInt({ min: 1 }), ...habitFields, validationError, (req, res) => {
    const habit = updateHabit(db, Number(req.params.id), req.body);
    res.json({ habit });
  });

  router.delete('/:id', param('id').isInt({ min: 1 }), validationError, (req, res) => {
    deleteHabit(db, Number(req.params.id));
    res.status(204).end();
  });

  router.get(
    '/:id/completions',
    param('id').isInt({ min: 1 }),
    optionalMonthQuery,
    validationError,
    (req, res) => {
      const month = req.query.month || todayString().slice(0, 7);
      res.json(getHabitHistory(db, Number(req.params.id), month));
    }
  );

  router.put(
    '/:id/completions/:date',
    param('id').isInt({ min: 1 }),
    param('date').custom(isNotFutureDate).withMessage('Completion date cannot be in the future.'),
    body('completed').isBoolean().withMessage('Completed must be a boolean.'),
    validationError,
    (req, res) => {
      const result = setCompletion(
        db,
        Number(req.params.id),
        req.params.date,
        req.body.completed
      );
      res.json(result);
    }
  );

  return router;
}

export function createStatsRoutes(db) {
  const router = Router();

  router.get(
    '/',
    optionalDateQuery,
    optionalMonthQuery,
    validationError,
    (req, res) => {
      res.json(
        getDashboardStats(
          db,
          req.query.date || todayString(),
          req.query.month || (req.query.date || todayString()).slice(0, 7)
        )
      );
    }
  );

  return router;
}
