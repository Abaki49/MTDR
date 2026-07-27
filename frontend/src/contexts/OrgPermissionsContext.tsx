import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyPermissions } from '../api/auth'

interface OrgPermissionsContextValue {
  permissions: string[]
  isLoading: boolean
  isError: boolean
  can: (permission: string) => boolean
}

const OrgPermissionsContext = createContext<OrgPermissionsContextValue | null>(null)

export function OrgPermissionsProvider({
  orgId,
  children,
}: {
  orgId: number
  children: ReactNode
}) {
  const {
    data: permissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['orgPermissions', orgId],
    queryFn: () => getMyPermissions(orgId),
    retry: false,
    staleTime: 30_000,
  })

  const can = useCallback(
    (permission: string): boolean => {
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    },
    [permissions],
  )

  return (
    <OrgPermissionsContext.Provider value={{ permissions, isLoading, isError, can }}>
      {children}
    </OrgPermissionsContext.Provider>
  )
}

export function useOrgPermissions(): OrgPermissionsContextValue {
  const ctx = useContext(OrgPermissionsContext)
  if (!ctx) throw new Error('useOrgPermissions must be used within OrgPermissionsProvider')
  return ctx
}

export function useCan(): (permission: string) => boolean {
  return useOrgPermissions().can
}
