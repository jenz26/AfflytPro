import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export class EmailService {
  /**
   * Validate API key
   */
  static async validateApiKey(apiKey: string, provider: 'sendgrid' | 'resend'): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      if (provider === 'sendgrid') {
        const testClient = sgMail;
        testClient.setApiKey(apiKey);

        // Test with sandbox mode
        await testClient.send({
          to: 'test@test.com',
          from: 'test@test.com', // Will fail but validates key format
          subject: 'Test',
          text: 'Test',
          mailSettings: {
            sandboxMode: { enable: true }
          }
        });
      }
      // TODO: Add Resend validation

      return { valid: true };
    } catch (error: any) {
      // 403 means key is invalid, 400 might mean other issues
      if (error.code === 403 || error.message?.includes('api key')) {
        return { valid: false, error: 'Invalid API key' };
      }
      // Other errors might be OK (like invalid email format in sandbox)
      return { valid: true };
    }
  }

  /**
   * Send deal email
   */
  static async sendDealEmail(
    to: string,
    from: string,
    deal: {
      title: string;
      price: number;
      originalPrice: number;
      discount: number;
      rating: number;
      imageUrl?: string;
      affiliateLink: string;
    }
  ) {
    const discountPercent = Math.round(deal.discount * 100);
    const savings = (deal.originalPrice - deal.price).toFixed(2);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .deal-image { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
    .price { font-size: 32px; font-weight: bold; color: #16a34a; }
    .original-price { text-decoration: line-through; color: #9ca3af; }
    .discount-badge { background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 Hot Deal Alert!</h1>
    </div>
    <div class="content">
      ${deal.imageUrl ? `<img src="${deal.imageUrl}" class="deal-image" alt="Product">` : ''}

      <h2>${deal.title}</h2>

      <p>
        <span class="price">€${deal.price}</span>
        <span class="original-price">€${deal.originalPrice}</span>
      </p>

      <p><span class="discount-badge">-${discountPercent}% (Risparmi €${savings})</span></p>

      <p>⭐ Rating: ${deal.rating}/5</p>

      <a href="${deal.affiliateLink}" class="cta-button">🛒 Acquista Ora su Amazon</a>

      <p style="margin-top: 30px; color: #9ca3af; font-size: 12px;">
        Deal trovato da Afflyt Pro | <a href="#">Disiscriviti</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await sgMail.send({
        to,
        from,
        subject: `🔥 ${deal.title} -${discountPercent}%!`,
        html
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
