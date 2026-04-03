import { buscarHandle } from '../controllers/bibliotecaController.js';
import { conversarComBibliotecario } from '../services/bibliotecaService.js';
import { supabase } from '../lib/supabase.js';

export async function bibliotecaRoutes(app) {
  // Rota legada
  app.post('/buscar', buscarHandle);

  // ── Chat ──────────────────────────────────────────────────────────────────────

  // Rota principal do chat — usada pelo front-end
  app.post('/api/chat', async (request, reply) => {
    const { mensagem, userId, historico, sessionId } = request.body;

    if (!mensagem?.trim()) {
      return reply.status(400).send({ error: 'Mensagem não pode ser vazia.' });
    }
    if (!userId) {
      return reply.status(400).send({ error: 'Usuário não identificado.' });
    }

    try {
      const resultado = await conversarComBibliotecario(userId, mensagem, historico ?? [], sessionId ?? null);

      // Auto-titulo a sessão com o conteúdo da primeira mensagem
      if (sessionId) {
        const autoTitle = mensagem.slice(0, 45).trim() + (mensagem.length > 45 ? '…' : '');
        await supabase
          .from('chat_sessions')
          .update({ title: autoTitle, updated_at: new Date().toISOString() })
          .eq('id', sessionId)
          .eq('user_id', userId)
          .eq('title', 'Nova Conversa'); // só atualiza se ainda for o título padrão
      }

      return reply.send(resultado);
    } catch (err) {
      console.error('[/api/chat]', err?.response?.data ?? err.message);
      return reply.status(500).send({ error: 'Erro ao conversar com o Bibliotecário.' });
    }
  });

  // Retorna o histórico de mensagens do usuário (últimas 20 — rota legada)
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

  // Apaga todo o histórico de mensagens do usuário (legado)
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

  // ── Sessions ──────────────────────────────────────────────────────────────────

  // Lista sessões do usuário
  app.get('/api/chat/sessions', async (request, reply) => {
    const { userId } = request.query;
    if (!userId) return reply.status(400).send({ error: 'Usuário não identificado.' });

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data ?? []);
  });

  // Cria nova sessão
  app.post('/api/chat/sessions', async (request, reply) => {
    const { userId } = request.body;
    if (!userId) return reply.status(400).send({ error: 'Usuário não identificado.' });

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'Nova Conversa' })
      .select('id, title, created_at, updated_at')
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // Retorna mensagens de uma sessão específica
  app.get('/api/chat/sessions/:id/messages', async (request, reply) => {
    const { id } = request.params;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data ?? []);
  });

  // Renomeia uma sessão
  app.patch('/api/chat/sessions/:id', async (request, reply) => {
    const { id } = request.params;
    const { title, userId } = request.body;

    if (!title?.trim()) return reply.status(400).send({ error: 'Título não pode ser vazio.' });

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title: title.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, created_at, updated_at')
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // Remove uma sessão (mensagens em cascata pelo FK)
  app.delete('/api/chat/sessions/:id', async (request, reply) => {
    const { id } = request.params;
    const { userId } = request.query;

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send({ ok: true });
  });
}
