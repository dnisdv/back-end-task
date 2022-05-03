import { Router, RequestHandler } from 'express';
import { Op } from 'sequelize';
import { LoginUserSchema, RegisterUserSchema } from '../validation';

import type { SequelizeClient } from '../sequelize';
import type { User } from '../repositories/types';

import { BadRequestError, UnauthorizedError } from '../errors';
import { checkPassword, generateToken } from '../security';
import { initTokenValidationRequestHandler, initAdminValidationRequestHandler, RequestAuth } from '../middleware/security';
import { UserType } from '../constants';
import { BodyValidation } from '../middleware/bodyValidation';

export function initUsersRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);
  const adminValidation = initAdminValidationRequestHandler();

  router.route('/')
    .get(tokenValidation, initListUsersRequestHandler(sequelizeClient))
    .post(tokenValidation, adminValidation, BodyValidation(RegisterUserSchema), initCreateUserRequestHandler(sequelizeClient));

  router.route('/login')
    .post(BodyValidation(LoginUserSchema), initLoginUserRequestHandler(sequelizeClient));
  router.route('/register')
    .post(BodyValidation(RegisterUserSchema), initRegisterUserRequestHandler(sequelizeClient));

  return router;
}

function initListUsersRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listUsersRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { auth: { user: { type: userType } } } = req as unknown as { auth: RequestAuth };

      const isAdmin = userType === UserType.ADMIN;

      const users = await models.users.findAll({
        attributes: isAdmin ? ['id', 'name', 'email'] : ['name', 'email'],
        ...!isAdmin && { where: { type: { [Op.ne]: UserType.ADMIN } } },
        raw: true,
      });

      res.send(users);

      return res.end();
    } catch (error) {
      next(error);
    }
  };
}

function initCreateUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createUserRequestHandler(req, res, next): Promise<void> {
    try {
      // NOTE(roman): missing validation and cleaning
      const { type, name, email, password } = req.body as CreateUserData;

      await createUser({ type, name, email, password }, sequelizeClient);

      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  };
}

function initLoginUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function loginUserRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { email, password } = req.body as CreateUserData;

      const user = await models.users.findOne({
        attributes: ['id', 'passwordHash'],
        where: { email },
        raw: true,
      }) as Pick<User, 'id' | 'passwordHash'> | null;
      if (!user) {
        throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
      }

      if (!checkPassword(password, user.passwordHash)) {
        throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
      }

      const token = generateToken({ id: user.id });

      return res.send({ token }).end();
    } catch (error) {
      next(error);
    }
  };
}

function initRegisterUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createUserRequestHandler(req, res, next): Promise<void> {
    try {
      const { name, email, password } = req.body as Omit<CreateUserData, 'type'>;

      await createUser({ type: UserType.BLOGGER, name, email, password }, sequelizeClient);

      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  };
}

async function createUser(data: CreateUserData, sequelizeClient: SequelizeClient): Promise<void> {
  const { type, name, email, password } = data;

  const { models } = sequelizeClient;

  const similarUser = await models.users.findOne({
    attributes: ['id', 'name', 'email'],
    where: {
      [Op.or]: [
        { name },
        { email },
      ],
    },
    raw: true,
  }) as Pick<User, 'id' | 'name' | 'email'> | null;
  if (similarUser) {
    if (similarUser.name === name) {
      throw new BadRequestError('NAME_ALREADY_USED');
    }
    if (similarUser.email === email) {
      throw new BadRequestError('EMAIL_ALREADY_USED');
    }
  }

  await models.users.create({ type, name, email, passwordHash: password });
}

type CreateUserData = Pick<User, 'type' | 'name' | 'email'> & { password: User['passwordHash'] };