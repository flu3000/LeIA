export interface Reference {
  titulo: string
  autor: string
  tipo: 'livro' | 'video' | 'podcast' | 'artigo' | 'curso'
  link?: string
  dificuldade?: 'Iniciante' | 'Intermediário' | 'Avançado'
  descricao?: string
}

export interface Topic {
  id: string
  tema: string
  descricao: string
  descricaoLonga: string
  emoji: string
  accentColor: string   // hex color for left border accent
  conceitos: string[]
  referencias: Reference[]
  todasReferencias: Reference[]
}

export const topics: Topic[] = [
  {
    id: '1',
    tema: 'Filosofia',
    emoji: '🏛️',
    descricao: 'Da lógica aristotélica ao existencialismo moderno.',
    descricaoLonga: 'A Filosofia é a busca racional por respostas às perguntas fundamentais da existência: o que é real, o que podemos conhecer, como devemos agir e o que nos torna humanos. Atravessa milênios de pensamento — dos pré-socráticos gregos ao existencialismo do século XX — moldando ciência, política, ética e arte.',
    accentColor: '#c084fc',
    conceitos: ['Epistemologia', 'Metafísica', 'Ética', 'Lógica', 'Existencialismo', 'Fenomenologia', 'Filosofia Política'],
    referencias: [
      { titulo: 'A República', autor: 'Platão', tipo: 'livro' },
      { titulo: 'Além do Bem e do Mal', autor: 'Friedrich Nietzsche', tipo: 'livro' },
      { titulo: 'Philosophize This!', autor: 'Stephen West', tipo: 'podcast' },
    ],
    todasReferencias: [
      { titulo: 'A República', autor: 'Platão', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'O diálogo fundador da filosofia política ocidental, explorando justiça e a cidade ideal.' },
      { titulo: 'Além do Bem e do Mal', autor: 'Friedrich Nietzsche', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Nietzsche desafia os fundamentos da moral tradicional e da filosofia ocidental.' },
      { titulo: 'Filosofia em 90 Minutos', autor: 'Paul Strathern', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Série que apresenta os grandes filósofos de forma acessível e concisa.' },
      { titulo: 'O Mundo de Sofia', autor: 'Jostein Gaarder', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Um romance que percorre a história da filosofia de forma envolvente.' },
      { titulo: 'Ser e Tempo', autor: 'Martin Heidegger', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Obra fundamental da fenomenologia e do existencialismo do século XX.' },
      { titulo: 'Meditações', autor: 'Marco Aurélio', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Reflexões pessoais do imperador filósofo sobre estoicismo e vida virtuosa.' },
      { titulo: 'Philosophize This!', autor: 'Stephen West', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Podcast que apresenta cronologicamente os grandes filósofos e suas ideias.' },
      { titulo: 'The School of Life — Philosophy', autor: 'Alain de Botton', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Vídeos que aplicam a filosofia clássica aos problemas do cotidiano moderno.' },
    ],
  },
  {
    id: '2',
    tema: 'Matemática',
    emoji: '∑',
    descricao: 'Fundamentos, cálculo e matemática aplicada.',
    descricaoLonga: 'A Matemática é a linguagem universal do raciocínio abstrato. Dos números inteiros à teoria dos grupos, do cálculo diferencial à topologia, ela permeia toda a ciência moderna. Compreender matemática é desenvolver uma forma de pensar: precisa, estruturada e criativa.',
    accentColor: '#38bdf8',
    conceitos: ['Álgebra', 'Cálculo', 'Geometria', 'Teoria dos Números', 'Probabilidade', 'Estatística', 'Matemática Discreta'],
    referencias: [
      { titulo: 'O Homem que Calculava', autor: 'Malba Tahan', tipo: 'livro' },
      { titulo: '3Blue1Brown', autor: 'Grant Sanderson', tipo: 'video' },
      { titulo: 'MIT OpenCourseWare — Cálculo', autor: 'MIT', tipo: 'curso' },
    ],
    todasReferencias: [
      { titulo: 'O Homem que Calculava', autor: 'Malba Tahan', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Clássico brasileiro que explora a matemática através de histórias e enigmas fascinantes.' },
      { titulo: 'How to Prove It', autor: 'Daniel Velleman', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Guia essencial para aprender a construir demonstrações matemáticas rigorosas.' },
      { titulo: 'Gödel, Escher, Bach', autor: 'Douglas Hofstadter', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Exploração profunda de matemática, lógica, música e arte em uma obra singular.' },
      { titulo: '3Blue1Brown', autor: 'Grant Sanderson', tipo: 'video', dificuldade: 'Intermediário', descricao: 'Visualizações excepcionais que tornam álgebra linear, cálculo e teoria dos números intuitivos.' },
      { titulo: 'MIT OpenCourseWare — Cálculo', autor: 'MIT', tipo: 'curso', dificuldade: 'Intermediário', descricao: 'Curso completo de cálculo de uma das melhores universidades do mundo, gratuito.' },
      { titulo: 'Khan Academy — Matemática', autor: 'Sal Khan', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Plataforma gratuita que cobre desde o básico até matemática avançada.' },
      { titulo: 'Numberphile', autor: 'Brady Haran', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Vídeos curtos e fascinantes sobre curiosidades e teoremas matemáticos.' },
    ],
  },
  {
    id: '3',
    tema: 'Programação',
    emoji: '💻',
    descricao: 'Algoritmos, arquitetura e engenharia de software.',
    descricaoLonga: 'Programação é a arte de traduzir problemas do mundo real em instruções que computadores executam. Mais do que aprender uma linguagem, envolve dominar algoritmos, estruturas de dados, paradigmas e princípios de design de software.',
    accentColor: '#34d399',
    conceitos: ['Algoritmos', 'Estruturas de Dados', 'POO', 'Design Patterns', 'Clean Code', 'Sistemas Distribuídos', 'DevOps'],
    referencias: [
      { titulo: 'Clean Code', autor: 'Robert C. Martin', tipo: 'livro' },
      { titulo: 'The Pragmatic Programmer', autor: 'Hunt & Thomas', tipo: 'livro' },
      { titulo: 'CS50', autor: 'Harvard / David Malan', tipo: 'curso' },
    ],
    todasReferencias: [
      { titulo: 'Clean Code', autor: 'Robert C. Martin', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Princípios e práticas para escrever código limpo, legível e sustentável.' },
      { titulo: 'The Pragmatic Programmer', autor: 'Hunt & Thomas', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Guia abrangente de boas práticas para programadores profissionais.' },
      { titulo: 'Designing Data-Intensive Applications', autor: 'Martin Kleppmann', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Bíblia dos sistemas distribuídos: bancos de dados, consistência, stream processing.' },
      { titulo: 'CS50', autor: 'Harvard / David Malan', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'O melhor curso introdutório de ciência da computação, gratuito e engajante.' },
      { titulo: 'Fireship', autor: 'Jeff Delaney', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Vídeos rápidos e densos sobre as principais tecnologias web do mercado.' },
      { titulo: 'Lex Fridman Podcast — Engineers', autor: 'Lex Fridman', tipo: 'podcast', dificuldade: 'Intermediário', descricao: 'Entrevistas com engenheiros e cientistas de computação de destaque mundial.' },
    ],
  },
  {
    id: '4',
    tema: 'Neurociência',
    emoji: '🧠',
    descricao: 'Como o cérebro aprende, memoriza e processa informações.',
    descricaoLonga: 'A Neurociência investiga o órgão mais complexo do universo conhecido: o cérebro humano. Compreender como neurônios se conectam, como memórias se formam e como aprendizagem ocorre tem implicações profundas para educação, saúde mental e inteligência artificial.',
    accentColor: '#f472b6',
    conceitos: ['Neuroplasticidade', 'Memória', 'Cognição', 'Sono', 'Dopamina', 'Aprendizagem', 'Saúde Mental'],
    referencias: [
      { titulo: 'O Cérebro que se Transforma', autor: 'Norman Doidge', tipo: 'livro' },
      { titulo: 'Huberman Lab', autor: 'Andrew Huberman', tipo: 'podcast' },
      { titulo: 'Learning How to Learn', autor: 'Barbara Oakley', tipo: 'curso' },
    ],
    todasReferencias: [
      { titulo: 'O Cérebro que se Transforma', autor: 'Norman Doidge', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Como a neuroplasticidade permite ao cérebro se reorganizar e superar limitações.' },
      { titulo: 'Em Busca da Memória', autor: 'Eric Kandel', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Autobiografia do Nobel de Medicina que conta a história da neurociência moderna.' },
      { titulo: 'O Erro de Descartes', autor: 'António Damásio', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Como emoção e razão estão profundamente interligadas.' },
      { titulo: 'Huberman Lab', autor: 'Andrew Huberman', tipo: 'podcast', dificuldade: 'Intermediário', descricao: 'Neurocientista de Stanford discute ciência aplicada ao sono, foco e exercício.' },
      { titulo: 'Learning How to Learn', autor: 'Barbara Oakley', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Técnicas baseadas em neurociência para aprender melhor.' },
      { titulo: 'Two Minute Papers', autor: 'Károly Zsolnai-Fehér', tipo: 'video', dificuldade: 'Intermediário', descricao: 'Resumos acessíveis de papers de IA e neurociência computacional.' },
    ],
  },
  {
    id: '5',
    tema: 'História',
    emoji: '📜',
    descricao: 'Civilizações, impérios e os eventos que moldaram o mundo.',
    descricaoLonga: 'Estudar história é compreender como chegamos até aqui: as forças que moldaram civilizações, os erros que se repetem e os momentos de ruptura que transformam tudo. Vai além de datas e batalhas — envolve economia, cultura, tecnologia e o papel dos indivíduos.',
    accentColor: '#fbbf24',
    conceitos: ['Antiguidade', 'Idade Média', 'Revolução Industrial', 'Guerras Mundiais', 'Colonialismo', 'História Econômica', 'Microhistória'],
    referencias: [
      { titulo: 'Sapiens', autor: 'Yuval Noah Harari', tipo: 'livro' },
      { titulo: 'Guns, Germs, and Steel', autor: 'Jared Diamond', tipo: 'livro' },
      { titulo: 'Hardcore History', autor: 'Dan Carlin', tipo: 'podcast' },
    ],
    todasReferencias: [
      { titulo: 'Sapiens', autor: 'Yuval Noah Harari', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Uma breve história da humanidade: de Homo sapiens a impérios globais.' },
      { titulo: 'Guns, Germs, and Steel', autor: 'Jared Diamond', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Por que certas civilizações dominaram outras? Uma análise geográfica e biológica.' },
      { titulo: 'Hardcore History', autor: 'Dan Carlin', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Episódios longos e imersivos sobre os períodos mais intensos da história mundial.' },
      { titulo: 'Crash Course History', autor: 'John Green', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Série de vídeos dinâmicos cobrindo história mundial de forma acessível.' },
      { titulo: 'The History of Rome', autor: 'Mike Duncan', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Podcast que narra episódio a episódio toda a história do Império Romano.' },
    ],
  },
  {
    id: '6',
    tema: 'Física',
    emoji: '⚛️',
    descricao: 'Do newtoniano ao quântico: como o universo funciona.',
    descricaoLonga: 'A Física busca as leis fundamentais que governam o universo — da mecânica clássica de Newton à relatividade de Einstein, da mecânica quântica à cosmologia. Estudar física é aprender a linguagem mais profunda da realidade.',
    accentColor: '#22d3ee',
    conceitos: ['Mecânica Clássica', 'Termodinâmica', 'Eletromagnetismo', 'Relatividade', 'Mecânica Quântica', 'Cosmologia', 'Física de Partículas'],
    referencias: [
      { titulo: 'Uma Breve História do Tempo', autor: 'Stephen Hawking', tipo: 'livro' },
      { titulo: 'The Feynman Lectures', autor: 'Richard Feynman', tipo: 'livro' },
      { titulo: 'PBS Space Time', autor: 'PBS Digital Studios', tipo: 'video' },
    ],
    todasReferencias: [
      { titulo: 'Uma Breve História do Tempo', autor: 'Stephen Hawking', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Cosmologia acessível: buracos negros, Big Bang e a busca por uma teoria do tudo.' },
      { titulo: 'The Feynman Lectures on Physics', autor: 'Richard Feynman', tipo: 'livro', dificuldade: 'Avançado', descricao: 'O curso de física mais influente já escrito.' },
      { titulo: 'Seis Peças Fáceis', autor: 'Richard Feynman', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Seis capítulos introdutórios das Feynman Lectures para o público geral.' },
      { titulo: 'PBS Space Time', autor: 'PBS Digital Studios', tipo: 'video', dificuldade: 'Intermediário', descricao: 'Canal que explora física teórica, relatividade e cosmologia com rigor científico.' },
      { titulo: 'Minute Physics', autor: 'Henry Reich', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Explicações curtas e elegantes de conceitos de física em animações simples.' },
    ],
  },
  {
    id: '7',
    tema: 'Economia',
    emoji: '📈',
    descricao: 'Macroeconomia, finanças comportamentais e mercados.',
    descricaoLonga: 'Economia estuda como indivíduos, empresas e países alocam recursos escassos. Da microeconomia à macroeconomia, passando pela economia comportamental. Compreender economia é fundamental para entender política, sociedade e o mundo financeiro.',
    accentColor: '#10b981',
    conceitos: ['Microeconomia', 'Macroeconomia', 'Economia Comportamental', 'Finanças', 'Política Econômica', 'Mercados', 'Desigualdade'],
    referencias: [
      { titulo: 'O Capital no Século XXI', autor: 'Thomas Piketty', tipo: 'livro' },
      { titulo: 'Freakonomics', autor: 'Levitt & Dubner', tipo: 'livro' },
      { titulo: 'Planet Money', autor: 'NPR', tipo: 'podcast' },
    ],
    todasReferencias: [
      { titulo: 'O Capital no Século XXI', autor: 'Thomas Piketty', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Análise histórica da desigualdade de riqueza e renda nos países capitalistas.' },
      { titulo: 'Freakonomics', autor: 'Levitt & Dubner', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Economia aplicada a situações surpreendentes: crime, educação, esporte e mais.' },
      { titulo: 'Thinking, Fast and Slow', autor: 'Daniel Kahneman', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Como nosso cérebro toma decisões econômicas — e por que frequentemente erra.' },
      { titulo: 'Planet Money', autor: 'NPR', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Histórias curtas e envolventes que explicam a economia por trás do dia a dia.' },
      { titulo: 'MRU — Marginal Revolution University', autor: 'Tyler Cowen & Alex Tabarrok', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Microeconomia e macroeconomia gratuitas em vídeos curtos de alta qualidade.' },
    ],
  },
  {
    id: '8',
    tema: 'Linguística',
    emoji: '🗣️',
    descricao: 'Linguagem, cognição e a estrutura das línguas humanas.',
    descricaoLonga: 'A Linguística investiga a linguagem humana: como as línguas funcionam, como são aprendidas, como evoluem e como moldam nosso pensamento. Do estudo dos sons à gramática, do significado ao uso social.',
    accentColor: '#fb7185',
    conceitos: ['Fonética', 'Sintaxe', 'Semântica', 'Pragmática', 'Aquisição de Linguagem', 'Psicolinguística', 'Linguística Computacional'],
    referencias: [
      { titulo: 'The Language Instinct', autor: 'Steven Pinker', tipo: 'livro' },
      { titulo: 'Lingthusiasm', autor: 'Gretchen McCulloch & Lauren Gawne', tipo: 'podcast' },
      { titulo: 'Crash Course Linguistics', autor: 'PBS Digital Studios', tipo: 'video' },
    ],
    todasReferencias: [
      { titulo: 'The Language Instinct', autor: 'Steven Pinker', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Pinker argumenta que a linguagem é um instinto biológico evoluído — acessível e fascinante.' },
      { titulo: 'The Stuff of Thought', autor: 'Steven Pinker', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Como a linguagem revela a natureza dos conceitos e do pensamento humano.' },
      { titulo: 'Syntactic Structures', autor: 'Noam Chomsky', tipo: 'livro', dificuldade: 'Avançado', descricao: 'A obra revolucionária que fundou a linguística gerativa moderna.' },
      { titulo: 'Lingthusiasm', autor: 'Gretchen McCulloch & Lauren Gawne', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Podcast animado sobre linguística cotidiana: gírias, emojis, internet e mais.' },
      { titulo: 'Crash Course Linguistics', autor: 'PBS Digital Studios', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Série de vídeos que cobre todos os ramos da linguística de forma acessível.' },
    ],
  },
]

// Color helpers for content type badges
export const tipoColors: Record<string, { bg: string; text: string }> = {
  livro:   { bg: 'rgba(56,189,248,0.12)',  text: '#38bdf8' },
  video:   { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa' },
  podcast: { bg: 'rgba(192,132,252,0.12)', text: '#c084fc' },
  artigo:  { bg: 'rgba(45,212,191,0.12)',  text: '#2dd4bf' },
  curso:   { bg: 'rgba(52,211,153,0.12)',  text: '#34d399' },
}

export const dificuldadeColors: Record<string, { bg: string; text: string }> = {
  'Iniciante':     { bg: 'rgba(52,211,153,0.12)',  text: '#34d399' },
  'Intermediário': { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
  'Avançado':      { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' },
}
