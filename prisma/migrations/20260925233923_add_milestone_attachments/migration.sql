-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
