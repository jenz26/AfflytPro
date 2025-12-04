/**
 * EarningsParser
 *
 * Parses Amazon Associates Fee-Earnings CSV reports.
 *
 * Expected format:
 * Categoria,Prodotto,ASIN,Venditore,TrackingID,Data Spedizione,Prezzo (€),Prodotti spediti,Resi,Ricavi (€),Commissioni pubblicitarie (€),Tipo di dispositivo,Acquisto idoneo diretto
 */

import { CSVParser } from '../CSVParser';
import { ParsedEarningsRow, ParseResult } from '../types';

/**
 * Get value from row with case-insensitive fallback
 */
function getValue(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return '';
}

export class EarningsParser {
  static parse(content: string): ParseResult<ParsedEarningsRow> {
    const { rows: rawRows, periodInfo, headers } = CSVParser.parse<Record<string, string>>(content);
    const period = CSVParser.extractPeriod(periodInfo);

    const rows: ParsedEarningsRow[] = rawRows.map((raw) => ({
      category: getValue(raw, 'Categoria', 'categoria'),
      productTitle: getValue(raw, 'Prodotto', 'prodotto'),
      asin: getValue(raw, 'ASIN', 'asin'),
      seller: getValue(raw, 'Venditore', 'venditore'),
      trackingId: getValue(raw, 'TrackingID', 'trackingid', 'Tracking ID'),
      shippedDate: CSVParser.parseDate(getValue(raw, 'Data Spedizione', 'data spedizione')) || new Date(),
      price: CSVParser.parsePrice(getValue(raw, 'Prezzo (€)', 'Prezzo', 'prezzo')),
      shippedQuantity: CSVParser.parseInt(getValue(raw, 'Prodotti spediti', 'prodotti spediti')),
      returns: CSVParser.parseInt(getValue(raw, 'Resi', 'resi')),
      revenue: CSVParser.parsePrice(getValue(raw, 'Ricavi (€)', 'Ricavi', 'ricavi')),
      commission: CSVParser.parsePrice(getValue(raw, 'Commissioni pubblicitarie (€)', 'commissioni pubblicitarie')),
      deviceType: getValue(raw, 'Tipo di dispositivo', 'tipo di dispositivo') || null,
      isDirectPurchase: getValue(raw, 'Acquisto idoneo diretto', 'acquisto idoneo diretto').toUpperCase() === 'Y',
    }));

    return {
      rows,
      periodStart: period.start,
      periodEnd: period.end,
      headers,
    };
  }
}

export default EarningsParser;
