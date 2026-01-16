/*
  # Enhanced Marketplace Schema

  ## Overview
  Complete marketplace system with categories, conditions, favorites, and reviews.

  ## New Tables
  
  ### `marketplace_categories`
  - `id` (uuid, primary key)
  - `name_en` (text) - Category name in English
  - `name_zh` (text) - Category name in Chinese
  - `icon` (text) - Icon name for the category
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)

  ### `marketplace_items`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `title` (text) - Item title
  - `title_zh` (text) - Chinese title
  - `description` (text) - Item description
  - `description_zh` (text) - Chinese description
  - `category` (text) - Main category
  - `subcategory` (text) - Subcategory
  - `price` (decimal) - Item price
  - `currency` (text) - Currency code (CAD)
  - `negotiable` (boolean) - Price negotiable
  - `condition` (text) - Item condition
  - `location_city` (text) - City
  - `location_area` (text) - Neighborhood/area
  - `images` (text[]) - Array of image URLs
  - `video_url` (text) - Optional video URL
  - `contact_method` (text) - Preferred contact method
  - `contact_wechat` (text) - WeChat ID
  - `status` (text) - active/pending/sold/expired
  - `views_count` (integer) - Number of views
  - `favorites_count` (integer) - Number of favorites
  - `featured_until` (timestamptz) - Featured listing expiry
  - `expires_at` (timestamptz) - Listing expiry
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `marketplace_favorites`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `item_id` (uuid, foreign key to marketplace_items)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, item_id)

  ### `marketplace_reviews`
  - `id` (uuid, primary key)
  - `item_id` (uuid, foreign key to marketplace_items)
  - `reviewer_id` (uuid, foreign key to auth.users)
  - `reviewee_id` (uuid, foreign key to auth.users)
  - `rating` (integer) - 1-5 stars
  - `comment` (text) - Review comment
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can read all active listings
  - Users can only manage their own listings
  - Users can manage their own favorites
  - Reviews can only be created by buyers

  ## Indexes
  - Index on category, status, location for fast filtering
  - Index on user_id for user's listings
  - Index on created_at for sorting
*/

-- Create marketplace_categories table
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_zh text NOT NULL,
  icon text NOT NULL DEFAULT 'package',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create marketplace_items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  title_zh text,
  description text NOT NULL,
  description_zh text,
  category text NOT NULL,
  subcategory text,
  price decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'CAD',
  negotiable boolean DEFAULT false,
  condition text NOT NULL,
  location_city text NOT NULL,
  location_area text,
  images text[] DEFAULT '{}',
  video_url text,
  contact_method text NOT NULL DEFAULT 'in_app',
  contact_wechat text,
  status text NOT NULL DEFAULT 'active',
  views_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  featured_until timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '60 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_categories
CREATE POLICY "Anyone can view categories"
  ON marketplace_categories FOR SELECT
  TO public
  USING (true);

-- RLS Policies for marketplace_items
CREATE POLICY "Anyone can view active listings"
  ON marketplace_items FOR SELECT
  TO public
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create listings"
  ON marketplace_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON marketplace_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON marketplace_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for marketplace_favorites
CREATE POLICY "Users can view own favorites"
  ON marketplace_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON marketplace_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON marketplace_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for marketplace_reviews
CREATE POLICY "Anyone can view reviews"
  ON marketplace_reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews"
  ON marketplace_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_location ON marketplace_items(location_city);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_user ON marketplace_items(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_created ON marketplace_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_price ON marketplace_items(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user ON marketplace_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_item ON marketplace_favorites(item_id);

-- Insert default categories
INSERT INTO marketplace_categories (name_en, name_zh, icon, order_index) VALUES
  ('Furniture', '家具', 'sofa', 1),
  ('Electronics', '电子产品', 'laptop', 2),
  ('Clothing', '服装', 'shirt', 3),
  ('Books', '书籍', 'book', 4),
  ('Kitchen', '厨房用品', 'utensils', 5),
  ('Baby & Kids', '婴儿和儿童用品', 'baby', 6),
  ('Sports', '运动器材', 'dumbbell', 7),
  ('Services', '服务', 'briefcase', 8),
  ('Housing', '住房', 'home', 9),
  ('Vehicles', '车辆', 'car', 10),
  ('Free Stuff', '免费赠送', 'gift', 11),
  ('Other', '其他', 'package', 12)
ON CONFLICT DO NOTHING;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_marketplace_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_items
  SET views_count = views_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update favorites count
CREATE OR REPLACE FUNCTION update_marketplace_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_items
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_items
    SET favorites_count = favorites_count - 1
    WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for favorites count
DROP TRIGGER IF EXISTS marketplace_favorites_count_trigger ON marketplace_favorites;
CREATE TRIGGER marketplace_favorites_count_trigger
  AFTER INSERT OR DELETE ON marketplace_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_favorites_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS marketplace_items_updated_at ON marketplace_items;
CREATE TRIGGER marketplace_items_updated_at
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();