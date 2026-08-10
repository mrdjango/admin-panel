import { useCallback, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AdminGroup } from '@librechat/data-schemas';
import { groupsQueryOptions, GROUPS_PAGE_SIZE } from '@/server';
import { useDebouncedFilter } from './useDebouncedFilter';

interface GroupSearch {
  readonly search: string;
  readonly onSearchChange: (next: string) => void;
  readonly groups: AdminGroup[];
  readonly total: number;
  readonly totalPages: number;
  readonly page: number;
  readonly setPage: (page: number) => void;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
}

/** Debounced server-side group search with offset pagination, so consumers
 * can browse every group instead of a single capped page. Searching resets
 * to the first page; previous results are kept while a new page loads. */
export function useGroupSearch(enabled = true): GroupSearch {
  const [page, setPage] = useState(1);
  const resetPage = useCallback(() => setPage(1), []);
  const { value, debouncedValue, onChange } = useDebouncedFilter('', resetPage);

  const { data, isLoading, isFetching } = useQuery({
    ...groupsQueryOptions(page, debouncedValue),
    placeholderData: keepPreviousData,
    enabled,
  });

  const total = data?.total ?? 0;
  return {
    search: value,
    onSearchChange: onChange,
    groups: data?.groups ?? [],
    total,
    totalPages: Math.ceil(total / GROUPS_PAGE_SIZE),
    page,
    setPage,
    isLoading,
    isFetching,
  };
}
