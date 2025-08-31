import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  Star,
  Edit,
  MoreVertical,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { VendorStatusBadge } from "./VendorStatusBadge";
import { formatDistanceToNow } from "date-fns";
import type { Vendor } from "@shared/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VendorDetailsViewProps {
  vendor: Vendor;
  onEdit: () => void;
  onClose: () => void;
  className?: string;
}

interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  monthlyGrowth: number;
}

export function VendorDetailsView({
  vendor,
  onEdit,
  onClose,
  className,
}: VendorDetailsViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock stats - in real app, fetch from API
  const stats: VendorStats = {
    totalProducts: 156,
    activeProducts: 142,
    totalOrders: 1834,
    totalRevenue: 45670,
    averageRating: 4.6,
    totalReviews: 234,
    monthlyGrowth: 12.5,
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    copyable = false,
    href,
  }: {
    icon: any;
    label: string;
    value: string;
    copyable?: boolean;
    href?: string;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm text-foreground mt-0.5 break-words">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {value}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            value
          )}
        </div>
      </div>
      {copyable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => copyToClipboard(value, label)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    format = "number",
  }: {
    icon: any;
    label: string;
    value: number;
    change?: number;
    format?: "number" | "currency" | "percentage";
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case "currency":
          return `$${val.toLocaleString()}`;
        case "percentage":
          return `${val}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            {change !== undefined && (
              <Badge
                variant={change >= 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </Badge>
            )}
          </div>
          <div className="text-2xl font-bold mt-2">{formatValue(value)}</div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {vendor.logo_url && (
            <div className="h-16 w-16 rounded-lg border bg-muted overflow-hidden flex-shrink-0">
              <img
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{vendor.name}</h2>
              <VendorStatusBadge status={vendor.status} />
              {vendor.is_verified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{vendor.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>ID: {vendor.id.slice(0, 8)}...</span>
              <span>Slug: {vendor.slug}</span>
              <span>
                Joined {formatDistanceToNow(new Date(vendor.created_at))} ago
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
          change={8.2}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats.totalOrders}
          change={stats.monthlyGrowth}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={stats.totalRevenue}
          format="currency"
          change={15.3}
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={stats.averageRating}
          change={2.1}
        />
      </div>

      {/* Detailed Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoItem
                  icon={Mail}
                  label="Business Email"
                  value={vendor.business_email}
                  copyable
                  href={`mailto:${vendor.business_email}`}
                />
                {vendor.business_phone && (
                  <InfoItem
                    icon={Phone}
                    label="Business Phone"
                    value={vendor.business_phone}
                    copyable
                    href={`tel:${vendor.business_phone}`}
                  />
                )}
                {vendor.business_address && (
                  <InfoItem
                    icon={MapPin}
                    label="Business Address"
                    value={vendor.business_address}
                  />
                )}
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.business_registration_number && (
                  <InfoItem
                    icon={Building}
                    label="Registration Number"
                    value={vendor.business_registration_number}
                    copyable
                  />
                )}
                {vendor.tax_id && (
                  <InfoItem
                    icon={FileText}
                    label="Tax ID"
                    value={vendor.tax_id}
                    copyable
                  />
                )}
                <InfoItem
                  icon={DollarSign}
                  label="Commission Rate"
                  value={`${vendor.commission_rate}%`}
                />
                <InfoItem
                  icon={Calendar}
                  label="Payment Terms"
                  value={`${vendor.payment_terms_days} days`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Banner */}
          {vendor.banner_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Banner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <img
                    src={vendor.banner_url}
                    alt={`${vendor.name} banner`}
                    className="w-full h-32 object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Business Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {vendor.commission_rate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Commission Rate
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {vendor.payment_terms_days}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Payment Terms (Days)
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    ${vendor.minimum_order_amount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Minimum Order
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(vendor.settings, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p>Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
