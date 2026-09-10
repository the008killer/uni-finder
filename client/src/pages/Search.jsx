// client/src/pages/Search.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  fetchFilters,
  fetchPrograms,
  toggleBookmark,
  fetchMyBookmarkIds,
} from "../services/api";
import {
  SearchIcon,
  LocationIcon,
  GlobeIcon,
  BookIcon,
  EuroIcon,
  UniversityIcon,
  GraduationCapIcon,
  FilterIcon,
  ChatIcon,
  BookmarkOutlineIcon,
  BookmarkIcon,
} from "../components/common/Icons";
import { useAuth } from "../context/AuthContext";
import { isValidData } from "../utils/helpers";
import CardSkeleton from "../components/common/CardSkeleton";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  // API Data States
  const [programs, setPrograms] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    cities: [],
  });
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());

  // Read URL search params
  const q = searchParams.get("q") || "";
  const subject = searchParams.get("subject") || "";
  const degree = searchParams.get("degree") || "";
  const language = searchParams.get("language") || "";
  const uniType = searchParams.get("uniType") || "";
  const maxFee = searchParams.get("maxFee") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [localSearch, setLocalSearch] = useState(q);

  // Debounce the search input: wait 400ms after typing stops before updating URL
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // Only update URL parameters if localSearch actually differs from current URL q
      if (localSearch !== q) {
        updateFilters({ q: localSearch });
      }
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounce);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  // Fetch Programs whenever search parameters or page changes
  useEffect(() => {
    async function loadPrograms() {
      setLoading(true);
      try {
        const params = {
          q,
          subject,
          degree,
          language,
          uniType,
          maxFee,
          page,
          limit: 10,
        };
        const res = await fetchPrograms(params);
        if (res.data.success) {
          setPrograms(res.data.data.results);
          setTotalResults(res.data.data.total);
          setTotalPages(res.data.data.totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch programs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPrograms();
  }, [searchParams]);

  // Update specific URL search parameters
  const updateFilters = (newFilters) => {
    const nextParams = new URLSearchParams(searchParams);

    // Always reset to page 1 on filter change
    nextParams.set("page", "1");

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  // Load user's saved IDs when logged in
  useEffect(() => {
    if (user) {
      fetchMyBookmarkIds()
        .then((res) => res.data.success && setSavedIds(new Set(res.data.data)))
        .catch(() => {});
    } else {
      setSavedIds(new Set());
    }
  }, [user]);

  const handleQuickBookmark = async (e, programId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please sign in to save courses!");
      return;
    }

    try {
      const res = await toggleBookmark(programId);
      if (res.data.success) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (res.data.bookmarked) next.add(programId);
          else next.delete(programId);
          return next;
        });
      }
    } catch (err) {
      console.error("Quick bookmark error:", err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Main Search Bar */}
      <div className="relative mb-6 sm:mb-8 w-full max-w-2xl">
        <input
          type="text"
          placeholder="Search by degree name, topic (e.g. AI, Embedded, Robotics, Business)..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)} // updates instantly for high responsive typing feel
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 text-sm"
        />
        <SearchIcon className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-slate-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* LEFT COLUMN: BROAD FILTERS */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 h-fit space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <FilterIcon className="w-3.5 h-3.5 text-slate-500" />
              <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
                Broad Filters
              </h2>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
            >
              Clear All
            </button>
          </div>

          {/* Degree Level */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Degree Level
            </label>
            <select
              value={degree}
              onChange={(e) => updateFilters({ degree: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All Degrees (Bachelor & Master)</option>
              <option value="bachelor">Bachelor</option>
              <option value="master">Master</option>
            </select>
          </div>

          {/* Subject Area */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Subject Area
            </label>
            <select
              value={subject}
              onChange={(e) => updateFilters({ subject: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All Subjects</option>
              {filterOptions.subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Language of Instruction */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => updateFilters({ language: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All Languages</option>
              <option value="english">English Only</option>
              <option value="german">German Only</option>
              <option value="mixed">Mixed (German & English)</option>
            </select>
          </div>

          {/* University Type (Public/Private) */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              University Type
            </label>
            <select
              value={uniType}
              onChange={(e) => updateFilters({ uniType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Public & Private</option>
              <option value="public">Public (Usually Free tuition)</option>
              <option value="private">Private (Tuition applies)</option>
              <option value="church">Church run</option>
            </select>
          </div>

          {/* Max Tuition Fee */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Max Tuition Fee
            </label>
            <select
              value={maxFee}
              onChange={(e) => updateFilters({ maxFee: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Any Tuition / Free</option>
              <option value="0">Free Tuition Only</option>
              <option value="1000">Max €1,000 / Semester</option>
              <option value="5000">Max €5,000 / Semester</option>
              <option value="10000">Max €10,000 / Semester</option>
            </select>
          </div>
        </div>

        {/* RIGHT COLUMN: SEARCH RESULTS */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wide uppercase">
              Found{" "}
              <span className="text-slate-900 font-bold">{totalResults}</span>{" "}
              courses
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 w-full">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center">
              <GraduationCapIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xs sm:text-base font-bold text-slate-900">
                No programs found
              </h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto text-xs">
                Try adjusting your search query, choosing a broader subject
                filter, or resetting tuition limits.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-slate-400 transition flex flex-col sm:flex-row justify-between gap-4 w-full min-w-0"
                >
                  <div className="space-y-2 flex-grow min-w-0">
                    <div>
                      {/* Course Name */}
                      <Link
                        to={`/programs/${prog.id}`}
                        className="text-sm sm:text-base font-bold text-slate-900 hover:text-brand-600 transition block leading-snug break-words"
                      >
                        {prog.course_name}
                      </Link>
                      {/* University + City Name */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-medium mt-1">
                        <span className="flex items-center gap-1 break-words">
                          <UniversityIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{prog.university_name}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500 shrink-0">
                          <LocationIcon className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{prog.city}</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {isValidData(prog.degree_type) && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 uppercase shrink-0">
                          <BookIcon className="w-2.5 h-2.5" />
                          {prog.degree_type}
                        </span>
                      )}
                      {isValidData(prog.language) && (
                        <span
                          className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 uppercase shrink-0"
                          title="Language"
                        >
                          <GlobeIcon className="w-2.5 h-2.5" />
                          {prog.language}
                        </span>
                      )}
                      {isValidData(prog.tuition_fee_eur) && (
                        <span
                          className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shrink-0"
                          title="Tuition Fee"
                        >
                          <EuroIcon className="w-2.5 h-2.5" />
                          {parseFloat(prog.tuition_fee_eur) === 0
                            ? "Free"
                            : `€${parseFloat(prog.tuition_fee_eur).toLocaleString()} / sem`}
                        </span>
                      )}
                      {isValidData(prog.duration_semesters) && (
                        <span
                          className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded shrink-0"
                          title="Course Duration"
                        >
                          {prog.duration_semesters} Semesters
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <Link
                      to={`/chat?group=${prog.chat_group_id}`}
                      title="Ask about the Course"
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-1.5 sm:py-2 rounded-lg text-center transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                    >
                      <ChatIcon className="w-3 h-3 text-white" />
                      Peer Chat
                    </Link>
                    <button
                      onClick={(e) => handleQuickBookmark(e, prog.id)}
                      title={
                        savedIds.has(prog.id)
                          ? "Remove Bookmark"
                          : "Save Course"
                      }
                      className="p-1 text-slate-400 hover:text-brand-600 transition shrink-0 flex items-center gap-1 text-sm font-medium"
                    >
                      {savedIds.has(prog.id) ? (
                        <>
                          <BookmarkIcon className="w-4 h-4 text-brand-600" />
                          <span className="text-brand-600">Saved</span>
                        </>
                      ) : (
                        <>
                          <BookmarkOutlineIcon className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          <span>Save Course</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* PAGINATION COMPONENT */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => updateFilters({ page: page - 1 })}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-medium text-slate-600 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => updateFilters({ page: page + 1 })}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
