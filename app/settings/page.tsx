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
    daily_send_limit: number;
    delay_between_emails_seconds: number;
  } | null>(null);
  
  const [sheets, setSheets] = useState<{id: string, name: string}[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGoogleStatus = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
        const res = await fetch(`${API_BASE}/users/me/google-status`);
        if (res.ok) {
          const data = await res.json();
          setGoogleStatus(data);
          setDailyLimit(data.daily_send_limit || 25);
          setMinDelay(data.delay_between_emails_seconds || 60);
          
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
    
    fetchGoogleStatus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      const res = await fetch(`${API_BASE}/users/me/settings`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          daily_send_limit: dailyLimit,
          delay_between_emails_seconds: minDelay
        })
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

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
          
          {/* Email Integration (Gmail) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Integration (Gmail API)
            </label>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
              {loadingGoogle ? (
                <div className="text-sm text-gray-500">Checking connection status...</div>
              ) : googleStatus?.is_connected ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-600">Gmail Connected</div>
                      <div className="text-xs text-gray-500">{googleStatus.email}</div>
                    </div>
                    <a 
                      href={`${API_BASE}/auth/google`}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Reconnect Gmail
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
                    Connect your Gmail account to send outreach emails directly from your mailbox.
                  </div>
                  <a 
                    href={`${API_BASE}/auth/google`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Connect Gmail
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6"></div>

          {/* Daily Send Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gmail Daily Send Limit
            </label>
            <div className="text-lg text-gray-900 font-semibold">{dailyLimit} emails per day</div>
            <p className="text-xs text-gray-500 mb-2">Recommended limit: 50 for new accounts, up to 500 for aged accounts.</p>
            <input
              type="range"
              min="10"
              max="500"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value))}
              className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Send Delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay Between Emails
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={minDelay}
                onChange={(e) => setMinDelay(parseInt(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">seconds (Recommended: 60s)</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6"></div>

          {/* Follow-Up Settings (Read-only for now) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-Up Interval
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                disabled
                value={followUpAfter}
                className="w-20 px-3 py-2 border border-gray-100 bg-gray-50 rounded-md text-gray-500"
              />
              <span className="text-sm text-gray-600">days after last contact</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
