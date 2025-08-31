import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/common/StatsCard";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useRealtimeStats, useRealtimeOrders } from "@/hooks/use-realtime";
import { debugSupabaseConnection } from "@/lib/debug-utils";
import {
  Users,
  Package,
  ShoppingCart,
  MapPin,
  TrendingUp,
  Clock,
  AlertCircle,
  Bug,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  serviceableAreas: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats: realtimeStats, loading: statsLoading } = useRealtimeStats();
  const { orders: recentOrders, loading: ordersLoading } = useRealtimeOrders();
  const [additionalStats, setAdditionalStats] = useState({
    totalProducts: 0,
    serviceableAreas: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdditionalStats();
  }, []);

  useEffect(() => {
    setLoading(statsLoading || ordersLoading);
  }, [statsLoading, ordersLoading]);

  const parseError = (error: any): string => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    if (typeof error === "object") {
      try {
        return JSON.stringify(error, null, 2);
      } catch {
        return "Unknown error occurred";
      }
    }
    return "Unknown error occurred";
  };

  const fetchAdditionalStats = async () => {
    try {
      setError(null);

      const [productsResult, areasResult, revenueOrdersResult] =
        await Promise.allSettled([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("serviceable_areas")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("payment_status", "completed"),
        ]);

      // Process results and handle any errors
      const getValue = (result: any, defaultValue: any = 0) => {
        if (result.status === "fulfilled") {
          if (result.value.count !== undefined) return result.value.count || 0;
          if (result.value.data) return result.value.data;
          return result.value || defaultValue;
        }
        console.warn("Failed to fetch data:", result.reason);
        return defaultValue;
      };

      // Calculate revenue safely
      const revenueData = getValue(revenueOrdersResult, []);
      const revenue = Array.isArray(revenueData)
        ? revenueData.reduce(
            (sum: number, order: any) =>
              sum + (Number(order.total_amount) || 0),
            0,
          )
        : 0;

      setAdditionalStats({
        totalProducts: getValue(productsResult),
        serviceableAreas: getValue(areasResult),
        totalRevenue: revenue,
      });
    } catch (error) {
      const errorMessage = parseError(error);
      console.error("Error fetching additional stats:", errorMessage, error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleDebugConnection = async () => {
    await debugSupabaseConnection();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Error loading dashboard</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">
                  Failed to load dashboard data
                </p>
                <details className="mt-2">
                  <summary className="text-red-600 text-sm cursor-pointer">
                    Error details
                  </summary>
                  <pre className="text-red-600 text-xs mt-1 whitespace-pre-wrap">
                    {error}
                  </pre>
                </details>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAdditionalStats}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
        <p className="text-blue-100 mt-2">
          Here's what's happening with your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Users"
          value={realtimeStats.totalUsers}
          icon={Users}
          loading={loading}
          className="bg-blue-50 border-blue-200"
        />

        <StatsCard
          title="Products"
          value={additionalStats.totalProducts}
          icon={Package}
          loading={loading}
          className="bg-green-50 border-green-200"
        />

        <StatsCard
          title="Orders"
          value={realtimeStats.totalOrders}
          icon={ShoppingCart}
          loading={loading}
          className="bg-purple-50 border-purple-200"
        />

        <StatsCard
          title="Revenue"
          value={formatCurrency(additionalStats.totalRevenue)}
          icon={TrendingUp}
          loading={loading}
          className="bg-orange-50 border-orange-200"
        />

        <StatsCard
          title="Today"
          value={realtimeStats.todayOrders}
          icon={Clock}
          loading={loading}
          className="bg-indigo-50 border-indigo-200"
        />

        <StatsCard
          title="Pending"
          value={realtimeStats.pendingOrders}
          icon={MapPin}
          loading={loading}
          className="bg-red-50 border-red-200"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-16 flex-col gap-1"
                onClick={() => navigate("/admin/inventory")}
              >
                <Package className="h-4 w-4" />
                <span className="text-xs">Inventory</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-16 flex-col gap-1"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="h-4 w-4" />
                <span className="text-xs">Users</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-16 flex-col gap-1"
                onClick={() => navigate("/admin/service-areas")}
              >
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Areas</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-16 flex-col gap-1"
                onClick={() => navigate("/admin/analytics")}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Analytics</span>
              </Button>
            </div>

            <div className="col-span-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleDebugConnection}
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug Database Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription className="text-sm">
              Latest customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.delivery_address}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(order.total_amount))}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No orders yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
