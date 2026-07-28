import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional().or(z.literal('')),
  description: z.string().optional(),
})

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional().or(z.literal('')),
  description: z.string().optional(),
})

export const createMemberSchema = z.object({
  user_id: z.number().positive(),
  role_id: z.number().positive(),
})

export const updateMemberSchema = z.object({
  role_id: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INVITED']).optional(),
})

export const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  storage_key: z.string().max(512).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
})

export const updateResourceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
})
