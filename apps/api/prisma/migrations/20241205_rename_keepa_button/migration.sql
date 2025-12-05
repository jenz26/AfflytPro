-- Rename includeKeepaChart to showKeepaButton and change default to true
ALTER TABLE "AutomationRule" RENAME COLUMN "includeKeepaChart" TO "showKeepaButton";
ALTER TABLE "AutomationRule" ALTER COLUMN "showKeepaButton" SET DEFAULT true;
