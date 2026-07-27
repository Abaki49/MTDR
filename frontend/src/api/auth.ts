import client from './client'
import type { LoginRequest, TokenResponse, User } from '../types/auth'

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/login', data)
  return res.data
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken })
  return res.data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>('/auth/me')
  return res.data
}

export async function getMyPermissions(orgId: number): Promise<string[]> {
  const res = await client.get<{ permissions: string[] }>(`/organizations/${orgId}/me/permissions`)
  return res.data.permissions
}
