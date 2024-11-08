-- AlterTable
ALTER TABLE "BootcampApplication" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "student" TEXT,
ALTER COLUMN "reasonForJoining" DROP NOT NULL;
