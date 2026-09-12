import React, { useState, useEffect } from "react";
import {
  Link,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  getProfile,
  updateProfile,
  removeBookmark,
  fetchNotifications,
  markNotificationsRead,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/common/UserAvatar";
import {
  BookmarkIcon,
  ChatIcon,
  LocationIcon,
  GlobeIcon,
  EuroIcon,
  BookIcon,
  ExternalLinkIcon,
  BellIcon,
  BookmarkOutlineIcon,
  CrossOutline,
  TwoFAIcon,
} from "../components/common/Icons";
import { isValidData } from "../utils/helpers";

function NotificationsTab({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((res) => res.data.success && setNotifications(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    markNotificationsRead().catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-xs text-slate-400">Loading...</div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <BellIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">
          No notifications yet
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          You'll see updates when someone messages in your chat groups or
          mentions you.
        </p>
      </div>
    );
  }

  return notifications.map((n) => (
    <Link
      key={n.id}
      to={n.chat_group_id ? `/chat?group=${n.chat_group_id}` : "/profile"}
      className={`block bg-white p-4 rounded-xl border transition ${
        n.is_read ? "border-slate-200" : "border-brand-200 bg-brand-50/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-slate-300" : "bg-brand-600"}`}
        />
        <div className="min-w-0">
          <p className="text-sm text-slate-900 font-medium">{n.message}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {new Date(n.created_at).toLocaleString([], {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {n.type === "mention" && (
          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
            @mention
          </span>
        )}
      </div>
    </Link>
  ));
}

export default function Profile() {
  const {
    user: authUser,
    logout,
    updateUser,
    loading: authLoading,
  } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "bookmarks";
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    country: "",
    avatar_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProfile();
        if (res.data.success) {
          setProfile(res.data.data);
          setEditData({
            username: res.data.data.user.username,
            country: res.data.data.user.country || "",
            avatar_url: res.data.data.user.avatar_url || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(editData);
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, user: res.data.user }));
        updateUser(res.data.user);
        setEditing(false);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBookmark = async (programId) => {
    try {
      await removeBookmark(programId);
      setProfile((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== programId),
      }));
    } catch (err) {
      console.error("Remove bookmark failed:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, bookmarks, chats, notifications } = profile;

  const tabs = [
    {
      key: "bookmarks",
      label: "Saved Courses",
      count: bookmarks.length,
      icon: BookmarkIcon,
    },
    { key: "chats", label: "Chat Groups", count: chats.length, icon: ChatIcon },
    {
      key: "notifications",
      label: "Notifications",
      count: notifications.length,
      icon: BellIcon,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <UserAvatar user={user} size="xl" />
          <div className="flex-grow text-center sm:text-left space-y-3">
            {editing ? (
              <div className="space-y-3 max-w-sm">
                <input
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({ ...editData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="Username"
                />
                <input
                  value={editData.country}
                  onChange={(e) =>
                    setEditData({ ...editData, country: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="Your country"
                />
                <input
                  value={editData.avatar_url}
                  onChange={(e) =>
                    setEditData({ ...editData, avatar_url: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="Avatar image URL (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {user.username}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 justify-center sm:justify-start">
                  {user.country && (
                    <span className="flex items-center gap-1">
                      <LocationIcon className="w-3 h-3" /> {user.country}
                    </span>
                  )}
                  <span>
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {user.two_factor_enabled && (
                    <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded border border-green-200">
                      2FA Enabled
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Account Settings / Security Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Account Settings
        </h2>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Change Password
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Need to update your password? Click the button to receive a secure
              reset link to your email address (**{user.email}**).
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={async () => {
                try {
                  const { sendPasswordResetEmail } =
                    await import("firebase/auth");
                  const { auth } = await import("../utils/firebase-client");
                  await sendPasswordResetEmail(auth, user.email);
                  alert("Password reset email sent! Check your inbox.");
                } catch (err) {
                  alert(err.message || "Failed to send reset email.");
                }
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition ${
              tab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20" : "bg-slate-100"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="space-y-3">
        {tab === "bookmarks" &&
          (bookmarks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <BookmarkIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                No saved courses yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse courses and click "Save" to bookmark them here.
              </p>
              <Link
                to="/search"
                className="inline-block mt-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            bookmarks.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-4 w-full min-w-0"
              >
                {/* Course Details Left */}
                <div className="space-y-2 flex-grow min-w-0">
                  <div>
                    <Link
                      to={`/programs/${b.id}`}
                      className="text-sm sm:text-base font-bold text-slate-900 hover:text-brand-600 transition block break-words"
                    >
                      {b.course_name}
                    </Link>

                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                      <span>{b.university_name}</span>
                      {isValidData(b.city) && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <LocationIcon className="w-2.5 h-2.5" />
                            {b.city}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Metadata Badges - Conditionally Rendered */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {isValidData(b.degree_type) && (
                      <span
                        className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 uppercase"
                        title="Degree Type"
                      >
                        <BookIcon className="w-2.5 h-2.5 text-slate-400" />
                        {b.degree_type}
                      </span>
                    )}

                    {isValidData(b.language) && (
                      <span
                        className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 uppercase"
                        title="Language"
                      >
                        <GlobeIcon className="w-2.5 h-2.5 text-slate-400" />
                        {b.language}
                      </span>
                    )}

                    {/* Always show tuition fee indicator if valid */}
                    {isValidData(b.tuition_fee_eur) && (
                      <span
                        className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                        title="Tuition Fee"
                      >
                        <EuroIcon className="w-2.5 h-2.5 text-slate-400" />
                        {parseFloat(b.tuition_fee_eur) === 0
                          ? "Free"
                          : `€${parseFloat(b.tuition_fee_eur).toLocaleString()} / sem`}
                      </span>
                    )}

                    {isValidData(b.duration_semesters) && (
                      <span
                        className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded"
                        title="Course Duration"
                      >
                        {b.duration_semesters} Semesters
                      </span>
                    )}

                    {isValidData(b.semester_start) && (
                      <span
                        className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded"
                        title="Semester Starts"
                      >
                        Starts: {b.semester_start}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Right */}
                <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                    Saved {new Date(b.bookmarked_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRemoveBookmark(b.id)}
                    title="Remove bookmark"
                    className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                  >
                    <CrossOutline className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ))}

        {tab === "chats" &&
          (chats.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <ChatIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                No chat groups joined
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Find a course and join its peer chat to connect with other
                students.
              </p>
            </div>
          ) : (
            chats.map((c) => (
              <Link
                key={c.id}
                to={`/chat?group=${c.id}`}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-600 transition block"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-brand-50 text-brand-600 p-2 rounded-lg">
                    <ChatIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Joined {new Date(c.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ))}

        {tab === "notifications" && <NotificationsTab user={user} />}
      </div>
    </div>
  );
}
