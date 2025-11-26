/**
 * Test Script: Telegram Bot Integration con Redirect System
 *
 * Questo script dimostra come pubblicare un deal su Telegram
 * con il sistema di short link tracking integrato.
 */

import { TelegramBotService } from './src/services/TelegramBotService';

async function testTelegramBot() {
  console.log('🤖 Testing Telegram Bot Integration\n');

  // 1. Setup (usa le tue credenziali via .env)
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

  if (!BOT_TOKEN || !CHANNEL_ID) {
    console.error('❌ Errore: TELEGRAM_BOT_TOKEN e TELEGRAM_CHANNEL_ID devono essere configurati in .env');
    console.log('\n💡 Aggiungi al file .env:');
    console.log('   TELEGRAM_BOT_TOKEN=your-bot-token-here');
    console.log('   TELEGRAM_CHANNEL_ID=your-channel-id-here\n');
    return;
  }

  console.log('📋 Configuration:');
  console.log(`   Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
  console.log(`   Channel: ${CHANNEL_ID}\n`);

  // 2. Test: Validate Bot Token
  console.log('🔐 Step 1: Validating bot token...');
  const tokenValidation = await TelegramBotService.validateToken(BOT_TOKEN);

  if (!tokenValidation.valid) {
    console.error('❌ Token non valido:', tokenValidation.error);
    return;
  }

  console.log('✅ Token valido!');
  console.log(`   Bot: @${tokenValidation.botInfo?.username}`);
  console.log(`   Name: ${tokenValidation.botInfo?.firstName}\n`);

  // 3. Test: Validate Channel Connection
  console.log('📡 Step 2: Validating channel connection...');
  const channelValidation = await TelegramBotService.validateChannelConnection(
    BOT_TOKEN,
    CHANNEL_ID
  );

  if (!channelValidation.valid) {
    console.error('❌ Canale non accessibile:', channelValidation.error);
    console.log('\n💡 Assicurati che:');
    console.log('   1. Il bot sia aggiunto al canale');
    console.log('   2. Il bot sia admin con permessi di postare');
    console.log('   3. Il channel ID sia corretto (es: @canale o -100123456789)\n');
    return;
  }

  console.log('✅ Canale accessibile!');
  console.log(`   Can Post: ${channelValidation.canPost ? 'Sì' : 'No'}\n`);

  if (!channelValidation.canPost) {
    console.warn('⚠️  Il bot non è admin nel canale');
    console.log('   Aggiungi il bot come admin per poter pubblicare\n');
    return;
  }

  // 4. Test: Send Test Message
  console.log('📨 Step 3: Sending test message...');
  const testResult = await TelegramBotService.sendTestMessage(CHANNEL_ID, BOT_TOKEN);

  if (!testResult.success) {
    console.error('❌ Errore invio test:', testResult.error);
    return;
  }

  console.log('✅ Test message inviato!\n');

  // 5. Test: Publish Deal with Short Link
  console.log('🔥 Step 4: Publishing deal with short link tracking...');

  const sampleDeal = {
    asin: 'B08N5WRWNW',
    title: 'Apple AirPods Pro (2ª generazione) con Custodia di Ricarica MagSafe',
    price: 199.99,
    originalPrice: 299.00,
    discount: 0.33,
    rating: 4.7,
    reviewCount: 45234,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    affiliateLink: 'https://amazon.it/dp/B08N5WRWNW?tag=afflyt-21',
  };

  const dealResult = await TelegramBotService.sendDealToChannel(
    CHANNEL_ID,
    BOT_TOKEN,
    sampleDeal
  );

  if (!dealResult.success) {
    console.error('❌ Errore pubblicazione deal:', dealResult.error);
    return;
  }

  console.log('✅ Deal pubblicato con successo!');
  console.log(`   Short URL: ${dealResult.shortUrl}`);
  console.log('\n📊 Il link include tracking per:');
  console.log('   - Source: telegram');
  console.log(`   - Campaign: channel_${CHANNEL_ID}`);
  console.log('   - Funnel events: page_view, click, redirect, ecc.\n');

  console.log('🎉 Test completato! Controlla il tuo canale Telegram.');
}

// Run test
if (require.main === module) {
  testTelegramBot().catch(console.error);
}

export { testTelegramBot };
