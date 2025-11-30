-- CreateTable: AffiliateTag
CREATE TABLE "AffiliateTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'IT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateTag_userId_idx" ON "AffiliateTag"("userId");

-- CreateIndex
CREATE INDEX "AffiliateTag_isDefault_idx" ON "AffiliateTag"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTag_userId_tag_key" ON "AffiliateTag"("userId", "tag");

-- AddColumn: AutomationRule.affiliateTagId
ALTER TABLE "AutomationRule" ADD COLUMN "affiliateTagId" TEXT;

-- AddColumn: ScheduledPost.affiliateTagId
ALTER TABLE "ScheduledPost" ADD COLUMN "affiliateTagId" TEXT;

-- AddColumn: AffiliateLink.affiliateTagId
ALTER TABLE "AffiliateLink" ADD COLUMN "affiliateTagId" TEXT;

-- AddColumn: ShortLink.affiliateTagId
ALTER TABLE "ShortLink" ADD COLUMN "affiliateTagId" TEXT;

-- AddForeignKey
ALTER TABLE "AffiliateTag" ADD CONSTRAINT "AffiliateTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_affiliateTagId_fkey" FOREIGN KEY ("affiliateTagId") REFERENCES "AffiliateTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_affiliateTagId_fkey" FOREIGN KEY ("affiliateTagId") REFERENCES "AffiliateTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliateTagId_fkey" FOREIGN KEY ("affiliateTagId") REFERENCES "AffiliateTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_affiliateTagId_fkey" FOREIGN KEY ("affiliateTagId") REFERENCES "AffiliateTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration: Migrate existing Channel.amazonTag to AffiliateTag
-- This creates an AffiliateTag for each unique (userId, amazonTag) combination from channels
INSERT INTO "AffiliateTag" ("id", "userId", "tag", "label", "marketplace", "isDefault", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    c."userId",
    c."amazonTag",
    COALESCE(c."name" || ' Tag', 'Tag Migrato'),
    'IT',
    true,
    NOW(),
    NOW()
FROM "Channel" c
WHERE c."amazonTag" IS NOT NULL
AND c."amazonTag" != ''
ON CONFLICT ("userId", "tag") DO NOTHING;

-- Ensure only one default per user (keep the first one created)
UPDATE "AffiliateTag" at1
SET "isDefault" = false
WHERE EXISTS (
    SELECT 1 FROM "AffiliateTag" at2
    WHERE at2."userId" = at1."userId"
    AND at2."isDefault" = true
    AND at2."createdAt" < at1."createdAt"
);
