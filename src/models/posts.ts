import { Sequelize, DataTypes } from 'sequelize';

import { Post } from '../repositories/posts';

export function setupPostsModel(modelName: string, sequelize: Sequelize): void {
  Post.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      field: 'is_hidden',
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    tableName: 'posts',
    modelName,
    name: {
      singular: 'post',
      plural: 'posts',
    },
    timestamps: true,
  });
}