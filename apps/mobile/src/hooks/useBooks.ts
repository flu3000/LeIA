import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/src/lib/apiClient'; // Usamos sempre esse para ter o Token!
import type { Book, BookFilters, BooksResponse } from '@/src/types/library';

const PAGE_SIZE = 20;

/** * HELPER: Monta a URL com os filtros para não sujar o corpo do Hook.
 */
function buildBooksUrl(offset: number, search: string, filters: BookFilters): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (filters.category_id) params.set('category_id', String(filters.category_id));
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  
  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String(offset));
  
  return `/books/getAll?${params.toString()}`;
}

export function useBooks(search: string = '', filters: BookFilters = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // useRef guarda o valor da página sem disparar um novo render do componente
  const offsetRef = useRef(0);

  // Criamos uma "chave" única para os filtros. 
  // Se mudar o ID da categoria, o Hook "sabe" que precisa resetar a lista.
  const filterKey = `${search}-${filters.category_id}-${filters.difficulty}`;

  /**
   * FUNÇÃO 1: Busca inicial (ou reset quando muda o filtro)
   */
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    offsetRef.current = 0; // Volta para o início
    
    try {
      const url = buildBooksUrl(0, search, filters);
      const response = await api.get<Book[]>(url); 
      
      // Se a API retornar menos que o PAGE_SIZE, significa que acabou o estoque
      setBooks(response);
      setHasMore(response.length >= PAGE_SIZE);
    } catch (e) {
      console.error('[useBooks] erro ao carregar:', e);
    } finally {
      setIsLoading(false);
    }
  }, [filterKey]); // Só recria a função se o filtro mudar

  /**
   * FUNÇÃO 2: Carregar mais (Infinite Scroll)
   */
  const fetchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextOffset = offsetRef.current + PAGE_SIZE;

    try {
      const url = buildBooksUrl(nextOffset, search, filters);
      const response = await api.get<Book[]>(url);

      if (response.length > 0) {
        setBooks((prev) => [...prev, ...response]);
        offsetRef.current = nextOffset;
      }
      
      setHasMore(response.length >= PAGE_SIZE);
    } catch (e) {
      console.error('[useBooks] erro ao carregar mais:', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, filterKey]);

  // Efeito que dispara a busca sempre que a função fetchBooks mudar (ou seja, quando o filtro mudar)
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return { books, isLoading, isLoadingMore, hasMore, fetchMore, refetch: fetchBooks };
}

// ── DETALHE DO LIVRO ─────────────────────────────────────────────────────────

export function useBookDetail(bookId: string) {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;

    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<Book>(`/books/getById/${bookId}`);
        setBook(response);
      } catch (e) {
        console.error('[useBookDetail] Erro:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [bookId]);

  return { book, isLoading };
}