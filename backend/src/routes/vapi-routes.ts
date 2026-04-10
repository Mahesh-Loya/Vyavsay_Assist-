import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { VoiceService } from '../services/voice-service.js';

export const vapiRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const voiceService = new VoiceService(server.supabase);

  /**
   * POST /api/vapi/webhook
   * Receives all Vapi server events.
   * This endpoint is called by Vapi directly — no JWT auth required.
   */
  server.post('/webhook', async (request, reply) => {
    const { message } = request.body as any;

    if (!message?.type) {
      return reply.status(400).send({ error: 'Invalid webhook payload' });
    }

    console.log(`📞 [Vapi] Event: ${message.type}`);

    try {
      switch (message.type) {
        case 'tool-calls': {
          const results = await voiceService.handleToolCalls(message);
          return reply.send({ results });
        }

        case 'status-update': {
          await voiceService.handleStatusUpdate(message);
          return reply.status(200).send();
        }

        case 'end-of-call-report': {
          await voiceService.handleEndOfCallReport(message);
          return reply.status(200).send();
        }

        case 'assistant-request': {
          const assistant = await voiceService.handleAssistantRequest(message);
          return reply.send(assistant);
        }

        case 'transcript': {
          const role = message.role || 'unknown';
          const text = message.transcript || '';
          if (message.transcriptType === 'final') {
            console.log(`  📝 [${role}]: ${text}`);
          }
          return reply.status(200).send();
        }

        case 'hang': {
          console.warn(`  ⚠️ [Vapi] Agent hung — no response for extended period`);
          return reply.status(200).send();
        }

        case 'speech-update': {
          // Informational — no action needed
          return reply.status(200).send();
        }

        case 'conversation-update': {
          // Informational — no action needed
          return reply.status(200).send();
        }

        default: {
          console.log(`  [Vapi] Unhandled event: ${message.type}`);
          return reply.status(200).send();
        }
      }
    } catch (err: any) {
      console.error(`❌ [Vapi] Webhook error:`, err.message);
      // Return 200 to prevent Vapi from retrying on our errors
      return reply.status(200).send();
    }
  });
};
