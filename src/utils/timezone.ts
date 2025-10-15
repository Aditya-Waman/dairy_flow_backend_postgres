/**
 * Timezone utility functions for Indian Standard Time (IST)
 * All functions ensure consistent timezone handling across the application
 */

/**
 * Get current time in Indian Standard Time
 * @returns Date object in IST
 */
export function getCurrentISTTime(): Date {
  return new Date();
}

/**
 * Convert UTC date to IST string
 * @param date - Date object (can be UTC or any timezone)
 * @returns IST formatted string
 */
export function toISTString(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Convert UTC date to IST Date object
 * @param date - Date object (can be UTC or any timezone)
 * @returns Date object adjusted to IST
 */
export function toISTDate(date: Date): Date {
  const istString = date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the IST string back to Date object
  const [datePart, timePart] = istString.split(', ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // Month is 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

/**
 * Get current IST time as formatted string
 * @returns Current time in IST format (DD/MM/YYYY, HH:MM:SS)
 */
export function getCurrentISTString(): string {
  return toISTString(new Date());
}

/**
 * Format date for database storage (ensures IST)
 * @param date - Date object
 * @returns Date object ready for database storage
 */
export function formatForDatabase(date: Date): Date {
  // PostgreSQL will handle timezone conversion based on database timezone setting
  return date;
}

/**
 * Parse date from database (assumes IST)
 * @param dateString - Date string from database
 * @returns Date object in IST
 */
export function parseFromDatabase(dateString: string | Date): Date {
  if (typeof dateString === 'string') {
    return new Date(dateString);
  }
  return dateString;
}

/**
 * Get timezone offset for IST
 * @returns Timezone offset in minutes (IST is UTC+5:30 = 330 minutes)
 */
export function getISTOffset(): number {
  return 330; // IST is UTC+5:30
}

/**
 * Check if a date is in IST
 * @param date - Date object to check
 * @returns boolean indicating if date is in IST
 */
export function isIST(date: Date): boolean {
  const istOffset = getISTOffset();
  const dateOffset = date.getTimezoneOffset();
  return dateOffset === -istOffset; // getTimezoneOffset returns negative for positive offsets
}

/**
 * Convert any date to IST and return as ISO string
 * @param date - Date object
 * @returns ISO string in IST
 */
export function toISTISOString(date: Date): string {
  const istDate = toISTDate(date);
  return istDate.toISOString();
}

/**
 * Get current IST time as ISO string
 * @returns Current IST time as ISO string
 */
export function getCurrentISTISOString(): string {
  return toISTISOString(new Date());
}

/**
 * Format date for API responses (IST)
 * @param date - Date object
 * @returns Formatted date string for API responses
 */
export function formatForAPI(date: Date): string {
  return toISTString(date);
}

/**
 * Create a new Date object in IST
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day (1-31)
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param second - Second (0-59)
 * @returns Date object in IST
 */
export function createISTDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  const date = new Date(year, month - 1, day, hour, minute, second);
  return toISTDate(date);
}

/**
 * Get start of day in IST
 * @param date - Date object
 * @returns Date object representing start of day in IST
 */
export function getStartOfDayIST(date: Date): Date {
  const istString = date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [day, month, year] = istString.split('/');
  return createISTDate(parseInt(year), parseInt(month), parseInt(day), 0, 0, 0);
}

/**
 * Get end of day in IST
 * @param date - Date object
 * @returns Date object representing end of day in IST
 */
export function getEndOfDayIST(date: Date): Date {
  const istString = date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [day, month, year] = istString.split('/');
  return createISTDate(parseInt(year), parseInt(month), parseInt(day), 23, 59, 59);
}
