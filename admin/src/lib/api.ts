import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get token from localStorage (client-side only)
function getAuthHeaders() {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Fetch wrapper with auth handling - use relative paths
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // Handle 401 - redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function fetchDashboardData() {
  try {
    const [stats, sales, profit, trends, weeklySales, peakHours, payment, topProducts, recentSales] = await Promise.all([
      apiFetch("/admin/stats"),
      apiFetch("/admin/sales-summary"),
      apiFetch("/admin/profit-summary"),
      apiFetch("/admin/revenue-trends"),
      apiFetch("/admin/weekly-sales"),
      apiFetch("/admin/peak-hours"),
      apiFetch("/admin/payment-breakdown"),
      apiFetch("/admin/top-products"),
      apiFetch("/admin/recent-sales"),
    ]);

    return {
      sales,
      profit,
      stats: {
        itemsSoldToday: stats.itemsSoldToday || 0,
        totalProducts: stats.totalProducts || 0,
        activeProducts: stats.activeProducts || 0,
        lowStockItems: stats.lowStockProducts?.length || 0,
        staffActive: 0,
      },
      revenueTrends: trends || [],
      weeklySales: weeklySales || [],
      peakHours: peakHours || [],
      paymentBreakdown: payment || [],
      topProducts: topProducts || [],
      recentSales: recentSales || [],
      lowStock: stats.lowStockProducts || [],
    };
  } catch (error) {
    console.error("Dashboard API error:", error);
    throw error;
  }
}

export { apiFetch };