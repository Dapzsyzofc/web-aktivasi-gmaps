-- Aktivasi GMaps — Initial Schema
-- Tables: profiles, card_batches, businesses, cards, audit_logs

-- 1. Profiles (admin only for MVP)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Card Batches
CREATE TABLE IF NOT EXISTS card_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Businesses (UMKM)
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  google_maps_url text,
  contact_name text,
  contact_phone text,
  internal_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Cards
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES card_batches(id),
  inventory_code text NOT NULL UNIQUE,
  public_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'disabled')),
  business_id uuid REFERENCES businesses(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  disabled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_batch_id ON cards(batch_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_business_id ON cards(business_id);
CREATE INDEX idx_cards_public_token ON cards(public_token);

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 6. Enable RLS on all tables (default-deny)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies — admin access via service role on server
-- No direct client access to admin tables; all access goes through server with service role
-- Public read on cards for the redirect route (only public_token, status, business google_maps_url)

CREATE POLICY "Allow service role full access on profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on card_batches"
  ON card_batches FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on businesses"
  ON businesses FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on cards"
  ON cards FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on audit_logs"
  ON audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- 8. RPC for atomic card activation
CREATE OR REPLACE FUNCTION activate_card(
  p_card_id uuid,
  p_business_id uuid,
  p_actor_id uuid
) RETURNS void AS $$
DECLARE
  v_business_url text;
BEGIN
  SELECT google_maps_url INTO v_business_url FROM businesses WHERE id = p_business_id;
  IF v_business_url IS NULL OR v_business_url = '' THEN
    RAISE EXCEPTION 'Business must have a Google Maps URL before activation';
  END IF;

  UPDATE cards
  SET status = 'active',
      business_id = p_business_id,
      activated_at = now(),
      updated_at = now()
  WHERE id = p_card_id AND status IN ('inactive', 'disabled');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found or cannot be activated';
  END IF;

  INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, metadata)
  VALUES (
    p_actor_id,
    'card',
    p_card_id,
    'activated',
    jsonb_build_object('business_id', p_business_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
