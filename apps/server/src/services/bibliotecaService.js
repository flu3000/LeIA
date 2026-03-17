import axios from 'axios';
import { supabase } from '../lib/supabase.js';
import { SYSTEM_PROMPT } from '../prompts/bibliotecario.js';

export const conversarComBibliotecario = async (userId, novaMensagem) => {
  // 1. Buscar histórico (últimas 6 mensagens para não gastar muitos tokens)
  const { data: historico } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6);

  // Inverter para ficar na ordem cronológica
  const mensagensFormatadas = historico ? historico.reverse() : [];

  // 2. Montar o array de mensagens para a API
  const todasAsMensagens = [
    { role: "system", content: SYSTEM_PROMPT },
    ...mensagensFormatadas,
    { role: "user", content: novaMensagem }
  ];

  const { data: cardsExistentes } = await supabase
    .from('cards')
    .select('*')
    .textSearch('titulo', mensagem, { config: 'portuguese', type: 'websearch' })
    .limit(5);

  // 3. Se acharmos cards relevantes, podemos retornar direto (ou perguntar se quer mais)
  if (cardsExistentes && cardsExistentes.length >= 5) {
    return {
      origem: 'cache_db',
      guia_contextual: "Já encontrei algumas referências excelentes na nossa biblioteca sobre isso!",
      cards: cardsExistentes
    };
  }

  // 4. Chamada para Perplexity
  const response = await axios.post('https://api.perplexity.ai/chat/completions', {
    model: "sonar",
    messages: todasAsMensagens,
    response_format: { type: "json_object" }
  }, {
    headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` }
  });

  const respostaIA = JSON.parse(response.data.choices[0].message.content);

  // 4. Salvar no banco (Pergunta do Usuário e Resposta da IA)
  await supabase.from('chat_messages').insert([
    { user_id: userId, role: 'user', content: novaMensagem },
    { user_id: userId, role: 'assistant', content: JSON.stringify(respostaIA) }
  ]);

  // 5. Opcional: Salvar os cards (fontes) se houver algum novo
  if (respostaIA.fontes && respostaIA.fontes.length > 0) {
    await supabase.from('cards').upsert(respostaIA.fontes, { onConflict: 'link' });
  }

  return respostaIA;
};