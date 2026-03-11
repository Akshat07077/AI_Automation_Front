"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useState(100);
  const [minDelay, setMinDelay] = useState(30);
  const [maxDelay, setMaxDelay] = useState(90);
  const [followUpAfter, setFollowUpAfter] = useState(3);
  const [maxFollowUps, setMaxFollowUps] = useState(2);
  const [agentStatus, setAgentStatus] = useState(true);
  const [googleStatus, setGoogleStatus] = useState<{
    is_connected: boolean;
    email: string | null;
    sheet_id: string | null;
  } | null>(null);
  
  const [sheets, setSheets] = useState<{id: string, name: string}[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(true);

  useEffect(() => {
    const fetchGoogleStatus = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
        const res = await fetch(`${API_BASE}/users/me/google-status`);
        if (res.ok) {
          const data = await res.json();
          setGoogleStatus(data);
          
          if (data.is_connected) {
            const sheetsRes = await fetch(`${API_BASE}/google/sheets`);
            if (sheetsRes.ok) {
              const sheetsData = await sheetsRes.json();
              setSheets(sheetsData.sheets);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check Google integration status:", err);
      } finally {
        setLoadingGoogle(false);
      }
    };
    
    // Check if we just returned from OAuth callback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_auth_success")) {
        // Strip the query param to clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    fetchGoogleStatus();
  }, []);

  const handleSelectSheet = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSheetId = e.target.value;
    if (!newSheetId) return;
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      await fetch(`${API_BASE}/google/select-sheet`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ sheet_id: newSheetId })
      });
      setGoogleStatus(prev => prev ? {...prev, sheet_id: newSheetId} : null);
    } catch (err) {
      console.error("Failed to select sheet", err);
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          
          {/* Google Integration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Integration
            </label>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
              {loadingGoogle ? (
                <div className="text-sm text-gray-500">Checking connection status...</div>
              ) : googleStatus?.is_connected ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Connected</div>
                      <div className="text-xs text-gray-500">{googleStatus.email}</div>
                    </div>
                    <a 
                      href={`${API_BASE}/auth/google`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Reconnect
                    </a>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Lead Source Sheet
                    </label>
                    <select 
                      value={googleStatus.sheet_id || ""}
                      onChange={handleSelectSheet}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>Select a spreadsheet...</option>
                      {sheets.map(sheet => (
                        <option key={sheet.id} value={sheet.id}>
                          {sheet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <div className="text-sm text-gray-600">
                    Connect your Google account to select a spreadsheet containing your leads.
                  </div>
                  <a 
                    href={`${API_BASE}/auth/google`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Connect Google
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6"></div>

          {/* Daily Send Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Send Limit
            </label>
            <div className="text-lg text-gray-900">{dailyLimit} emails per day</div>
            <input
              type="range"
              min="10"
              max="500"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          {/* Send Delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Delay
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Delay:</label>
                <input
                  type="number"
                  value={minDelay}
                  onChange={(e) => setMinDelay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 mt-1">sec</span>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Delay:</label>
                <input
                  type="number"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 mt-1">sec</span>
              </div>
            </div>
          </div>

          {/* Follow-Up Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-Up Settings
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Follow-Up After:</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={followUpAfter}
                    onChange={(e) => setFollowUpAfter(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">days</span>
                  <button
                    onClick={() => setFollowUpAfter(followUpAfter)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      true ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Max Follow-Ups:</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={maxFollowUps}
                    onChange={(e) => setMaxFollowUps(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setMaxFollowUps(maxFollowUps)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      true ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Status */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Agent Status</span>
              <button
                onClick={() => setAgentStatus(!agentStatus)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  agentStatus ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    agentStatus ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
