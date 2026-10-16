/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'WALLET_FUNDING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "reference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");
