-- ============================================================
-- WEBINAR 3-TIER PRICING: FREE EARLY BIRD + EARLY PRICE + NORMAL
-- Atomic server-side pricing with concurrency protection
-- ============================================================

-- ─── 1. ADD PRICING COLUMNS TO kinora_webinars ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'pricing_strategy') THEN
    ALTER TABLE kinora_webinars ADD COLUMN pricing_strategy TEXT DEFAULT 'fixed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'free_early_bird_enabled') THEN
    ALTER TABLE kinora_webinars ADD COLUMN free_early_bird_enabled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'free_early_bird_quota') THEN
    ALTER TABLE kinora_webinars ADD COLUMN free_early_bird_quota INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'early_price_enabled') THEN
    ALTER TABLE kinora_webinars ADD COLUMN early_price_enabled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'early_price_amount') THEN
    ALTER TABLE kinora_webinars ADD COLUMN early_price_amount NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'early_price_quota') THEN
    ALTER TABLE kinora_webinars ADD COLUMN early_price_quota INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'early_price_start') THEN
    ALTER TABLE kinora_webinars ADD COLUMN early_price_start TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'early_price_end') THEN
    ALTER TABLE kinora_webinars ADD COLUMN early_price_end TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'normal_price_amount') THEN
    ALTER TABLE kinora_webinars ADD COLUMN normal_price_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

-- ─── 2. ADD PRICING COLUMNS TO kinora_webinar_registrations ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinar_registrations' AND column_name = 'pricing_type') THEN
    ALTER TABLE kinora_webinar_registrations ADD COLUMN pricing_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinar_registrations' AND column_name = 'original_price') THEN
    ALTER TABLE kinora_webinar_registrations ADD COLUMN original_price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinar_registrations' AND column_name = 'final_price') THEN
    ALTER TABLE kinora_webinar_registrations ADD COLUMN final_price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinar_registrations' AND column_name = 'tier_position') THEN
    ALTER TABLE kinora_webinar_registrations ADD COLUMN tier_position INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinar_registrations' AND column_name = 'reservation_expires_at') THEN
    ALTER TABLE kinora_webinar_registrations ADD COLUMN reservation_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinar_registrations' AND column_name = 'payment_id') THEN
    ALTER TABLE kinora_webinar_registrations ADD COLUMN payment_id UUID;
  END IF;
END $$;

-- ─── 3. ATOMIC PRICING RESOLVER (concurrency-safe) ───
CREATE OR REPLACE FUNCTION resolve_webinar_pricing(
  p_webinar_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webinar RECORD;
  v_free_used INTEGER;
  v_early_used INTEGER;
  v_existing RECORD;
  v_pricing_type TEXT;
  v_final_price NUMERIC;
  v_position INTEGER;
  v_early_active BOOLEAN;
BEGIN
  -- Lock the webinar row to prevent race conditions
  SELECT * INTO v_webinar
  FROM kinora_webinars
  WHERE id = p_webinar_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Webinar not found');
  END IF;

  -- Check duplicate registration
  SELECT * INTO v_existing
  FROM kinora_webinar_registrations
  WHERE webinar_id = p_webinar_id
    AND user_id = p_user_id
    AND status NOT IN ('cancelled', 'rejected', 'expired')
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'already_registered', 'registration_id', v_existing.id, 'status', v_existing.status);
  END IF;

  -- If not tiered pricing, return fixed price
  IF v_webinar.pricing_strategy != 'tiered' THEN
    v_final_price := COALESCE(v_webinar.ticket_price, v_webinar.price_amount, v_webinar.normal_price_amount, 0);
    IF v_final_price = 0 AND v_webinar.is_free THEN
      RETURN jsonb_build_object(
        'pricing_type', 'FREE',
        'original_price', 0,
        'final_price', 0
      );
    END IF;
    RETURN jsonb_build_object(
      'pricing_type', 'NORMAL',
      'original_price', v_final_price,
      'final_price', v_final_price
    );
  END IF;

  -- Count confirmed FREE allocations (not cancelled/expired)
  SELECT COUNT(*) INTO v_free_used
  FROM kinora_webinar_registrations
  WHERE webinar_id = p_webinar_id
    AND pricing_type = 'FREE_EARLY_BIRD'
    AND status NOT IN ('cancelled', 'rejected', 'expired');

  -- Count confirmed/pending EARLY allocations
  SELECT COUNT(*) INTO v_early_used
  FROM kinora_webinar_registrations
  WHERE webinar_id = p_webinar_id
    AND pricing_type = 'EARLY_PRICE'
    AND status NOT IN ('cancelled', 'rejected', 'expired')
    AND (reservation_expires_at IS NULL OR reservation_expires_at > now());

  -- Check early price period
  v_early_active := v_webinar.early_price_enabled
    AND (v_webinar.early_price_start IS NULL OR v_webinar.early_price_start <= now())
    AND (v_webinar.early_price_end IS NULL OR v_webinar.early_price_end >= now());

  -- TIER 1: FREE EARLY BIRD
  IF v_webinar.free_early_bird_enabled AND v_free_used < v_webinar.free_early_bird_quota THEN
    v_pricing_type := 'FREE_EARLY_BIRD';
    v_final_price := 0;
    v_position := v_free_used + 1;

    RETURN jsonb_build_object(
      'pricing_type', v_pricing_type,
      'original_price', COALESCE(v_webinar.normal_price_amount, 0),
      'final_price', v_final_price,
      'free_early_bird_position', v_position,
      'early_price_position', NULL,
      'quota_remaining', v_webinar.free_early_bird_quota - v_free_used - 1
    );
  END IF;

  -- TIER 2: EARLY PRICE
  IF v_early_active AND v_early_used < v_webinar.early_price_quota THEN
    v_pricing_type := 'EARLY_PRICE';
    v_final_price := v_webinar.early_price_amount;
    v_position := v_early_used + 1;

    RETURN jsonb_build_object(
      'pricing_type', v_pricing_type,
      'original_price', COALESCE(v_webinar.normal_price_amount, 0),
      'final_price', v_final_price,
      'free_early_bird_position', NULL,
      'early_price_position', v_position,
      'quota_remaining', v_webinar.early_price_quota - v_early_used - 1
    );
  END IF;

  -- TIER 3: NORMAL
  v_pricing_type := 'NORMAL';
  v_final_price := COALESCE(v_webinar.normal_price_amount, v_webinar.ticket_price, v_webinar.price_amount, 0);

  RETURN jsonb_build_object(
    'pricing_type', v_pricing_type,
    'original_price', v_final_price,
    'final_price', v_final_price,
    'free_early_bird_position', NULL,
    'early_price_position', NULL,
    'quota_remaining', NULL
  );
END;
$$;

-- ─── 4. ATOMIC REGISTRATION ALLOCATOR ───
CREATE OR REPLACE FUNCTION allocate_webinar_registration(
  p_webinar_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pricing JSONB;
  v_pricing_type TEXT;
  v_final_price NUMERIC;
  v_position INTEGER;
  v_reg_id UUID;
  v_status TEXT;
  v_reservation_expires TIMESTAMPTZ;
BEGIN
  -- Resolve pricing (this locks the webinar row)
  v_pricing := resolve_webinar_pricing(p_webinar_id, p_user_id);

  -- Check for errors
  IF v_pricing ? 'error' THEN
    RETURN v_pricing;
  END IF;

  v_pricing_type := v_pricing->>'pricing_type';
  v_final_price := (v_pricing->>'final_price')::NUMERIC;
  v_position := COALESCE((v_pricing->>'free_early_bird_position')::INTEGER, (v_pricing->>'early_price_position')::INTEGER);

  -- Determine status based on pricing type
  IF v_pricing_type = 'FREE_EARLY_BIRD' THEN
    v_status := 'approved';
    v_reservation_expires := NULL;
  ELSE
    v_status := 'pending';
    v_reservation_expires := now() + interval '15 minutes';
  END IF;

  -- Insert registration
  INSERT INTO kinora_webinar_registrations (
    webinar_id, user_id, status,
    pricing_type, original_price, final_price, tier_position,
    reservation_expires_at, registered_at
  ) VALUES (
    p_webinar_id, p_user_id, v_status,
    v_pricing_type, (v_pricing->>'original_price')::NUMERIC, v_final_price, v_position,
    v_reservation_expires, now()
  )
  RETURNING id INTO v_reg_id;

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_reg_id,
    'pricing_type', v_pricing_type,
    'original_price', (v_pricing->>'original_price')::NUMERIC,
    'final_price', v_final_price,
    'position', v_position,
    'status', v_status,
    'requires_payment', v_final_price > 0,
    'reservation_expires_at', v_reservation_expires
  );
END;
$$;

-- ─── 5. RELEASE EXPIRED RESERVATIONS ───
CREATE OR REPLACE FUNCTION release_expired_webinar_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE kinora_webinar_registrations
  SET status = 'expired'
  WHERE status = 'pending'
    AND reservation_expires_at IS NOT NULL
    AND reservation_expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─── 6. GET WEBINAR PRICING STATUS (for frontend display) ───
CREATE OR REPLACE FUNCTION get_webinar_pricing_status(p_webinar_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webinar RECORD;
  v_free_used INTEGER;
  v_early_used INTEGER;
  v_normal_count INTEGER;
  v_early_active BOOLEAN;
BEGIN
  SELECT * INTO v_webinar FROM kinora_webinars WHERE id = p_webinar_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;

  IF v_webinar.pricing_strategy != 'tiered' THEN
    RETURN jsonb_build_object(
      'strategy', 'fixed',
      'price', COALESCE(v_webinar.ticket_price, v_webinar.price_amount, v_webinar.normal_price_amount, 0),
      'is_free', v_webinar.is_free
    );
  END IF;

  SELECT COUNT(*) INTO v_free_used FROM kinora_webinar_registrations
  WHERE webinar_id = p_webinar_id AND pricing_type = 'FREE_EARLY_BIRD'
    AND status NOT IN ('cancelled', 'rejected', 'expired');

  SELECT COUNT(*) INTO v_early_used FROM kinora_webinar_registrations
  WHERE webinar_id = p_webinar_id AND pricing_type = 'EARLY_PRICE'
    AND status NOT IN ('cancelled', 'rejected', 'expired')
    AND (reservation_expires_at IS NULL OR reservation_expires_at > now());

  SELECT COUNT(*) INTO v_normal_count FROM kinora_webinar_registrations
  WHERE webinar_id = p_webinar_id AND pricing_type = 'NORMAL'
    AND status NOT IN ('cancelled', 'rejected', 'expired');

  v_early_active := v_webinar.early_price_enabled
    AND (v_webinar.early_price_start IS NULL OR v_webinar.early_price_start <= now())
    AND (v_webinar.early_price_end IS NULL OR v_webinar.early_price_end >= now());

  RETURN jsonb_build_object(
    'strategy', 'tiered',
    'free_early_bird', jsonb_build_object(
      'enabled', v_webinar.free_early_bird_enabled,
      'quota', v_webinar.free_early_bird_quota,
      'used', v_free_used,
      'remaining', GREATEST(v_webinar.free_early_bird_quota - v_free_used, 0)
    ),
    'early_price', jsonb_build_object(
      'enabled', v_webinar.early_price_enabled,
      'active', v_early_active,
      'price', v_webinar.early_price_amount,
      'quota', v_webinar.early_price_quota,
      'used', v_early_used,
      'remaining', GREATEST(v_webinar.early_price_quota - v_early_used, 0),
      'start', v_webinar.early_price_start,
      'end_at', v_webinar.early_price_end
    ),
    'normal_price', jsonb_build_object(
      'price', COALESCE(v_webinar.normal_price_amount, v_webinar.ticket_price, v_webinar.price_amount, 0),
      'registered', v_normal_count
    ),
    'current_tier',
      CASE
        WHEN v_webinar.free_early_bird_enabled AND v_free_used < v_webinar.free_early_bird_quota THEN 'FREE_EARLY_BIRD'
        WHEN v_early_active AND v_early_used < v_webinar.early_price_quota THEN 'EARLY_PRICE'
        ELSE 'NORMAL'
      END
  );
END;
$$;
