import Joi from 'joi';

export const CreatePostSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(30)
        .required(),

    content: Joi.string()
        .required()
        .min(3)
        .max(300),

    isHidden: Joi.boolean(),
});

export const UpdatePostSchema = Joi.object({
    id: Joi.number()
        .required(),
        
    title: Joi.string()
        .min(3)
        .max(30),

    content: Joi.string()
        .min(3)
        .max(300),

    isHidden: Joi.boolean(),
});
