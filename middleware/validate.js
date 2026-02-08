const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string().min(3).max(30).required().pattern(/^[a-zA-Z0-9_-]+$/).messages({
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username must be less than 30 characters',
        'string.pattern.base': 'Username can only contain letters, numbers, underscores and hyphens'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
        'string.email': 'Please enter a valid email address'
    }),
    password: Joi.string().min(6).max(100).required().messages({
        'string.min': 'Password must be at least 6 characters'
    })
});

const tutorialSchema = Joi.object({
    title: Joi.string().min(5).max(100).required().messages({
        'string.min': 'Title must be at least 5 characters',
        'string.max': 'Title must be less than 100 characters'
    }),
    content: Joi.string().min(10).required().messages({
        'string.min': 'Content must be at least 10 characters'
    }),
    tags: Joi.array().items(Joi.string().max(20)).optional()
});

module.exports = { userSchema, tutorialSchema };
