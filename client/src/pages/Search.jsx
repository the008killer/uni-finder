// client/src/pages/Search.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchFilters, fetchPrograms } from "../services/api";
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
} from "../components/common/Icons";

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

  // Read URL search params
  const q = searchParams.get("q") || "";
  const subject = searchParams.get("subject") || "";
  const degree = searchParams.get("degree") || "";
  const language = searchParams.get("language") || "";
  const uniType = searchParams.get("uniType") || "";
  const maxFee = searchParams.get("maxFee") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Fetch Broad Filter dropdown options once on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetchFilters();
        if (res.data.success) {
          setFilterOptions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    }
    loadFilters();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Main Search Bar */}
      <div className="relative mb-8 max-w-2xl">
        <input
          type="text"
          placeholder="Search courses (e.g. AI, Embedded Computing, Robotics, Finance...)"
          value={q}
          onChange={(e) => updateFilters({ q: e.target.value })}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900"
        />
        <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN: BROAD FILTERS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 h-fit space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Broad Filters</h2>
            <button
              onClick={handleClearFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
            >
              Clear All
            </button>
          </div>

          {/* Degree Level */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Degree Level
            </label>
            <select
              value={degree}
              onChange={(e) => updateFilters({ degree: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Degrees (Bachelor & Master)</option>
              <option value="bachelor">Bachelor</option>
              <option value="master">Master</option>
            </select>
          </div>

          {/* Subject Area */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Subject Area
            </label>
            <select
              value={subject}
              onChange={(e) => updateFilters({ subject: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => updateFilters({ language: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Languages</option>
              <option value="english">English Only</option>
              <option value="german">German Only</option>
              <option value="mixed">Mixed (German & English)</option>
            </select>
          </div>

          {/* University Type (Public/Private) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              University Type
            </label>
            <select
              value={uniType}
              onChange={(e) => updateFilters({ uniType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Public & Private</option>
              <option value="public">Public (Usually Free tuition)</option>
              <option value="private">Private (Tuition applies)</option>
              <option value="church">Church run</option>
            </select>
          </div>

          {/* Max Tuition Fee */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Max Tuition Fee
            </label>
            <select
              value={maxFee}
              onChange={(e) => updateFilters({ maxFee: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500 font-medium">
              Found{" "}
              <span className="text-slate-900 font-semibold">
                {totalResults}
              </span>{" "}
              courses
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium">
                Searching matching programs...
              </p>
            </div>
          ) : programs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <GraduationCapIcon className="w-10 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">
                No programs found
              </h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
                Try adjusting your search query, choosing a broader subject
                filter, or resetting tuition limits.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition duration-150 flex flex-col sm:flex-row justify-between gap-6"
                >
                  <div className="space-y-3 flex-grow">
                    <div>
                      {/* Course Name */}
                      <Link
                        to={`/programs/${prog.id}`}
                        className="text-lg font-bold text-slate-900 hover:text-brand-600 transition block leading-snug"
                      >
                        {prog.course_name}
                      </Link>
                      {/* University + City Name */}
                      <span className="text-sm text-slate-600 font-medium flex items-center gap-1.5 mt-1">
                        <Link
                          to={`/universities/${prog.university_id}`}
                          className="hover:text-brand-600 transition flex items-center gap-1.5 text-slate-800 font-semibold"
                        >
                          <UniversityIcon className="w-3.5 h-3.5 text-slate-400" />
                          {prog.university_name}
                        </Link>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 mt-1">
                          <LocationIcon className="w-3.5 h-3.5" />
                          {prog.city}
                        </span>
                      </span>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <BookIcon className="w-3.5 h-3.5" />
                        {prog.degree_type
                          ? prog.degree_type.toUpperCase()
                          : "OTHER"}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                        <GlobeIcon className="w-3.5 h-3.5" />
                        {prog.language}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <EuroIcon className="w-3.5 h-3.5" />
                        {parseFloat(prog.tuition_fee_eur) === 0
                          ? "Free Tuition"
                          : `€${parseFloat(prog.tuition_fee_eur).toLocaleString()} / sem`}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                        Starting:{" "}
                        {prog.semester_start
                          ? `${prog.semester_start}`
                          : "Check Program Site"}
                      </span>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="flex sm:flex-col justify-end sm:justify-between items-end gap-3 min-w-[140px]">
                    <Link
                      to={`/chat?group=${prog.chat_group_id}`}
                      className="bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 text-xs font-bold px-4 py-2.5 rounded-lg text-center transition w-full block shadow-sm"
                    >
                      Peer Chat Group
                    </Link>
                  </div>
                </div>
              ))}

              {/* PAGINATION COMPONENT */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => updateFilters({ page: page - 1 })}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm font-medium text-slate-600 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => updateFilters({ page: page + 1 })}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-white disabled:opacity-40 hover:bg-slate-50"
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
