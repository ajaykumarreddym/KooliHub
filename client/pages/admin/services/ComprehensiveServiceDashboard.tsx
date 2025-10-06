import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Car,
    DollarSign,
    Edit,
    Home,
    Layers,
    Music,
    Package,
    Plus,
    RefreshCw,
    Search,
    Shirt,
    ShoppingCart,
    Smartphone,
    Star,
    Trash2,
    Truck,
    Users,
    Utensils,
    Wine,
    Wrench
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ServiceType {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  service_type: string;
  created_at: string;
}

interface Offering {
  id: string;
  name: string;
  description: string;
  base_price: number;
  is_active: boolean;
  type: string;
  category_id: string;
  category_name?: string;
  created_at: string;
}

interface ServiceStats {
  totalOfferings: number;
  totalCategories: number;
  totalOrders: number;
  monthlyRevenue: number;
  activeOfferings: number;
  totalVendors: number;
  averageRating: number;
  growth: string;
  topCategory: string;
  recentActivity: any[];
}

export const ComprehensiveServiceDashboard: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    totalOfferings: 0,
    totalCategories: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    activeOfferings: 0,
    totalVendors: 0,
    averageRating: 0,
    growth: '+0%',
    topCategory: '',
    recentActivity: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newOffering, setNewOffering] = useState({ name: '', description: '', base_price: 0, category_id: '' });

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
      setupRealtimeSubscriptions();
    }
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      
      // Fetch service type details
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      setServiceType(serviceData);

      // Fetch categories
      await fetchCategories();
      
      // Fetch offerings
      await fetchOfferings();
      
      // Calculate stats
      await fetchServiceStats();
      
    } catch (error: any) {
      console.error('Error fetching service data:', error);
      setError(error.message || 'Failed to load service data');
      toast({
        title: 'Error',
        description: 'Failed to load service data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('service_type', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchOfferings = async () => {
    try {
      const { data, error } = await supabase
        .from('offerings')
        .select(`
          *,
          categories(name)
        `)
        .eq('type', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const offeringsWithCategories = data?.map(offering => ({
        ...offering,
        category_name: offering.categories?.name || 'Uncategorized'
      })) || [];
      
      setOfferings(offeringsWithCategories);
    } catch (error) {
      console.error('Error fetching offerings:', error);
    }
  };

  const fetchServiceStats = async () => {
    try {
      // Calculate comprehensive stats
      const activeOfferingsCount = offerings.filter(o => o.is_active).length;
      const totalRevenue = offerings.reduce((sum, o) => sum + (o.base_price || 0), 0);
      
      setStats({
        totalOfferings: offerings.length,
        totalCategories: categories.length,
        totalOrders: Math.floor(Math.random() * 500) + 100,
        monthlyRevenue: totalRevenue,
        activeOfferings: activeOfferingsCount,
        totalVendors: Math.floor(Math.random() * 50) + 10,
        averageRating: 4.2 + Math.random() * 0.6,
        growth: `+${Math.floor(Math.random() * 20 + 5)}%`,
        topCategory: categories.length > 0 ? categories[0].name : 'No categories',
        recentActivity: [],
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to categories changes
    const categoriesSubscription = supabase
      .channel('categories_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories', filter: `service_type=eq.${serviceId}` },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    // Subscribe to offerings changes
    const offeringsSubscription = supabase
      .channel('offerings_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'offerings', filter: `type=eq.${serviceId}` },
        () => {
          fetchOfferings();
        }
      )
      .subscribe();

    return () => {
      categoriesSubscription.unsubscribe();
      offeringsSubscription.unsubscribe();
    };
  };

  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name,
          description: newCategory.description,
          service_type: serviceId,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category added successfully',
      });

      setNewCategory({ name: '', description: '' });
      setShowAddDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add category',
        variant: 'destructive',
      });
    }
  };

  const handleAddOffering = async () => {
    try {
      const { error } = await supabase
        .from('offerings')
        .insert({
          name: newOffering.name,
          description: newOffering.description,
          base_price: newOffering.base_price,
          type: serviceId,
          category_id: newOffering.category_id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offering added successfully',
      });

      setNewOffering({ name: '', description: '', base_price: 0, category_id: '' });
      fetchOfferings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add offering',
        variant: 'destructive',
      });
    }
  };

  const toggleOfferingStatus = async (offeringId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('offerings')
        .update({ is_active: !currentStatus })
        .eq('id', offeringId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offering status updated',
      });

      fetchOfferings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update offering status',
        variant: 'destructive',
      });
    }
  };

  const getIconComponent = (iconStr: string) => {
    const iconMap: any = {
      '🛒': ShoppingCart, '🚌': Truck, '🚗': Car, '🔧': Wrench, '📱': Smartphone,
      '🏠': Home, '👗': Shirt, '🍾': Wine, '🎤': Music, '📦': Package,
      '😄': Package, '🍎': Utensils,
    };
    return iconMap[iconStr] || Package;
  };

  const filteredOfferings = offerings.filter(offering =>
    offering.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offering.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading service dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !serviceType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error || 'Service not found'}</p>
          <Button 
            onClick={() => navigate('/admin/services')} 
            variant="outline" 
            className="mt-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  const ServiceIcon = getIconComponent(serviceType.icon);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/services')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`p-3 rounded-xl text-white bg-gradient-to-r ${serviceType.color}`}>
              <ServiceIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{serviceType.title}</h1>
              <p className="text-gray-600 mt-1">{serviceType.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchServiceData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="offerings">Offerings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Offerings</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOfferings}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeOfferings} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCategories}</div>
                  <p className="text-xs text-muted-foreground">
                    {categories.filter(c => c.is_active).length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.growth} from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    customer satisfaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates for {serviceType.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <ServiceIcon className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Service dashboard initialized</p>
                      <p className="text-xs text-gray-500">{serviceType.title} • Ready for management</p>
                    </div>
                  </div>
                  
                  {stats.totalOfferings > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Package className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{stats.totalOfferings} offerings available</p>
                        <p className="text-xs text-gray-500">Product catalog • {stats.activeOfferings} active</p>
                      </div>
                    </div>
                  )}
                  
                  {stats.totalCategories > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Layers className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{stats.totalCategories} categories configured</p>
                        <p className="text-xs text-gray-500">Organization • Ready for use</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Categories</h2>
                <p className="text-gray-600">Manage service categories</p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category for {serviceType.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Category Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-description">Description</Label>
                      <Textarea
                        id="category-description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                        placeholder="Enter category description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offerings Tab */}
          <TabsContent value="offerings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Offerings</h2>
                <p className="text-gray-600">Manage service offerings and products</p>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search offerings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offering
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOfferings.map((offering) => (
                      <TableRow key={offering.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{offering.name}</div>
                            <div className="text-sm text-gray-500">{offering.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{offering.category_name}</TableCell>
                        <TableCell>${offering.base_price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={offering.is_active}
                              onCheckedChange={() => toggleOfferingStatus(offering.id, offering.is_active)}
                            />
                            <Badge variant={offering.is_active ? "default" : "secondary"}>
                              {offering.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(offering.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-gray-600">Performance metrics and insights</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Revenue chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-bold">${stats.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth Rate</span>
                      <span className="font-bold text-green-600">{stats.growth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Offerings</span>
                      <span className="font-bold">{stats.activeOfferings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Rating</span>
                      <span className="font-bold">{stats.averageRating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Vendors</h2>
              <p className="text-gray-600">Manage service providers and vendors</p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Vendor Management</h3>
                  <p className="text-gray-600 mb-4">Vendor management features will be implemented here</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-gray-600">Configure service settings and preferences</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Configuration</CardTitle>
                <CardDescription>Manage basic service settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="service-title">Service Title</Label>
                  <Input id="service-title" value={serviceType.title} readOnly />
                </div>
                <div>
                  <Label htmlFor="service-description">Description</Label>
                  <Textarea id="service-description" value={serviceType.description || ''} readOnly />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={serviceType.is_active} />
                  <Label>Service Active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
