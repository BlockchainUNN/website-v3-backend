-- CreateTable
CREATE TABLE "BootcampApplication" (
    "id" SERIAL NOT NULL,
    "FirstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "levelOfExperience" TEXT NOT NULL,
    "reasonForJoining" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "availability" TEXT,

    CONSTRAINT "BootcampApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BootcampApplication_email_key" ON "BootcampApplication"("email");
