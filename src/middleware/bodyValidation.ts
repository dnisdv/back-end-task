import { RequestHandler } from 'express';
import { BadRequestError } from '../errors';
import Joi from 'joi';

export function BodyValidation(Schema: Joi.Schema): RequestHandler {
    return function bodyValidation(req, res, next): void {
      try {
        const { error } = Schema.validate(req.body) as unknown as Joi.ValidationResult;
        if (error) {
          throw new BadRequestError(error.message);
        }
  
        return next();
      } catch (error) {
        return next(error);
      }
    };
  }