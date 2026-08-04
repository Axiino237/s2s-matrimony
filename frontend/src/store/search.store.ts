import { create } from 'zustand';
import type { SearchFilters, Profile, PaginationMeta } from '../types';

interface SearchStore {
  filters: SearchFilters;
  results: Profile[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  hasSearched: boolean;

  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setResults: (results: Profile[], meta: PaginationMeta) => void;
  setLoading: (isLoading: boolean) => void;
}

const defaultFilters: SearchFilters = {
  ageMin: 18,
  ageMax: 60,
  page: 1,
  limit: 20,
  sortBy: 'newest',
};

export const useSearchStore = create<SearchStore>((set) => ({
  filters: defaultFilters,
  results: [],
  meta: null,
  isLoading: false,
  hasSearched: false,

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } })),

  resetFilters: () => set({ filters: defaultFilters, results: [], meta: null, hasSearched: false }),

  setResults: (results, meta) => set({ results, meta, hasSearched: true }),

  setLoading: (isLoading) => set({ isLoading }),
}));
