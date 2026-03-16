import { buscarERegistrarFontes } from '../services/bibliotecaService.js';

export const buscarHandle = async (request, reply) => {
  try {
    const { mensagem } = request.body;
    const resultado = await buscarERegistrarFontes(mensagem);
    return reply.send(resultado);
  } catch (err) {
    return reply.status(500).send({ error: 'Erro no servidor' });
  }
};