import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchMyChatGroups,
  leaveChatGroup,
  joinChatGroup,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import {
  formatDateLabel,
  groupMessagesByDate,
  formatLocalTime,
} from "../utils/dateUtils";
import UserAvatar from "../components/common/UserAvatar";
import {
  ChatIcon,
  GraduationCapIcon,
  LogoutIcon,
} from "../components/common/Icons";

const SECTIONS = [
  { key: "general", label: "General", desc: "Open discussion" },
  {
    key: "admissions",
    label: "Admissions",
    desc: "Application, requirements, deadlines",
  },
  {
    key: "courses",
    label: "Courses & Studies",
    desc: "Curriculum, modules, exams",
  },
  { key: "life", label: "Student Life", desc: "Housing, city tips, social" },
];

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGroupId = searchParams.get("group");

  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId || null);
  const [activeSection, setActiveSection] = useState("general");

  const [messageInput, setMessageInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(!initialGroupId);
  const [floatingDate, setFloatingDate] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const dateRefs = useRef({});

  const { messages, connected, sendMessage } = useChat(
    activeGroupId,
    activeSection,
    user,
  );
  const grouped = groupMessagesByDate(messages);

  // Helper to load user's real joined groups
  const loadMyGroups = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchMyChatGroups();
      if (res.data.success) {
        setGroups(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load chat groups:", err);
    }
  }, [user]);

  // Load groups on mount and when user logs in
  useEffect(() => {
    loadMyGroups();
  }, [loadMyGroups]);

  // Join group on arrival from link, then fetch updated list
  useEffect(() => {
    if (initialGroupId && user) {
      joinChatGroup(initialGroupId)
        .then(() => {
          setActiveGroupId(initialGroupId);
          setShowSidebar(false);
          loadMyGroups(); // Syncs sidebar list immediately
        })
        .catch(() => {});
    }
  }, [initialGroupId, user, loadMyGroups]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset section when switching groups
  useEffect(() => {
    setActiveSection("general");
  }, [activeGroupId]);

  // Track visible date for floating header
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    let currentLabel = null;

    Object.entries(dateRefs.current).forEach(([label, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top - containerTop <= 50) {
        currentLabel = label;
      }
    });

    setFloatingDate(currentLabel);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput("");
  };

  const selectGroup = (id) => {
    setActiveGroupId(id);
    setSearchParams({ group: id }); // Keeps query param in browser in sync
    setShowSidebar(false);
  };

  const handleLeaveGroup = async () => {
    if (!activeGroupId) return;
    if (
      !confirm(
        "Leave this chat group? You can rejoin from the course page anytime.",
      )
    )
      return;

    try {
      await leaveChatGroup(activeGroupId);
      setGroups((prev) =>
        prev.filter((g) => String(g.id) !== String(activeGroupId)),
      );
      setActiveGroupId(null);
      setSearchParams({}); // Clear query parameters on leave
      setShowSidebar(true);
    } catch (err) {
      console.error("Leave failed:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
        <ChatIcon className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-slate-900">
          Sign in to access chat
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Join course-specific peer discussions.
        </p>
      </div>
    );
  }

  const activeGroup = groups.find(
    (g) => String(g.id) === String(activeGroupId),
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`${showSidebar ? "flex" : "hidden"} sm:flex flex-col w-full sm:w-72 md:w-80 bg-white border-r border-slate-200 shrink-0`}
      >
        <div className="p-3 sm:p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ChatIcon className="w-4 h-4 text-brand-600" />
            My Chat Groups
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {groups.length} group{groups.length !== 1 ? "s" : ""} joined
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <GraduationCapIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  No chat groups joined yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Find a course on the search page and click "Peer Chat" to join
                  the discussion.
                </p>
              </div>
              <Link
                to="/search"
                className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Find Courses
              </Link>
            </div>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGroup(g.id)}
                className={`w-full text-left px-3 sm:px-4 py-3 border-b border-slate-50 transition hover:bg-slate-50 ${
                  activeGroupId == g.id
                    ? "bg-brand-50 border-l-2 border-l-brand-600"
                    : ""
                }`}
              >
                <p className="text-xs font-bold text-slate-900 truncate">
                  {g.name}
                </p>
                {g.degree_type && (
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {g.degree_type}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div
        className={`${!showSidebar ? "flex" : "hidden"} sm:flex flex-col flex-1 min-w-0 bg-white`}
      >
        {!activeGroupId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <ChatIcon className="w-14 h-14 text-slate-200 mb-4" />
            <h2 className="text-base font-bold text-slate-900">
              Select a chat group
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Choose a course group from the sidebar to start chatting.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header + Leave Button */}
            <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
              <button
                onClick={() => setShowSidebar(true)}
                className="sm:hidden text-slate-500 hover:text-slate-900 text-xs font-bold p-1"
              >
                ← Back
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {activeGroup?.name || "Chat Room"}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {connected ? "Connected" : "Reconnecting..."}
                </p>
              </div>
              <button
                onClick={handleLeaveGroup}
                title="Leave group"
                className="flex items-center gap-1 text-slate-400 hover:text-red-600 transition p-1.5"
              >
                <LogoutIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-bold">
                  Leave
                </span>
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 overflow-x-auto px-2 py-2 bg-slate-50 border-b border-slate-200 shrink-0 no-scrollbar">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  title={s.desc}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                    activeSection === s.key
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-white text-slate-500 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  # {s.label}
                </button>
              ))}
            </div>

            {/* Messages Container */}
            <div className="relative flex-1 overflow-hidden">
              {/* Floating Date Badge */}
              {floatingDate && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <span className="bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                    {floatingDate}
                  </span>
                </div>
              )}

              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto px-3 sm:px-4 py-4 space-y-2 bg-slate-50"
              >
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-xs text-slate-400">
                      No messages in{" "}
                      <span className="font-bold">#{activeSection}</span> yet.
                      Start the conversation! 👋
                    </p>
                  </div>
                )}

                {grouped.map((item) => {
                  if (item.type === "date") {
                    return (
                      <div
                        key={item.id}
                        ref={(el) => (dateRefs.current[item.label] = el)}
                        className="flex justify-center my-3"
                      >
                        <span className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  const msg = item;
                  const isMe = String(msg.sender?.id) === String(user.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <UserAvatar
                        user={msg.sender}
                        size="sm"
                        className="shrink-0 mt-1"
                      />
                      <div
                        className={`max-w-[75%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                      >
                        <span
                          className={`text-[10px] font-semibold mb-0.5 ${isMe ? "text-brand-600" : "text-slate-500"}`}
                        >
                          {isMe ? "You" : msg.sender?.username || "Student"}
                        </span>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? "bg-brand-600 text-white rounded-tr-sm"
                              : "bg-white text-slate-900 border border-slate-200 rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-medium">
                          {formatLocalTime(msg.sent_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-slate-200 bg-white shrink-0"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message #${activeSection}`}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 min-w-0"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-40 shrink-0"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
