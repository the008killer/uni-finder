// client/src/components/common/UniLogo.jsx
import React, { useState, useEffect } from 'react';

// In-Memory Global Cache (Prevents duplicate requests across components & re-renders)
const LOGO_CACHE = new Map();

// Heraldic color themes for fallback badges
const HERALDIC_THEMES = [
  { bg: 'from-blue-900 to-indigo-950', border: 'border-blue-700/50', text: 'text-blue-100', accent: 'bg-blue-400' },
  { bg: 'from-slate-900 to-slate-950', border: 'border-slate-700/50', text: 'text-slate-100', accent: 'bg-amber-400' },
  { bg: 'from-emerald-900 to-teal-950', border: 'border-emerald-700/50', text: 'text-emerald-100', accent: 'bg-emerald-400' },
  { bg: 'from-rose-900 to-red-950', border: 'border-rose-700/50', text: 'text-rose-100', accent: 'bg-rose-400' },
  { bg: 'from-purple-900 to-indigo-950', border: 'border-purple-700/50', text: 'text-purple-100', accent: 'bg-purple-400' },
  { bg: 'from-sky-900 to-blue-950', border: 'border-sky-700/50', text: 'text-sky-100', accent: 'bg-sky-400' },
];

function getTheme(name) {
  if (!name) return HERALDIC_THEMES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HERALDIC_THEMES[Math.abs(hash) % HERALDIC_THEMES.length];
}

function getCleanDomain(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const raw = url.trim();
    const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return 'U';
  const clean = name.replace(/universit[aä]t|hochschule|fachhochschule|technische|applied|sciences|of|für|der|die|das/gi, '').trim();
  const words = (clean || name).replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
}

// Cleans university names for high-precision Wikipedia/Wikimedia matching
function cleanSearchQuery(rawName) {
  if (!rawName) return '';
  return rawName
    .replace(/\s*-\s*Anhalt University of Applied Sciences/gi, '')
    .replace(/\s*-\s*Technik, Wirtschaft und Gesundheit/gi, '')
    .replace(/\s*-\s*Technik, Wirtschaft, Gestaltung/gi, '')
    .replace(/\s*-\s*University of Applied Sciences/gi, '')
    .replace(/\s*\([^)]*\)/g, '') // Remove (University of Applied Sciences)
    .replace(/\s*-\s*.*$/, '')     // Remove trailing descriptions after dash
    .trim();
}

// Reads cached logo from RAM or SessionStorage
function getStoredLogo(name) {
  if (!name) return null;
  if (LOGO_CACHE.has(name)) return LOGO_CACHE.get(name);
  try {
    const session = sessionStorage.getItem(`unilogo_${name}`);
    if (session) {
      const parsed = JSON.parse(session);
      LOGO_CACHE.set(name, parsed);
      return parsed;
    }
  } catch {}
  return null;
}

function storeLogo(name, result) {
  if (!name || !result) return;
  LOGO_CACHE.set(name, result);
  try {
    sessionStorage.setItem(`unilogo_${name}`, JSON.stringify(result));
  } catch {}
}

export default function UniLogo({ uni, size = 'md', className = '' }) {
  const uniName = uni?.name || '';
  const domain = getCleanDomain(uni?.website);

  const getInitialSource = () => {
    if (uni?.logo_url) return { type: 'image', src: uni.logo_url };
    const cached = getStoredLogo(uniName);
    if (cached) return cached;
    if (domain) {
      return { type: 'google', src: `https://www.google.com/s2/favicons?domain=https://www.${domain}&sz=128` };
    }
    return { type: 'wiki', src: null };
  };

  const [source, setSource] = useState(getInitialSource);

  useEffect(() => {
    setSource(getInitialSource());
  }, [uniName, uni?.website, uni?.logo_url]);

  // Enhanced Wikipedia / Wikimedia Commons Logo Pipeline
  useEffect(() => {
    if (source.type !== 'wiki' || !uniName) return;

    const cached = getStoredLogo(uniName);
    if (cached) {
      setSource(cached);
      return;
    }

    let isMounted = true;
    const cleanName = cleanSearchQuery(uniName);

    async function searchWikimediaPipeline() {
      try {
        // ============================================================
        // TIER 1: Search Wikimedia Commons Media Files (Vector SVGs / PNG Crests)
        // ============================================================
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanName + ' logo OR ' + cleanName + ' seal OR ' + cleanName + ' wappen')}&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=250`;
        const commonsRes = await fetch(commonsUrl);

        if (commonsRes.ok) {
          const commonsData = await commonsRes.json();
          const pages = commonsData?.query?.pages;
          if (pages) {
            for (const key of Object.keys(pages)) {
              const imageInfo = pages[key]?.imageinfo?.[0];
              const thumbUrl = imageInfo?.thumburl || imageInfo?.url;
              // Filter out noise images (prefer svg/png logos)
              if (thumbUrl && (thumbUrl.includes('.svg') || thumbUrl.includes('logo') || thumbUrl.includes('wappen') || thumbUrl.includes('seal') || thumbUrl.includes('.png'))) {
                if (isMounted) {
                  const result = { type: 'image', src: thumbUrl };
                  storeLogo(uniName, result);
                  setSource(result);
                  return;
                }
              }
            }
          }
        }

        // ============================================================
        // TIER 2: German Wikipedia Article Lead Image (with pilicense=any)
        // ============================================================
        const deWikiUrl = `https://de.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=250&pilicense=any`;
        const deRes = await fetch(deWikiUrl);

        if (deRes.ok) {
          const deData = await deRes.json();
          const pages = deData?.query?.pages;
          if (pages) {
            const firstKey = Object.keys(pages)[0];
            const thumb = pages[firstKey]?.thumbnail?.source;
            if (thumb && isMounted) {
              const result = { type: 'image', src: thumb };
              storeLogo(uniName, result);
              setSource(result);
              return;
            }
          }
        }

        // ============================================================
        // TIER 3: English Wikipedia Fallback
        // ============================================================
        const enWikiUrl = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=250&pilicense=any`;
        const enRes = await fetch(enWikiUrl);

        if (enRes.ok) {
          const enData = await enRes.json();
          const pages = enData?.query?.pages;
          if (pages) {
            const firstKey = Object.keys(pages)[0];
            const thumb = pages[firstKey]?.thumbnail?.source;
            if (thumb && isMounted) {
              const result = { type: 'image', src: thumb };
              storeLogo(uniName, result);
              setSource(result);
              return;
            }
          }
        }

        // Fallback to Heraldic Shield if no graphic found
        if (isMounted) {
          const fallback = { type: 'shield', src: null };
          storeLogo(uniName, fallback);
          setSource(fallback);
        }
      } catch {
        if (isMounted) {
          const fallback = { type: 'shield', src: null };
          storeLogo(uniName, fallback);
          setSource(fallback);
        }
      }
    }

    searchWikimediaPipeline();

    return () => {
      isMounted = false;
    };
  }, [source.type, uniName]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-16 h-16 text-sm sm:w-20 sm:h-20 sm:text-base',
  };

  // 1. Google Favicon or Wikimedia Logo Image
  if (source.type === 'google' || source.type === 'image') {
    return (
      <div className={`bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${sizeClasses[size]} ${className}`}>
        <img
          src={source.src}
          alt={`${uniName} logo`}
          referrerPolicy="no-referrer"
          onError={() => {
            if (source.type === 'google') {
              // If Google 404s, trigger the enhanced Wikimedia pipeline
              setSource({ type: 'wiki', src: null });
            } else {
              // If Wikimedia image fails to render, fallback to shield
              const fallback = { type: 'shield', src: null };
              storeLogo(uniName, fallback);
              setSource(fallback);
            }
          }}
          className="w-full h-full object-contain select-none"
        />
      </div>
    );
  }

  // 2. Heraldic Academic Shield (When no remote logo is available)
  const theme = getTheme(uniName);
  const initials = getInitials(uniName);

  return (
    <div
      className={`relative bg-gradient-to-br ${theme.bg} ${theme.border} ${theme.text} border rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm select-none font-serif font-black tracking-widest ${sizeClasses[size]} ${className}`}
      title={uniName}
    >
      <span className="leading-none drop-shadow-sm">{initials}</span>
      <div className={`w-2/5 h-0.5 ${theme.accent} rounded-full mt-1 opacity-80`} />
    </div>
  );
}