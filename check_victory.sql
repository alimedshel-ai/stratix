SELECT u.email, m.role, m."userType", m."departmentRole"
FROM members m 
JOIN users u ON m."userId" = u.id 
WHERE u.email = 'logistics-ultimate-victory@stratix.com';
