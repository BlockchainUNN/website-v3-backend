/*
  Warnings:

  - You are about to drop the column `hashed_password` on the `Hacker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Hacker" DROP COLUMN "hashed_password";
