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
  accentClass: string
  accentColor: string
  conceitos: string[]
  referencias: Reference[]         // resumo exibido no card (3 itens)
  todasReferencias: Reference[]    // lista completa exibida na página de detalhes
}

export const topics: Topic[] = [
  {
    id: '1',
    tema: 'Filosofia',
    emoji: '🏛️',
    descricao: 'Da lógica aristotélica ao existencialismo moderno.',
    descricaoLonga:
      'A Filosofia é a busca racional por respostas às perguntas fundamentais da existência: o que é real, o que podemos conhecer, como devemos agir e o que nos torna humanos. Atravessa milênios de pensamento — dos pré-socráticos gregos ao existencialismo do século XX — moldando ciência, política, ética e arte. Estudar filosofia desenvolve o pensamento crítico, a capacidade de argumentação e a habilidade de examinar ideias com rigor.',
    accentClass: 'border-l-4 border-l-purple-400',
    accentColor: 'purple',
    conceitos: ['Epistemologia', 'Metafísica', 'Ética', 'Lógica', 'Existencialismo', 'Fenomenologia', 'Filosofia Política'],
    referencias: [
      { titulo: 'A República', autor: 'Platão', tipo: 'livro' },
      { titulo: 'Além do Bem e do Mal', autor: 'Friedrich Nietzsche', tipo: 'livro' },
      { titulo: 'Filosofia em 90 Minutos', autor: 'Paul Strathern', tipo: 'livro' },
    ],
    todasReferencias: [
      { titulo: 'A República', autor: 'Platão', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'O diálogo fundador da filosofia política ocidental, explorando justiça, a cidade ideal e o papel do filósofo.' },
      { titulo: 'Além do Bem e do Mal', autor: 'Friedrich Nietzsche', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Nietzsche desafia os fundamentos da moral tradicional e da filosofia ocidental.' },
      { titulo: 'Filosofia em 90 Minutos', autor: 'Paul Strathern', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Série que apresenta os grandes filósofos de forma acessível e concisa.' },
      { titulo: 'O Mundo de Sofia', autor: 'Jostein Gaarder', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Um romance que percorre a história da filosofia de forma envolvente.' },
      { titulo: 'Ser e Tempo', autor: 'Martin Heidegger', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Obra fundamental da fenomenologia e do existencialismo do século XX.' },
      { titulo: 'Meditações', autor: 'Marco Aurélio', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Reflexões pessoais do imperador filósofo sobre estoicismo e vida virtuosa.' },
      { titulo: 'Philosophize This!', autor: 'Stephen West', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Podcast acessível que apresenta cronologicamente os grandes filósofos e suas ideias.' },
      { titulo: 'The School of Life — Philosophy', autor: 'Alain de Botton', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Vídeos que aplicam a filosofia clássica aos problemas do cotidiano moderno.' },
      { titulo: 'Introduction to Philosophy — Coursera', autor: 'University of Edinburgh', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Curso introdutório gratuito que abrange as principais questões e correntes filosóficas.' },
      { titulo: 'Stanford Encyclopedia of Philosophy', autor: 'Stanford University', tipo: 'artigo', dificuldade: 'Avançado', descricao: 'Enciclopédia acadêmica online com verbetes detalhados sobre todos os temas filosóficos.' },
    ],
  },
  {
    id: '2',
    tema: 'Matemática',
    emoji: '∑',
    descricao: 'Fundamentos, cálculo e matemática aplicada.',
    descricaoLonga:
      'A Matemática é a linguagem universal do raciocínio abstrato. Dos números inteiros à teoria dos grupos, do cálculo diferencial à topologia, ela permeia toda a ciência moderna. Compreender matemática não é apenas resolver equações — é desenvolver uma forma de pensar: precisa, estruturada e criativa. É a base da física, engenharia, economia, ciência da computação e muito mais.',
    accentClass: 'border-l-4 border-l-brand-accent',
    accentColor: 'sky',
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
      { titulo: 'A Jornada do Universo Matemático', autor: 'Marcus du Sautoy', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Panorama dos grandes problemas e descobertas da matemática moderna.' },
      { titulo: '3Blue1Brown', autor: 'Grant Sanderson', tipo: 'video', dificuldade: 'Intermediário', descricao: 'Visualizações excepcionais que tornam conceitos de álgebra linear, cálculo e teoria dos números intuitivos.' },
      { titulo: 'MIT OpenCourseWare — Cálculo', autor: 'MIT', tipo: 'curso', dificuldade: 'Intermediário', descricao: 'Curso completo de cálculo de uma das melhores universidades do mundo, gratuito.' },
      { titulo: 'Khan Academy — Matemática', autor: 'Sal Khan', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Plataforma gratuita que cobre desde o básico até matemática avançada de forma progressiva.' },
      { titulo: 'Numberphile', autor: 'Brady Haran', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Vídeos curtos e fascinantes sobre curiosidades e teoremas matemáticos.' },
      { titulo: 'The Joy of x', autor: 'Steven Strogatz', tipo: 'artigo', dificuldade: 'Iniciante', descricao: 'Série de artigos (e livro homônimo) que revelam a beleza da matemática no cotidiano.' },
    ],
  },
  {
    id: '3',
    tema: 'Programação',
    emoji: '💻',
    descricao: 'Algoritmos, arquitetura e engenharia de software.',
    descricaoLonga:
      'Programação é a arte de traduzir problemas do mundo real em instruções que computadores executam. Mais do que aprender uma linguagem, envolve dominar algoritmos, estruturas de dados, paradigmas (funcional, orientado a objetos) e princípios de design de software. Um bom programador pensa em eficiência, legibilidade e manutenibilidade — construindo sistemas que resistem ao tempo.',
    accentClass: 'border-l-4 border-l-emerald-400',
    accentColor: 'emerald',
    conceitos: ['Algoritmos', 'Estruturas de Dados', 'POO', 'Design Patterns', 'Clean Code', 'Sistemas Distribuídos', 'DevOps'],
    referencias: [
      { titulo: 'Clean Code', autor: 'Robert C. Martin', tipo: 'livro' },
      { titulo: 'The Pragmatic Programmer', autor: 'Hunt & Thomas', tipo: 'livro' },
      { titulo: 'CS50', autor: 'Harvard / David Malan', tipo: 'curso' },
    ],
    todasReferencias: [
      { titulo: 'Clean Code', autor: 'Robert C. Martin', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Princípios e práticas para escrever código limpo, legível e sustentável.' },
      { titulo: 'The Pragmatic Programmer', autor: 'Hunt & Thomas', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Guia abrangente de boas práticas e mentalidade para programadores profissionais.' },
      { titulo: 'Estruturas de Dados e Algoritmos em Python', autor: 'Michael T. Goodrich', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Referência completa sobre algoritmos e estruturas de dados com implementações práticas.' },
      { titulo: 'Designing Data-Intensive Applications', autor: 'Martin Kleppmann', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Biblia dos sistemas distribuídos: bancos de dados, consistência, stream processing.' },
      { titulo: 'CS50', autor: 'Harvard / David Malan', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'O melhor curso introdutório de ciência da computação, gratuito e altamente engajante.' },
      { titulo: 'The Missing Semester of Your CS Education', autor: 'MIT', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Ferramentas essenciais (shell, git, vim, debugging) que a faculdade não ensina.' },
      { titulo: 'Fireship', autor: 'Jeff Delaney', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Vídeos rápidos e densos sobre as principais tecnologias web do mercado.' },
      { titulo: 'Coding Horror', autor: 'Jeff Atwood', tipo: 'artigo', dificuldade: 'Intermediário', descricao: 'Blog clássico sobre programação, melhores práticas e a indústria de software.' },
      { titulo: 'Lex Fridman Podcast — Engineers', autor: 'Lex Fridman', tipo: 'podcast', dificuldade: 'Intermediário', descricao: 'Entrevistas longas com engenheiros e cientistas de computação de destaque mundial.' },
    ],
  },
  {
    id: '4',
    tema: 'Neurociência',
    emoji: '🧠',
    descricao: 'Como o cérebro aprende, memoriza e processa informações.',
    descricaoLonga:
      'A Neurociência investiga o órgão mais complexo do universo conhecido: o cérebro humano. Compreender como neurônios se conectam, como memórias se formam, como emoções surgem e como aprendizagem ocorre tem implicações profundas para educação, saúde mental, inteligência artificial e nossa visão de quem somos. Uma das fronteiras mais fascinantes da ciência contemporânea.',
    accentClass: 'border-l-4 border-l-pink-400',
    accentColor: 'pink',
    conceitos: ['Neuroplasticidade', 'Memória', 'Cognição', 'Sono', 'Dopamina', 'Aprendizagem', 'Saúde Mental'],
    referencias: [
      { titulo: 'O Cérebro que se Transforma', autor: 'Norman Doidge', tipo: 'livro' },
      { titulo: 'Huberman Lab', autor: 'Andrew Huberman', tipo: 'podcast' },
      { titulo: 'Learning How to Learn', autor: 'Barbara Oakley', tipo: 'curso' },
    ],
    todasReferencias: [
      { titulo: 'O Cérebro que se Transforma', autor: 'Norman Doidge', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Como a neuroplasticidade permite ao cérebro se reorganizar e superar limitações.' },
      { titulo: 'Em Busca da Memória', autor: 'Eric Kandel', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Autobiografia do Nobel de Medicina que conta a história da neurociência moderna.' },
      { titulo: 'O Erro de Descartes', autor: 'António Damásio', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Como emoção e razão estão profundamente interligadas — contra o dualismo mente-corpo.' },
      { titulo: 'Princípios de Neurociência', autor: 'Kandel, Schwartz et al.', tipo: 'livro', dificuldade: 'Avançado', descricao: 'O tratado de referência da neurociência clínica e experimental.' },
      { titulo: 'Huberman Lab', autor: 'Andrew Huberman', tipo: 'podcast', dificuldade: 'Intermediário', descricao: 'Neurocientista de Stanford discute ciência aplicada ao sono, foco, exercício e bem-estar.' },
      { titulo: 'Learning How to Learn', autor: 'Barbara Oakley', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Curso mais popular da história do Coursera: técnicas baseadas em neurociência para aprender melhor.' },
      { titulo: 'Two Minute Papers', autor: 'Károly Zsolnai-Fehér', tipo: 'video', dificuldade: 'Intermediário', descricao: 'Resumos acessíveis de papers de IA e neurociência computacional.' },
      { titulo: 'Nautilus — Neuroscience', autor: 'Nautilus Magazine', tipo: 'artigo', dificuldade: 'Intermediário', descricao: 'Artigos de divulgação científica de alto nível sobre o cérebro e comportamento.' },
    ],
  },
  {
    id: '5',
    tema: 'História',
    emoji: '📜',
    descricao: 'Civilizações, impérios e os eventos que moldaram o mundo.',
    descricaoLonga:
      'Estudar história é compreender como chegamos até aqui: as forças que moldaram civilizações, os erros que se repetem e os momentos de ruptura que transformam tudo. Vai além de datas e batalhas — envolve economia, cultura, tecnologia e o papel dos indivíduos em grandes processos coletivos. Quem não conhece o passado está condenado a repeti-lo.',
    accentClass: 'border-l-4 border-l-amber-400',
    accentColor: 'amber',
    conceitos: ['Antiguidade', 'Idade Média', 'Revolução Industrial', 'Guerras Mundiais', 'Colonialismo', 'História Econômica', 'Microhistória'],
    referencias: [
      { titulo: 'Sapiens', autor: 'Yuval Noah Harari', tipo: 'livro' },
      { titulo: 'Guns, Germs, and Steel', autor: 'Jared Diamond', tipo: 'livro' },
    ],
    todasReferencias: [
      { titulo: 'Sapiens', autor: 'Yuval Noah Harari', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Uma breve história da humanidade: de Homo sapiens a impérios globais e revoluções cognitivas.' },
      { titulo: 'Guns, Germs, and Steel', autor: 'Jared Diamond', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Por que certas civilizações dominaram outras? Uma análise geográfica e biológica do poder.' },
      { titulo: 'O Mediterrâneo e o Mundo Mediterrânico', autor: 'Fernand Braudel', tipo: 'livro', dificuldade: 'Avançado', descricao: 'Obra monumental da Escola dos Annales sobre história de longa duração.' },
      { titulo: 'A Revolução Francesa', autor: 'Eric Hobsbawm', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Análise marxista do período que transformou política, economia e cultura do Ocidente.' },
      { titulo: 'Hardcore History', autor: 'Dan Carlin', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Episódios longos e imersivos sobre os períodos mais intensos da história mundial.' },
      { titulo: 'Crash Course History', autor: 'John Green', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Série de vídeos dinâmicos cobrindo história mundial de forma cronológica e acessível.' },
      { titulo: 'The History of Rome', autor: 'Mike Duncan', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Podcast clássico que narra episódio a episódio toda a história do Império Romano.' },
      { titulo: 'JSTOR — Historical Journals', autor: 'JSTOR', tipo: 'artigo', dificuldade: 'Avançado', descricao: 'Acervo de artigos acadêmicos de história com acesso parcial gratuito.' },
    ],
  },
  {
    id: '6',
    tema: 'Física',
    emoji: '⚛️',
    descricao: 'Do newtoniano ao quântico: como o universo funciona.',
    descricaoLonga:
      'A Física busca as leis fundamentais que governam o universo — da mecânica clássica de Newton à relatividade de Einstein, da mecânica quântica à cosmologia. É a ciência que explica por que maçãs caem, como a luz funciona, o que é matéria escura e o que aconteceu no Big Bang. Estudar física é aprender a linguagem mais profunda da realidade.',
    accentClass: 'border-l-4 border-l-cyan-400',
    accentColor: 'cyan',
    conceitos: ['Mecânica Clássica', 'Termodinâmica', 'Eletromagnetismo', 'Relatividade', 'Mecânica Quântica', 'Cosmologia', 'Física de Partículas'],
    referencias: [
      { titulo: 'Uma Breve História do Tempo', autor: 'Stephen Hawking', tipo: 'livro' },
      { titulo: 'The Feynman Lectures', autor: 'Richard Feynman', tipo: 'livro' },
    ],
    todasReferencias: [
      { titulo: 'Uma Breve História do Tempo', autor: 'Stephen Hawking', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Cosmologia acessível: buracos negros, Big Bang e a busca por uma teoria do tudo.' },
      { titulo: 'The Feynman Lectures on Physics', autor: 'Richard Feynman', tipo: 'livro', dificuldade: 'Avançado', descricao: 'A série de aulas do gênio Feynman: o curso de física mais influente já escrito.' },
      { titulo: 'Seis Peças Fáceis', autor: 'Richard Feynman', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Seis capítulos introdutórios das Feynman Lectures adaptados para o público geral.' },
      { titulo: 'O Universo Elegante', autor: 'Brian Greene', tipo: 'livro', dificuldide: 'Intermediário', descricao: 'Teoria das cordas e as fronteiras da física teórica apresentadas com clareza notável.' },
      { titulo: 'PBS Space Time', autor: 'PBS Digital Studios', tipo: 'video', dificuldade: 'Intermediário', descricao: 'Canal que explora física teórica, relatividade e cosmologia com rigor científico.' },
      { titulo: 'Física com Hewitt', autor: 'Paul Hewitt', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Física conceitual: aprenda física com intuição e exemplos do cotidiano, sem cálculo pesado.' },
      { titulo: 'Minute Physics', autor: 'Henry Reich', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Explicações curtas e elegantes de conceitos de física em animações simples.' },
      { titulo: 'The Theoretical Minimum', autor: 'Leonard Susskind', tipo: 'curso', dificuldade: 'Intermediário', descricao: 'Série de cursos online de Susskind (Stanford) sobre mecânica clássica, quântica e mais.' },
      { titulo: 'Scientific American — Physics', autor: 'Scientific American', tipo: 'artigo', dificuldade: 'Intermediário', descricao: 'Artigos de divulgação sobre as descobertas mais recentes da física.' },
    ],
  },
  {
    id: '7',
    tema: 'Economia',
    emoji: '📈',
    descricao: 'Macroeconomia, finanças comportamentais e mercados.',
    descricaoLonga:
      'Economia estuda como indivíduos, empresas e países alocam recursos escassos. Vai da microeconomia (decisões individuais) à macroeconomia (inflação, desemprego, crescimento), passando pela economia comportamental (por que tomamos decisões irracionais). Compreender economia é fundamental para entender política, sociedade e o mundo financeiro moderno.',
    accentClass: 'border-l-4 border-l-pomodoro-break',
    accentColor: 'emerald',
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
      { titulo: 'A Riqueza das Nações', autor: 'Adam Smith', tipo: 'livro', dificuldade: 'Avançado', descricao: 'A obra fundadora da economia clássica e do conceito de mercado livre.' },
      { titulo: 'Planet Money', autor: 'NPR', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Histórias curtas e envolventes que explicam a economia por trás de eventos do dia a dia.' },
      { titulo: 'EconTalk', autor: 'Russ Roberts', tipo: 'podcast', dificuldade: 'Intermediário', descricao: 'Entrevistas semanais longas com economistas sobre teoria, política e ideias.' },
      { titulo: 'MRU — Marginal Revolution University', autor: 'Tyler Cowen & Alex Tabarrok', tipo: 'curso', dificuldade: 'Iniciante', descricao: 'Microeconomia e macroeconomia gratuitas em vídeos curtos de alta qualidade.' },
      { titulo: 'The Economist — Free Exchange', autor: 'The Economist', tipo: 'artigo', dificuldade: 'Intermediário', descricao: 'Coluna semanal sobre questões econômicas globais com análise aprofundada.' },
    ],
  },
  {
    id: '8',
    tema: 'Linguística',
    emoji: '🗣️',
    descricao: 'Linguagem, cognição e a estrutura das línguas humanas.',
    descricaoLonga:
      'A Linguística investiga a linguagem humana: como as línguas funcionam, como são aprendidas, como evoluem e como moldam nosso pensamento. Do estudo dos sons (fonética) à gramática (sintaxe), do significado (semântica) ao uso social (pragmática). Entender a linguagem é entender o que nos torna únicos como espécie — e como nos comunicamos, argumentamos e construímos realidade.',
    accentClass: 'border-l-4 border-l-rose-400',
    accentColor: 'rose',
    conceitos: ['Fonética', 'Sintaxe', 'Semântica', 'Pragmática', 'Aquisição de Linguagem', 'Psicolinguística', 'Linguística Computacional'],
    referencias: [
      { titulo: 'The Language Instinct', autor: 'Steven Pinker', tipo: 'livro' },
      { titulo: 'Stuff You Missed in History', autor: 'iHeartPodcasts', tipo: 'podcast' },
    ],
    todasReferencias: [
      { titulo: 'The Language Instinct', autor: 'Steven Pinker', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'Pinker argumenta que a linguagem é um instinto biológico evoluído — acessível e fascinante.' },
      { titulo: 'The Stuff of Thought', autor: 'Steven Pinker', tipo: 'livro', dificuldade: 'Intermediário', descricao: 'Como a linguagem revela a natureza dos conceitos e do pensamento humano.' },
      { titulo: 'Syntactic Structures', autor: 'Noam Chomsky', tipo: 'livro', dificuldade: 'Avançado', descricao: 'A obra revolucionária que fundou a linguística gerativa moderna.' },
      { titulo: 'O Dom das Línguas', autor: 'Guy Deutscher', tipo: 'livro', dificuldade: 'Iniciante', descricao: 'A evolução das línguas ao longo do tempo: como surgem, mudam e desaparecem.' },
      { titulo: 'Lingthusiasm', autor: 'Gretchen McCulloch & Lauren Gawne', tipo: 'podcast', dificuldade: 'Iniciante', descricao: 'Podcast animado sobre linguística cotidiana: gírias, emojis, internet e muito mais.' },
      { titulo: 'Crash Course Linguistics', autor: 'PBS Digital Studios', tipo: 'video', dificuldade: 'Iniciante', descricao: 'Série de vídeos que cobre todos os ramos da linguística de forma acessível.' },
      { titulo: 'Introduction to Linguistics — MIT OCW', autor: 'MIT', tipo: 'curso', dificuldade: 'Intermediário', descricao: 'Curso completo de linguística do MIT, gratuito, com leituras e conjuntos de problemas.' },
      { titulo: 'Language Log', autor: 'Pullum, Liberman et al.', tipo: 'artigo', dificuldade: 'Intermediário', descricao: 'Blog de linguistas profissionais comentando linguagem, mídia e gramática.' },
    ],
  },
]

export const tipoStyle: Record<string, string> = {
  livro:   'text-sky-400    bg-sky-400/10    border border-sky-400/20',
  video:   'text-blue-400   bg-blue-400/10   border border-blue-400/20',
  podcast: 'text-purple-400 bg-purple-400/10 border border-purple-400/20',
  artigo:  'text-teal-400   bg-teal-400/10   border border-teal-400/20',
  curso:   'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
}

export const dificuldadeStyle: Record<string, string> = {
  'Iniciante':     'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  'Intermediário': 'text-amber-400   bg-amber-400/10   border border-amber-400/20',
  'Avançado':      'text-rose-400    bg-rose-400/10    border border-rose-400/20',
}
