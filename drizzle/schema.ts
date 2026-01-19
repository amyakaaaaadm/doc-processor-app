import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documents table for storing uploaded and processed documents
 */
export const documents = mysqlTable('documents', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id),
  originalFileName: varchar('originalFileName', { length: 255 }).notNull(),
  originalFileKey: varchar('originalFileKey', { length: 255 }).notNull(),
  originalFileUrl: text('originalFileUrl').notNull(),
  fileType: varchar('fileType', { length: 50 }).notNull(), // pdf, docx, xlsx
  fileSize: int('fileSize').notNull(),
  isScan: int('isScan').default(0).notNull(), // 0 = false, 1 = true
  extractedText: text('extractedText'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Processing history table for tracking document transformations
 */
export const processingHistory = mysqlTable('processingHistory', {
  id: int('id').autoincrement().primaryKey(),
  documentId: int('documentId').notNull().references(() => documents.id),
  userId: int('userId').notNull().references(() => users.id),
  outputFormat: varchar('outputFormat', { length: 50 }).notNull(), // pdf, docx, xlsx
  processedFileKey: varchar('processedFileKey', { length: 255 }).notNull(),
  processedFileUrl: text('processedFileUrl').notNull(),
  processedText: text('processedText'),
  translateFrom: varchar('translateFrom', { length: 50 }).default('none'),
  translateTo: varchar('translateTo', { length: 50 }).default('none'),
  ocrLanguages: varchar('ocrLanguages', { length: 255 }).default('eng,rus,uzb'),
  preserveStructure: int('preserveStructure').default(1), // 0 = false, 1 = true
  status: mysqlEnum('status', ['pending', 'processing', 'completed', 'failed']).default('pending'),
  errorMessage: text('errorMessage'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  completedAt: timestamp('completedAt'),
});

export type ProcessingHistory = typeof processingHistory.$inferSelect;
export type InsertProcessingHistory = typeof processingHistory.$inferInsert;