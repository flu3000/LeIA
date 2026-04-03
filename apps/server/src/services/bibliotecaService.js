import axios from 'axios';
import { supabase } from '../lib/supabase.js';
import { SYSTEM_PROMPT } from '../prompts/bibliotecario.js';

// Remove citações numéricas do tipo [1][2][3] geradas pela Perplexity
function limparCitacoes(texto) {
  return texto.replace(/\[\d+\]/g, '').replace(/\s{2,}/g, ' ').trim();
}

// Palavras-chave que indicam mudança de assunto pelo usuário
const KEYWORDS_QUEBRA_TEMA = [
  'mudar de tema', 'mudar de assunto', 'outro assunto', 'outra coisa',
  'agora sobre', 'agora quero', 'falar sobre', 'novo tema', 'novo assunto',
  'esqueça isso', 'esquece isso', 'deixa isso', 'mudando de assunto',
  'pode mudar', 'vamos mudar', 'quero falar de', 'quero aprender sobre',
];

function detectaQuebraDeTema(mensagem) {
  const lower = mensagem.toLowerCase();
  return KEYWORDS_QUEBRA_TEMA.some((kw) => lower.includes(kw));
}

export const conversarComBibliotecario = async (userId, novaMensagem, historicoFrontend = [], sessionId = null) => {
  // 1. Histórico do Supabase; usa o do frontend como fallback
  // Busca apenas as últimas 4 mensagens (2 pares user/assistant) para evitar poluição de contexto
  let histQuery = supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(4);

  if (sessionId) histQuery = histQuery.eq('session_id', sessionId);

  const { data: historicoDb } = await histQuery;

  // Inverte para ordem cronológica
  const historicoDbOrdenado = (historicoDb ?? []).reverse();

  const mensagensBase = (historicoDbOrdenado?.length ?? 0) > 0 ? historicoDbOrdenado : historicoFrontend.slice(-4);

  // Se o usuário sinaliza mudança de tema, descarta o histórico para aqueste payload
  const quebraDeTema = detectaQuebraDeTema(novaMensagem);

  // Garante alternância estrita user → assistant (Perplexity rejeita sequências inválidas)
  const mensagensFormatadas = [];
  if (!quebraDeTema) {
    let expectedRole = 'user';
    for (const msg of (mensagensBase ?? [])) {
      if (msg.role === expectedRole) {
        mensagensFormatadas.push({ role: msg.role, content: msg.content });
        expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
      }
    }
    // Histórico deve terminar com 'assistant' antes de acrescentar o novo user
    while (mensagensFormatadas.length > 0 && mensagensFormatadas.at(-1)?.role !== 'assistant') {
      mensagensFormatadas.pop();
    }
  }

  // 2. Verificar cache de cards relevantes
  const { data: cardsExistentes } = await supabase
    .from('cards')
    .select('*')
    .textSearch('titulo', novaMensagem, { config: 'portuguese', type: 'websearch' })
    .limit(5);

  if (cardsExistentes && cardsExistentes.length >= 5) {
    return {
      origem: 'cache_db',
      guia_contextual: 'Encontrei referências excelentes na nossa biblioteca sobre isso!',
      fontes: cardsExistentes,
      citations: [],
    };
  }

  // 3. Chamar a API da Perplexity
  const body = {
    model: 'sonar',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...mensagensFormatadas,
      { role: 'user', content: novaMensagem },
    ],
    stream: false,
  };

  console.log('Enviando para Perplexity:', JSON.stringify(body));

  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    body,
    {
      headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` },
    }
  );

  // citations vem no nível raiz da resposta Perplexity (lista de URLs)
  const citations = response.data.citations ?? [];
  const rawContent = response.data.choices[0].message.content;

  // Extrai o bloco ```json-materials``` do Markdown e converte para o schema de fontes
  const MATERIALS_RE = /```json-materials\n([\s\S]*?)\n```/;
  const materialsMatch = rawContent.match(MATERIALS_RE);

  let fontes = [];
  if (materialsMatch) {
    try {
      fontes = JSON.parse(materialsMatch[1]).map((m) => ({
        id_externo:     m.id,
        titulo:         m.title,
        tipo:           m.type,
        link:           m.url,
        dificuldade:    m.difficulty,
        autor_canal:    m.author ?? '',
        por_que_estudar: m.por_que_estudar ?? '',
      }));
    } catch { /* mantém vazio */ }
  }

  const guia_contextual = limparCitacoes(rawContent.replace(MATERIALS_RE, '').trim());
  const temaMatch = guia_contextual.match(/\*\*Tema identificado:\*\*\s*(.+)/);

  const respostaIA = {
    tema_identificado: temaMatch?.[1]?.trim() ?? 'Geral',
    guia_contextual,
    fontes,
  };

  // 4. Persistir conversa — armazena só o texto (guia_contextual) como conteúdo do assistente
  //    para que o histórico enviado à IA seja Markdown limpo, não JSON bruto.
  const sessionData = sessionId ? { session_id: sessionId } : {};
  await supabase.from('chat_messages').insert({ user_id: userId, role: 'user',      content: novaMensagem,                ...sessionData });
  await supabase.from('chat_messages').insert({ user_id: userId, role: 'assistant', content: respostaIA.guia_contextual, ...sessionData });

  // 5. Upsert dos cards (fontes)
  if (respostaIA.fontes?.length > 0) {
    await supabase.from('cards').upsert(respostaIA.fontes, { onConflict: 'link' });
  }

  return { ...respostaIA, citations };
};
