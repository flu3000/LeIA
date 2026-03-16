import fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { bibliotecaRoutes } from './src/routes/bibliotecaRoutes.js';
import { userRoutes } from './src/routes/userRoutes.js';

const app = fastify({ logger: true });

app.register(cors, { origin: '*' });

// Registrar as rotas
app.register(bibliotecaRoutes);
app.register(userRoutes);
// ... outras importações

app.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });