import { supabase } from '../lib/supabase.js';

export async function userRoutes(app) {
  // Rota para favoritar ou marcar como lido (Interação)
  app.post('/interagir', async (request, reply) => {
    const { userId, cardId, isFavorite, isRead } = request.body;

    const { data, error } = await supabase
      .from('user_content')
      .upsert({ 
        user_id: userId, 
        card_id: cardId, 
        is_favorite: isFavorite, 
        is_read: isRead 
      }, { onConflict: 'user_id, card_id' })
      .select();

    if (error) return reply.status(400).send(error);
    return data;
  });

  // Rota para pegar a biblioteca do usuário (Favoritos e Lidos)
  app.get('/biblioteca/:userId', async (request, reply) => {
    const { userId } = request.params;

    const { data, error } = await supabase
      .from('user_content')
      .select(`
        is_favorite,
        is_read,
        cards (*)
      `)
      .eq('user_id', userId);

    if (error) return reply.status(400).send(error);
    return data;
  });
}