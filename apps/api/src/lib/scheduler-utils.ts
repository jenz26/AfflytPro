/**
 * Scheduler Utilities
 *
 * Functions for cron parsing, next run calculation, and scheduler helpers.
 */

/**
 * Parse a cron expression and calculate the next run time
 *
 * @param cronExpression - Cron expression (5 parts: minute hour day month weekday)
 * @param timezone - IANA timezone string (e.g., 'Europe/Rome')
 * @returns Next run Date
 */
export function calculateNextRunAt(cronExpression: string, timezone: string = 'Europe/Rome'): Date {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression: must have 5 parts');
  }

  const [minuteExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = parts;

  // Get current time in the specified timezone
  const now = new Date();

  // Simple implementation: find the next matching time
  // For a full implementation, consider using a library like 'cron-parser'

  // Parse minute and hour from cron
  const targetMinutes = parseCronPart(minuteExpr, 0, 59);
  const targetHours = parseCronPart(hourExpr, 0, 23);
  const targetDays = parseCronPart(dayExpr, 1, 31);
  const targetMonths = parseCronPart(monthExpr, 1, 12);
  const targetWeekdays = parseCronPart(weekdayExpr, 0, 6);

  // Start from the next minute
  const candidate = new Date(now);
  candidate.setSeconds(0);
  candidate.setMilliseconds(0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  // Find the next matching time (max 1 year ahead)
  const maxIterations = 525600; // minutes in a year
  for (let i = 0; i < maxIterations; i++) {
    const month = candidate.getMonth() + 1;
    const day = candidate.getDate();
    const weekday = candidate.getDay();
    const hour = candidate.getHours();
    const minute = candidate.getMinutes();

    const monthMatch = targetMonths.includes(month);
    const dayMatch = targetDays.includes(day);
    const weekdayMatch = targetWeekdays.includes(weekday);
    const hourMatch = targetHours.includes(hour);
    const minuteMatch = targetMinutes.includes(minute);

    // Day matches if either day-of-month OR day-of-week matches
    // (unless both are restricted, then both must match)
    const dayOrWeekdayMatch =
      (dayExpr === '*' && weekdayExpr === '*') ? true :
      (dayExpr === '*') ? weekdayMatch :
      (weekdayExpr === '*') ? dayMatch :
      (dayMatch || weekdayMatch);

    if (monthMatch && dayOrWeekdayMatch && hourMatch && minuteMatch) {
      return candidate;
    }

    // Move to next minute
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  // Fallback: return 24 hours from now
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  return fallback;
}

/**
 * Parse a single cron part into an array of valid values
 */
function parseCronPart(expr: string, min: number, max: number): number[] {
  if (expr === '*') {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  const values: number[] = [];

  // Handle comma-separated values
  const parts = expr.split(',');

  for (const part of parts) {
    // Handle step values (*/2, 1-10/2)
    const [rangeOrValue, step] = part.split('/');
    const stepValue = step ? parseInt(step, 10) : 1;

    if (rangeOrValue === '*') {
      // */step
      for (let i = min; i <= max; i += stepValue) {
        values.push(i);
      }
    } else if (rangeOrValue.includes('-')) {
      // Range: 1-10 or 1-10/2
      const [start, end] = rangeOrValue.split('-').map(Number);
      for (let i = start; i <= end; i += stepValue) {
        if (i >= min && i <= max) {
          values.push(i);
        }
      }
    } else {
      // Single value
      const val = parseInt(rangeOrValue, 10);
      if (val >= min && val <= max) {
        values.push(val);
      }
    }
  }

  return [...new Set(values)].sort((a, b) => a - b);
}

/**
 * Convert a cron expression to a human-readable string
 */
export function cronToHumanReadable(cronExpression: string, locale: string = 'it'): string {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return cronExpression;
  }

  const [minute, hour, day, month, weekday] = parts;

  // Common patterns
  if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
    // Daily at specific time
    return locale === 'it'
      ? `Ogni giorno alle ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
      : `Every day at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') {
    // Weekly
    const days = locale === 'it'
      ? ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dayName = days[parseInt(weekday, 10)] || weekday;
    return locale === 'it'
      ? `Ogni ${dayName} alle ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
      : `Every ${dayName} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  if (minute === '0' && hour.includes('/')) {
    // Every X hours
    const interval = hour.split('/')[1];
    return locale === 'it'
      ? `Ogni ${interval} ore`
      : `Every ${interval} hours`;
  }

  // Default: return the cron expression
  return cronExpression;
}

/**
 * Retry configuration for scheduler
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelayMs: 60000,  // 1 minute
  maxDelayMs: 3600000,    // 1 hour
};

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number): number {
  const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Error codes for scheduler
 */
export enum SchedulerErrorCode {
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  CHANNEL_DISCONNECTED = 'CHANNEL_DISCONNECTED',
  TELEGRAM_API_ERROR = 'TELEGRAM_API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  CONTENT_GENERATION_FAILED = 'CONTENT_GENERATION_FAILED',
  INVALID_SETTINGS = 'INVALID_SETTINGS',
  CONFLICT_WITH_DEAL = 'CONFLICT_WITH_DEAL',
}
