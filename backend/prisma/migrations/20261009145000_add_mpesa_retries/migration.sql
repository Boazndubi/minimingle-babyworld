ALTER TABLE "Order"
ADD COLUMN "mpesaCheckoutRequestIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "mpesaAttemptStatus" TEXT,
ADD COLUMN "mpesaAttemptMessage" TEXT;
