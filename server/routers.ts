import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  createDocument,
  getDocumentById,
  getUserDocuments,
  createProcessingHistory,
  updateProcessingStatus,
  getProcessingHistoryByDocId,
} from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  documents: router({
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileSize: z.number(),
          fileType: z.string(),
          isScan: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        try {
          const doc = await createDocument(
            ctx.user.id,
            input.fileName,
            `uploads/${nanoid()}/${input.fileName}`,
            `https://example.com/uploads/${input.fileName}`,
            input.fileType,
            input.fileSize,
            input.isScan
          );
          return { success: true, documentId: (doc as any).insertId };
        } catch (error) {
          console.error('Upload error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload document',
          });
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      try {
        return await getUserDocuments(ctx.user.id);
      } catch (error) {
        console.error('List error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list documents',
        });
      }
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        try {
          const doc = await getDocumentById(input.id);
          if (!doc || doc.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'NOT_FOUND' });
          }
          return doc;
        } catch (error) {
          console.error('Get document error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get document',
          });
        }
      }),
  }),

  processing: router({
    process: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          outputFormat: z.enum(['pdf', 'docx', 'xlsx']),
          translateFrom: z.string().default('none'),
          translateTo: z.string().default('none'),
          ocrLanguages: z.string().default('eng,rus,uzb'),
          preserveStructure: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        try {
          const doc = await getDocumentById(input.documentId);
          if (!doc || doc.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'NOT_FOUND' });
          }

          const processingResult = await createProcessingHistory(
            input.documentId,
            ctx.user.id,
            input.outputFormat,
            `processed/${nanoid()}/result.${input.outputFormat}`,
            `https://example.com/processed/result.${input.outputFormat}`,
            undefined,
            input.translateFrom,
            input.translateTo,
            input.ocrLanguages,
            input.preserveStructure
          );

          await notifyOwner({
            title: 'Document Processing Started',
            content: `Processing document: ${doc.originalFileName}`,
          });

          return { success: true, processingId: (processingResult as any).insertId };
        } catch (error) {
          console.error('Processing error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process document',
          });
        }
      }),

    getHistory: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        try {
          const doc = await getDocumentById(input.documentId);
          if (!doc || doc.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'NOT_FOUND' });
          }
          return await getProcessingHistoryByDocId(input.documentId);
        } catch (error) {
          console.error('Get history error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get processing history',
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
