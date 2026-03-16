import { buscarHandle } from '../controllers/bibliotecaController.js';

export async function bibliotecaRoutes(app) {
  app.post('/buscar', buscarHandle);
  // app.get('/cards', outroController);
}