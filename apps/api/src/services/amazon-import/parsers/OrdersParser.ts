/**
 * OrdersParser
 *
 * Parses Amazon Associates Fee-Orders CSV reports.
 *
 * Expected format:
 * Categoria,Prodotto,ASIN,Data,Quantità,Prezzo (€),Tipo di link,Tag,Ordini attraverso il link del prodotto,Tipo di dispositivo
 */

import { CSVParser } from '../CSVParser';
import { ParsedOrderRow, ParseResult } from '../types';

/**
 * Get value from row with case-insensitive fallback
 */
function getValue(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return '';
}

export class OrdersParser {
  static parse(content: string): ParseResult<ParsedOrderRow> {
    const { rows: rawRows, periodInfo, headers } = CSVParser.parse<Record<string, string>>(content);
    const period = CSVParser.extractPeriod(periodInfo);

    const rows: ParsedOrderRow[] = rawRows.map((raw) => ({
      category: getValue(raw, 'Categoria', 'categoria'),
      productTitle: getValue(raw, 'Prodotto', 'prodotto'),
      asin: getValue(raw, 'ASIN', 'asin'),
      orderDate: CSVParser.parseDate(getValue(raw, 'Data', 'data')) || new Date(),
      quantity: CSVParser.parseInt(getValue(raw, 'Quantità', 'quantità') || '1'),
      price: CSVParser.parsePrice(getValue(raw, 'Prezzo (€)', 'Prezzo', 'prezzo')),
      linkType: getValue(raw, 'Tipo di link', 'tipo di link') || null,
      trackingId: getValue(raw, 'Tag', 'tag') || null,
      orderType: getValue(raw, 'Ordini attraverso il link del prodotto') || null, // 'di' | 'ndi'
      deviceType: getValue(raw, 'Tipo di dispositivo', 'tipo di dispositivo') || null,
    }));

    return {
      rows,
      periodStart: period.start,
      periodEnd: period.end,
      headers,
    };
  }
}

export default OrdersParser;
