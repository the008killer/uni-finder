// client/src/pages/ProgramDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchProgramById } from "../services/api";
import UniLogo from "../components/common/UniLogo";
import {
  UniversityIcon,
  LocationIcon,
  GlobeIcon,
  BookIcon,
  EuroIcon,
  ChatIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  CalendarIcon,
} from "../components/common/Icons";

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgram() {
      try {
        const res = await fetchProgramById(id);
        if (res.data.success) {
          setProgram(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load program:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProgram();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">
          Loading course information...
        </p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-slate-900">Program Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          The course you are looking for does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/search")}
          className="mt-6 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg"
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-6"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        <span>Back to results</span>
      </button>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <UniLogo
              uni={{
                name: program.university_name,
                website: program.university_website,
              }}
              size="md"
            />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {program.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium pt-1">
                <Link
                  to={`/universities/${program.university_id}`}
                  className="hover:text-brand-600 transition flex items-center gap-1.5 text-slate-800 font-semibold"
                >
                  {program.university_name}
                </Link>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <LocationIcon className="w-3 h-3 text-slate-400" />
                  {program.city}
                </span>
                <span className="text-slate-300">•</span>
                <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-600">
                  {program.university_type}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2.5 min-w-[160px]">
            <Link
              to={`/chat?group=${program.chat_group_id}`}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 w-full shadow-sm"
            >
              <ChatIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>Course Chat</span>
            </Link>

            <button
              onClick={() => alert("Bookmark feature coming in Phase 3!")}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 w-full"
            >
              <BookmarkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Course</span>
            </button>
          </div>
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BookIcon className="w-3 h-3" />
              <span>Degree Level</span>
            </div>
            <p className="text-base font-bold text-slate-900 uppercase">
              {program.degree_type || "OTHER"}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <GlobeIcon className="w-3 h-3" />
              <span>Language</span>
            </div>
            <p className="text-base font-bold text-slate-900 uppercase">
              {program.language}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <EuroIcon className="w-3 h-3" />
              <span>Tuition Fee</span>
            </div>
            <p className="text-base font-bold text-slate-900">
              {parseFloat(program.tuition_fee_eur) === 0
                ? "Free Tuition"
                : `€${parseFloat(program.tuition_fee_eur).toLocaleString()} / sem`}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CalendarIcon className="w-3 h-3" />
              <span>Duration</span>
            </div>
            <p className="text-base font-bold text-slate-900">
              {program.duration_semesters
                ? `${program.duration_semesters} Semesters`
                : "Varies"}
            </p>
          </div>
        </div>

        {/* Admission & Language Requirements Section */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Language & Admission Requirements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                German Language Level Required
              </span>
              <p className="text-sm font-bold text-slate-900">
                {program.required_german_level
                  ? `Level ${program.required_german_level} (e.g. TestDaF / Goethe)`
                  : "None / Not explicitly required"}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                English Language Level Required
              </span>
              <p className="text-sm font-bold text-slate-900">
                {program.required_english_level
                  ? `Level ${program.required_english_level} (e.g. IELTS / TOEFL)`
                  : "None / Standard proficiency"}
              </p>
            </div>
          </div>
        </div>

        {/* Links & Details Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Semester Start:{" "}
            <span className="font-semibold text-slate-800">
              {program.semester_start || "Winter / Summer Semester"}
            </span>
          </div>

          {program.course_link && (
            <a
              href={program.course_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 transition"
            >
              <span>View Official University / DAAD Course Page</span>
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
