export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';

  if (user.full_name) return user.full_name;
  if (user.displayName) return user.displayName;
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];

  return 'User';
};

export const getUserInitials = (user) => {
  const name = getUserDisplayName(user);
  const parts = name.split(' ');

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

export const getUserRole = (user) => {
  if (!user) return 'user';
  return user.role_type || user.role || 'user';
};
