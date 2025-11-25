import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class SecurityService {
    private secretKey: Buffer;

    constructor() {
        const secret = process.env.ENCRYPTION_SECRET;
        if (!secret) {
            throw new Error('ENCRYPTION_SECRET environment variable is not set');
        }
        // Ensure key is 32 bytes (256 bits). If string is provided, hash it to get 32 bytes.
        this.secretKey = crypto.createHash('sha256').update(secret).digest();
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, this.secretKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encryptedContent
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }

        const [ivHex, authTagHex, encryptedContentHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.secretKey, iv);

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedContentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
