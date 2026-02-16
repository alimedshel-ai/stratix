const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  handleValidationErrors,
];

// Entity validation rules
const validateEntity = [
  body('legalName')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Legal name is required (2-255 characters)'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Display name must be less than 255 characters'),
  body('sectorId')
    .optional()
    .isString()
    .withMessage('Sector ID must be a valid string'),
  body('industryId')
    .optional()
    .isString()
    .withMessage('Industry ID must be a valid string'),
  body('typeId')
    .optional()
    .isString()
    .withMessage('Type ID must be a valid string'),
  handleValidationErrors,
];

// KPI validation rules
const validateKPI = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('KPI name is required (2-255 characters)'),
  body('target')
    .isFloat({ min: 0 })
    .withMessage('Target must be a positive number'),
  body('actual')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual must be a positive number'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Unit must be less than 50 characters'),
  handleValidationErrors,
];

// Strategic Objective validation rules
const validateObjective = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Objective title is required (2-255 characters)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateEntity,
  validateKPI,
  validateObjective,
  handleValidationErrors,
};
