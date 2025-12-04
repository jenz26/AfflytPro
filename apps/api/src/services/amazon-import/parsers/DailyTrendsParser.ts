/**
 * DailyTrendsParser
 *
 * Parses Amazon Associates Fee-DailyTrends CSV reports.
 *
 * Expected format:
 * Data,Clic,Articoli ordinati (Amazon),Articoli ordinati (3rd Party),Totale articoli ordinati,Conversione
 */

import { CSVParser } from '../CSVParser';
import { ParsedDailyTrendRow, ParseResult } from '../types';

/**
 * Get value from row with case-insensitive fallback
 */
function getValue(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return '';
}

export class DailyTrendsParser {
  static parse(content: string): ParseResult<ParsedDailyTrendRow> {
    const { rows: rawRows, periodInfo, headers } = CSVParser.parse<Record<string, string>>(content);
    const period = CSVParser.extractPeriod(periodInfo);

    const rows: ParsedDailyTrendRow[] = rawRows.map((raw) => ({
      date: CSVParser.parseDate(getValue(raw, 'Data', 'data')) || new Date(),
      clicks: CSVParser.parseInt(getValue(raw, 'Clic', 'clic')),
      ordersAmazon: CSVParser.parseInt(getValue(raw, 'Articoli ordinati (Amazon)', 'articoli ordinati (Amazon)')),
      orders3rdParty: CSVParser.parseInt(getValue(raw, 'Articoli ordinati (3rd Party)', 'articoli ordinati (3rd Party)')),
      ordersTotal: CSVParser.parseInt(getValue(raw, 'Totale articoli ordinati', 'totale articoli ordinati')),
      conversionRate: CSVParser.parsePercent(getValue(raw, 'Conversione', 'conversione')),
    }));

    return {
      rows,
      periodStart: period.start,
      periodEnd: period.end,
      headers,
    };
  }
}

export default DailyTrendsParser;
