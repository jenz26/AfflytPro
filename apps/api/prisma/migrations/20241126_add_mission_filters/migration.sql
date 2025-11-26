-- Migration: add_mission_filters
-- Description: Add tier-based filters to AutomationRule and BUSINESS filter support fields to Product

-- ═══════════════════════════════════════════════════════════════
-- PRODUCT TABLE: Add BUSINESS filter support fields
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isAmazonSeller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFBA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hasCoupon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "couponPercent" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPrime" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "listedAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "buyBoxPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "fbaOfferCount" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "newOfferCount" INTEGER;

-- Create indexes for Product BUSINESS filters
CREATE INDEX IF NOT EXISTS "Product_brandName_idx" ON "Product"("brandName");
CREATE INDEX IF NOT EXISTS "Product_isAmazonSeller_idx" ON "Product"("isAmazonSeller");
CREATE INDEX IF NOT EXISTS "Product_isFBA_idx" ON "Product"("isFBA");
CREATE INDEX IF NOT EXISTS "Product_hasCoupon_idx" ON "Product"("hasCoupon");
CREATE INDEX IF NOT EXISTS "Product_isPrime_idx" ON "Product"("isPrime");
CREATE INDEX IF NOT EXISTS "Product_listedAt_idx" ON "Product"("listedAt");
CREATE INDEX IF NOT EXISTS "Product_discount_idx" ON "Product"("discount");
CREATE INDEX IF NOT EXISTS "Product_rating_idx" ON "Product"("rating");

-- ═══════════════════════════════════════════════════════════════
-- AUTOMATIONRULE TABLE: Add PRO and BUSINESS tier filters
-- ═══════════════════════════════════════════════════════════════

-- PRO tier filters
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "minPrice" DOUBLE PRECISION;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "minDiscount" INTEGER;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "minRating" INTEGER;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "minReviews" INTEGER;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "maxSalesRank" INTEGER;

-- BUSINESS tier filters
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "amazonOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "fbaOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "hasCoupon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "primeOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "brandInclude" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "brandExclude" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "listedAfter" TIMESTAMP(3);

-- Execution stats
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "dealsPublished" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "clicksGenerated" INTEGER NOT NULL DEFAULT 0;

-- Create index for lastRunAt
CREATE INDEX IF NOT EXISTS "AutomationRule_lastRunAt_idx" ON "AutomationRule"("lastRunAt");
