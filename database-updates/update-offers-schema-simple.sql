-- Update offers table to support new offer types
-- Run this script in Supabase SQL Editor

-- 1. Add offer_type column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'offer_type') THEN
        ALTER TABLE public.offers ADD COLUMN offer_type text;
    END IF;
END
$$;

-- 2. Add discount_type column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'discount_type') THEN
        ALTER TABLE public.offers ADD COLUMN discount_type text;
    END IF;
END
$$;

-- 3. Add discount_percentage column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'discount_percentage') THEN
        ALTER TABLE public.offers ADD COLUMN discount_percentage numeric;
    END IF;
END
$$;

-- 4. Add discount_amount column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.offers ADD COLUMN discount_amount numeric;
    END IF;
END
$$;

-- 5. Add buy_quantity column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'buy_quantity') THEN
        ALTER TABLE public.offers ADD COLUMN buy_quantity integer;
    END IF;
END
$$;

-- 6. Add linked_product_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'linked_product_id') THEN
        ALTER TABLE public.offers ADD COLUMN linked_product_id uuid REFERENCES public.products(id);
    END IF;
END
$$;

-- 7. Add get_product_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'get_product_id') THEN
        ALTER TABLE public.offers ADD COLUMN get_product_id uuid REFERENCES public.products(id);
    END IF;
END
$$;

-- 8. Add get_discount_type column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'get_discount_type') THEN
        ALTER TABLE public.offers ADD COLUMN get_discount_type text;
    END IF;
END
$$;

-- 9. Add get_discount_value column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'get_discount_value') THEN
        ALTER TABLE public.offers ADD COLUMN get_discount_value numeric;
    END IF;
END
$$;

-- 10. Remove old constraint if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'offers_offer_type_check') THEN
        ALTER TABLE public.offers DROP CONSTRAINT offers_offer_type_check;
    END IF;
END
$$;

-- 11. Add new constraint to allow three types
ALTER TABLE public.offers 
ADD CONSTRAINT offers_offer_type_check 
CHECK (offer_type IN ('discount', 'buy_get', 'product_discount'));

-- 12. Update existing data to set offer_type as 'discount' if null
UPDATE public.offers 
SET offer_type = 'discount' 
WHERE offer_type IS NULL;

-- 13. Update existing data to set discount_type
-- Check if discount_percent column exists, if not, just set default values
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'discount_percent') THEN
        -- If old discount_percent column exists, migrate the data
        UPDATE public.offers 
        SET discount_type = 'percentage',
            discount_percentage = discount_percent
        WHERE offer_type = 'discount' AND discount_type IS NULL;
    ELSE
        -- If old column doesn't exist, just set default discount_type
        UPDATE public.offers 
        SET discount_type = 'percentage'
        WHERE offer_type = 'discount' AND discount_type IS NULL;
    END IF;
END
$$;

-- 14. Make offer_type required
ALTER TABLE public.offers ALTER COLUMN offer_type SET NOT NULL;

-- 15. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_offer_type ON public.offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_linked_product_id ON public.offers(linked_product_id);
CREATE INDEX IF NOT EXISTS idx_offers_get_product_id ON public.offers(get_product_id);

-- Success message
SELECT 'Offers table updated successfully to support new offer types' as status;
