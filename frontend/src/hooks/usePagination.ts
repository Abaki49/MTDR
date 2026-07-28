import { useMemo, useCallback, useState } from 'react'

export function usePagination(total: number, pageSize = 50) {
  const [page, setPage] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const goTo = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }, [totalPages])

  const next = useCallback(() => goTo(page + 1), [goTo, page])
  const prev = useCallback(() => goTo(page - 1), [goTo, page])

  return { page, setPage: goTo, next, prev, totalPages, pageSize, offset: page * pageSize }
}
