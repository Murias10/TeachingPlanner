import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FilterValues } from '@/components/ClassFilter';

const EMPTY_FILTERS: FilterValues = {
  tipoGrupo: [],
  asignatura: [],
  grupos: [],
  aula: [],
  idioma: [],
  curso: [],
  tipoEvento: [],
};

function getOrCreateGuestUUID(): string {
  const existing = localStorage.getItem('guest_uuid');
  if (existing) return existing;
  const uuid = crypto.randomUUID();
  localStorage.setItem('guest_uuid', uuid);
  return uuid;
}

function getFilterKey(userId: string | undefined): string {
  if (userId) return `filters_user_${userId}`;
  const guestId = getOrCreateGuestUUID();
  return `filters_guest_${guestId}`;
}

/**
 * Persists FilterValues in localStorage with a per-user key shared across all pages.
 * Automatically reloads filters when the user changes (login/logout).
 */
export function usePersistedFilters() {
  const { user } = useAuth();
  const userId = user?.id;

  const buildKey = () => getFilterKey(userId);

  const loadFilters = (): FilterValues => {
    try {
      const raw = localStorage.getItem(buildKey());
      return raw ? JSON.parse(raw) : EMPTY_FILTERS;
    } catch {
      return EMPTY_FILTERS;
    }
  };

  const [filters, setFiltersState] = useState<FilterValues>(loadFilters);

  useEffect(() => {
    setFiltersState(loadFilters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setFilters = (value: FilterValues | ((prev: FilterValues) => FilterValues)) => {
    setFiltersState(prev => {
      const next = value instanceof Function ? value(prev) : value;
      try {
        localStorage.setItem(buildKey(), JSON.stringify(next));
      } catch (e) {
        console.error('Error saving filters to localStorage', e);
      }
      return next;
    });
  };

  return [filters, setFilters] as const;
}
