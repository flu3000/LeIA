import { supabase } from '../lib/supabase.js';

export async function userRoutes(app) {
  // Rota para favoritar ou marcar como lido (Interação)
  app.post('/interagir', async (request, reply) => {
    const { userId, cardId, isFavorite, isRead } = request.body;

    const { data, error } = await supabase
      .from('user_content')
      .upsert({
        user_id:     userId,
        card_id:     cardId,
        is_favorite: isFavorite,
        is_read:     isRead,
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
      .select('is_favorite, is_read, cards (*)')
      .eq('user_id', userId);

    if (error) return reply.status(400).send(error);
    return data;
  });

  // ── Avatar upload ─────────────────────────────────────────────────────────────

  app.post('/api/user/avatar', async (request, reply) => {
    // 1. Validar JWT
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Não autenticado.' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return reply.status(401).send({ error: 'Token inválido.' });
    }

    // 2. Extrair arquivo do multipart
    let fileBuffer = null;
    let mimetype   = 'image/jpeg';

    for await (const part of request.parts()) {
      if (part.type === 'file' && part.fieldname === 'avatar') {
        fileBuffer = await part.toBuffer();
        mimetype   = part.mimetype ?? 'image/jpeg';
      }
    }

    if (!fileBuffer) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado.' });
    }

    if (fileBuffer.length > 5 * 1024 * 1024) {
      return reply.status(413).send({ error: 'Arquivo muito grande. O limite é 5MB.' });
    }

    // 3. Upload para o Supabase Storage
    const ext  = mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const path = `avatars/${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(path, fileBuffer, { upsert: true, contentType: mimetype });

    if (uploadError) {
      app.log.error('[avatar upload]', uploadError.message);
      return reply.status(500).send({ error: 'Falha no upload. Tente novamente.' });
    }

    // 4. Gerar URL pública com cache-bust
    const { data: { publicUrl } } = supabase.storage.from('user-avatars').getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    // 5. Persistir no user_settings
    const { error: dbError } = await supabase
      .from('user_settings')
      .upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' });

    if (dbError) {
      app.log.error('[avatar db]', dbError.message);
      // Upload foi bem-sucedido; não bloqueia o retorno da URL
    }

    return reply.send({ avatarUrl });
  });
}
