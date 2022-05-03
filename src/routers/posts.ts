import { Router, RequestHandler } from 'express';
import { CreatePostSchema, UpdatePostSchema } from '../validation';

import type { SequelizeClient } from '../sequelize';
import { Post } from '../repositories/types';

import { BodyValidation } from '../middleware/bodyValidation';
import { NotFoundError, UnauthorizedError } from '../errors';
import { initTokenValidationRequestHandler, RequestAuth } from '../middleware/security';
import { UserType } from '../constants';

export function initPostsRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

  router.route('/')
    .get(tokenValidation, initListMyPostsRequestHandler(sequelizeClient))
    .post(tokenValidation, BodyValidation(CreatePostSchema), initCreatePostRequestHandler(sequelizeClient))
    .put(tokenValidation, BodyValidation(UpdatePostSchema), initUpdatePostRequestHandler(sequelizeClient));


  router.route('/:id')
    .get(tokenValidation, initGetSinglePostRequestHandler(sequelizeClient)) 
    .delete(tokenValidation, initDeletePostRequestHandler(sequelizeClient));
 
  router.route('/user/:authorId')
        .get(tokenValidation, initGetAllUserPostsRequestHandler(sequelizeClient));

  return router;
}

function initListMyPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listPostsRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const me = (req as unknown as { auth: RequestAuth }).auth.user;

      const posts = await models.posts.findAll({
        where: { authorId: me.id } ,
        raw: true,
      });

      res.send(posts);

      return res.end();
    } catch (error) {
      next(error);
    }
  };
}

function initCreatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createUserRequestHandler(req, res, next): Promise<void> {
    try {
      const authorId = (req as unknown as { auth: RequestAuth }).auth.user.id;
      const { title, content, isHidden } = req.body as CreatePostData;

      const post = await createPost({ title, content, isHidden, authorId: authorId}, sequelizeClient);

      return res.status(200).send(post).end();
    } catch (error) {
      next(error);
    }
  };
}

function initGetSinglePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listPostsRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const authorId = (req as unknown as { auth: RequestAuth }).auth.user.id;
      const { id: postId } = req.params;
      const isAdminOrAuthor = (req as unknown as { auth: RequestAuth }).auth.user.type === UserType.ADMIN || +authorId === +postId;

      const post = await models.posts.findOne({
        where: {
           id: postId,
           ...!isAdminOrAuthor && { isHidden: false },
        } ,
        raw: true,
      });

      if(!post){
        throw new NotFoundError('Post not found', req.method, req.path);
      }

      if(post.authorId === authorId){
        res.status(200).send(post);
        return res.end();
      }

      if(post?.isHidden){
        throw new NotFoundError('Post not found', req.method, req.path);
      }

      res.status(200).send(post);
      return res.end();
    } catch (error) {
      next(error);
    }
  };
}

function initDeletePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function deletePostRequestHandler(req, res, next): Promise<void> {

    try {
      const { id: postId } = req.params as unknown as DeletePostData;
      if(!postId){
        return res.send(404).end();
      }

      const author = (req as unknown as { auth: RequestAuth }).auth.user;

      const post = await findOnePost({ id: postId }, sequelizeClient);
      if(!post){
        return res.send(404).end();
      }

      const isAdminOrAuthor = author.type === UserType.ADMIN || +author.id === +post.authorId;

      if(!isAdminOrAuthor){
        throw new UnauthorizedError('you dont have access to the post');
      }

      await post.destroy();
      return res.status(200).send().end();
    } catch (error) {
      next(error);
    }
  };
}

function initUpdatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createUserRequestHandler(req, res, next): Promise<void> {
    try {
      const author = (req as unknown as { auth: RequestAuth }).auth.user;

      const { title, content, isHidden, id } = req.body as UpdatePostData;

      const post = await updatePost({ title, content, isHidden, id, authorId: author.id }, sequelizeClient);
      return res.status(200).send(post).end();
    } catch (error) {
      next(error);
    }
  };
}

function initGetAllUserPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listPostsRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;
    const author = (req as unknown as { auth: RequestAuth }).auth.user;

    try {
      const { authorId } = req.params as { authorId: string };
      const isAdminOrAuthor = author.type === UserType.ADMIN || +author.id === +authorId;

      const posts = await models.posts.findAll({
        where: { 
          authorId: authorId,
          ...!isAdminOrAuthor && { isHidden: false },
        } ,
        raw: true,
      });

      res.send(posts);

      return res.end();
    } catch (error) {
      next(error);
    }
  };
}

async function findOnePost(data: Partial<CreatePostData>, sequelizeClient: SequelizeClient): Promise<Post | null> {
  const { id } = data;
  const { models } = sequelizeClient;

  const post = await models.posts.findOne({
    where: {
       id,
    } ,
    raw: true,
  });
  return post;
}

async function createPost(data: CreatePostData, sequelizeClient: SequelizeClient): Promise<Post> {
  const { title, content, isHidden, authorId } = data;
  const { models } = sequelizeClient;

  const post = await models.posts.create({
     title, 
     content, 
     isHidden, 
     authorId, 
  });
  return post;
}


async function updatePost(data: CreatePostData, sequelizeClient: SequelizeClient): Promise<Post[]> {
    const { title, content, isHidden, id, authorId } = data;
    const { models } = sequelizeClient; 
  
    const post = await models.posts.update<Post>(
        { title, content, isHidden },
        { 
         where: { id, authorId },
         returning: true,
        },
    );
    return post[1];
}

type DeletePostData = Pick<Post, 'id'>
type UpdatePostData = Pick<Post, 'title' | 'content' | 'isHidden' | 'id'>;
type CreatePostData = Pick<Post, 'title' | 'content' | 'isHidden' | 'authorId'> & { id?: number };