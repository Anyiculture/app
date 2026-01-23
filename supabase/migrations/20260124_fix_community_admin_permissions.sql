-- Allow admins to delete any community post
CREATE POLICY "Admins can delete any community post"
ON community_posts
FOR DELETE
TO authenticated
USING (is_admin_internal());

-- Allow admins to manage (update/delete) any community comment/like/report too?
-- For now, deleting the post is the main target.
-- If cascade is missing, we need to add it.
