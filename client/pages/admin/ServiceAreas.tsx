import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddServiceAreaModal } from "@/components/admin/AddServiceAreaModal";
import { EditServiceAreaModal } from "@/components/admin/EditServiceAreaModal";
import { useRealtimeServiceAreas } from "@/hooks/use-realtime";
import {
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  Filter,
  Download,
  MoreHorizontal,
  Navigation,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SafeTable } from "@/components/common/SafeTableWrapper";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { handleError } from "@/lib/error-utils";

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours: number | null;
  delivery_charge: number | null;
  coordinates: any; // JSONB field from database
  created_at: string;
  updated_at: string;
}

export const ServiceAreas: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { areas: serviceAreas, loading } = useRealtimeServiceAreas();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeAreas: 0,
    totalPincodes: 0,
    avgDeliveryTime: 0,
    totalStates: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [serviceAreas]);

  const calculateStats = useCallback(() => {
    if (!serviceAreas.length) return;

    const activeAreas = serviceAreas.filter(
      (area) => area.is_serviceable,
    ).length;
    const totalPincodes = serviceAreas.length;
    const validDeliveryTimes = serviceAreas.filter(
      (area) => area.delivery_time_hours !== null,
    );
    const avgTime =
      validDeliveryTimes.length > 0
        ? validDeliveryTimes.reduce(
            (sum, area) => sum + (area.delivery_time_hours || 0),
            0,
          ) / validDeliveryTimes.length
        : 0;
    const uniqueStates = new Set(serviceAreas.map((area) => area.state)).size;

    setStats({
      activeAreas,
      totalPincodes,
      avgDeliveryTime: Math.round(avgTime),
      totalStates: uniqueStates,
    });
  }, [serviceAreas]);

  const filteredAreas = useMemo(
    () =>
      serviceAreas.filter(
        (area) =>
          area.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          area.pincode.includes(searchTerm) ||
          area.state.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [serviceAreas, searchTerm],
  );

  const getStatusBadge = (isServiceable: boolean) => {
    return isServiceable ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "Free";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleEdit = (area: ServiceArea) => {
    setEditingArea(area);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (areaId: string) => {
    if (!window.confirm("Are you sure you want to delete this service area?")) {
      return;
    }

    setDeleteLoading(areaId);

    try {
      const { error } = await supabase
        .from("serviceable_areas")
        .delete()
        .eq("id", areaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service area deleted successfully",
      });
    } catch (error: unknown) {
      const errorMessage = handleError(error, "Deleting service area");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Areas</h1>
            <p className="text-gray-500 text-sm mt-1">
              Loading service areas...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Areas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage delivery zones and coverage areas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Area
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAreas}</p>
                <p className="text-xs text-gray-500">Active Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPincodes}</p>
                <p className="text-xs text-gray-500">Total Pincodes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgDeliveryTime}h</p>
                <p className="text-xs text-gray-500">Avg Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStates}</p>
                <p className="text-xs text-gray-500">States Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by city, pincode, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Areas ({filteredAreas.length})</CardTitle>
          <CardDescription>Manage your delivery coverage zones</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAreas.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No service areas found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first service area.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service Area
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {area.city}, {area.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            {area.pincode} | {area.country}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(area.is_serviceable)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {area.service_types.length > 0
                          ? area.service_types.slice(0, 2).join(", ")
                          : "All"}
                        {area.service_types.length > 2 &&
                          ` +${area.service_types.length - 2}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {area.delivery_time_hours
                          ? `${area.delivery_time_hours}h`
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(area.delivery_charge)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(area.updated_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(area)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Area
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(area.id)}
                            disabled={deleteLoading === area.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === area.id
                              ? "Deleting..."
                              : "Delete Area"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Service Area Modal */}
      <AddServiceAreaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          /* Areas will update automatically via realtime */
        }}
      />

      {/* Edit Service Area Modal */}
      <EditServiceAreaModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArea(null);
        }}
        onSuccess={() => {
          /* Areas will update automatically via realtime */
        }}
        area={editingArea}
      />
    </div>
  );
};
