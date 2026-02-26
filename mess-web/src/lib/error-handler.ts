import axios from 'axios';
import { ApiErrorResponse } from '@/types/common';

export const getErrorMessage = (error: unknown, fallback: string = "An unexpected error occurred"): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallback;
};