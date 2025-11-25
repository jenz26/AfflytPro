import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const {
      asin,
      amazonUrl,
      title,
      imageUrl,
      currentPrice,
      originalPrice,
      source,
      campaignId,
      userId,
      amazonTag = 'afflyt-21',
    } = await req.json();

    // Validate required fields
    if (!asin || !amazonUrl || !title || !currentPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: asin, amazonUrl, title, currentPrice' },
        { status: 400 }
      );
    }

    // Generate unique short code (8 characters)
    const shortCode = nanoid(8);

    // Calculate discount
    const discount = originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    // Create short link
    const link = await prisma.shortLink.create({
      data: {
        shortCode,
        asin,
        title,
        imageUrl,
        currentPrice,
        originalPrice,
        discount,
        amazonUrl,
        amazonTag,
        priceCheckedAt: new Date(),
        source,
        campaignId,
        userId,
      },
    });

    // Build short URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/r/${shortCode}`;

    return NextResponse.json({
      success: true,
      shortUrl,
      shortCode,
      linkId: link.id,
    });
  } catch (error) {
    console.error('Error creating short link:', error);
    return NextResponse.json(
      { error: 'Failed to create short link' },
      { status: 500 }
    );
  }
}
