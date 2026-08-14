-- ============================================================
-- Comment Moderation RLS + RPC
-- ============================================================
-- Uses existing is_kinora_admin() function for authorization.
-- Adds secure RPC for moderation actions (bypasses RLS safely).
-- ============================================================

-- Ensure RLS is enabled
ALTER TABLE kinora_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. Admin SELECT policy (read all comments for moderation)
-- ============================================================
DROP POLICY IF EXISTS "Admins can read all comments" ON kinora_comments;
CREATE POLICY "Admins can read all comments"
  ON kinora_comments FOR SELECT
  TO authenticated
  USING (is_kinora_admin());

-- ============================================================
-- 2. User SELECT policy (read published comments)
-- ============================================================
DROP POLICY IF EXISTS "Users can read published comments" ON kinora_comments;
CREATE POLICY "Users can read published comments"
  ON kinora_comments FOR SELECT
  TO authenticated
  USING (
    status IN ('published', 'active', 'approved', 'visible')
    OR status IS NULL
    OR user_id = auth.uid()
  );

-- ============================================================
-- 3. User INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own comments" ON kinora_comments;
CREATE POLICY "Users can insert own comments"
  ON kinora_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. User UPDATE own comments (body/is_edited only via app)
-- ============================================================
DROP POLICY IF EXISTS "Users can update own comments" ON kinora_comments;
CREATE POLICY "Users can update own comments"
  ON kinora_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. User DELETE own comments
-- ============================================================
DROP POLICY IF EXISTS "Users can delete own comments" ON kinora_comments;
CREATE POLICY "Users can delete own comments"
  ON kinora_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Secure Moderation RPC (SECURITY DEFINER — bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.moderate_kinora_comment(
  p_comment_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Authorization check
  IF NOT public.is_kinora_admin() THEN
    RAISE EXCEPTION 'Not authorized: admin/founder role required';
  END IF;

  -- Validate status
  IF p_status NOT IN ('published', 'hidden', 'rejected', 'deleted') THEN
    RAISE EXCEPTION 'Invalid moderation status: %', p_status;
  END IF;

  -- Perform the update
  IF p_status = 'deleted' THEN
    -- Soft delete: clear body
    UPDATE kinora_comments
    SET
      status = 'deleted',
      body = '',
      updated_at = now()
    WHERE id = p_comment_id;
  ELSE
    UPDATE kinora_comments
    SET
      status = p_status,
      updated_at = now()
    WHERE id = p_comment_id;
  END IF;

  -- Return result
  SELECT json_build_object(
    'success', true,
    'comment_id', p_comment_id,
    'new_status', p_status,
    'moderated_by', auth.uid()
  ) INTO v_result;

  RETURN v_result;
END;
$$;
