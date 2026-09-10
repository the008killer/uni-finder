import React from 'react';

export default function CardSkeleton() {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 animate-pulse flex flex-col sm:flex-row justify-between gap-4 w-full min-w-0">
      
      {/* Left Column: Core Info (Stretches fully across large displays) */}
      <div className="space-y-3 flex-grow min-w-0 w-full">
        <div className="space-y-2 w-full">
          {/* Title line - takes up almost full width on desktop */}
          <div className="h-4 bg-slate-200 rounded-md w-11/12 sm:w-10/12 lg:w-4/5" />
          
          {/* Subtitle line */}
          <div className="flex items-center gap-2 w-full">
            <div className="h-3 bg-slate-200 rounded w-1/3 sm:w-1/4 max-w-[180px]" />
            <div className="h-2.5 bg-slate-200 rounded w-2 hidden sm:block shrink-0" />
            <div className="h-3 bg-slate-200 rounded w-1/6 max-w-[100px]" />
          </div>
        </div>

        {/* Badges line */}
        <div className="flex flex-wrap gap-1.5 pt-1 w-full">
          <div className="h-5 bg-slate-100 rounded w-14 sm:w-16 shrink-0" />
          <div className="h-5 bg-slate-100 rounded w-16 sm:w-20 shrink-0" />
          <div className="h-5 bg-slate-100 rounded w-12 sm:w-14 shrink-0" />
          <div className="h-5 bg-slate-100 rounded w-24 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Right Column: Actions and buttons */}
      <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0 w-full sm:w-auto">
        <div className="h-3 bg-slate-200 rounded w-12 sm:w-16 hidden sm:block" />
        <div className="h-8 bg-slate-200 rounded-lg w-20 sm:w-24 shadow-sm" />
      </div>

    </div>
  );
}