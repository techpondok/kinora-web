-- Existing support ticket contract used by Help, Bug Report, Feature Request, and Admin Tickets.

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'account_access', 'general')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'in_progress', 'needs_info', 'waiting_user', 'resolved', 'closed', 'rejected', 'duplicate')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  contact_email TEXT,
  contact_name TEXT,
  impact TEXT CHECK (impact IS NULL OR impact IN ('low', 'medium', 'high', 'critical')),
  steps_to_reproduce TEXT,
  expected_result TEXT,
  actual_result TEXT,
  platform TEXT,
  browser TEXT,
  page_url TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_type_idx ON public.support_tickets(type);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx ON public.ticket_messages(ticket_id);

CREATE OR REPLACE FUNCTION public.generate_ticket_number(p_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
BEGIN
  v_prefix := CASE p_type
    WHEN 'bug' THEN 'KNR-BUG'
    WHEN 'feature' THEN 'KNR-FT'
    ELSE 'KNR-TKT'
  END;

  RETURN v_prefix || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
END;
$$;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own support tickets" ON public.support_tickets;
CREATE POLICY "Users can create own support tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own support tickets" ON public.support_tickets;
CREATE POLICY "Users can read own support tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id OR is_kinora_admin());

DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;
CREATE POLICY "Admins can update support tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (is_kinora_admin())
WITH CHECK (is_kinora_admin());

DROP POLICY IF EXISTS "Admins can read ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins can read ticket messages"
ON public.ticket_messages
FOR SELECT
TO authenticated
USING (is_kinora_admin());

DROP POLICY IF EXISTS "Admins can create ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins can create ticket messages"
ON public.ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (is_kinora_admin() AND sender_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_number(TEXT) TO authenticated;
