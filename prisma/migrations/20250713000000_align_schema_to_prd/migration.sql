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
ALTER TABLE "Room" DROP COLUMN "baseRate",
ADD COLUMN "amenities" JSONB,
ADD COLUMN "dailyRate" DOUBLE PRECISION NOT NULL;

-- AlterTable DailyReport: per-room model
ALTER TABLE "DailyReport" DROP COLUMN "occupancy",
DROP COLUMN "supplies",
ADD COLUMN "guestCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "guestName" TEXT,
ADD COLUMN "occupancyStatus" "OccupancyStatus" NOT NULL,
ADD COLUMN "roomId" TEXT NOT NULL;

-- AlterTable MaintenanceIssue: add category, assignedTo
ALTER TABLE "MaintenanceIssue" ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "category" "MaintenanceCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM',
ALTER COLUMN "status" SET DEFAULT 'REPORTED';

-- AlterTable IncomeRecord: source, recordDate, propertyId, reference, verified
ALTER TABLE "IncomeRecord" DROP COLUMN "bookingSource",
DROP COLUMN "checkInDate",
DROP COLUMN "checkOutDate",
ADD COLUMN "propertyId" TEXT NOT NULL,
ADD COLUMN "recordDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN "reference" TEXT,
ADD COLUMN "source" "IncomeSource" NOT NULL DEFAULT 'ACCOMMODATION',
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

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
