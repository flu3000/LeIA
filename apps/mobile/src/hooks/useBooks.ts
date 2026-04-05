import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/src/lib/apiClient';
import type { Book, BookFilters } from '@/src/types/library';

const PAGE_SIZE = 20;

function buildBooksUrl(offset: number, search: string, filters: BookFilters): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (filters.category_id) params.set('category_id', String(filters.category_id));
  if (filters.difficulty)  params.set('difficulty', filters.difficulty);

  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String(offset));

  return `/library/books?${params.toString()}`;
}

export function useBooks(search: string = '', filters: BookFilters = {}) {
  const [books, setBooks]               = useState<Book[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore]           = useState(true);

  const offsetRef        = useRef(0);
  // Refs para guards de concorrência — leitura sempre atual, sem stale closure.
  // Ao contrário de state, refs não causam re-render ao mudar, eliminando a
  // cascata: estado muda → novo fetchMore → FlatList rebinda → dispara de novo.
  const isFetchingRef    = useRef(false);
  const isFetchingMoreRef = useRef(false);
  const hasMoreRef       = useRef(true);

  // String estável derivada dos filtros: só muda quando os VALORES mudam de fato.
  // Usar o objeto `filters` diretamente causaria instabilidade se o chamador
  // passar um literal `{}` novo a cada render (referência diferente, valor igual).
  const filterKey = `${search}-${filters.category_id ?? ''}-${filters.difficulty ?? ''}`;

  // ── Busca inicial (ou reset quando muda o filtro) ────────────────────────────
  const fetchBooks = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    offsetRef.current = 0;
    // Reseta o ref de paginação junto com o estado — garantia de sincronia
    hasMoreRef.current = true;
    setHasMore(true);

    try {
      const url = buildBooksUrl(0, search, filters);
      const response = await api.get<Book[]>(url);
      setBooks(response);
      const more = response.length >= PAGE_SIZE;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (e) {
      console.error('[useBooks] erro ao carregar:', e);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // `search` e `filters` são capturados via filterKey. O linter pediria que
  // estivessem aqui, mas adicioná-los causaria instabilidade com objetos literais.

  // ── Carregar mais (Infinite Scroll) ─────────────────────────────────────────
  const fetchMore = useCallback(async () => {
    // Guards via refs: sem stale closure, sem re-render em cascata ao mudar.
    // Usando state aqui, duas chamadas rápidas passariam pelo guard antes que
    // setIsLoadingMore(true) propagasse para o próximo render.
    if (isFetchingMoreRef.current || !hasMoreRef.current) return;

    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextOffset = offsetRef.current + PAGE_SIZE;

    try {
      const url = buildBooksUrl(nextOffset, search, filters);
      const response = await api.get<Book[]>(url);

      if (response.length > 0) {
        setBooks((prev) => [...prev, ...response]);
        offsetRef.current = nextOffset;
      }

      const more = response.length >= PAGE_SIZE;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (e) {
      console.error('[useBooks] erro ao carregar mais:', e);
      // Interrompe o loop: em falha persistente a FlatList pararia de chamar
      // onEndReached infinitamente porque hasMore vai a false.
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      isFetchingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // isLoadingMore e hasMore deliberadamente fora das deps: o guard usa refs,
  // que são sempre atuais. Incluí-los aqui criaria novo fetchMore a cada fetch,
  // disparando re-bind na FlatList e potencial chamada extra de onEndReached.

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return { books, isLoading, isLoadingMore, hasMore, fetchMore, refetch: fetchBooks };
}

// ── DETALHE DO LIVRO ─────────────────────────────────────────────────────────

export function useBookDetail(bookId: string) {
  const [book, setBook]         = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;

    let cancelled = false;

    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<Book>(`/library/books/${bookId}`);
        if (!cancelled) setBook(response);
      } catch (e) {
        console.error('[useBookDetail] Erro:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDetail();
    return () => { cancelled = true; };
  }, [bookId]);

  return { book, isLoading };
}
