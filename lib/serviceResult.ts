export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export const ok = <T>(data: T): ServiceResult<T> => ({ success: true, data })
export const err = (error: string): ServiceResult<never> => ({ success: false, error })
