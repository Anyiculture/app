/*
  # Add Missing Module Tables

  ## New Tables

  ### 1. profiles
  General profile table that links to auth.users and contains common profile info
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `avatar_url` (text)
  - `location` (text)
  - `phone` (text)
  - `bio` (text)
  - `preferred_language` (text: 'en', 'zh')
  - `onboarding_completed` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. education_resources
  Educational content and courses
  - `id` (uuid, PK)
  - `creator_id` (uuid, FK to users)
  - `title` (text)
  - `description` (text)
  - `type` (text: 'course', 'workshop', 'webinar', 'resource')
  - `level` (text: 'beginner', 'intermediate', 'advanced')
  - `language` (text)
  - `duration` (text)
  - `price` (numeric)
  - `image_url` (text)
  - `status` (text: 'active', 'draft', 'archived')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. education_interests
  User submissions expressing interest
  - `id` (uuid, PK)
  - `resource_id` (uuid, FK to education_resources)
  - `user_id` (uuid, FK to users)
  - `message` (text)
  - `created_at` (timestamptz)

  ### 4. community_posts
  Social feed posts
  - `id` (uuid, PK)
  - `author_id` (uuid, FK to users)
  - `content` (text)
  - `images` (text[])
  - `category` (text)
  - `likes_count` (integer)
  - `comments_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. community_comments
  Comments on posts
  - `id` (uuid, PK)
  - `post_id` (uuid, FK to community_posts)
  - `author_id` (uuid, FK to users)
  - `content` (text)
  - `created_at` (timestamptz)

  ### 6. community_likes
  Likes on posts
  - `id` (uuid, PK)
  - `post_id` (uuid, FK to community_posts)
  - `user_id` (uuid, FK to users)
  - `created_at` (timestamptz)

  ### 7. notifications
  User notifications
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to users)
  - `type` (text)
  - `title` (text)
  - `message` (text)
  - `link` (text)
  - `read` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Users can only read/write their own data
  - Public read access for published content
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  location text,
  phone text,
  bio text,
  preferred_language text DEFAULT 'en',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create education_resources table
CREATE TABLE IF NOT EXISTS education_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  level text DEFAULT 'beginner',
  language text DEFAULT 'en',
  duration text,
  price numeric DEFAULT 0,
  image_url text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE education_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active education resources"
  ON education_resources FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can create education resources"
  ON education_resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own resources"
  ON education_resources FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Create education_interests table
CREATE TABLE IF NOT EXISTS education_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES education_resources(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, user_id)
);

ALTER TABLE education_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interests"
  ON education_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit interests"
  ON education_interests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  category text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON community_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create community_likes table
CREATE TABLE IF NOT EXISTS community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON community_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON community_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON community_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_education_resources_creator_id ON education_resources(creator_id);
CREATE INDEX IF NOT EXISTS idx_education_resources_status ON education_resources(status);
CREATE INDEX IF NOT EXISTS idx_education_interests_resource_id ON education_interests(resource_id);
CREATE INDEX IF NOT EXISTS idx_education_interests_user_id ON education_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);