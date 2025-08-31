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
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  BarChart3,
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  newCustomers: number;
  totalProducts: number;
  pendingOrders: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    newCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

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

  const fetchAnalyticsData = async () => {
    try {
      setError(null);

      // Fetch orders for revenue and order analytics
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, status, created_at, order_items");

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      const completedOrders =
        orders?.filter((order) => order.status === "delivered") || [];
      const pendingOrdersCount =
        orders?.filter((order) => order.status === "pending").length || 0;

      // Calculate analytics
      const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0,
      );
      const totalOrders = completedOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get monthly data for the last 6 months
      const monthlyStats: {
        [key: string]: { revenue: number; orders: number };
      } = {};
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString("default", { month: "short" });
        monthlyStats[monthKey] = { revenue: 0, orders: 0 };
      }

      completedOrders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const monthKey = orderDate.toLocaleString("default", {
          month: "short",
        });
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].revenue += Number(order.total_amount);
          monthlyStats[monthKey].orders += 1;
        }
      });

      const monthlyArray = Object.entries(monthlyStats).map(
        ([month, data]) => ({
          month,
          revenue: data.revenue,
          orders: data.orders,
        }),
      );

      // Calculate top products
      const productSales: {
        [key: string]: { sales: number; revenue: number };
      } = {};

      completedOrders.forEach((order) => {
        try {
          const items =
            typeof order.order_items === "string"
              ? JSON.parse(order.order_items)
              : order.order_items;

          if (items && items.items) {
            items.items.forEach((item: any) => {
              const productName =
                item.product || item.name || "Unknown Product";
              if (!productSales[productName]) {
                productSales[productName] = { sales: 0, revenue: 0 };
              }
              productSales[productName].sales += item.quantity || 1;
              productSales[productName].revenue +=
                (item.price || 0) * (item.quantity || 1);
            });
          }
        } catch (error) {
          console.error("Error parsing order items:", error);
        }
      });

      const topProductsArray = Object.entries(productSales)
        .map(([name, data]) => ({
          name,
          sales: data.sales,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        newCustomers: usersCount || 0,
        totalProducts: productsCount || 0,
        pendingOrders: pendingOrdersCount,
      });

      setMonthlyData(monthlyArray);
      setTopProducts(topProductsArray);
    } catch (error) {
      const errorMessage = parseError(error);
      console.error("Error fetching analytics data:", errorMessage, error);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Loading analytics...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Error loading analytics</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">
                  Failed to load analytics data
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
                  onClick={fetchAnalyticsData}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your business performance and insights
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Revenue"
          value={formatCurrency(analytics.totalRevenue)}
          icon={DollarSign}
          className="bg-green-50 border-green-200"
        />

        <StatsCard
          title="Orders"
          value={analytics.totalOrders}
          icon={ShoppingCart}
          className="bg-blue-50 border-blue-200"
        />

        <StatsCard
          title="Avg Order"
          value={formatCurrency(analytics.avgOrderValue)}
          icon={TrendingUp}
          className="bg-purple-50 border-purple-200"
        />

        <StatsCard
          title="Customers"
          value={analytics.newCustomers}
          icon={Users}
          className="bg-orange-50 border-orange-200"
        />

        <StatsCard
          title="Products"
          value={analytics.totalProducts}
          icon={Package}
          className="bg-indigo-50 border-indigo-200"
        />

        <StatsCard
          title="Pending"
          value={analytics.pendingOrders}
          icon={Clock}
          className="bg-red-50 border-red-200"
        />
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>
              Revenue and order count over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => {
                const maxRevenue = Math.max(
                  ...monthlyData.map((d) => d.revenue),
                  1,
                );
                const percentage = (data.revenue / maxRevenue) * 100;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">
                          {data.month}
                        </span>
                        <span className="text-sm text-gray-500">
                          {data.orders} orders
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(data.revenue)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Top Selling Products
            </CardTitle>
            <CardDescription>
              Best performing products by sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => {
                  const maxSales = Math.max(
                    ...topProducts.map((p) => p.sales),
                    1,
                  );
                  const percentage = (product.sales / maxSales) * 100;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div
                              className="bg-green-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(5, percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-sm">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.sales} sold
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No product data available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Key insights and recent business performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {analytics.totalOrders > 0 ? "+" : ""}23%
              </p>
              <p className="text-sm text-green-600">Revenue Growth</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">
                {analytics.newCustomers}
              </p>
              <p className="text-sm text-blue-600">Total Customers</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(analytics.avgOrderValue)}
              </p>
              <p className="text-sm text-purple-600">Average Order Value</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
