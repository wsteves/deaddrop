-- Vercel Postgres Schema
-- Run this in your Vercel Postgres database

CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  type VARCHAR(100),
  size INTEGER,
  signature TEXT,
  uploaded_by VARCHAR(255),
  signed_message TEXT,
  encrypted BOOLEAN DEFAULT FALSE,
  storage_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uploads_created_at ON uploads(created_at DESC);
CREATE INDEX idx_uploads_uploaded_by ON uploads(uploaded_by);
