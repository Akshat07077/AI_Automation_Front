"use client";

import { useEffect, useState } from "react";

type Campaign = {
  name: string;
  leads: number;
  sent: number;
  replies: number;
  replyRate: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchLeadsSummary(): Promise<any> {
  const res = await fetch(`${API_BASE}/leads/summary`);
  if (!res.ok) {
    throw new Error("Failed to load leads summary");
  }
  return res.json();
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const summary = await fetchLeadsSummary();
        // For now, create mock campaigns based on summary data
        // In the future, this would come from a campaigns API
        setCampaigns([
          {
            name: "AI Startups",
            leads: summary.total || 37,
            sent: summary.sent || 58,
            replies: summary.replied || 12,
            replyRate: summary.sent > 0 ? Number(((summary.replied / summary.sent) * 100).toFixed(2)) : 0,
          },
          {
            name: "SaaS Companies",
            leads: 33,
            sent: 40,
            replies: 15,
            replyRate: 7.8,
          },
          {
            name: "Fintech Prospects",
            leads: 22,
            sent: 20,
            replies: 10,
            replyRate: 8.11,
          },
          {
            name: "HealthTech Leads",
            leads: 33,
            sent: 28,
            replies: 6,
            replyRate: 7.35,
          },
        ]);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {campaigns.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Replies
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reply Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {campaign.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {campaign.leads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {campaign.sent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {campaign.replies}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={parseFloat(campaign.replyRate.toString()) > 5 ? "text-green-600 font-medium" : "text-gray-600"}>
                            {campaign.replyRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing 1-{campaigns.length} of {campaigns.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &lt;
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-gray-900">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={campaigns.length <= currentPage * 20}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={campaigns.length <= currentPage * 20}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? "Loading campaigns..." : "No campaigns found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
