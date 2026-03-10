"use client";

import { useEffect, useState } from "react";

type ActivityEntry = {
  id: string;
  timestamp: string;
  type: "email_sent" | "email_replied" | "email_bounced" | "follow_up_sent" | "unknown";
  title: string;
  description: string;
  lead_id: string | null;
  lead_founder_name: string | null;
  lead_startup_name: string | null;
  lead_email: string | null;
  email_subject: string | null;
  metadata: Record<string, any> | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchActivityLog(
  page: number = 1,
  eventType?: string
): Promise<{ entries: ActivityEntry[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: "50",
  });
  if (eventType && eventType !== "all") {
    params.append("event_type", eventType);
  }

  const res = await fetch(`${API_BASE}/activity-log?${params}`);
  if (!res.ok) {
    throw new Error("Failed to load activity log");
  }
  const data = await res.json();
  return { entries: data.entries, total: data.total };
}

async function fetchActivitySummary(): Promise<any> {
  const res = await fetch(`${API_BASE}/activity-log/summary?days=7`);
  if (!res.ok) {
    throw new Error("Failed to load activity summary");
  }
  return res.json();
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const loadActivityLog = async () => {
    setLoading(true);
    try {
      const [logData, summaryData] = await Promise.all([
        fetchActivityLog(currentPage, eventFilter),
        fetchActivitySummary(),
      ]);
      setEntries(logData.entries);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivityLog();
    const interval = setInterval(() => {
      void loadActivityLog();
    }, 30_000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [eventFilter, currentPage]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email_sent":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "follow_up_sent":
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case "email_replied":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "email_bounced":
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "email_sent":
        return "border-blue-200 bg-blue-50";
      case "follow_up_sent":
        return "border-purple-200 bg-purple-50";
      case "email_replied":
        return "border-green-200 bg-green-50";
      case "email_bounced":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Emails Sent</div>
              <div className="text-2xl font-bold text-gray-900">{summary.sent}</div>
              <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Follow-Ups</div>
              <div className="text-2xl font-bold text-gray-900">{summary.follow_ups}</div>
              <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Replies</div>
              <div className="text-2xl font-bold text-green-600">{summary.replied}</div>
              <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Bounces</div>
              <div className="text-2xl font-bold text-red-600">{summary.bounced}</div>
              <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="sent">Emails Sent</option>
              <option value="follow_up">Follow-Ups</option>
              <option value="replied">Replies</option>
              <option value="bounce">Bounces</option>
            </select>
            <button
              onClick={() => loadActivityLog()}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 px-4 py-2 rounded hover:bg-blue-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {entries.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-6 border-l-4 ${getActivityColor(entry.type)} hover:bg-opacity-80 transition-colors`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getActivityIcon(entry.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {entry.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {entry.description}
                      </p>
                      {entry.email_subject && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Subject:</span> <span className="break-words">{entry.email_subject}</span>
                        </div>
                      )}
                      {entry.lead_founder_name && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <span className="font-medium">Founder:</span> {entry.lead_founder_name}
                          </span>
                          <span>
                            <span className="font-medium">Startup:</span> {entry.lead_startup_name}
                          </span>
                          <span className="break-all">
                            <span className="font-medium">Email:</span> {entry.lead_email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? "Loading activity log..." : "No activity found. Start sending emails to see activity here."}
            </div>
          )}
        </div>

        {/* Pagination */}
        {entries.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={entries.length < 50 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
