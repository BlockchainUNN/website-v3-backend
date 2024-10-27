-- DropForeignKey
ALTER TABLE "EventAttendee" DROP CONSTRAINT "EventAttendee_attendee_id_fkey";

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
