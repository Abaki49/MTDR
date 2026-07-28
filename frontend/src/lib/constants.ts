export const PAGE_SIZE = 50

export const STALE_TIMES = {
  AUTH_ME: 5 * 60 * 1000,
  MY_PERMISSIONS: 30 * 1000,
  MEMBERS: 30 * 1000,
  RESOURCES: 30 * 1000,
  AUDIT: 10 * 1000,
  ROLES: 10 * 60 * 1000,
  ORGANIZATIONS: 60 * 1000,
} as const

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION: (id: number | string) => `/organizations/${id}`,
  ORG_RESOURCES: (id: number | string) => `/organizations/${id}/resources`,
  ORG_MEMBERS: (id: number | string) => `/organizations/${id}/members`,
  ORG_PERMISSIONS: (id: number | string) => `/organizations/${id}/permissions`,
  ORG_AUDIT: (id: number | string) => `/organizations/${id}/audit`,
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUDIT: '/admin/audit-logs',
  PROFILE: '/profile',
} as const

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME: 'theme',
} as const
