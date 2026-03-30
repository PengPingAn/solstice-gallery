// server/utils/response.ts
export interface ApiResponse<T = any> {
  code: number
  msg: string
  success: boolean
  data: T | null
}

export function success<T>(data: T, msg = 'success'): ApiResponse<T> {
  return {
    code: 200,
    msg,
    success: true,
    data,
  }
}

export function fail(msg = 'error', code = 500): ApiResponse<null> {
  return {
    code,
    msg,
    success: false,
    data: null,
  }
}
