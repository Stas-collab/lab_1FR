import 'dotenv/config';

export default {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    // eslint-disable-next-line no-restricted-syntax
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    // eslint-disable-next-line no-restricted-syntax
    port: Number(process.env.MYSQL_PORT ?? 3306),
    // eslint-disable-next-line no-restricted-syntax
    user: process.env.MYSQL_USER ?? 'root',
    // eslint-disable-next-line no-restricted-syntax
    password: process.env.MYSQL_PASSWORD ?? '',
    // eslint-disable-next-line no-restricted-syntax
    database: process.env.MYSQL_DB ?? 'lab8',
  },
};
