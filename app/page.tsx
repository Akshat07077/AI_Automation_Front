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

type Lead = {
  id: string;
  founder_name: string;
  startup_name: string;
  email: string;
  hiring_role: string | null;
  website: string | null;
  status: "new" | "sent" | "replied" | "bounce";
  created_at: string;
  last_contacted: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchStats(): Promise<Stats> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) {
      throw new Error(`Failed to load stats: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Cannot connect to API at ${API_BASE}. Is the backend running?`);
    }
    throw error;
  }
}

async function fetchLeadsSummary(): Promise<LeadsSummary> {
  const res = await fetch(`${API_BASE}/leads/summary`);
  if (!res.ok) {
    throw new Error("Failed to load leads summary");
  }
  return res.json();
}

async function fetchLeads(page: number = 1, status?: string): Promise<{ leads: Lead[]; total: number }> {
  const params = new URLSearchParams({ page: page.toString(), page_size: "10" });
  if (status) params.append("status", status);
  
  const res = await fetch(`${API_BASE}/leads?${params}`);
  if (!res.ok) {
    throw new Error("Failed to load leads");
  }
  const data = await res.json();
  return { leads: data.leads, total: data.total };
}

type OutreachLog = {
  id: string;
  lead_id: string;
  event_type: "sent" | "replied" | "bounce";
  timestamp: string;
  email_subject: string | null;
  email_body: string | null;
  lead_founder_name: string;
  lead_startup_name: string;
  lead_email: string;
};

async function fetchOutreachLogs(
  page: number = 1,
  eventType?: string
): Promise<{ logs: OutreachLog[]; total: number }> {
  const params = new URLSearchParams({ page: page.toString(), page_size: "20" });
  if (eventType) params.append("event_type", eventType);
  
  const res = await fetch(`${API_BASE}/outreach-logs?${params}`);
  if (!res.ok) {
    throw new Error("Failed to load outreach logs");
  }
  const data = await res.json();
  return { logs: data.logs, total: data.total };
}

async function triggerImportLeads(): Promise<string> {
  const res = await fetch(`${API_BASE}/import-leads`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to import leads");
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

async function resendEmailToLead(leadId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/resend-email`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to resend email");
  }
  const data = await res.json();
  return data.message;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leadsSummary, setLeadsSummary] = useState<LeadsSummary | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<"import" | "outreach" | null>(null);
  const [resendingLeadId, setResendingLeadId] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [showErrorNotification, setShowErrorNotification] = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    setActionError(null);
    try {
      const [statsData, summaryData] = await Promise.all([
        fetchStats(),
        fetchLeadsSummary(),
      ]);
      setStats(statsData);
      setLeadsSummary(summaryData);
      setActionError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setActionError(errorMessage);
      setErrorCount(prev => prev + 1);
      setShowErrorNotification(true);
      console.error("Failed to load stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      const data = await fetchLeads(1);
      setRecentLeads(data.leads);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadOutreachLogs = async () => {
    setLoadingLogs(true);
    try {
      const eventType = logFilter === "all" ? undefined : logFilter;
      const data = await fetchOutreachLogs(1, eventType);
      setOutreachLogs(data.logs);
    } catch (err) {
      console.error("Failed to load outreach logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    void loadStats();
    void loadLeads();
    void loadOutreachLogs();
    const interval = setInterval(() => {
      void loadStats();
      void loadLeads();
      void loadOutreachLogs();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void loadOutreachLogs();
  }, [logFilter]);

  const handleImportLeads = async () => {
    setRunningAction("import");
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await triggerImportLeads();
      setActionMessage(`✓ ${msg}`);
      await Promise.all([loadStats(), loadLeads(), loadOutreachLogs()]);
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
      // Wait a bit then refresh to see updated stats
      setTimeout(async () => {
        await Promise.all([loadStats(), loadLeads(), loadOutreachLogs()]);
      }, 2000);
    } catch (err) {
      setActionError(`✗ ${(err as Error).message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const handleResendEmail = async (leadId: string) => {
    setResendingLeadId(leadId);
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await resendEmailToLead(leadId);
      setActionMessage(`✓ ${msg}`);
      // Refresh to see updated logs
      setTimeout(async () => {
        await Promise.all([loadStats(), loadLeads(), loadOutreachLogs()]);
      }, 1000);
    } catch (err) {
      setActionError(`✗ ${(err as Error).message}`);
    } finally {
      setResendingLeadId(null);
    }
  };

  const replyRatePercent = stats ? (stats.reply_rate * 100).toFixed(1) : "0.0";
  
  // Mock data for 7-day trend (in real app, fetch from API)
  const trendData = [1, 1, 3, 7, 4, 6, 1]; // Mon-Sun
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxValue = Math.max(...trendData, 8);
  
  // Use real data from API
  const leadsByStatus = {
    new: leadsSummary?.new ?? 0,
    sent: leadsSummary?.sent ?? 0,
    replied: leadsSummary?.replied ?? 0,
    bounce: leadsSummary?.bounce ?? 0,
  };
  
  // Calculate conversion rate (replies / sent)
  const conversionRate = stats && stats.sent_today > 0 
    ? ((stats.replies_today / stats.sent_today) * 100).toFixed(1)
    : "0.0";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "sent": return "bg-yellow-100 text-yellow-800";
      case "replied": return "bg-green-100 text-green-800";
      case "bounce": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "sent": return "bg-blue-100 text-blue-800";
      case "replied": return "bg-green-100 text-green-800";
      case "bounce": return "bg-red-100 text-red-800";
      case "follow_up": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <MetricCard
            title="Emails Sent Today"
            value={stats?.sent_today ?? 0}
            color="blue"
            loading={loadingStats && !stats}
          />
          <MetricCard
            title="Replies Today"
            value={stats?.replies_today ?? 0}
            color="green"
            loading={loadingStats && !stats}
          />
          <MetricCard
            title="Bounces Today"
            value={stats?.bounce_today ?? 0}
            color="red"
            loading={loadingStats && !stats}
          />
          <MetricCard
            title="Reply Rate"
            value={`${replyRatePercent}%`}
            color="purple"
            loading={loadingStats && !stats}
          />
        </div>

        {/* 7-Day Reply Trend Graph */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">7-Day Reply Trend</h3>
          <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2 overflow-x-auto">
            {days.map((day, index) => {
              const height = (trendData[index] / maxValue) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">{day}</div>
                  <div className="text-xs font-medium text-gray-900 mt-1">{trendData[index]}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{maxValue}</span>
          </div>
        </div>

        {/* Bottom Row - 4 Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Active Campaigns */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Active Campaigns</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">AI Startups</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">Python SaaS</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">Seed Stage</span>
              </div>
            </div>
          </div>

          {/* Leads by Status - Now with Real Data */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Leads by Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New</span>
                <span className="font-semibold text-gray-900">{leadsByStatus.new}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sent</span>
                <span className="font-semibold text-gray-900">{leadsByStatus.sent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Replied</span>
                <span className="font-semibold text-emerald-600">{leadsByStatus.replied}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Bounce</span>
                <span className="font-semibold text-red-600">{leadsByStatus.bounce}</span>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col items-center justify-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Conversion Rate</h3>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">{conversionRate}%</div>
          </div>

          {/* Daily Limit */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Daily Limit</h3>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">25</div>
                <div className="text-sm text-gray-600">Emails/Day</div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Sending:</div>
                <button
                  onClick={handleRunOutreach}
                  disabled={runningAction !== null}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {runningAction === "outreach" ? "Starting..." : "Active"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sent Emails / Outreach Logs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sent Emails & Activity</h3>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="sent">Sent Only</option>
                <option value="follow_up">Follow-Ups Only</option>
                <option value="replied">Replies Only</option>
                <option value="bounce">Bounces Only</option>
              </select>
              <button
                onClick={loadOutreachLogs}
                disabled={loadingLogs}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {loadingLogs ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
          {outreachLogs.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Founder</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Startup</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outreachLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <span className="sm:hidden">{new Date(log.timestamp).toLocaleDateString()}</span>
                        <span className="hidden sm:inline">{new Date(log.timestamp).toLocaleString()}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 hidden sm:table-cell">{log.lead_founder_name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">{log.lead_startup_name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{log.lead_email}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 max-w-[120px] sm:max-w-xs truncate" title={log.email_subject || ""}>
                        {log.email_subject || "-"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${getEventTypeColor(log.event_type)}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleResendEmail(log.lead_id)}
                          disabled={resendingLeadId === log.lead_id}
                          className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Resend email to this lead"
                        >
                          {resendingLeadId === log.lead_id ? "..." : "Resend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loadingLogs ? "Loading emails..." : "No emails sent yet. Run outreach batch to start sending emails."}
            </div>
          )}
        </div>

        {/* Recent Leads Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Leads</h3>
            <button
              onClick={loadLeads}
              disabled={loadingLeads}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 px-2 py-1 rounded hover:bg-blue-50"
            >
              {loadingLeads ? "Loading..." : "Refresh"}
            </button>
          </div>
          {recentLeads.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Founder</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Startup</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Role</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Created</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{lead.founder_name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{lead.startup_name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">{lead.email}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{lead.hiring_role || "-"}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleResendEmail(lead.id)}
                          disabled={resendingLeadId === lead.id}
                          className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Resend email to this lead"
                        >
                          {resendingLeadId === lead.id ? "..." : <span className="hidden sm:inline">Resend</span>}
                          <span className="sm:hidden">↻</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loadingLeads ? "Loading leads..." : "No leads yet. Import leads from Google Sheets to get started."}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <a
              href="/follow-ups"
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-purple-700 transition-colors text-center"
            >
              Manage Follow-Ups →
            </a>
            <a
              href="/activity"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
            >
              View Activity Log →
            </a>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Email Limit
              </label>
              <input
                type="number"
                defaultValue="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Delay
              </label>
              <input
                type="number"
                defaultValue="45"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sending Mode:
              </label>
              <button
                onClick={handleRunOutreach}
                disabled={runningAction !== null}
                className="w-full px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningAction === "outreach" ? "Starting..." : "Active"}
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleImportLeads}
              disabled={runningAction !== null}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningAction === "import" ? "Importing..." : "Import Leads"}
            </button>
            <button
              onClick={handleRunOutreach}
              disabled={runningAction !== null}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="mt-2 text-xs text-red-500">
                  Make sure the backend is running at {API_BASE}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Notification (Bottom Left) */}
      {showErrorNotification && errorCount > 0 && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
          <button
            onClick={() => {
              setShowErrorNotification(false);
              setErrorCount(0);
            }}
            className="ml-2 hover:bg-red-600 rounded p-1 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number | string;
  color: "blue" | "green" | "red" | "purple";
  loading?: boolean;
};

function MetricCard({ title, value, color, loading }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600">{title}</h3>
        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${colorClasses[color]}`} />
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
        {loading ? (
          <span className="inline-block h-6 sm:h-8 w-12 sm:w-16 animate-pulse bg-gray-200 rounded" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}
