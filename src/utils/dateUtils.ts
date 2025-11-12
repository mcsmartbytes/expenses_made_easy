/**
 * Date utility functions for consistent date formatting throughout the app
 * All dates use MM/DD/YYYY format as requested
 */

/**
 * Get today's date in MM/DD/YYYY format
 * Uses local timezone to avoid date shifting
 */
export function getTodayFormatted(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format a date string to MM/DD/YYYY
 * @param dateString - Date string in any format (YYYY-MM-DD, ISO, etc.)
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Convert MM/DD/YYYY format to YYYY-MM-DD for database storage
 * @param dateString - Date string in MM/DD/YYYY format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDatabase(dateString: string): string {
  // Handle both MM/DD/YYYY and YYYY-MM-DD formats
  if (dateString.includes('/')) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString; // Already in YYYY-MM-DD format
}

/**
 * Format a date for short display (without year for current year)
 * @param dateString - Date string in any format
 * @returns Formatted date string like "10/21" or "10/21/2024" if different year
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const currentYear = new Date().getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  if (year === currentYear) {
    return `${month}/${day}`;
  }
  return `${month}/${day}/${year}`;
}

/**
 * Validate MM/DD/YYYY date format
 * @param dateString - Date string to validate
 * @returns true if valid MM/DD/YYYY format
 */
export function isValidDateFormat(dateString: string): boolean {
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // Check if date is actually valid
  const [month, day, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

/**
 * Format currency to USD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
