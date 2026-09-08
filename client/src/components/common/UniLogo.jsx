// client/src/components/common/UniLogo.jsx
import React, { useState } from 'react';
import { UniversityIcon } from './Icons';

export default function UniLogo({ uni, size = "md", className = "" }) {
  const [imageError, setImageError] = useState(false);

  // Extract clean domain from website URL
  const getDomain = (url) => {
    if (!url) return null;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  };

  // Get initials for fallback monogram (e.g. "RWTH Aachen" -> "RA" or "TU Munich" -> "TM")
  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const domain = getDomain(uni?.website);
  // Uses Google's high-res favicon service or custom logo_url
  const logoSrc = uni?.logo_url || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base sm:w-20 sm:h-20 sm:text-xl",
  };

  if (logoSrc && !imageError) {
    return (
      <div className={`bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${sizeClasses[size]} ${className}`}>
        <img
          src={logoSrc}
          alt={`${uni?.name} logo`}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback Monogram Avatar
  return (
    <div className={`bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center shrink-0 shadow-sm select-none ${sizeClasses[size]} ${className}`}>
      {uni?.name ? getInitials(uni.name) : <UniversityIcon className="w-5 h-5 text-slate-300" />}
    </div>
  );
}