import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../common/UserAvatar";
import {
  GraduationCapIcon,
  SearchIcon,
  ChatIcon,
  BookmarkIcon,
  LogoutIcon,
  BellIcon,
} from "../common/Icons";
import { useNotifications } from "../../hooks/useNotifications";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, markRead } = useNotifications(user);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center gap-2">
          {/* LEFT: Logo (Shrinks slightly on mobile to prevent squishing) */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-brand-600 font-bold text-base sm:text-xl tracking-tight shrink-0 select-none"
          >
            <div className="bg-brand-600 text-white p-1 sm:p-1.5 rounded-lg shadow-sm">
              <GraduationCapIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <span>
              UniFinder{" "}
              <span className="text-[8px] sm:text-[9px] bg-brand-50 text-brand-700 font-bold px-1.5 py-0.5 rounded border border-brand-200 uppercase tracking-wide">
                DE
              </span>
            </span>
          </Link>

          {/* RIGHT: Auth actions (Always visible, optimized for tiny mobile viewports) */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="hidden sm:flex items-center gap-5 md:gap-6">
              <Link
                to="/search"
                title="Find Courses"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold transition"
              >
                <SearchIcon className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Find Courses</span>
              </Link>

              <Link
                to="/chat"
                title="Student Chat"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold transition"
              >
                <ChatIcon className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Student Chat</span>
              </Link>

              <Link
                to="/profile?tab=bookmarks"
                title="Bookmarks"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold transition"
              >
                <BookmarkIcon className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Bookmarks</span>
              </Link>
            </div>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
            {/* Real-time Notification Bell - Always visible for logged-in users */}
            {user && (
              <Link
                to="/profile?tab=notifications"
                onClick={markRead}
                className="relative p-2 text-slate-400 hover:text-slate-900 transition rounded-lg hover:bg-slate-50 shrink-0"
                title="Notifications"
              >
                <BellIcon className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <Link
                  to="/profile"
                  className="shrink-0 flex items-center gap-1.5"
                >
                  <UserAvatar user={user} size="sm" />
                </Link>
                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-600 transition shrink-0 flex items-center gap-1"
                >
                  <LogoutIcon className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-bold">
                    Sign Out
                  </span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-brand-600 hover:bg-brand-700 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition shadow-sm whitespace-nowrap"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
