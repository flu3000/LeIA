import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import 'dotenv/config';
import { bibliotecaRoutes } from './routes/bibliotecaRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { libraryRoutes } from './routes/libraryRoutes.js';

const app = fastify({ logger: true });

app.register(cors, { origin: '*' });
app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// Registrar as rotas
app.register(bibliotecaRoutes);
app.register(userRoutes);
app.register(libraryRoutes);

app.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });
