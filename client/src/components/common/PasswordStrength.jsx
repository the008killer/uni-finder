import React from 'react';
import { checkPasswordStrength } from '../../utils/password';

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const { checks, level } = checkPasswordStrength(password);

  const colors = {
    weak: 'bg-red-500',
    medium: 'bg-amber-500',
    strong: 'bg-green-500',
  };

  const widths = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Progress bar */}
      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${colors[level]} ${widths[level]} rounded-full transition-all duration-300`} />
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {checks.map((check, i) => (
          <li key={i} className={`text-[11px] flex items-center gap-1.5 ${check.pass ? 'text-green-600' : 'text-slate-400'}`}>
            <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0"
              style={{
                borderColor: check.pass ? '#16a34a' : '#cbd5e1',
                backgroundColor: check.pass ? '#dcfce7' : 'transparent',
                color: check.pass ? '#16a34a' : '#94a3b8'
              }}
            >
              {check.pass ? '✓' : '·'}
            </span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}