// Auth utility functions for role-based access control

export const hasAdminAccess = (role?: string): boolean => {
  if (!role) return false;
  return role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin';
};

export const hasRole = (userRole?: string, requiredRole?: string): boolean => {
  if (!userRole || !requiredRole) return false;
  
  const roleHierarchy = {
    user: 0,
    editor: 1,
    admin: 2,
    superadmin: 3
  };
  
  const userLevel = roleHierarchy[userRole.toLowerCase() as keyof typeof roleHierarchy] ?? -1;
  const requiredLevel = roleHierarchy[requiredRole.toLowerCase() as keyof typeof roleHierarchy] ?? -1;
  
  return userLevel >= requiredLevel;
};

export const canManageRoles = (userRole?: string): boolean => {
  return hasRole(userRole, 'admin');
};

export const getRoleDisplayName = (role?: string): string => {
  const roleNames = {
    user: 'User',
    editor: 'Editor',
    admin: 'Admin',
    superadmin: 'SuperAdmin'
  };
  
  return roleNames[role?.toLowerCase() as keyof typeof roleNames] || 'Unknown';
};

export const getRoleBadgeVariant = (role?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (role?.toLowerCase()) {
    case 'superadmin':
      return 'destructive';
    case 'admin':
      return 'destructive';
    case 'editor':
      return 'secondary';
    case 'user':
    default:
      return 'outline';
  }
};