/**
 * Admin Guard Middleware
 * Restricts access to admin-only routes
 */

import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Check if user has admin role
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (request.user.role !== 'ADMIN') {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
}
