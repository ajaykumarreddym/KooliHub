import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { parseError, logDetailedError } from "@/lib/debug-utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  deliveryTime: number;
  customerSatisfaction: number;

  // Growth metrics
  orderGrowth: number;
  revenueGrowth: number;

  // Status breakdown
  statusBreakdown: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };

  // Service type breakdown
  serviceBreakdown: {
    [key: string]: {
      orders: number;
      revenue: number;
      avgValue: number;
    };
  };

  // Time-based data
  dailyOrders: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;

  hourlyDistribution: Array<{
    hour: number;
    orders: number;
  }>;

  // Top customers
  topCustomers: Array<{
    user_id: string;
    user_name: string;
    total_orders: number;
    total_spent: number;
  }>;

  // Geographic data
  topLocations: Array<{
    pincode: string;
    city: string;
    orders: number;
    revenue: number;
  }>;
}

const timeRanges = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "1y", label: "Last Year" },
];

export const OrderAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [compareRange, setCompareRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const days = parseInt(timeRange.replace("d", "")) || 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const compareDays = parseInt(compareRange.replace("d", "")) || 365;
      const compareStartDate = new Date();
      compareStartDate.setDate(
        compareStartDate.getDate() - (days + compareDays),
      );
      const compareEndDate = new Date();
      compareEndDate.setDate(compareEndDate.getDate() - days);

      // Fetch current period orders
      const { data: currentOrders, error: currentError } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles!orders_user_id_fkey(full_name, email)
        `,
        )
        .gte("created_at", startDate.toISOString());

      if (currentError) {
        logDetailedError("Fetching Current Orders", currentError);
        throw currentError;
      }

      // Fetch comparison period orders
      const { data: compareOrders, error: compareError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", compareStartDate.toISOString())
        .lt("created_at", compareEndDate.toISOString());

      if (compareError) {
        logDetailedError("Fetching Compare Orders", compareError);
        throw compareError;
      }

      const analytics = calculateAnalytics(
        currentOrders || [],
        compareOrders || [],
      );
      setAnalytics(analytics);
    } catch (error) {
      logDetailedError("Analytics Fetch Exception", error);
      toast.error(`Failed to fetch analytics: ${parseError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    currentOrders: any[],
    compareOrders: any[],
  ): AnalyticsData => {
    // Basic metrics
    const totalOrders = currentOrders.length;
    const totalRevenue = currentOrders
      .filter((o) => o.payment_status === "completed")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Compare period metrics
    const compareTotalOrders = compareOrders.length;
    const compareTotalRevenue = compareOrders
      .filter((o) => o.payment_status === "completed")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Growth calculations
    const orderGrowth =
      compareTotalOrders > 0
        ? ((totalOrders - compareTotalOrders) / compareTotalOrders) * 100
        : 0;
    const revenueGrowth =
      compareTotalRevenue > 0
        ? ((totalRevenue - compareTotalRevenue) / compareTotalRevenue) * 100
        : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: currentOrders.filter((o) => o.status === "pending").length,
      confirmed: currentOrders.filter((o) => o.status === "confirmed").length,
      processing: currentOrders.filter((o) => o.status === "processing").length,
      shipped: currentOrders.filter((o) => o.status === "shipped").length,
      delivered: currentOrders.filter((o) => o.status === "delivered").length,
      cancelled: currentOrders.filter((o) => o.status === "cancelled").length,
    };

    // Service type breakdown
    const serviceBreakdown: { [key: string]: any } = {};
    currentOrders.forEach((order) => {
      const service = order.service_type;
      if (!serviceBreakdown[service]) {
        serviceBreakdown[service] = { orders: 0, revenue: 0, avgValue: 0 };
      }
      serviceBreakdown[service].orders++;
      if (order.payment_status === "completed") {
        serviceBreakdown[service].revenue += Number(order.total_amount);
      }
    });

    // Calculate average values for services
    Object.keys(serviceBreakdown).forEach((service) => {
      const data = serviceBreakdown[service];
      data.avgValue = data.orders > 0 ? data.revenue / data.orders : 0;
    });

    // Daily orders (last 30 days)
    const dailyOrders: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayOrders = currentOrders.filter((o) =>
        o.created_at.startsWith(dateStr),
      );

      dailyOrders.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders
          .filter((o) => o.payment_status === "completed")
          .reduce((sum, o) => sum + Number(o.total_amount), 0),
      });
    }

    // Hourly distribution
    const hourlyDistribution: any[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourOrders = currentOrders.filter((o) => {
        const orderHour = new Date(o.created_at).getHours();
        return orderHour === hour;
      });

      hourlyDistribution.push({
        hour,
        orders: hourOrders.length,
      });
    }

    // Top customers
    const customerMap: { [key: string]: any } = {};
    currentOrders.forEach((order) => {
      const userId = order.user_id;
      if (!customerMap[userId]) {
        customerMap[userId] = {
          user_id: userId,
          user_name:
            order.profiles?.full_name || order.profiles?.email || "Unknown",
          total_orders: 0,
          total_spent: 0,
        };
      }
      customerMap[userId].total_orders++;
      if (order.payment_status === "completed") {
        customerMap[userId].total_spent += Number(order.total_amount);
      }
    });

    const topCustomers = Object.values(customerMap)
      .sort((a: any, b: any) => b.total_spent - a.total_spent)
      .slice(0, 10);

    // Top locations
    const locationMap: { [key: string]: any } = {};
    currentOrders.forEach((order) => {
      const key = `${order.delivery_pincode}`;
      if (!locationMap[key]) {
        locationMap[key] = {
          pincode: order.delivery_pincode,
          city: order.delivery_address.split(",").pop()?.trim() || "Unknown",
          orders: 0,
          revenue: 0,
        };
      }
      locationMap[key].orders++;
      if (order.payment_status === "completed") {
        locationMap[key].revenue += Number(order.total_amount);
      }
    });

    const topLocations = Object.values(locationMap)
      .sort((a: any, b: any) => b.orders - a.orders)
      .slice(0, 10);

    // Calculate delivery time and satisfaction (mock data for now)
    const deliveryTime = 2.5; // hours
    const customerSatisfaction = 4.2; // out of 5

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      deliveryTime,
      customerSatisfaction,
      orderGrowth,
      revenueGrowth,
      statusBreakdown,
      serviceBreakdown,
      dailyOrders,
      hourlyDistribution,
      topCustomers,
      topLocations,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const data = {
      summary: {
        totalOrders: analytics.totalOrders,
        totalRevenue: analytics.totalRevenue,
        avgOrderValue: analytics.avgOrderValue,
        orderGrowth: analytics.orderGrowth,
        revenueGrowth: analytics.revenueGrowth,
      },
      statusBreakdown: analytics.statusBreakdown,
      serviceBreakdown: analytics.serviceBreakdown,
      topCustomers: analytics.topCustomers,
      topLocations: analytics.topLocations,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Analytics</h1>
          <p className="text-gray-500">
            Comprehensive order and revenue insights
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <div className="flex items-center text-sm">
              {getGrowthIcon(analytics.orderGrowth)}
              <span
                className={
                  analytics.orderGrowth >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {formatPercent(analytics.orderGrowth)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <div className="flex items-center text-sm">
              {getGrowthIcon(analytics.revenueGrowth)}
              <span
                className={
                  analytics.revenueGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatPercent(analytics.revenueGrowth)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.avgOrderValue)}
            </div>
            <div className="text-sm text-gray-500">Per order</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Delivery Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.deliveryTime}h</div>
            <div className="text-sm text-gray-500">Average</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.customerSatisfaction}/5
            </div>
            <div className="text-sm text-gray-500">Customer rating</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.statusBreakdown).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              {
                                pending: "bg-yellow-400",
                                confirmed: "bg-blue-400",
                                processing: "bg-purple-400",
                                shipped: "bg-indigo-400",
                                delivered: "bg-green-400",
                                cancelled: "bg-red-400",
                              }[status]
                            }`}
                          />
                          <span className="capitalize">{status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{count}</span>
                          <span className="text-sm text-gray-500">
                            (
                            {analytics.totalOrders > 0
                              ? ((count / analytics.totalOrders) * 100).toFixed(
                                  1,
                                )
                              : 0}
                            %)
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.hourlyDistribution
                    .sort((a, b) => b.orders - a.orders)
                    .slice(0, 6)
                    .map((hour) => (
                      <div
                        key={hour.hour}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {hour.hour.toString().padStart(2, "0")}:00 -{" "}
                          {(hour.hour + 1).toString().padStart(2, "0")}:00
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(hour.orders / Math.max(...analytics.hourlyDistribution.map((h) => h.orders))) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">
                            {hour.orders}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.serviceBreakdown)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([service, data]) => (
                    <div key={service} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold capitalize">
                          {service.replace("-", " ")}
                        </h3>
                        <Badge variant="outline">{data.orders} orders</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Revenue</div>
                          <div className="font-medium">
                            {formatCurrency(data.revenue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Avg Order Value</div>
                          <div className="font-medium">
                            {formatCurrency(data.avgValue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Share</div>
                          <div className="font-medium">
                            {analytics.totalRevenue > 0
                              ? (
                                  (data.revenue / analytics.totalRevenue) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, index) => (
                  <div
                    key={customer.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{customer.user_name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.total_orders} orders
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(customer.total_spent)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(
                          customer.total_spent / customer.total_orders,
                        )}{" "}
                        avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Top Delivery Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topLocations.map((location, index) => (
                  <div
                    key={location.pincode}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{location.city}</div>
                        <div className="text-sm text-gray-500">
                          Pincode: {location.pincode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {location.orders} orders
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(location.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
