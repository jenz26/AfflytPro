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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const auth_1 = __importDefault(require("./plugins/auth"));
const auth_2 = require("./routes/auth");
const app = (0, fastify_1.default)({ logger: true });
// Register plugins
app.register(cors_1.default, {
    origin: true, // Allow all origins for dev, restrict in prod
});
app.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'supersecret',
});
app.register(auth_1.default);
// Register routes
app.register(auth_2.authRoutes, { prefix: '/auth' });
// Health check
app.get('/health', () => __awaiter(void 0, void 0, void 0, function* () {
    return { status: 'ok' };
}));
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield app.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server listening on http://localhost:3001');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
});
start();
