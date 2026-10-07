-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
