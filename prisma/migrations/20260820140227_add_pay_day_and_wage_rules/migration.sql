-- AlterTable
ALTER TABLE "Workplace" ADD COLUMN     "payDay" INTEGER NOT NULL DEFAULT 25;

-- CreateTable
CREATE TABLE "WageRule" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "workplaceId" TEXT NOT NULL,

    CONSTRAINT "WageRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WageRule_workplaceId_idx" ON "WageRule"("workplaceId");

-- AddForeignKey
ALTER TABLE "WageRule" ADD CONSTRAINT "WageRule_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
