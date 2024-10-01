/*
  Warnings:

  - Added the required column `hackathon_id` to the `Hacker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hacker" ADD COLUMN     "hackathon_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Hacker" ADD CONSTRAINT "Hacker_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
