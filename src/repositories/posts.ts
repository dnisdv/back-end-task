import { BelongsTo, Model } from 'sequelize';

import type { SequelizeModels } from '../sequelize';
import type { User } from './types';

export class Post extends Model {
  static associations: {
    author: BelongsTo<Post, User>;
  };

  id!: number;
  title!: string;
  content!: string;
  isHidden!: boolean;
  authorId!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static associate(models: SequelizeModels): void {
    this.belongsTo(models.users, { foreignKey: 'authorId', as: 'author' });
  }
}

export type PostsModel = typeof Post;