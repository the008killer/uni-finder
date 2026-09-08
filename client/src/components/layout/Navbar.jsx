import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCapIcon, SearchIcon, ChatIcon, BookmarkIcon } from '../common/Icons';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-brand-600 font-bold text-xl tracking-tight">
            <GraduationCapIcon className="w-8 h-8 text-brand-600" />
            <span>UniFinder-DE <span className="text-xs bg-brand-100 text-brand-800 font-semibold px-2 py-0.5 rounded-full ml-1">DE</span></span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link to="/search" className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 font-medium text-sm transition">
              <SearchIcon className="w-4 h-4" />
              <span>Find Courses</span>
            </Link>

            <Link to="/chat" className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 font-medium text-sm transition">
              <ChatIcon className="w-4 h-4" />
              <span>Student Chat</span>
            </Link>

            <Link to="/bookmarks" className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 font-medium text-sm transition">
              <BookmarkIcon className="w-4 h-4" />
              <span>Saved</span>
            </Link>

            <div className="h-5 w-[1px] bg-slate-200" />

            <Link 
              to="/login"
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}