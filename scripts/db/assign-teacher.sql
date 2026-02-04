INSERT INTO class_memberships (class_id, user_id, role) 
VALUES ('8612361e-ed81-41e3-b838-6e26efddb438', '494ea263-62b1-4f93-8073-6e1d2c250590', 'teacher')
ON CONFLICT (class_id, user_id) DO UPDATE SET role = 'teacher';