import React, { useState } from 'react';

export default function UserAvatar({ user, size = "md", className = "" }) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-2xl",
    xl: "w-28 h-28 text-3xl",
  };

  if (user?.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow-md ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-brand-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-md select-none ${className}`}>
      {getInitials(user?.username)}
    </div>
  );
}