import Joi from 'joi';

const EMAIL_VALIDATION_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const UserSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .required(),

    email: Joi.string()
        .regex(EMAIL_VALIDATION_REGEX)
        .required(),

    password: Joi.string()
        .min(3)
        .required(),
});

