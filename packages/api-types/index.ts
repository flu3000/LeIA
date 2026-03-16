export interface Fonte {
  id: string;               // Útil para chaves no React/React Native
  tipo: 'livro' | 'video' | 'podcast' | 'artigo_academico';
  titulo: string;
  autor_ou_canal: string;
  link: string;
  descricao_curta: string;  // O "porquê" dessa fonte ser relevante
  nivel_dificuldade?: 'iniciante' | 'intermediario' | 'avancado';
}

export interface RespostaBibliotecario {
  tema_detectado: string;
  guia_contextual: string;  // O texto curto de navegação (sem dar a aula)
  roteiro_sugerido: string[]; // Ex: ["História", "Prática", "Críticas"]
  fontes: Fonte[];
  sugestoes_proximos_temas: string[];
}