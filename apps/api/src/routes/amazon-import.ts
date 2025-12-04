/**
 * Amazon Import Routes
 *
 * API endpoints for importing Amazon Associates CSV reports.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AmazonImportService, ReportType, CSVParser } from '../services/amazon-import';

// Schemas
const uploadSchema = z.object({
  content: z.string().min(1, 'CSV content is required'),
  fileName: z.string().min(1, 'File name is required'),
  reportType: z.enum(['orders', 'earnings', 'daily_trends', 'tracking', 'link_type']).optional(),
});

const uploadMultipleSchema = z.object({
  files: z.array(
    z.object({
      content: z.string().min(1),
      fileName: z.string().min(1),
      reportType: z.enum(['orders', 'earnings', 'daily_trends', 'tracking', 'link_type']).optional(),
    })
  ),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

const deleteParamSchema = z.object({
  id: z.string().min(1),
});

export async function amazonImportRoutes(fastify: FastifyInstance) {
  // Protect all routes
  fastify.addHook('onRequest', fastify.authenticate);

  /**
   * POST /amazon-import/upload
   * Upload and import a single CSV file
   *
   * Body: { content: string (CSV content), fileName: string, reportType?: string }
   */
  fastify.post<{
    Body: { content: string; fileName: string; reportType?: ReportType };
  }>('/upload', async (request, reply) => {
    const userId = request.user.id;

    try {
      const body = uploadSchema.parse(request.body);
      const { content, fileName } = body;

      // Auto-detect report type if not provided
      let reportType = body.reportType;
      if (!reportType) {
        reportType = CSVParser.detectReportType(content) || undefined;
        if (!reportType) {
          return reply.code(400).send({
            error: 'Could not detect report type. Please specify reportType.',
          });
        }
      }

      const result = await AmazonImportService.importFile(userId, reportType, fileName, content);

      return result;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      request.log.error(error);
      return reply.code(500).send({ error: error.message || 'Import failed' });
    }
  });

  /**
   * POST /amazon-import/upload-multiple
   * Upload and import multiple CSV files
   *
   * Body: { files: Array<{ content: string, fileName: string, reportType?: string }> }
   */
  fastify.post<{
    Body: {
      files: Array<{ content: string; fileName: string; reportType?: ReportType }>;
    };
  }>('/upload-multiple', async (request, reply) => {
    const userId = request.user.id;

    try {
      const body = uploadMultipleSchema.parse(request.body);

      if (!body.files || body.files.length === 0) {
        return reply.code(400).send({ error: 'No files provided' });
      }

      const results = [];

      for (const file of body.files) {
        // Auto-detect report type if not provided
        let reportType = file.reportType;
        if (!reportType) {
          reportType = CSVParser.detectReportType(file.content) || undefined;
        }

        if (!reportType) {
          results.push({
            fileName: file.fileName,
            success: false,
            error: 'Could not detect report type from file content',
          });
          continue;
        }

        try {
          const result = await AmazonImportService.importFile(
            userId,
            reportType,
            file.fileName,
            file.content
          );
          results.push({ fileName: file.fileName, ...result });
        } catch (error: any) {
          results.push({
            fileName: file.fileName,
            success: false,
            error: error.message,
          });
        }
      }

      return { results };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      request.log.error(error);
      return reply.code(500).send({ error: error.message || 'Import failed' });
    }
  });

  /**
   * POST /amazon-import/detect
   * Detect report type from CSV content
   *
   * Body: { content: string }
   */
  fastify.post<{
    Body: { content: string };
  }>('/detect', async (request, reply) => {
    try {
      const { content } = request.body;

      if (!content) {
        return reply.code(400).send({ error: 'Content is required' });
      }

      const reportType = CSVParser.detectReportType(content);

      return {
        detected: !!reportType,
        reportType: reportType || null,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * GET /amazon-import/history
   * Get import history
   */
  fastify.get<{
    Querystring: { limit?: string };
  }>('/history', async (request, reply) => {
    const userId = request.user.id;

    try {
      const query = historyQuerySchema.parse(request.query);
      const history = await AmazonImportService.getImportHistory(userId, query.limit);
      return { history };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * GET /amazon-import/stats
   * Get aggregated stats from imported data
   */
  fastify.get('/stats', async (request, reply) => {
    const userId = request.user.id;

    try {
      const stats = await AmazonImportService.getImportedStats(userId);
      return stats;
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * DELETE /amazon-import/:id
   * Delete an import and its related data
   */
  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const userId = request.user.id;

    try {
      const { id } = deleteParamSchema.parse(request.params);
      const deleted = await AmazonImportService.deleteImport(userId, id);

      if (!deleted) {
        return reply.code(404).send({ error: 'Import not found' });
      }

      return { success: true };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}

export default amazonImportRoutes;
