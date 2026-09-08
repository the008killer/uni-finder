import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchUniversityById } from "../services/api";
import UniLogo from "../components/common/UniLogo";
import {
  UniversityIcon,
  LocationIcon,
  BookIcon,
  GlobeIcon,
  EuroIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  ChatIcon,
} from "../components/common/Icons";

export default function UniversityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUni() {
      try {
        const res = await fetchUniversityById(id);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load university details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUni();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">
          Loading university profile...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-slate-900">
          University Not Found
        </h2>
        <button
          onClick={() => navigate("/search")}
          className="mt-6 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const { university, programs } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        <span>Back to results</span>
      </button>

      {/* University Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6">
          <div className="flex items-start gap-5">
            <UniLogo uni={university} size="lg"/>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded capitalize">
                  {university.type} University
                </span>
                {university.category && (
                  <span className="bg-brand-50 text-brand-700 text-[11px] font-semibold px-2 py-0.5 rounded border border-brand-200 capitalize">
                    {university.category}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {university.name}
              </h1>

              <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <LocationIcon className="w-3 h-3 text-slate-400" />
                <span>
                  {university.city}, {university.state || ""}{" "}
                  {university.country || "Germany"}
                </span>
              </p>
            </div>
          </div>

          {university.website && (
            <a
              href={university.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <span>Visit Official Website</span>
              <ExternalLinkIcon className="w-3 h-3 text-slate-300" />
            </a>
          )}
        </div>

        {university.description && (
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            {university.description}
          </p>
        )}
      </div>

      {/* All Available Courses at this University */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            Programs Offered ({programs.length})
          </h2>
        </div>

        {programs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
            No specific course details indexed for this university yet.
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((prog) => (
              <div
                key={prog.id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-400 transition flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-2 flex-grow">
                  <Link
                    to={`/programs/${prog.id}`}
                    className="text-base font-bold text-slate-900 hover:text-brand-600 transition block leading-snug"
                  >
                    {prog.name}
                  </Link>

                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                      <BookIcon className="w-2.5 h-2.5" />
                      {prog.degree_type
                        ? prog.degree_type.toUpperCase()
                        : "DEGREE"}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                      <GlobeIcon className="w-2.5 h-2.5" />
                      {prog.language}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                      <EuroIcon className="w-2.5 h-2.5" />
                      {parseFloat(prog.tuition_fee_eur) === 0
                        ? "Free"
                        : `€${parseFloat(prog.tuition_fee_eur).toLocaleString()} / sem`}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col justify-end sm:justify-center items-end gap-2 min-w-[120px]">
                  <Link
                    to={`/chat?group=${prog.chat_group_id}`}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg text-center transition w-full flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ChatIcon className="w-3 h-3 text-slate-300" />
                    <span>Peer Chat</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
