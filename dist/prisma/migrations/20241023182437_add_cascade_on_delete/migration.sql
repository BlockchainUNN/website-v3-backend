-- DropForeignKey
ALTER TABLE "Hacker" DROP CONSTRAINT "Hacker_user_id_fkey";

-- AddForeignKey
ALTER TABLE "Hacker" ADD CONSTRAINT "Hacker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
