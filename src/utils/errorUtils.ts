
import { toast } from "sonner";

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
  success: boolean;
};

/**
 * Standard API error handler that logs and shows a toast notification
 */
export const handleApiError = (error: unknown, customMessage?: string): ApiResponse<null> => {
  console.error("API Error:", error);
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string'
      ? error
      : "An unexpected error occurred";
  
  toast.error(customMessage || errorMessage);
  
  return {
    data: null,
    error: errorMessage,
    status: 500,
    success: false,
  };
};

/**
 * Wraps API calls with standard error handling
 */
export const safeApiCall = async <T>(
  apiFunction: () => Promise<T>,
  errorMessage?: string
): Promise<ApiResponse<T>> => {
  try {
    const data = await apiFunction();
    return {
      data,
      error: null,
      status: 200,
      success: true,
    };
  } catch (error) {
    return handleApiError(error, errorMessage) as ApiResponse<T>;
  }
};

/**
 * Validate phone numbers to ensure they're in a valid format
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic validation - in production, this would be more robust
  // and would handle international formats
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  return cleanedNumber.length >= 10 && cleanedNumber.length <= 15;
};

/**
 * Validate that a message is not empty and within length limits
 */
export const validateMessageContent = (
  message: string, 
  minLength = 1,
  maxLength = 1600
): { valid: boolean; reason?: string } => {
  if (!message || message.trim().length < minLength) {
    return { 
      valid: false, 
      reason: "Message cannot be empty" 
    };
  }
  
  if (message.length > maxLength) {
    return { 
      valid: false, 
      reason: `Message exceeds maximum length of ${maxLength} characters` 
    };
  }
  
  return { valid: true };
};

/**
 * Format a localized date string with options for different formats
 */
export const formatDate = (
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (format === 'long') {
    options.second = '2-digit';
    options.weekday = 'long';
  }
  
  return dateObj.toLocaleDateString(undefined, options);
};
