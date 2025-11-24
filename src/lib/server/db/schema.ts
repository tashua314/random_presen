import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const talks = pgTable('talks', {
	id: uuid('id').primaryKey().defaultRandom(),
	eventId: uuid('event_id')
		.references(() => events.id)
		.notNull(),
	orderIndex: integer('order_index').notNull(),
	name: text('name').notNull(),
	title: text('title').notNull(),
	slideUrl: text('slide_url').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const slideStates = pgTable('slide_states', {
	id: uuid('id').primaryKey().defaultRandom(),
	talkId: uuid('talk_id')
		.references(() => talks.id)
		.notNull()
		.unique(),
	currentPage: integer('current_page').default(1).notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const comments = pgTable('comments', {
	id: uuid('id').primaryKey().defaultRandom(),
	talkId: uuid('talk_id')
		.references(() => talks.id)
		.notNull(),
	displayName: text('display_name').default('Anonymous'),
	message: text('message').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const eventStates = pgTable('event_states', {
	id: uuid('id').primaryKey().defaultRandom(),
	eventId: uuid('event_id')
		.references(() => events.id)
		.notNull()
		.unique(),
	currentTalkId: uuid('current_talk_id').references(() => talks.id),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});
