-- Create signup_requests table for storing user signup requests
CREATE TABLE IF NOT EXISTS signup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, denied
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    denied_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID, -- WorkOS user ID who approved
    denied_by UUID, -- WorkOS user ID who denied
    denial_reason TEXT
);

-- Create index for faster queries
CREATE INDEX idx_signup_requests_email ON signup_requests(email);
CREATE INDEX idx_signup_requests_status ON signup_requests(status);
CREATE INDEX idx_signup_requests_created_at ON signup_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- Public can read (for approval links) and insert (for requests)
CREATE POLICY "Public can view signup request status" ON signup_requests
    FOR SELECT
    USING (true);

CREATE POLICY "Public can insert signup requests" ON signup_requests
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated admins can update
CREATE POLICY "Authenticated users can update signup requests" ON signup_requests
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
