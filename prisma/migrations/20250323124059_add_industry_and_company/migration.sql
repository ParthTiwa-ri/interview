-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "company" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "industry" TEXT NOT NULL DEFAULT 'Technology';
