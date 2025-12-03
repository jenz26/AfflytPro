/**
 * Utility to parse cron expressions into human-readable format
 */

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const DAYS_OF_WEEK: Record<string, string> = {
  '0': 'Domenica',
  '1': 'Lunedì',
  '2': 'Martedì',
  '3': 'Mercoledì',
  '4': 'Giovedì',
  '5': 'Venerdì',
  '6': 'Sabato',
  '7': 'Domenica',
};

/**
 * Parse a cron expression into human-readable Italian text
 * @param cron - Standard 5-part cron expression (minute hour day month weekday)
 * @returns Human-readable description in Italian
 */
export function parseCronToHumanReadable(cron: string): string {
  if (!cron) return '';

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron; // Return original if invalid

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Handle common patterns
  try {
    // Every N minutes/hours
    if (minute.startsWith('*/') && hour === '*') {
      const interval = parseInt(minute.slice(2));
      return `Ogni ${interval} minut${interval === 1 ? 'o' : 'i'}`;
    }

    if (minute === '0' && hour.startsWith('*/')) {
      const interval = parseInt(hour.slice(2));
      return `Ogni ${interval} or${interval === 1 ? 'a' : 'e'}`;
    }

    // Specific time patterns
    if (isNumeric(minute) && isNumeric(hour)) {
      const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

      // Every day at specific time
      if (dayOfMonth === '*' && month === '*') {
        // Specific weekdays
        if (dayOfWeek !== '*') {
          const days = parseDaysOfWeek(dayOfWeek);
          if (days === 'Lun-Ven') {
            return `Giorni feriali alle ${time}`;
          }
          if (days === 'Sab-Dom') {
            return `Weekend alle ${time}`;
          }
          return `${days} alle ${time}`;
        }
        return `Ogni giorno alle ${time}`;
      }

      // Specific day of month
      if (isNumeric(dayOfMonth) && month === '*' && dayOfWeek === '*') {
        return `Il ${dayOfMonth} di ogni mese alle ${time}`;
      }
    }

    // Multiple times per day (e.g., "0 9,18 * * *")
    if (isNumeric(minute) && hour.includes(',')) {
      const hours = hour.split(',').map(h => `${h.padStart(2, '0')}:${minute.padStart(2, '0')}`);
      if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Ogni giorno alle ${hours.join(' e ')}`;
      }
    }

    // If we can't parse it, return a simplified version
    return formatSimpleCron(parts);

  } catch {
    return cron; // Return original on error
  }
}

function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

function parseDaysOfWeek(dayOfWeek: string): string {
  // Range like 1-5
  if (dayOfWeek.includes('-')) {
    const [start, end] = dayOfWeek.split('-').map(Number);
    if (start === 1 && end === 5) return 'Lun-Ven';
    if (start === 6 && end === 7) return 'Sab-Dom';
    if (start === 0 && end === 6) return 'Ogni giorno';
    return `${DAYS_OF_WEEK[start.toString()] || start}-${DAYS_OF_WEEK[end.toString()] || end}`;
  }

  // List like 1,3,5
  if (dayOfWeek.includes(',')) {
    const days = dayOfWeek.split(',').map(d => DAYS_OF_WEEK[d] || d);
    return days.join(', ');
  }

  // Single day
  return DAYS_OF_WEEK[dayOfWeek] || dayOfWeek;
}

function formatSimpleCron(parts: string[]): string {
  const [minute, hour] = parts;

  // Try to at least show the time
  if (isNumeric(minute) && isNumeric(hour)) {
    return `Programmato alle ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  if (minute.startsWith('*/')) {
    return `Ogni ${minute.slice(2)} minuti`;
  }

  if (isNumeric(minute) && hour.startsWith('*/')) {
    return `Ogni ${hour.slice(2)} ore`;
  }

  return `Programmato (${parts.join(' ')})`;
}

/**
 * Format content for preview, replacing variables with placeholder examples
 * @param content - Original content with variables
 * @returns Content with variables replaced by example values
 */
export function formatContentPreview(content: string): string {
  if (!content) return '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  return content
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{time\}\}/g, timeStr)
    .replace(/\{\{link\}\}/g, '🔗 [Link Affiliato]')
    .replace(/\{\{deals\}\}/g, '📦 [Elenco offerte del giorno...]');
}
