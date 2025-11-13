import { format } from 'date-fns'

/**
 * Format a date using the specified format pattern
 * @param date - The date to format (Date object, string, or number)
 * @param formatPattern - The format pattern (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number, formatPattern: string = 'MMM d, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date)
      return 'Invalid Date'
    }
    
    return format(dateObj, formatPattern)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

// Convenience function for common format
export const formatBlogDate = (date: Date | string | number): string => {
  return formatDate(date, 'MMM d, yyyy')
}