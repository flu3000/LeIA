import { buscarHandle } from '../controllers/bibliotecaController.js';
import { conversarComBibliotecario } from '../services/bibliotecaService.js';
import { supabase } from '../lib/supabase.js';

export async function bibliotecaRoutes(app) {
  // Rota legada
  app.post('/buscar', buscarHandle);

  // Rota principal do chat — usada pelo front-end
  app.post('/api/chat', async (request, reply) => {
    const { mensagem, userId, historico } = request.body;

    if (!mensagem?.trim()) {
      return reply.status(400).send({ error: 'Mensagem não pode ser vazia.' });
    }
    if (!userId) {
      return reply.status(400).send({ error: 'Usuário não identificado.' });
    }

    try {
      const resultado = await conversarComBibliotecario(userId, mensagem, historico ?? []);
      return reply.send(resultado);
    } catch (err) {
      console.error('[/api/chat]', err?.response?.data ?? err.message);
      return reply.status(500).send({ error: 'Erro ao conversar com o Bibliotecário.' });
    }
  });

  // Retorna o histórico de mensagens do usuário (últimas 20 mensagens)
  app.get('/api/chat/history/:userId', async (request, reply) => {
    const { userId } = request.params;
    if (!userId) return reply.status(400).send({ error: 'Usuário não identificado.' });

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data ?? []);
  });

  // Apaga todo o histórico de mensagens do usuário (nova conversa)
  app.delete('/api/chat/:userId', async (request, reply) => {
    const { userId } = request.params;
    if (!userId) return reply.status(400).send({ error: 'Usuário não identificado.' });

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send({ ok: true });
  });
}
