import React, { useState, useEffect, useCallback } from "react";
import { vendorApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeVendors } from "@/hooks/use-realtime-vendors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Plus,
  Store,
  Mail,
  Phone,
  MapPin,
  Check,
  X,
  Image as ImageIcon,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Vendor, VendorStatus } from "@shared/api";
import { RobustVendorModal } from "./RobustVendorModal";

interface VendorManagementProps {
  className?: string;
}

const VENDOR_STATUSES: { value: VendorStatus; label: string; color: string }[] =
  [
    { value: "active", label: "Active", color: "bg-green-500" },
    { value: "inactive", label: "Inactive", color: "bg-gray-500" },
    {
      value: "pending_approval",
      label: "Pending Approval",
      color: "bg-yellow-500",
    },
    { value: "suspended", label: "Suspended", color: "bg-red-500" },
  ];

export function VendorManagement({ className }: VendorManagementProps) {
  const { session, isAuthenticated, isAdminUser, user, profile } = useAuth();
  const {
    vendors,
    loading,
    error,
    refresh,
    restartSubscription,
    testSubscription,
    stats,
  } = useRealtimeVendors();

  // Debug logging
  useEffect(() => {
    console.log("🔍 VendorManagement Auth State:", {
      isAuthenticated,
      isAdminUser,
      userEmail: user?.email,
      profileRole: profile?.role,
      sessionExists: !!session,
      hasAccessToken: !!session?.access_token,
    });
  }, [isAuthenticated, isAdminUser, user?.email, profile?.role, session]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  // Show auth error if real-time hook has permission issues
  // Add fallback admin check for development - check if user email matches admin email
  const fallbackIsAdmin = user?.email === "hello.krsolutions@gmail.com";
  const effectiveIsAdmin = isAdminUser || fallbackIsAdmin;

  const authError = !isAuthenticated
    ? "Not authenticated. Please login again."
    : !effectiveIsAdmin
      ? "Admin access required."
      : error;

  // Auto-refresh if there's an error and user is authenticated
  useEffect(() => {
    if (error && isAuthenticated && effectiveIsAdmin) {
      console.log("Auto-refreshing vendors due to error:", error);
      refresh();
    }
  }, [error, isAuthenticated, effectiveIsAdmin, refresh]);

  const handleDelete = async (vendorId: string) => {
    if (!session?.access_token) {
      toast.error("Not authenticated. Please login again.");
      return;
    }

    if (!isAuthenticated || !effectiveIsAdmin) {
      toast.error("Admin access required.");
      return;
    }

    setOperationLoading(`delete-${vendorId}`);

    try {
      const result = await vendorApi.delete(vendorId);

      if (result.success) {
        toast.success("Vendor deleted successfully");
        // No need to manually refresh - real-time subscription will handle it
      } else {
        toast.error(result.error || "Failed to delete vendor");
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Network error. Please check your connection.");
    } finally {
      setOperationLoading(null);
    }
  };

  const handleStatusChange = async (
    vendorId: string,
    newStatus: VendorStatus,
  ) => {
    if (!session?.access_token) {
      toast.error("Not authenticated. Please login again.");
      return;
    }

    if (!isAuthenticated || !effectiveIsAdmin) {
      toast.error("Admin access required.");
      return;
    }

    setOperationLoading(`status-${vendorId}`);

    try {
      const result = await vendorApi.updateStatus(vendorId, newStatus);

      if (result.success) {
        toast.success("Vendor status updated successfully");
        // No need to manually refresh - real-time subscription will handle it
      } else {
        toast.error(result.error || "Failed to update vendor status");
      }
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast.error("Network error. Please check your connection.");
    } finally {
      setOperationLoading(null);
    }
  };

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setModalMode("edit");
    setShowModal(true);
  };

  const openAddDialog = () => {
    setSelectedVendor(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    // Modal closed, real-time subscription will handle data updates automatically
    // But also manually refresh as a fallback in case real-time is not working
    console.log("✅ Vendor operation successful, refreshing data...");
    refresh();
    setShowModal(false);
    setSelectedVendor(null);
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.business_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Debug logging for vendor filtering
  useEffect(() => {
    console.log("🎯 VendorManagement Filter Debug:", {
      totalVendors: vendors.length,
      filteredVendors: filteredVendors.length,
      searchTerm,
      statusFilter,
      vendorDetails: vendors.map((v) => ({
        name: v.name,
        status: v.status,
        matchesSearch:
          v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.business_email.toLowerCase().includes(searchTerm.toLowerCase()),
        matchesStatus: statusFilter === "all" || v.status === statusFilter,
      })),
    });
  }, [vendors, filteredVendors, searchTerm, statusFilter]);

  const getStatusBadge = (status: VendorStatus) => {
    const statusConfig = VENDOR_STATUSES.find((s) => s.value === status);
    return (
      <Badge
        variant="secondary"
        className={`${statusConfig?.color} text-white`}
      >
        {statusConfig?.label}
      </Badge>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Vendor Management
                {isAuthenticated && (
                  <Badge variant="outline" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Authenticated
                  </Badge>
                )}
                {/* Real-time stats badges */}
                <div className="flex gap-1 ml-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.total} Total
                  </Badge>
                  <Badge variant="default" className="text-xs bg-green-500">
                    {stats.active} Active
                  </Badge>
                  {stats.pending > 0 && (
                    <Badge variant="default" className="text-xs bg-yellow-500">
                      {stats.pending} Pending
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Manage vendors and their business information
                {authError && (
                  <span className="text-red-500 block mt-1">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {authError}
                    {error && error.includes("subscription") && (
                      <span className="text-xs text-blue-600 ml-2">
                        (Click "Fix Sync" to retry)
                      </span>
                    )}
                    {error && error.includes("[object Object]") && (
                      <span className="text-xs text-orange-600 ml-2">
                        (Raw error detected - check console for details)
                      </span>
                    )}
                  </span>
                )}
                {!authError && !loading && (
                  <span
                    className={`block mt-1 ${error && error.includes("subscription") ? "text-yellow-600" : "text-green-600"}`}
                  >
                    {error && error.includes("subscription") ? (
                      <>
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Real-time sync issues - data updates on refresh
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Real-time sync active
                      </>
                    )}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={authError ? "default" : "outline"}
                size="sm"
                onClick={refresh}
                disabled={loading}
                className={
                  authError
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "hover:bg-gray-50"
                }
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {authError ? "Retry" : "Refresh"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🐛 DEBUG: Current vendor state:", {
                    vendorsInHook: vendors.length,
                    filteredVendors: filteredVendors.length,
                    searchTerm,
                    statusFilter,
                    allVendors: vendors,
                    filteredDetails: filteredVendors,
                  });
                  refresh();
                }}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                🐛 Debug DB
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log("🧪 Testing subscription...");
                  const result = await testSubscription();
                  toast.success(
                    `Subscription test ${result ? "passed" : "failed"} - check console for details`,
                  );
                }}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                🧪 Test Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔍 DETAILED SUBSCRIPTION ANALYSIS:");
                  console.log("Current error state:", { error, authError });
                  console.log("Authentication details:", {
                    isAuthenticated,
                    effectiveIsAdmin,
                    userEmail: user?.email,
                    sessionExists: !!session,
                  });
                  console.log("Vendor data state:", {
                    vendorCount: vendors.length,
                    loading,
                    stats,
                  });
                  console.log(
                    "You can also run: debugVendorSubscription() in console",
                  );
                  toast.info("Detailed analysis logged to console");
                }}
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                🔍 Analyze
              </Button>
              {error && error.includes("subscription") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restartSubscription}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  🔄 Fix Sync
                </Button>
              )}
              <Button
                onClick={openAddDialog}
                disabled={
                  !isAuthenticated ||
                  !effectiveIsAdmin ||
                  !session?.access_token
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as VendorStatus | "all")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {VENDOR_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendors Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading vendors...
                    </TableCell>
                  </TableRow>
                ) : filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No vendors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {vendor.logo_url ? (
                            <img
                              src={vendor.logo_url}
                              alt={`${vendor.name} logo`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Store className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              /{vendor.slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {vendor.business_email}
                          </div>
                          {vendor.business_phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {vendor.business_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={vendor.status}
                          onValueChange={(value: VendorStatus) =>
                            handleStatusChange(vendor.id, value)
                          }
                          disabled={operationLoading === `status-${vendor.id}`}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VENDOR_STATUSES.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {operationLoading === `status-${vendor.id}` && (
                          <RefreshCw className="h-3 w-3 animate-spin ml-1 inline" />
                        )}
                      </TableCell>
                      <TableCell>{vendor.commission_rate}%</TableCell>
                      <TableCell>
                        {vendor.is_verified ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(vendor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  operationLoading === `delete-${vendor.id}`
                                }
                              >
                                {operationLoading === `delete-${vendor.id}` ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Vendor
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{vendor.name}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(vendor.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                  disabled={
                                    operationLoading === `delete-${vendor.id}`
                                  }
                                >
                                  {operationLoading ===
                                  `delete-${vendor.id}` ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Robust Vendor Modal */}
      <RobustVendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        vendor={selectedVendor}
        mode={modalMode}
      />
    </div>
  );
}
