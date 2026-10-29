-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
