/**
 * TrackingParser
 *
 * Parses Amazon Associates Fee-Tracking CSV reports.
 *
 * Expected format:
 * Monitoraggio ID,Clic,articoli ordinati,oggetti spediti,delle entrate (€),tasse pubblicitarie (€)
 */

import { CSVParser } from '../CSVParser';
import { ParsedTrackingRow, ParseResult } from '../types';

/**
 * Get value from row with case-insensitive fallback
 */
function getValue(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return '';
}

export class TrackingParser {
  static parse(content: string): ParseResult<ParsedTrackingRow> {
    const { rows: rawRows, periodInfo, headers } = CSVParser.parse<Record<string, string>>(content);
    const period = CSVParser.extractPeriod(periodInfo);

    const rows: ParsedTrackingRow[] = rawRows.map((raw) => ({
      trackingId: getValue(raw, 'Monitoraggio ID', 'monitoraggio id', 'TrackingID'),
      clicks: CSVParser.parseInt(getValue(raw, 'Clic', 'clic')),
      orderedItems: CSVParser.parseInt(getValue(raw, 'articoli ordinati', 'Articoli ordinati')),
      shippedItems: CSVParser.parseInt(getValue(raw, 'oggetti spediti', 'Oggetti spediti')),
      revenue: CSVParser.parsePrice(getValue(raw, 'delle entrate (€)', 'entrate')),
      commission: CSVParser.parsePrice(getValue(raw, 'tasse pubblicitarie (€)', 'commissioni')),
    }));

    return {
      rows,
      periodStart: period.start,
      periodEnd: period.end,
      headers,
    };
  }
}

export default TrackingParser;
