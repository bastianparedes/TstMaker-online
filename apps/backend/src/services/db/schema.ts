import { relations } from 'drizzle-orm';
import { timestamp, pgTable, serial, varchar, boolean, integer } from 'drizzle-orm/pg-core';

export const Users = pgTable('users', {
  id: serial('id').primaryKey().unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export const Exams = pgTable('exams', {
  id: varchar('id', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  userId: integer('user_id')
    .references(() => Users.id)
    .notNull()
});

export const usersRelations = relations(Users, ({ many }) => ({
  posts: many(Exams)
}));

export const ExamsRelations = relations(Exams, ({ one }) => ({
  user: one(Users, {
    fields: [Exams.userId],
    references: [Users.id]
  })
}));
