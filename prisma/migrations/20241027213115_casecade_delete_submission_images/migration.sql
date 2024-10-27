-- DropForeignKey
ALTER TABLE "SubmissionImage" DROP CONSTRAINT "SubmissionImage_submission_id_fkey";

-- AddForeignKey
ALTER TABLE "SubmissionImage" ADD CONSTRAINT "SubmissionImage_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
