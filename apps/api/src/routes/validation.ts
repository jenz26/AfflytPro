import { FastifyInstance } from 'fastify';
import { TelegramBotService } from '../services/TelegramBotService';
import { EmailService } from '../services/EmailService';
import { z } from 'zod';

const validateTokenSchema = z.object({
  token: z.string().min(10)
});

const validateChannelSchema = z.object({
  token: z.string().min(10),
  channelId: z.string()
});

const validateEmailSchema = z.object({
  apiKey: z.string().min(10),
  provider: z.enum(['sendgrid', 'resend'])
});

export default async function validationRoutes(app: FastifyInstance) {
  // Validate Telegram token
  app.post('/telegram-token', async (req, reply) => {
    try {
      const { token } = validateTokenSchema.parse(req.body);
      const result = await TelegramBotService.validateToken(token);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ valid: false, error: error.message });
    }
  });

  // Validate channel connection
  app.post('/telegram-channel', async (req, reply) => {
    try {
      const { token, channelId } = validateChannelSchema.parse(req.body);
      const result = await TelegramBotService.validateChannelConnection(token, channelId);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ valid: false, canPost: false, error: error.message });
    }
  });

  // Test Telegram connection
  app.post('/telegram-test', {
    onRequest: [app.authenticate]
  }, async (req, reply) => {
    try {
      const { token, channelId } = validateChannelSchema.parse(req.body);
      const result = await TelegramBotService.sendTestMessage(channelId, token);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  // Validate email API key
  app.post('/email-key', async (req, reply) => {
    try {
      const { apiKey, provider } = validateEmailSchema.parse(req.body);
      const result = await EmailService.validateApiKey(apiKey, provider);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ valid: false, error: error.message });
    }
  });
}
