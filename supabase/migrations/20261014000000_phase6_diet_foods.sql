-- Phase 6 Migration: Diet Foods Catalogue and Personal Meal Planning
-- Follows docs/08-database.md (Section 10 & 11) and docs/06-content-spec.md

-- 1. Table: public.foods (Curated Food Catalogue)
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  food_form TEXT,
  dietary_preference TEXT NOT NULL DEFAULT 'vegetarian' CHECK (dietary_preference IN ('vegetarian', 'egg', 'non_vegetarian')),
  meal_types TEXT[] NOT NULL DEFAULT '{}',
  reference_quantity NUMERIC NOT NULL CHECK (reference_quantity > 0),
  reference_unit TEXT NOT NULL CHECK (reference_unit IN ('g', 'ml', 'serving', 'piece')),
  energy_kcal NUMERIC CHECK (energy_kcal IS NULL OR energy_kcal >= 0),
  protein_g NUMERIC CHECK (protein_g IS NULL OR protein_g >= 0),
  carbohydrates_g NUMERIC CHECK (carbohydrates_g IS NULL OR carbohydrates_g >= 0),
  fat_g NUMERIC CHECK (fat_g IS NULL OR fat_g >= 0),
  fibre_g NUMERIC CHECK (fibre_g IS NULL OR fibre_g >= 0),
  source_name TEXT NOT NULL CHECK (source_name IN ('IFCT_2017', 'USDA_FDC')),
  source_record_id TEXT,
  source_reference TEXT NOT NULL,
  source_url TEXT,
  match_status TEXT NOT NULL DEFAULT 'exact' CHECK (match_status IN ('exact', 'approximate', 'needs_review')),
  value_method TEXT NOT NULL DEFAULT 'source' CHECK (value_method IN ('source', 'calculated')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- 2. Table: public.meal_plans (User-Owned Meal Plans)
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100),
  target_kcal NUMERIC CHECK (target_kcal IS NULL OR (target_kcal >= 500 AND target_kcal <= 10000)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_meal_plans_id_user UNIQUE (id, user_id)
);

-- 3. Table: public.meal_plan_items (Food Selections Within a Meal Plan)
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0 AND quantity <= 5000),
  quantity_unit TEXT NOT NULL CHECK (quantity_unit IN ('g', 'ml', 'serving', 'piece')),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT fk_meal_plan_items_plan_owner FOREIGN KEY (meal_plan_id, user_id) REFERENCES public.meal_plans(id, user_id) ON DELETE CASCADE
);

-- 4. Indexes for Query Performance and Foreign Keys
CREATE INDEX IF NOT EXISTS idx_foods_active_category ON public.foods (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_foods_active_dietary ON public.foods (dietary_preference) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_foods_active_name ON public.foods (name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON public.meal_plans (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan_sort ON public.meal_plan_items (meal_plan_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_user ON public.meal_plan_items (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_food ON public.meal_plan_items (food_id);

-- 5. Updated_at Triggers
CREATE TRIGGER on_foods_updated
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_meal_plans_updated
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_meal_plan_items_updated
  BEFORE UPDATE ON public.meal_plan_items
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 6. Permissions & Grants (Least Privilege)
REVOKE ALL ON public.foods FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.meal_plans FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.meal_plan_items FROM PUBLIC, anon, authenticated;

-- Foods: Read-only for anon and authenticated users
GRANT SELECT ON public.foods TO anon, authenticated;
GRANT ALL ON public.foods TO postgres, service_role;

-- Meal Plans & Items: Full CRUD for authenticated users (owner scoped via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO authenticated;
GRANT ALL ON public.meal_plans TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_items TO authenticated;
GRANT ALL ON public.meal_plan_items TO postgres, service_role;

-- 7. Row Level Security (RLS)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

-- Foods RLS Policies
CREATE POLICY "Anyone can view active foods" ON public.foods
  FOR SELECT USING (is_active = true);

-- Meal Plans RLS Policies
CREATE POLICY "Users can view own meal plans" ON public.meal_plans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON public.meal_plans
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON public.meal_plans
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Meal Plan Items RLS Policies
CREATE POLICY "Users can view own meal plan items" ON public.meal_plan_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan items" ON public.meal_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan items" ON public.meal_plan_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plan items" ON public.meal_plan_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 8. Seed Verified Food Catalogue (IFCT 2017 & USDA FoodData Central)
INSERT INTO public.foods (
  id, name, description, category, food_form, dietary_preference, meal_types,
  reference_quantity, reference_unit, energy_kcal, protein_g, carbohydrates_g, fat_g, fibre_g,
  source_name, source_record_id, source_reference, source_url, match_status, value_method, is_active
) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Cooked White Rice (Ponni)', 'Boiled polished white rice, common Tamil Nadu staple grain.', 'grains_cereals', 'cooked', 'vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 130, 2.7, 28.2, 0.3, 0.4, 'IFCT_2017', 'IFCT:A006', 'Indian Food Composition Tables 2017, ICMR-NIN, Table A: Cereal and Millets (Cooked Rice)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000002', 'Cooked Parboiled Rice (Puzhungal Arisi)', 'Boiled parboiled rice with higher retained micronutrients, customary in South India.', 'grains_cereals', 'cooked', 'vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 123, 2.7, 26.8, 0.4, 0.9, 'IFCT_2017', 'IFCT:A008', 'Indian Food Composition Tables 2017, ICMR-NIN, Table A: Parboiled Rice cooked', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000003', 'Chapati / Whole Wheat Roti', 'Dry roasted unleavened flatbread prepared from stone-ground whole wheat atta without oil.', 'grains_cereals', 'cooked', 'vegetarian', ARRAY['breakfast', 'lunch', 'dinner'], 100, 'g', 275, 9.1, 54.4, 2.1, 7.5, 'IFCT_2017', 'IFCT:A025', 'Indian Food Composition Tables 2017, ICMR-NIN, Table A: Wheat bread/roti', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000004', 'Rava Upma', 'Steamed semolina porridge tempered with mustard seeds, curry leaves, and ginger.', 'grains_cereals', 'cooked', 'vegetarian', ARRAY['breakfast', 'dinner'], 100, 'g', 148, 3.4, 24.6, 4.0, 1.3, 'IFCT_2017', 'IFCT:CookedDishes-012', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes Section (Upma)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000005', 'Idli', 'Traditional steamed cakes made from naturally fermented rice and dehulled black gram batter.', 'prepared_dishes', 'steamed', 'vegetarian', ARRAY['breakfast', 'dinner'], 100, 'g', 132, 4.2, 27.5, 0.6, 1.5, 'IFCT_2017', 'IFCT:CookedDishes-004', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Idli, fermented and steamed)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000006', 'Plain Dosa (Sada Dosa)', 'Crispy pan-griddled pancake made from fermented rice and black gram batter with light oil.', 'prepared_dishes', 'cooked', 'vegetarian', ARRAY['breakfast', 'dinner'], 100, 'g', 168, 3.9, 29.0, 3.7, 1.2, 'IFCT_2017', 'IFCT:CookedDishes-005', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Dosa, plain)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000007', 'Cooked Toor Dal (Paruppu)', 'Boiled and seasoned pigeon pea dal, traditional Tamil Nadu protein staple.', 'pulses_legumes', 'cooked', 'vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 108, 7.2, 16.5, 1.2, 4.2, 'IFCT_2017', 'IFCT:B005', 'Indian Food Composition Tables 2017, ICMR-NIN, Table B: Grain Legumes (Pigeon pea, cooked)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000008', 'Cooked Sambar', 'South Indian lentil stew simmered with pigeon pea dal, mixed vegetables, tamarind, and sambar masala.', 'prepared_dishes', 'cooked', 'vegetarian', ARRAY['breakfast', 'lunch', 'dinner'], 100, 'g', 75, 2.8, 11.2, 1.8, 2.2, 'IFCT_2017', 'IFCT:CookedDishes-008', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Sambar)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000009', 'Boiled Chana / Chickpea Sundal', 'Boiled white chickpeas lightly tempered with mustard seeds and shredded coconut.', 'pulses_legumes', 'cooked', 'vegetarian', ARRAY['snack', 'breakfast'], 100, 'g', 164, 8.9, 27.4, 2.6, 7.6, 'IFCT_2017', 'IFCT:B001', 'Indian Food Composition Tables 2017, ICMR-NIN, Table B: Bengal gram, whole cooked', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000010', 'Tomato Rasam', 'Traditional spiced tamarind and tomato soup with black pepper and cumin.', 'prepared_dishes', 'cooked', 'vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 32, 0.8, 5.4, 0.7, 0.5, 'IFCT_2017', 'IFCT:CookedDishes-009', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Rasam)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000011', 'Cabbage Poriyal', 'Shredded cabbage stir-fried with mustard, green chilies, and a small quantity of fresh coconut.', 'vegetables', 'cooked', 'vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 68, 1.8, 6.5, 3.8, 2.8, 'IFCT_2017', 'IFCT:CookedDishes-015', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Cabbage poriyal approximate)', 'http://www.ifct2017.com/', 'approximate', 'source', true),
  ('f1000000-0000-0000-0000-000000000012', 'Cooked Keerai (Spinach Poriyal / Masiyal)', 'Fresh amaranth/spinach greens cooked and lightly seasoned with garlic and cumin.', 'vegetables', 'cooked', 'vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 45, 2.9, 5.1, 1.3, 3.4, 'IFCT_2017', 'IFCT:C001', 'Indian Food Composition Tables 2017, ICMR-NIN, Table C: Green Leafy Vegetables (Cooked greens)', 'http://www.ifct2017.com/', 'approximate', 'source', true),
  ('f1000000-0000-0000-0000-000000000013', 'Curd / Plain Yogurt (Cow Milk Dahi)', 'Freshly cultured curd made from cow milk, staple cooling food in Tamil Nadu.', 'dairy', 'raw', 'vegetarian', ARRAY['breakfast', 'lunch', 'dinner'], 100, 'g', 60, 3.1, 4.0, 3.5, 0.0, 'IFCT_2017', 'IFCT:G002', 'Indian Food Composition Tables 2017, ICMR-NIN, Table G: Milk and Milk Products (Cow milk curd)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000014', 'Boiled Cow Milk (Whole)', 'Fresh boiled whole cow milk.', 'dairy', 'boiled', 'vegetarian', ARRAY['breakfast', 'snack'], 100, 'ml', 67, 3.2, 4.8, 3.9, 0.0, 'IFCT_2017', 'IFCT:G001', 'Indian Food Composition Tables 2017, ICMR-NIN, Table G: Cow milk whole', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000015', 'Paneer (Indian Cottage Cheese)', 'Fresh acid-set cheese made from curdled milk, rich in vegetarian protein and fat.', 'dairy', 'raw', 'vegetarian', ARRAY['lunch', 'dinner', 'snack'], 100, 'g', 265, 18.3, 3.2, 20.8, 0.0, 'IFCT_2017', 'IFCT:G006', 'Indian Food Composition Tables 2017, ICMR-NIN, Table G: Paneer', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000016', 'Whole Boiled Egg', 'Hard-boiled whole chicken egg with yolk and white.', 'eggs', 'boiled', 'egg', ARRAY['breakfast', 'snack', 'dinner'], 100, 'g', 155, 12.6, 1.1, 10.6, 0.0, 'IFCT_2017', 'IFCT:J001', 'Indian Food Composition Tables 2017, ICMR-NIN, Table J: Egg, whole, boiled', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000017', 'Boiled Egg White', 'Hard-boiled egg albumen without yolk, pure lean protein source.', 'eggs', 'boiled', 'egg', ARRAY['breakfast', 'snack', 'dinner'], 100, 'g', 52, 10.9, 0.7, 0.2, 0.0, 'USDA_FDC', 'FDC:172183', 'USDA FoodData Central, FDC ID 172183: Egg, white, cooked, hard-boiled', 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/172183/nutrients', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000018', 'Cooked Chicken Breast (Skinless)', 'Skinless chicken breast cooked plain without added fats, primary lean meat source.', 'poultry_meat', 'cooked', 'non_vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 165, 31.0, 0.0, 3.6, 0.0, 'USDA_FDC', 'FDC:171077', 'USDA FoodData Central, FDC ID 171077: Chicken, broiler or fryers, breast, meat only, cooked', 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/171077/nutrients', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000019', 'South Indian Fish Curry (Meen Kulambu)', 'Marine/freshwater fish simmered in a spicy tamarind and tomato gravy with fenugreek.', 'seafood', 'cooked', 'non_vegetarian', ARRAY['lunch', 'dinner'], 100, 'g', 115, 14.5, 3.2, 4.8, 0.6, 'IFCT_2017', 'IFCT:CookedDishes-021', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Fish curry approximate)', 'http://www.ifct2017.com/', 'approximate', 'source', true),
  ('f1000000-0000-0000-0000-000000000020', 'Banana (Poovan / Cavendish)', 'Fresh ripe banana, universally consumed breakfast fruit and workout fuel in Tamil Nadu.', 'fruits', 'raw', 'vegetarian', ARRAY['breakfast', 'snack'], 100, 'g', 89, 1.1, 22.8, 0.3, 2.6, 'IFCT_2017', 'IFCT:E004', 'Indian Food Composition Tables 2017, ICMR-NIN, Table E: Fruits (Banana, ripe)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000021', 'Apple (Fresh)', 'Fresh whole apple with skin.', 'fruits', 'raw', 'vegetarian', ARRAY['breakfast', 'snack'], 100, 'g', 52, 0.3, 13.8, 0.2, 2.4, 'USDA_FDC', 'FDC:171688', 'USDA FoodData Central, FDC ID 171688: Apples, raw, with skin', 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/171688/nutrients', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000022', 'Roasted Peanuts (Groundnuts / Varkadalai)', 'Dry roasted peanuts without added oil or salt, traditional protein-rich snack.', 'nuts_seeds', 'cooked', 'vegetarian', ARRAY['snack'], 100, 'g', 567, 25.8, 16.1, 49.2, 8.5, 'IFCT_2017', 'IFCT:F003', 'Indian Food Composition Tables 2017, ICMR-NIN, Table F: Oil Seeds (Groundnut, roasted)', 'http://www.ifct2017.com/', 'exact', 'source', true),
  ('f1000000-0000-0000-0000-000000000023', 'Filter Coffee (with Milk & Sugar)', 'Traditional South Indian chicory filter coffee decoction mixed with boiled milk and 1 tsp sugar.', 'beverages', 'cooked', 'vegetarian', ARRAY['breakfast', 'snack'], 100, 'ml', 72, 1.9, 9.5, 2.8, 0.0, 'IFCT_2017', 'IFCT:CookedDishes-030', 'Indian Food Composition Tables 2017, ICMR-NIN, Cooked Dishes (Filter coffee with milk approximate)', 'http://www.ifct2017.com/', 'approximate', 'source', true),
  ('f1000000-0000-0000-0000-000000000024', 'Tender Coconut Water (Elaneer)', 'Natural refreshing electrolyte water extracted directly from young green coconut.', 'beverages', 'raw', 'vegetarian', ARRAY['snack'], 100, 'ml', 19, 0.7, 3.7, 0.2, 1.1, 'IFCT_2017', 'IFCT:E032', 'Indian Food Composition Tables 2017, ICMR-NIN, Table E: Tender coconut water', 'http://www.ifct2017.com/', 'exact', 'source', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  food_form = EXCLUDED.food_form,
  dietary_preference = EXCLUDED.dietary_preference,
  meal_types = EXCLUDED.meal_types,
  reference_quantity = EXCLUDED.reference_quantity,
  reference_unit = EXCLUDED.reference_unit,
  energy_kcal = EXCLUDED.energy_kcal,
  protein_g = EXCLUDED.protein_g,
  carbohydrates_g = EXCLUDED.carbohydrates_g,
  fat_g = EXCLUDED.fat_g,
  fibre_g = EXCLUDED.fibre_g,
  source_name = EXCLUDED.source_name,
  source_record_id = EXCLUDED.source_record_id,
  source_reference = EXCLUDED.source_reference,
  source_url = EXCLUDED.source_url,
  match_status = EXCLUDED.match_status,
  value_method = EXCLUDED.value_method,
  is_active = EXCLUDED.is_active,
  updated_at = pg_catalog.now();
