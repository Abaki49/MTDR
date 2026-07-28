export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

export interface ApiError {
  message: string
  status: number
}
