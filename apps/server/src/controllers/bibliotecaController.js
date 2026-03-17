import { conversarComBibliotecario } from '../services/bibliotecaService.js';

export const buscarHandle = async (request, reply) => {
  try {
    const { mensagem, userId } = request.body; // userId é essencial aqui
    
    if (!userId) return reply.status(400).send({ error: 'Usuário não identificado' });

    const resultado = await conversarComBibliotecario(userId, mensagem);
    return reply.send(resultado);
  } catch (err) {
    return reply.status(500).send({ error: 'Erro na conversa' });
  }
};