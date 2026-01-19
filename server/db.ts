import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, documents, processingHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Document queries
 */
export async function createDocument(
  userId: number,
  originalFileName: string,
  originalFileKey: string,
  originalFileUrl: string,
  fileType: string,
  fileSize: number,
  isScan: boolean,
  extractedText?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values({
    userId,
    originalFileName,
    originalFileKey,
    originalFileUrl,
    fileType,
    fileSize,
    isScan: isScan ? 1 : 0,
    extractedText,
  });

  return result;
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy((t) => t.createdAt);
}

/**
 * Processing history queries
 */
export async function createProcessingHistory(
  documentId: number,
  userId: number,
  outputFormat: string,
  processedFileKey: string,
  processedFileUrl: string,
  processedText?: string,
  translateFrom?: string,
  translateTo?: string,
  ocrLanguages?: string,
  preserveStructure?: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(processingHistory).values({
    documentId,
    userId,
    outputFormat,
    processedFileKey,
    processedFileUrl,
    processedText,
    translateFrom: translateFrom || 'none',
    translateTo: translateTo || 'none',
    ocrLanguages: ocrLanguages || 'eng,rus,uzb',
    preserveStructure: preserveStructure !== false ? 1 : 0,
    status: 'pending',
  });

  return result;
}

export async function updateProcessingStatus(
  id: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
  };

  if (status === 'completed') {
    updateData.completedAt = new Date();
  }

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  return await db
    .update(processingHistory)
    .set(updateData)
    .where(eq(processingHistory.id, id));
}

export async function getProcessingHistoryByDocId(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(processingHistory)
    .where(eq(processingHistory.documentId, documentId))
    .orderBy((t) => t.createdAt);
}
