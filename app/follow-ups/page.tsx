"use client";

import { useEffect, useState } from "react";

type FollowUpLead = {
  id: string;
  founder_name: string;
  startup_name: string;
  email: string;
  hiring_role: string | null;
  status: string;
  follow_up_count: number;
  next_follow_up_date: string | null;
  days_since_last_contact: number | null;
  last_contacted: string | null;
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

async function fetchFollowUps(
  page: number = 1,
  status: string = "ready"
): Promise<{ leads: FollowUpLead[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: "50",
    status: status,
  });

  try {
    const res = await fetchWithTimeout(`${API_BASE}/follow-ups?${params}`, {}, 20000);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to load follow-ups: ${res.status} ${res.statusText}. ${errorText}`);
    }
    const data = await res.json();
    return { leads: data.leads, total: data.total };
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      throw new Error(`Request to ${API_BASE}/follow-ups timed out. The backend may be slow or unresponsive.`);
    }
    throw error;
  }
}

async function sendFollowUp(leadId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/send-follow-up/${leadId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to send follow-up");
  }
  const data = await res.json();
  return data.message;
}

async function processFollowUps(): Promise<string> {
  const res = await fetch(`${API_BASE}/process-follow-ups`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to process follow-ups");
  }
  const data = await res.json();
  return data.message;
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<FollowUpLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ready");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);

  const loadFollowUps = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await fetchFollowUps(1, statusFilter);
      setLeads(data.leads);
      // Log for debugging
      console.log(`Loaded ${data.leads.length} leads (total: ${data.total}) with filter: ${statusFilter}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setActionError(`Failed to load follow-ups: ${errorMessage}`);
      console.error("Error loading follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFollowUps();
    const interval = setInterval(() => {
      void loadFollowUps();
    }, 30_000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleSendFollowUp = async (leadId: string) => {
    setSendingLeadId(leadId);
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await sendFollowUp(leadId);
      setActionMessage(`✓ ${msg}`);
      await loadFollowUps();
    } catch (err) {
      setActionError(`✗ ${(err as Error).message}`);
    } finally {
      setSendingLeadId(null);
    }
  };

  const handleProcessAll = async () => {
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await processFollowUps();
      setActionMessage(`✓ ${msg}`);
      await loadFollowUps();
    } catch (err) {
      setActionError(`✗ ${(err as Error).message}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (lead: FollowUpLead) => {
    if (lead.next_follow_up_date) {
      const nextDate = new Date(lead.next_follow_up_date);
      const now = new Date();
      if (nextDate <= now) {
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Due Now
          </span>
        );
      } else {
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Scheduled
          </span>
        );
      }
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        No Follow-up
      </span>
    );
  };

  const readyCount = leads.filter(
    (lead) =>
      lead.next_follow_up_date &&
      new Date(lead.next_follow_up_date) <= new Date()
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and send follow-up emails to leads who haven't replied
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Note: Only leads with status "sent" appear here. Send emails from Dashboard first.
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ready">Due Now ({readyCount})</option>
                <option value="pending">Scheduled</option>
                <option value="all">All Sent Leads</option>
              </select>
              <button
                onClick={handleProcessAll}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Process All Due
              </button>
            </div>
            <button
              onClick={loadFollowUps}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 px-4 py-2 rounded hover:bg-blue-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Status Messages */}
          {actionMessage && (
            <div className="mt-4 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-md border border-emerald-200">
              {actionMessage}
            </div>
          )}
          {actionError && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-200">
              {actionError}
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {leads.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Founder
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Startup
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow-ups
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Days Since
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Next Follow-up
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        <div className="sm:hidden">
                          <div>{lead.founder_name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{lead.startup_name}</div>
                        </div>
                        <span className="hidden sm:inline">{lead.founder_name}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                        {lead.startup_name}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                        {lead.email}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {lead.follow_up_count} / 3
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                        {lead.days_since_last_contact ?? "-"} days
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                        {formatDate(lead.next_follow_up_date)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        {getStatusBadge(lead)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        {lead.follow_up_count < 3 ? (
                          <button
                            onClick={() => handleSendFollowUp(lead.id)}
                            disabled={sendingLeadId === lead.id || loading}
                            className="px-2 sm:px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingLeadId === lead.id
                              ? "..."
                              : <span className="hidden sm:inline">Send</span>}
                            <span className="sm:hidden">↻</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Max
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading
                ? "Loading follow-ups..."
                : statusFilter === "ready"
                ? "No follow-ups due at the moment."
                : statusFilter === "pending"
                ? "No scheduled follow-ups found."
                : statusFilter === "all"
                ? "No sent leads found. Make sure you have sent emails to leads first."
                : "No leads found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
