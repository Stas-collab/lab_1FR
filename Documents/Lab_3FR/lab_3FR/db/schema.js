import { mysqlTable, int, varchar, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';

export const tasks = mysqlTable('tasks', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  done: boolean('done').notNull().default(false),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).notNull().default('low'),
  dueDate: varchar('dueDate', { length: 20 }).default(''),
  image: varchar('image', { length: 500 }),
});

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
});
