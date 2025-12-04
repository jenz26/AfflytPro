/**
 * CSVParser
 *
 * Base CSV parser for Amazon Associates reports.
 * Handles common parsing logic like date/price formatting and period extraction.
 */

import { parse } from 'csv-parse/sync';

export interface CSVParseOptions {
  skipFirstRow?: boolean; // Skip header descrittivo (es: "Fee-Orders reports from...")
  delimiter?: string;
}

export class CSVParser {
  /**
   * Parse CSV content to array of objects
   */
  static parse<T>(
    content: string,
    options: CSVParseOptions = {}
  ): { headers: string[]; rows: T[]; periodInfo: string | null } {
    const lines = content.trim().split('\n');

    // Prima riga spesso è descrizione del periodo
    let periodInfo: string | null = null;
    let startIndex = 0;

    if (options.skipFirstRow !== false && lines[0] && !lines[0].includes(',')) {
      // Es: "Fee-Orders reports from 03-01-2024 to 02-01-2025"
      periodInfo = lines[0];
      startIndex = 1;
    }

    const csvContent = lines.slice(startIndex).join('\n');

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: options.delimiter || ',',
      relax_column_count: true,
      trim: true,
    }) as Record<string, string>[];

    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    return {
      headers,
      rows: records as T[],
      periodInfo,
    };
  }

  /**
   * Extract period from description line
   */
  static extractPeriod(periodInfo: string | null): { start: Date | null; end: Date | null } {
    if (!periodInfo) return { start: null, end: null };

    // Pattern: "... from DD-MM-YYYY to DD-MM-YYYY"
    const match = periodInfo.match(/(\d{2}-\d{2}-\d{4})\s+to\s+(\d{2}-\d{2}-\d{4})/);

    if (match) {
      const parseDate = (str: string): Date => {
        const [day, month, year] = str.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      return {
        start: parseDate(match[1]),
        end: parseDate(match[2]),
      };
    }

    return { start: null, end: null };
  }

  /**
   * Parse Italian date format
   * Supports: "2024-12-18 00:00:00" or "2024-12-18"
   */
  static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Format: "2024-12-18 00:00:00" or "2024-12-18"
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }

    // Try alternative format: "18-12-2024"
    const altMatch = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (altMatch) {
      return new Date(parseInt(altMatch[3]), parseInt(altMatch[2]) - 1, parseInt(altMatch[1]));
    }

    return null;
  }

  /**
   * Parse price from Italian/European format
   * Handles: "16,39", "16.39", "€16.39", "16,39 €"
   */
  static parsePrice(priceStr: string): number {
    if (!priceStr) return 0;

    // Remove currency symbols and spaces
    const cleaned = priceStr
      .replace(/[€$]/g, '')
      .replace(/\s/g, '')
      .trim();

    // Handle European format (comma as decimal separator)
    // If there's a comma and no period, or comma is after period, comma is decimal
    if (cleaned.includes(',')) {
      const lastComma = cleaned.lastIndexOf(',');
      const lastPeriod = cleaned.lastIndexOf('.');

      if (lastPeriod < lastComma) {
        // European format: 1.234,56 -> 1234.56
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
      }
    }

    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse percentage
   * Handles: "17.86", "17,86", "17.86%"
   */
  static parsePercent(percentStr: string): number {
    if (!percentStr) return 0;

    const cleaned = percentStr.replace('%', '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse integer safely
   */
  static parseInt(intStr: string): number {
    if (!intStr) return 0;
    const cleaned = intStr.replace(/[.,\s]/g, '').trim();
    return parseInt(cleaned) || 0;
  }

  /**
   * Detect report type from file content
   */
  static detectReportType(
    content: string
  ): 'orders' | 'earnings' | 'daily_trends' | 'tracking' | 'link_type' | null {
    const lowerContent = content.toLowerCase();
    const firstLines = content.split('\n').slice(0, 3).join('\n').toLowerCase();

    // Check header patterns
    if (
      firstLines.includes('ordini attraverso il link') ||
      firstLines.includes('tipo di link') ||
      lowerContent.includes('fee-orders')
    ) {
      return 'orders';
    }

    if (
      firstLines.includes('data spedizione') ||
      firstLines.includes('commissioni pubblicitarie') ||
      lowerContent.includes('fee-earnings')
    ) {
      return 'earnings';
    }

    if (
      firstLines.includes('articoli ordinati (amazon)') ||
      firstLines.includes('totale articoli ordinati') ||
      lowerContent.includes('dailytrends')
    ) {
      return 'daily_trends';
    }

    if (firstLines.includes('monitoraggio id') || lowerContent.includes('fee-tracking')) {
      return 'tracking';
    }

    if (
      firstLines.includes('link tipo') ||
      firstLines.includes('di conversione') ||
      lowerContent.includes('linktype')
    ) {
      return 'link_type';
    }

    return null;
  }
}

export default CSVParser;
