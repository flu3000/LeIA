import { Router } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth' // Importe o middleware

const router = Router()
router.use(requireAuth)

const BOOK_SUMMARY_COLS = `book_id,title,author,difficulty,tags,category_id,best_seller_edition,all_editions:book_editions!book_id(edition_id,isbn_13,publisher,cover_url)`

const BOOK_DETAIL_COLS =
  `book_id,
  title,
  author,
  difficulty,
  description,
  tags,
  category_id,
  best_seller_edition,
  all_editions:book_editions!book_id(
    edition_id,
    isbn_13,
    isbn_10,
    publisher,
    publication_year,
    pages,
    language,
    cover_url
  ),
  main_cover:book_editions!best_seller_edition (cover_url)
`;

// GET /books — list with optional filters
router.get('/getAll', async (req, res) => {
  const { category_id, difficulty, search } = req.query as Record<string, string>
  const page = parseInt(req.query.page as string) || 0;
  const limit = 20;

  // 1. Iniciamos a query básica
  let query = supabase.from('books').select(BOOK_SUMMARY_COLS)

  // 2. Filtros obrigatórios do Banco (Categoria e Dificuldade)
  if (category_id) query = query.eq('category_id', category_id)
  if (difficulty)  query = query.eq('difficulty', difficulty)
  
  // IMPORTANTE: Removemos o query.or() daqui! 
  // Se filtrarmos no banco por título, o ISBN nunca chegará ao JavaScript.

  // 3. Executamos a busca no banco
  const { data, error } = await query.order('title', { ascending: true });

  if (error) {
    console.error('[GET /api/books/getAll]', error)
    return res.status(500).json({ error: error.message })
  }

  if (!data) return res.json([]);

  // 4. PÓS-PROCESSAMENTO (Filtro e Formatação)
  const s = search?.toLowerCase().trim();

  const results = data
    .filter((book: any) => {
      // Se não houver busca, exibe tudo
      if (!s) return true;

      // Verifica Título e Autor
      const matchInBook = 
        book.title?.toLowerCase().includes(s) || 
        book.author?.toLowerCase().includes(s);

      // Verifica ISBN e Editora dentro do array de edições
      const matchInEditions = book.all_editions?.some((ed: any) => 
        (ed.isbn_13 && ed.isbn_13.toLowerCase().includes(s)) || 
        (ed.publisher && ed.publisher.toLowerCase().includes(s))
      );
      return matchInBook || matchInEditions;
    })
    .map((book: any) => {
      // Lógica da Capa
      const mainEdition = book.all_editions?.find(
        (ed: any) => ed.edition_id === book.best_seller_edition
      );

      let finalCover = mainEdition?.cover_url || book.all_editions?.[0]?.cover_url;

      // Se a busca bateu com uma edição específica, troca a capa
      if (s) {
        const contextualEdition = book.all_editions?.find((ed: any) => 
          (ed.isbn_13 && ed.isbn_13.toLowerCase().includes(s)) || 
          (ed.publisher && ed.publisher.toLowerCase().includes(s))
        );
        // if (contextualEdition) console.log(`Busca "${s}" bateu com uma edição do livro "${book.title}". "${contextualEdition.cover_url}"`);
        if (contextualEdition) finalCover = contextualEdition.cover_url;
      }

      const { all_editions, best_seller_edition, ...rest } = book;
      return { ...rest, cover_url: finalCover };
    });

  // 5. Paginação Manual (já que filtramos no JS)
  const from = page * limit;
  const to = from + limit;
  const paginatedResults = results.slice(from, to);

  res.json(paginatedResults);
});

// GET /api/books/getById/:bookId — full detail
router.get('/getById/:bookId', async (req, res) => {
  const { bookId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_DETAIL_COLS)
    .eq('book_id', bookId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/getById/:bookId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'Book not found' })
    return
  }
  res.json(data)
})

router.get('/getByCategory/:categoryId', async (req, res) => {
  const { categoryId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SUMMARY_COLS)
    .eq('category_id', categoryId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/getByCategory/:categotyId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'No books found in the category' })
    return
  }
  res.json(data)
})

router.get('/getBook/:categoryId', async (req, res) => {
  const { categoryId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SUMMARY_COLS)
    .eq('category_id', categoryId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/getByCategory/:categotyId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'No books found in the category' })
    return
  }
  res.json(data)
})

export default router
