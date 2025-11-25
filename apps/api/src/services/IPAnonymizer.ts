import crypto from 'crypto';

/**
 * IPAnonymizer - GDPR-compliant IP address anonymization
 * 
 * Implements IP anonymization by zeroing out the last octet (IPv4)
 * or last 80 bits (IPv6) before storage, ensuring user privacy.
 */
export class IPAnonymizer {
    /**
     * Anonymize an IP address for GDPR compliance
     * 
     * @param ip - Raw IP address (IPv4 or IPv6)
     * @returns Anonymized IP address
     * 
     * @example
     * IPAnonymizer.anonymize('192.168.1.100') // → '192.168.1.0'
     * IPAnonymizer.anonymize('2001:0db8:85a3::8a2e:0370:7334') // → '2001:0db8:85a3::'
     */
    static anonymize(ip: string): string {
        // IPv4: Zero last octet (e.g., 192.168.1.100 → 192.168.1.0)
        if (ip.includes('.') && !ip.includes(':')) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                parts[3] = '0';
                return parts.join('.');
            }
        }

        // IPv6: Zero last 80 bits (keep first 48 bits)
        if (ip.includes(':')) {
            const parts = ip.split(':');
            // Keep first 3 groups (48 bits), zero the rest
            return parts.slice(0, 3).join(':') + '::';
        }

        // Fallback: return as-is if format is unknown
        return ip;
    }

    /**
     * Create a deterministic hash of an anonymized IP
     * 
     * This allows deduplication of clicks from the same anonymized IP
     * without storing the actual IP address.
     * 
     * @param anonymizedIp - Already anonymized IP address
     * @returns 16-character hash
     */
    static hash(anonymizedIp: string): string {
        return crypto
            .createHash('sha256')
            .update(anonymizedIp)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Full anonymization pipeline: anonymize + hash
     * 
     * @param rawIp - Raw IP address from request
     * @returns Anonymized and hashed IP
     */
    static process(rawIp: string): string {
        const anonymized = this.anonymize(rawIp);
        return this.hash(anonymized);
    }
}
