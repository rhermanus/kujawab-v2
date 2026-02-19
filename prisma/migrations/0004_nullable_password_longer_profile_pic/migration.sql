-- AlterTable: allow NULL password for Google OAuth users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable: increase profile_picture length for Google avatar URLs
ALTER TABLE "users" ALTER COLUMN "profile_picture" SET DATA TYPE VARCHAR(120);
