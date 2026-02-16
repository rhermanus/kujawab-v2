-- CreateEnum
CREATE TYPE "ProblemSetStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'PUBLISHED');

-- AlterTable: add status column with default
ALTER TABLE "problemsets" ADD COLUMN "status" "ProblemSetStatus" NOT NULL DEFAULT 'DRAFT';

-- Migrate data: published=true → PUBLISHED
UPDATE "problemsets" SET "status" = 'PUBLISHED' WHERE "published" = true;

-- Drop the old published column
ALTER TABLE "problemsets" DROP COLUMN "published";
