import './dotenv';
import express from 'express';

import { initSequelizeClient } from './sequelize';
import { initUsersRouter, initPostsRouter } from './routers';
import { initErrorRequestHandler, initNotFoundRequestHandler } from './middleware';

const PORT = process.env.PORT || 8080;

async function main(): Promise<void> {
  const app = express();

  const sequelizeClient = await initSequelizeClient({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT && +process.env.DB_PORT || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
  });

  app.use(express.json());

  app.use('/api/v1/users', initUsersRouter(sequelizeClient));
  app.use('/api/v1/posts', initPostsRouter(sequelizeClient));


  app.use('/', initNotFoundRequestHandler());

  app.use(initErrorRequestHandler());

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.info(`app listening on port: '${PORT}'`);

      resolve();
    });
  });
}

main().then(() => console.info('app started')).catch(console.error);