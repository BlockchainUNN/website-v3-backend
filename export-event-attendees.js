// export-event-attendees.js
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main(eventId) {
  try {
    // Validate eventId
    const id = parseInt(eventId);
    if (isNaN(id)) {
      throw new Error(
        "Please provide a valid event ID as a command-line argument."
      );
    }

    console.log(`⏳ Fetching attendees for event ID ${id}...`);

    // Fetch attendees for the specified event
    const attendees = await prisma.eventAttendee.findMany({
      where: { event_id: id },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attendees.length) {
      console.log(`⚠️ No attendees found for event ID ${id}.`);
      return;
    }

    // Flatten attendee data and registrationDetails JSON
    const rows = attendees.map((a) => {
      const reg = a.registrationDetails;

      console.log(reg["firstName"]);

      return {
        event_id: a.event.id,
        event_name: a.event.name,
        user_first_name: a.user.first_name,
        user_last_name: a.user.last_name,
        user_email: a.user.email,
        user_phone: a.user.phone_number || "",
        reg_first_name: reg.firstName || "",
        reg_last_name: reg.lastName || "",
        reg_email: reg.email || "",
        gender: reg.gender || "",
        student: reg.student || "",
        techCareer: reg.techCareer || "",
        phoneNumber: reg.phoneNumber || "",
        attendingFrom: reg.attendingFrom || "",
        expirenceLevel: reg.expirenceLevel || "",
        willParticipateInHackathon: reg.willParticipateInHackathon || "",
      };
    });

    // Convert to CSV
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const outputPath = `./event_${id}_attendees.csv`;
    writeFileSync(outputPath, csvContent, "utf8");

    console.log(`✅ Export complete! Saved to ${outputPath}`);
  } catch (error) {
    console.error("❌ Error exporting attendees:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get event ID from command-line argument
const eventId = process.argv[2];
if (!eventId) {
  console.error(
    "❌ Please provide an event ID. Usage: node export-event-attendees.js <event_id>"
  );
  process.exit(1);
}

main(eventId);
