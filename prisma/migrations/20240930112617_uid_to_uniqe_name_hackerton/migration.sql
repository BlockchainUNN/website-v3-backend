/*
  Warnings:

  - You are about to drop the column `uid` on the `Hackathon` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unique_name]` on the table `Hackathon` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unique_name` to the `Hackathon` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Hackathon_uid_key";

-- AlterTable
ALTER TABLE "Hackathon" DROP COLUMN "uid",
ADD COLUMN     "unique_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_unique_name_key" ON "Hackathon"("unique_name");
