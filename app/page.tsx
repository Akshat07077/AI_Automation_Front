"use client";

import { useEffect, useState } from "react";

type Stats = {
  sent_today: number;
  replies_today: number;
  bounce_today: number;
  reply_rate: number;
};

type LeadsSummary = {
  total: number;
  new: number;
  sent: number;
  replied: number;
  bounce: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Helper function to create fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url} took longer than ${timeout}ms`);
    }
    throw error;
  }
}

async function fetchStats(): Promise<Stats> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/stats`, {}, 20000);
    if (!res.ok) {
      throw new Error(`Failed to load stats: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Cannot connect to API at ${API_BASE}. Is the backend running?`);
    }
    if (error instanceof Error && error.message.includes("timeout")) {
      throw new Error(`Request to ${API_BASE}/stats timed out. The backend may be slow or unresponsive.`);
    }
    throw error;
  }
}

async function fetchLeadsSummary(): Promise<LeadsSummary> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/leads/summary`, {}, 20000);
    if (!res.ok) {
      throw new Error("Failed to load leads summary");
    }
    return res.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      throw new Error(`Request to ${API_BASE}/leads/summary timed out. The backend may be slow or unresponsive.`);
    }
    throw error;
  }
}

async function triggerImportLeads(): Promise<string> {
  const res = await fetch(`${API_BASE}/import-leads`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to import leads" }));
    throw new Error(errorData.detail || "Failed to import leads");
  }
  const data = await res.json();
  return `Inserted ${data.inserted}, skipped ${data.skipped_duplicates}`;
}

async function triggerRunOutreach(): Promise<string> {
  const res = await fetch(`${API_BASE}/run-outreach`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to start outreach");
  }
  const data = await res.json();
  return data.detail ?? "Outreach started";
}

// Helper to get last 7 days data for trends
function getLast7DaysData() {
  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();
    days.push({ label: `${dayName} ${dayNum}`, date });
  }
  return days;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leadsSummary, setLeadsSummary] = useState<LeadsSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<"import" | "outreach" | null>(null);
  const [agentActive, setAgentActive] = useState(true);
  const [dailyLimit] = useState(100);
  const [emailsRemaining, setEmailsRemaining] = useState(42);

  // Mock 7-day data (will be replaced with real data later)
  const emailsSentData = [1, 1, 3, 7, 4, 6, 1];
  const repliesReceivedData = [0, 0, 1, 2, 1, 1, 0];
  const days = getLast7DaysData();

  const loadStats = async () => {
    setLoadingStats(true);
    setActionError(null);
    try {
      const [statsResult, summaryResult] = await Promise.allSettled([
        fetchStats(),
        fetchLeadsSummary(),
      ]);
      
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      }
      
      if (summaryResult.status === "fulfilled") {
        setLeadsSummary(summaryResult.value);
        // Update emails remaining based on sent today
        if (statsResult.status === "fulfilled") {
          setEmailsRemaining(Math.max(0, dailyLimit - statsResult.value.sent_today));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setActionError(errorMessage);
      console.error("Failed to load stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    void loadStats();
    const interval = setInterval(() => {
      void loadStats();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleImportLeads = async () => {
    setRunningAction("import");
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await triggerImportLeads();
      setActionMessage(`✓ ${msg}`);
      await loadStats();
    } catch (err) {
      setActionError(`✗ ${(err as Error).message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const handleRunOutreach = async () => {
    setRunningAction("outreach");
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await triggerRunOutreach();
      setActionMessage(`✓ ${msg}`);
      setTimeout(async () => {
        await loadStats();
      }, 2000);
    } catch (err) {
      setActionError(`✗ ${(err as Error).message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const replyRatePercent = stats ? (stats.reply_rate * 100).toFixed(1) : "0.0";
  const maxEmailsSent = Math.max(...emailsSentData, 8);
  const maxReplies = Math.max(...repliesReceivedData, 8);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Emails Sent Today"
            value={stats?.sent_today ?? 0}
            color="red"
            loading={loadingStats && !stats}
            showTrend={true}
          />
          <MetricCard
            title="Replies Today"
            value={`${stats?.replies_today ?? 0} (${replyRatePercent}%)`}
            color="green"
            loading={loadingStats && !stats}
            showTrend={true}
          />
          <MetricCard
            title="Reply Rate"
            value={`${replyRatePercent}%`}
            color="green"
            loading={loadingStats && !stats}
            showTrend={true}
          />
          <MetricCard
            title="Bounces"
            value={stats?.bounce_today ?? 0}
            color="red"
            loading={loadingStats && !stats}
            showTrend={true}
          />
        </div>

        {/* Graphs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Emails Sent (Last 7 Days) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails Sent (Last 7 Days)</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {days.map((day, index) => {
                const height = (emailsSentData[index] / maxEmailsSent) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center h-full">
                      <div
                        className="w-full bg-red-500 rounded-t transition-all duration-500 hover:bg-red-600"
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{day.label}</div>
                    <div className="text-xs font-medium text-gray-900 mt-1">{emailsSentData[index]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Replies Received (Last 7 Days) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Replies Received (Last 7 Days)</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {days.map((day, index) => {
                const height = (repliesReceivedData[index] / maxReplies) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center h-full">
                      <div
                        className="w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{day.label}</div>
                    <div className="text-xs font-medium text-gray-900 mt-1">{repliesReceivedData[index]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agent Control & Pipeline Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Agent Control */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Control</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Active</span>
                <button
                  onClick={() => setAgentActive(!agentActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    agentActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      agentActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={handleRunOutreach}
                disabled={runningAction !== null || !agentActive}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningAction === "outreach" ? "Starting..." : "Run Batch"}
              </button>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Daily Limit</span>
                  <span className="text-sm font-medium text-gray-900">{dailyLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${((dailyLimit - emailsRemaining) / dailyLimit) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Emails Remaining: {emailsRemaining}/{dailyLimit}
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h3>
            <div className="space-y-4">
              <PipelineMetric
                label="New Leads"
                value={leadsSummary?.new ?? 0}
                color="green"
                loading={loadingStats && !leadsSummary}
              />
              <PipelineMetric
                label="Sent"
                value={leadsSummary?.sent ?? 0}
                color="green"
                loading={loadingStats && !leadsSummary}
              />
              <PipelineMetric
                label="Replied"
                value={leadsSummary?.replied ?? 0}
                color="green"
                loading={loadingStats && !leadsSummary}
              />
              <PipelineMetric
                label="Follow-ups Due"
                value={0}
                color="blue"
                loading={false}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleImportLeads}
              disabled={runningAction !== null}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningAction === "import" ? "Importing..." : "Import Leads"}
            </button>
            <button
              onClick={handleRunOutreach}
              disabled={runningAction !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningAction === "outreach" ? "Starting..." : "Run Outreach Batch"}
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-4 space-y-2">
            {actionMessage && (
              <div className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-md border border-emerald-200">
                {actionMessage}
              </div>
            )}
            {actionError && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-200">
                <div className="font-semibold mb-1">Error:</div>
                <div>{actionError}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number | string;
  color: "blue" | "green" | "red" | "purple";
  loading?: boolean;
  showTrend?: boolean;
};

function MetricCard({ title, value, color, loading, showTrend }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse bg-gray-200 rounded" />
        ) : (
          value
        )}
      </div>
      {showTrend && (
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${colorClasses[color]} w-1/3`} />
        </div>
      )}
    </div>
  );
}

type PipelineMetricProps = {
  label: string;
  value: number;
  color: "green" | "blue";
  loading?: boolean;
};

function PipelineMetric({ label, value, color, loading }: PipelineMetricProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="inline-block h-5 w-8 animate-pulse bg-gray-200 rounded" />
        ) : (
          <>
            <span className="font-semibold text-gray-900">{value}</span>
            <div className={`w-16 h-1 rounded-full ${color === "green" ? "bg-green-500" : "bg-blue-500"}`} />
          </>
        )}
      </div>
    </div>
  );
}
