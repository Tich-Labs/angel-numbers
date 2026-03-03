-- Run this in Supabase SQL Editor

-- Create the angel_cache table
CREATE TABLE angel_cache (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  meanings TEXT[] NOT NULL,
  sources TEXT[],
  is_trusted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_angel_cache_number ON angel_cache(number);
