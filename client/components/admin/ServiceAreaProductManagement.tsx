import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { handleError } from '@/lib/error-utils';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    DollarSign,
    Grid3x3,
    Info,
    List,
    Loader2,
    MapPin,
    Navigation,
    Package,
    Plus,
    Search,
    ShoppingCart,
    Star,
    Tag,
    Trash2,
    X,
    XCircle
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  type: string;
  status: string;
  primary_image_url: string | null;
  category_id: string | null;
  categories?: {
    name: string;
    service_type: string;
  };
  vendor_id: string | null;
  description: string | null;
}

interface AssignedProduct extends Product {
  assignment_id: string;
  is_available: boolean;
  price_override: number | null;
  stock_quantity: number | null;
  is_featured: boolean;
  priority_order: number;
}

interface Category {
  id: string;
  name: string;
  service_type: string;
  parent_id: string | null;
  parent?: {
    id: string;
    name: string;
  };
}

interface ServiceAreaProductManagementProps {
  serviceAreaId: string | null;
  onBack: () => void;
}

export const ServiceAreaProductManagement: React.FC<ServiceAreaProductManagementProps> = ({
  serviceAreaId,
  onBack
}) => {
  const [serviceArea, setServiceArea] = useState<ServiceArea | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'assigned' | 'add'>('assigned');
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingProducts, setSavingProducts] = useState(false);

  // Load service area details
  useEffect(() => {
    if (serviceAreaId) {
      loadServiceAreaData();
      loadServiceTypes();
    }
  }, [serviceAreaId]);

  const loadServiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setServiceTypes(data || []);
    } catch (error) {
      console.error('Error loading service types:', error);
    }
  };

  const loadServiceAreaData = async () => {
    if (!serviceAreaId) return;
    
    setLoading(true);
    try {
      // Load service area details
      const { data: areaData, error: areaError } = await supabase
        .from('serviceable_areas')
        .select('*')
        .eq('id', serviceAreaId)
        .single();

      if (areaError) throw areaError;
      setServiceArea(areaData);

      // Load assigned products
      const { data: assignedData, error: assignedError } = await supabase
        .from('service_area_products')
        .select(`
          id,
          is_available,
          price_override,
          stock_quantity,
          is_featured,
          priority_order,
          offerings:offering_id (
            id,
            name,
            base_price,
            type,
            status,
            primary_image_url,
            category_id,
            vendor_id,
            description,
            categories:category_id (
              name,
              service_type
            )
          )
        `)
        .eq('service_area_id', serviceAreaId);

      if (assignedError) throw assignedError;

      // Transform the data
      const transformedAssigned = (assignedData || [])
        .filter(item => item.offerings)
        .map(item => ({
          ...(item.offerings as any),
          assignment_id: item.id,
          is_available: item.is_available,
          price_override: item.price_override,
          stock_quantity: item.stock_quantity,
          is_featured: item.is_featured,
          priority_order: item.priority_order,
        }));

      setAssignedProducts(transformedAssigned);

      // Load available products (not yet assigned)
      const assignedIds = transformedAssigned.map(p => p.id);
      
      let productsQuery = supabase
        .from('offerings')
        .select(`
          id,
          name,
          base_price,
          type,
          status,
          primary_image_url,
          category_id,
          vendor_id,
          description,
          categories:category_id (
            name,
            service_type
          )
        `)
        .eq('is_active', true);

      // Only add the NOT IN clause if there are assigned IDs
      if (assignedIds.length > 0) {
        productsQuery = productsQuery.not('id', 'in', `(${assignedIds.join(',')})`);
      }

      const { data: productsData, error: productsError } = await productsQuery;

      if (productsError) throw productsError;
      
      // Transform categories from array to single object
      const transformedProducts = (productsData || []).map(product => ({
        ...product,
        categories: Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories[0]
          : product.categories
      }));
      
      setAvailableProducts(transformedProducts as Product[]);

      // Load categories with parent info
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');

      setCategories(categoriesData || []);

    } catch (error) {
      const errorMessage = handleError(error, 'Loading service area data');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedProducts.size === 0 || !serviceAreaId) return;

    setSavingProducts(true);
    try {
      const productsToAssign = Array.from(selectedProducts).map(productId => ({
        service_area_id: serviceAreaId,
        offering_id: productId,
        is_available: true,
      }));

      const { error } = await supabase
        .from('service_area_products')
        .insert(productsToAssign);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `Successfully assigned ${selectedProducts.size} products to this location`,
      });

      setSelectedProducts(new Set());
      setActiveTab('assigned');
      loadServiceAreaData();
    } catch (error) {
      const errorMessage = handleError(error, 'Assigning products');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSavingProducts(false);
    }
  };

  const handleRemoveProduct = async (assignmentId: string, productName: string) => {
    if (!window.confirm(`Remove "${productName}" from this location?`)) return;

    try {
      const { error } = await supabase
        .from('service_area_products')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product removed from this location',
      });

      loadServiceAreaData();
    } catch (error) {
      const errorMessage = handleError(error, 'Removing product');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAvailability = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_area_products')
        .update({ is_available: !currentStatus })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Product ${!currentStatus ? 'enabled' : 'disabled'}`,
      });

      loadServiceAreaData();
    } catch (error) {
      const errorMessage = handleError(error, 'Updating availability');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_area_products')
        .update({ is_featured: !currentStatus })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Product ${!currentStatus ? 'featured' : 'unfeatured'}`,
      });

      loadServiceAreaData();
    } catch (error) {
      const errorMessage = handleError(error, 'Updating featured status');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    setSelectedProducts(new Set(filteredAvailableProducts.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const filteredAssignedProducts = useMemo(() => {
    return assignedProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServiceType = filterServiceType === 'all' || 
        (product.categories && product.categories.service_type === filterServiceType);
      const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
      
      return matchesSearch && matchesServiceType && matchesCategory;
    });
  }, [assignedProducts, searchTerm, filterServiceType, filterCategory]);

  const filteredAvailableProducts = useMemo(() => {
    return availableProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServiceType = filterServiceType === 'all' || 
        (product.categories && product.categories.service_type === filterServiceType);
      const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
      
      return matchesSearch && matchesServiceType && matchesCategory;
    });
  }, [availableProducts, searchTerm, filterServiceType, filterCategory]);

  // Group products by service type -> category -> subcategory
  const groupedAvailableProducts = useMemo(() => {
    const grouped: Record<string, Record<string, Record<string, Product[]>>> = {};
    
    filteredAvailableProducts.forEach(product => {
      const serviceType = product.categories?.service_type || 'Uncategorized';
      const categoryData = categories.find(c => c.id === product.category_id);
      
      // Determine parent category and subcategory
      let parentCategory = 'Root Categories';
      let subcategory = product.categories?.name || 'No Category';
      
      if (categoryData) {
        if (categoryData.parent_id && categoryData.parent) {
          // This is a subcategory
          parentCategory = categoryData.parent.name;
          subcategory = categoryData.name;
        } else {
          // This is a root category
          parentCategory = categoryData.name;
          subcategory = 'Products';
        }
      }
      
      if (!grouped[serviceType]) {
        grouped[serviceType] = {};
      }
      if (!grouped[serviceType][parentCategory]) {
        grouped[serviceType][parentCategory] = {};
      }
      if (!grouped[serviceType][parentCategory][subcategory]) {
        grouped[serviceType][parentCategory][subcategory] = [];
      }
      grouped[serviceType][parentCategory][subcategory].push(product);
    });
    
    return grouped;
  }, [filteredAvailableProducts, categories]);

  if (!serviceAreaId) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Service Area Selected
        </h3>
        <p className="text-gray-500 mb-4">
          Please select a service area to manage its products
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading service area data...</p>
        </div>
      </div>
    );
  }

  if (!serviceArea) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Service Area Not Found
        </h3>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const stats = {
    totalProducts: assignedProducts.length,
    availableProducts: assignedProducts.filter(p => p.is_available).length,
    featuredProducts: assignedProducts.filter(p => p.is_featured).length,
    totalCategories: new Set(assignedProducts.map(p => p.category_id)).size,
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Enhanced Header with Location Details */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-white hover:bg-white/20 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Areas
            </Button>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{serviceArea.city}, {serviceArea.state}</h1>
                <p className="text-blue-100 text-lg mt-1">Product & Availability Management</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Pincode</p>
                    <p className="text-lg font-bold">{serviceArea.pincode}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Delivery Time</p>
                    <p className="text-lg font-bold">{serviceArea.delivery_time_hours || 'N/A'}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Delivery Charge</p>
                    <p className="text-lg font-bold">
                      {serviceArea.delivery_charge === 0 ? 'FREE' : `₹${serviceArea.delivery_charge}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Status</p>
                    <Badge className={serviceArea.is_serviceable ? "bg-green-500" : "bg-gray-500"}>
                      {serviceArea.is_serviceable ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
              </div>
              <Package className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.availableProducts}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.featuredProducts}</p>
              </div>
              <Star className="h-10 w-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCategories}</p>
              </div>
              <Tag className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assigned' | 'add')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Management</CardTitle>
                <CardDescription className="mt-1">
                  Manage product availability and settings for this location
                </CardDescription>
              </div>
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="assigned" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Assigned Products ({assignedProducts.length})
                </TabsTrigger>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Products ({availableProducts.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {serviceTypes.map(st => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.icon} {st.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter(c => filterServiceType === 'all' || c.service_type === filterServiceType)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {activeTab === 'assigned' && (
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Tab Content */}
            <TabsContent value="assigned" className="mt-0">
              {filteredAssignedProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Products Assigned
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start by adding products to make them available in this location
                  </p>
                  <Button onClick={() => setActiveTab('add')} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Products Now
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                  {filteredAssignedProducts.map(product => (
                    <Card key={product.assignment_id} className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                      {product.is_featured && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        </div>
                      )}
                      
                      <CardContent className="p-4">
                        {product.primary_image_url && viewMode === 'grid' && (
                          <div className="relative w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            <img
                              src={product.primary_image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {product.categories?.name || 'No category'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={product.is_available ? 'default' : 'secondary'} className="text-xs">
                              {product.is_available ? (
                                <><Check className="h-3 w-3 mr-1" /> Available</>
                              ) : (
                                <><X className="h-3 w-3 mr-1" /> Unavailable</>
                              )}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ₹{product.price_override || product.base_price}
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAvailability(product.assignment_id, product.is_available)}
                              className="text-xs"
                            >
                              {product.is_available ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleFeatured(product.assignment_id, product.is_featured)}
                              className="text-xs"
                            >
                              <Star className={`h-3 w-3 ${product.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveProduct(product.assignment_id, product.name)}
                              className="text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="mt-0">
              {/* Selection Actions */}
              {selectedProducts.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {selectedProducts.size} product(s) selected
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear Selection
                    </Button>
                  </div>
                  <Button 
                    onClick={handleBulkAssign}
                    disabled={savingProducts}
                    size="lg"
                    className="shadow-lg"
                  >
                    {savingProducts ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Add {selectedProducts.size} Product(s)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {filteredAvailableProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {availableProducts.length === 0 ? 'All Products Assigned' : 'No Products Match Your Filters'}
                  </h3>
                  <p className="text-gray-600">
                    {availableProducts.length === 0 
                      ? 'All available products have been assigned to this location'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Showing {filteredAvailableProducts.length} products
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All ({filteredAvailableProducts.length})
                      </Button>
                    </div>
                  </div>

                  {/* Hierarchical Product List: Service Type -> Category -> Subcategory -> Products */}
                  {Object.entries(groupedAvailableProducts).map(([serviceType, categoriesObj]) => (
                    <Card key={serviceType} className="overflow-hidden border-2">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {serviceTypes.find(st => st.id === serviceType)?.icon}
                              <span>{serviceTypes.find(st => st.id === serviceType)?.title || serviceType}</span>
                            </div>
                            <p className="text-sm text-blue-100 font-normal mt-1">
                              {Object.values(categoriesObj).reduce((sum, subcats) => 
                                sum + Object.values(subcats).reduce((s, prods) => s + prods.length, 0), 0
                              )} products in {Object.keys(categoriesObj).length} categories
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {Object.entries(categoriesObj).map(([category, subcategoriesObj], catIdx) => (
                          <div key={category}>
                            {catIdx > 0 && <Separator className="my-0" />}
                            <div className="bg-gray-50 border-l-4 border-l-purple-500">
                              {/* Category Header */}
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Tag className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-base">{category}</h4>
                                    <p className="text-xs text-gray-600">
                                      {Object.values(subcategoriesObj).reduce((sum, prods) => sum + prods.length, 0)} products
                                      {Object.keys(subcategoriesObj).length > 1 && ` in ${Object.keys(subcategoriesObj).length} subcategories`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Subcategories */}
                              {Object.entries(subcategoriesObj).map(([subcategory, products], subIdx) => (
                                <div key={subcategory} className="bg-white">
                                  {subIdx > 0 && <Separator className="ml-4" />}
                                  <div className="p-4 pl-8">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                        <Package className="h-4 w-4 text-green-600" />
                                      </div>
                                      <h5 className="font-semibold text-gray-800 text-sm">{subcategory}</h5>
                                      <Badge variant="secondary" className="ml-auto text-xs">
                                        {products.length} {products.length === 1 ? 'product' : 'products'}
                                      </Badge>
                                    </div>
                                    
                                    {/* Products Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                                      {products.map(product => (
                                        <Card
                                          key={product.id}
                                          className={`cursor-pointer transition-all duration-200 ${
                                            selectedProducts.has(product.id)
                                              ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                                              : 'hover:shadow-md hover:border-primary/50'
                                          }`}
                                          onClick={() => toggleProductSelection(product.id)}
                                        >
                                          <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                              <Checkbox
                                                checked={selectedProducts.has(product.id)}
                                                onCheckedChange={() => toggleProductSelection(product.id)}
                                                className="mt-1"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              
                                              {product.primary_image_url && (
                                                <img
                                                  src={product.primary_image_url}
                                                  alt={product.name}
                                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                />
                                              )}
                                              
                                              <div className="flex-1 min-w-0">
                                                <h5 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                                                  {product.name}
                                                </h5>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <Badge variant="outline" className="text-xs">
                                                    ₹{product.base_price}
                                                  </Badge>
                                                  <Badge 
                                                    variant={product.status === 'active' ? 'default' : 'secondary'} 
                                                    className="text-xs"
                                                  >
                                                    {product.status}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};
