-- Allow admins to view all visa applications
CREATE POLICY "Admins can view all applications"
  ON visa_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Allow admins to update all visa applications
CREATE POLICY "Admins can update all applications"
  ON visa_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Allow admins to view all visa documents
CREATE POLICY "Admins can view all documents"
  ON visa_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Allow admins to view all history
CREATE POLICY "Admins can view all history"
  ON visa_application_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Allow admins to view all document requests
CREATE POLICY "Admins can view all document requests"
  ON visa_document_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Allow admins to insert document requests
CREATE POLICY "Admins can insert document requests"
  ON visa_document_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Allow admins to update document requests
CREATE POLICY "Admins can update document requests"
  ON visa_document_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );
