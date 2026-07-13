-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('OCCUPIED', 'VACANT', 'CHECKOUT', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'APPLIANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('ACCOMMODATION', 'MINIBAR', 'LAUNDRY', 'SERVICE_CHARGE', 'OTHER');

-- AlterEnum RoomStatus: BLOCKED → OUT_OF_SERVICE
BEGIN;
CREATE TYPE "RoomStatus_new" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE');
ALTER TABLE "Room" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Room" ALTER COLUMN "status" TYPE "RoomStatus_new" USING ("status"::text::"RoomStatus_new");
ALTER TYPE "RoomStatus" RENAME TO "RoomStatus_old";
ALTER TYPE "RoomStatus_new" RENAME TO "RoomStatus";
DROP TYPE "RoomStatus_old";
ALTER TABLE "Room" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterEnum MaintenancePriority: URGENT/NORMAL → CRITICAL/MEDIUM
BEGIN;
CREATE TYPE "MaintenancePriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
ALTER TABLE "MaintenanceIssue" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "MaintenanceIssue" ALTER COLUMN "priority" TYPE "MaintenancePriority_new" USING ("priority"::text::"MaintenancePriority_new");
ALTER TYPE "MaintenancePriority" RENAME TO "MaintenancePriority_old";
ALTER TYPE "MaintenancePriority_new" RENAME TO "MaintenancePriority";
DROP TYPE "MaintenancePriority_old";
ALTER TABLE "MaintenanceIssue" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';
COMMIT;

-- AlterEnum MaintenanceStatus: OPEN → REPORTED, add CLOSED
BEGIN;
CREATE TYPE "MaintenanceStatus_new" AS ENUM ('REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
ALTER TABLE "MaintenanceIssue" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MaintenanceIssue" ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING ("status"::text::"MaintenanceStatus_new");
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "MaintenanceStatus_old";
ALTER TABLE "MaintenanceIssue" ALTER COLUMN "status" SET DEFAULT 'REPORTED';
COMMIT;

-- AlterEnum PaymentMethod: BANK_TRANSFER → TRANSFER, add POS
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'POS', 'ONLINE');
ALTER TABLE "IncomeRecord" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- DropIndex
DROP INDEX "DailyReport_propertyId_reportDate_key";

-- AlterTable User: add phone and lastLoginAt
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "phone" TEXT;

-- AlterTable Room: baseRate → dailyRate, add amenities
ALTER TABLE "Room" ADD COLUMN "amenities" JSONB,
ADD COLUMN "dailyRate" DOUBLE PRECISION;
UPDATE "Room" SET "dailyRate" = 0 WHERE "dailyRate" IS NULL;
ALTER TABLE "Room" ALTER COLUMN "dailyRate" SET NOT NULL,
ALTER COLUMN "dailyRate" SET DEFAULT 0;
ALTER TABLE "Room" DROP COLUMN "baseRate";

-- AlterTable DailyReport: per-room model
-- Add new columns as nullable first
ALTER TABLE "DailyReport" ADD COLUMN "guestCount" INTEGER DEFAULT 1,
ADD COLUMN "guestName" TEXT,
ADD COLUMN "occupancyStatus" "OccupancyStatus" DEFAULT 'VACANT',
ADD COLUMN "roomId" TEXT;

-- Link existing reports to the first room in their property
UPDATE "DailyReport" dr
SET "roomId" = (
  SELECT r.id FROM "Room" r
  JOIN "Area" a ON r."areaId" = a.id
  WHERE a."propertyId" = dr."propertyId"
  AND r."active" = true
  LIMIT 1
)
WHERE dr."roomId" IS NULL;

-- Drop old columns
ALTER TABLE "DailyReport" DROP COLUMN "occupancy",
DROP COLUMN "supplies";

-- Set NOT NULL constraints
ALTER TABLE "DailyReport" ALTER COLUMN "guestCount" SET NOT NULL,
ALTER COLUMN "guestCount" SET DEFAULT 1,
ALTER COLUMN "occupancyStatus" SET NOT NULL,
ALTER COLUMN "roomId" SET NOT NULL;

-- AlterTable MaintenanceIssue: add category, assignedTo
ALTER TABLE "MaintenanceIssue" ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "category" "MaintenanceCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM',
ALTER COLUMN "status" SET DEFAULT 'REPORTED';

-- AlterTable IncomeRecord: source, recordDate, propertyId, reference, verified
-- Add new columns as nullable first
ALTER TABLE "IncomeRecord" ADD COLUMN "propertyId" TEXT,
ADD COLUMN "recordDate" TIMESTAMP(3),
ADD COLUMN "reference" TEXT,
ADD COLUMN "source" "IncomeSource" DEFAULT 'ACCOMMODATION',
ADD COLUMN "verified" BOOLEAN DEFAULT false;

-- Backfill propertyId from room→area→property chain
UPDATE "IncomeRecord" ir
SET "propertyId" = (
  SELECT a."propertyId" FROM "Room" r
  JOIN "Area" a ON r."areaId" = a.id
  WHERE r.id = ir."roomId"
  LIMIT 1
)
WHERE ir."propertyId" IS NULL;

-- Backfill recordDate from createdAt
UPDATE "IncomeRecord" SET "recordDate" = "createdAt" WHERE "recordDate" IS NULL;

-- Backfill source from bookingSource (map old values)
UPDATE "IncomeRecord" SET "source" = 'ACCOMMODATION' WHERE "source" IS NULL;

-- Drop old columns
ALTER TABLE "IncomeRecord" DROP COLUMN "bookingSource",
DROP COLUMN "checkInDate",
DROP COLUMN "checkOutDate";

-- Set NOT NULL constraints
ALTER TABLE "IncomeRecord" ALTER COLUMN "propertyId" SET NOT NULL,
ALTER COLUMN "recordDate" SET NOT NULL,
ALTER COLUMN "source" SET NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'ACCOMMODATION',
ALTER COLUMN "verified" SET NOT NULL,
ALTER COLUMN "verified" SET DEFAULT false;

-- DropEnum
DROP TYPE "BookingSource";

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_roomId_reportDate_key" ON "DailyReport"("roomId", "reportDate");

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceIssue" ADD CONSTRAINT "MaintenanceIssue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
