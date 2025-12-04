import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Beta Signup Route
 *
 * Collects email addresses from landing page for beta waitlist
 *
 * POST /api/beta-signup
 * Body: { email: string, telegramChannel?: string, subscriberCount?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, telegramChannel, subscriberCount } = body;

    console.log('[Beta Signup Web] Incoming request:', { email, telegramChannel, subscriberCount });
    console.log('[Beta Signup Web] API_BASE:', API_BASE);

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email non valida' },
        { status: 400 }
      );
    }

    // Forward to backend API with all fields
    const apiUrl = `${API_BASE}/auth/beta-signup`;
    console.log('[Beta Signup Web] Forwarding to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, telegramChannel, subscriberCount }),
    });

    console.log('[Beta Signup Web] API response status:', response.status);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Perfetto! Ti contatteremo presto con il tuo invito alla beta.',
      });
    }

    const data = await response.json();

    // Handle specific error cases
    if (response.status === 409) {
      return NextResponse.json({
        success: true, // Still show success to user
        message: 'Sei gia nella lista! Ti contatteremo presto.',
      });
    }

    return NextResponse.json(
      { success: false, message: data.message || 'Si e verificato un errore. Riprova.' },
      { status: response.status }
    );

  } catch (error: any) {
    console.error('Beta signup error:', error);

    return NextResponse.json(
      { success: false, message: 'Errore di connessione. Riprova piu tardi.' },
      { status: 500 }
    );
  }
}
