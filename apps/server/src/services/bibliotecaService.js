import axios from 'axios';
import { supabase } from '../lib/supabase.js';
import { SYSTEM_PROMPT } from '../prompts/bibliotecario.js'; // A importação deve estar aqui!

export const buscarERegistrarFontes = async (mensagem) => {
  const response = await axios.post('https://api.perplexity.ai/chat/completions', {
    model: "sonar",
    messages: [
      { role: "system", content: SYSTEM_PROMPT }, // O valor é lido aqui
      { role: "user", content: mensagem }
    ],
    response_format: { type: "json_object" }
  }, {
    headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` }
  });

  const dadosIA = JSON.parse(response.data.choices[0].message.content);
  
  // Lógica do Supabase continua aqui...
  const { data, error } = await supabase
    .from('cards')
    .upsert(dadosIA.fontes, { onConflict: 'link' })
    .select();

  if (error) throw error;

  return {
    guia: dadosIA.guia_contextual,
    tema: dadosIA.tema_identificado,
    cards: data
  };
};