"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function authRoutes(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.post('/register', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email, password, name } = request.body;
            try {
                const user = yield prisma.user.create({
                    data: {
                        email,
                        password, // In a real app, hash this!
                        name,
                    },
                });
                const token = fastify.jwt.sign({ id: user.id, email: user.email, brandId: user.brandId });
                return { token, user };
            }
            catch (err) {
                reply.code(400).send({ message: 'User already exists or invalid data' });
            }
        }));
        fastify.post('/login', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = request.body;
            const user = yield prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return reply.code(401).send({ message: 'Invalid credentials' });
            }
            // Simple password check (if password provided)
            if (password && user.password !== password) {
                return reply.code(401).send({ message: 'Invalid credentials' });
            }
            const token = fastify.jwt.sign({ id: user.id, email: user.email, brandId: user.brandId });
            return { token, user };
        }));
        fastify.get('/profile', {
            onRequest: [fastify.authenticate]
        }, (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma.user.findUnique({
                where: { id: request.user.id },
            });
            return user;
        }));
    });
}
