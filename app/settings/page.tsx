"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useState(100);
  const [minDelay, setMinDelay] = useState(30);
  const [maxDelay, setMaxDelay] = useState(90);
  const [followUpAfter, setFollowUpAfter] = useState(3);
  const [maxFollowUps, setMaxFollowUps] = useState(2);
  const [agentStatus, setAgentStatus] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
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
