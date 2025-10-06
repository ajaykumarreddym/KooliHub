import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import {
    BarChart3,
    Package,
    ShoppingBag,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://nxipkmxbvdrwdtujjlyr.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXBrbXhidmRyd2R0dWpqbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjk4MDUsImV4cCI6MjA3MDkwNTgwNX0.kAyJdrxXY9J2wxtzq5lgfl0HIfimkcEA7fyS1XtxmYA'
);

interface FashionStats {
  totalProducts: number;
  totalCategories: number;
  activeVendors: number;
  totalRevenue: number;
  averageRating: number;
  topCategories: string[];
  totalAttributes: number;
}

interface FashionProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  attributes?: any[];
}

interface FashionAttribute {
  id: string;
  name: string;
  label: string;
  data_type: string;
  group_name: string;
  validation_rules: any;
  is_required: boolean;
}

export const FashionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FashionStats>({
    totalProducts: 0,
    totalCategories: 0,
    activeVendors: 0,
    totalRevenue: 0,
    averageRating: 0,
    topCategories: [],
    totalAttributes: 0
  });
  const [recentProducts, setRecentProducts] = useState<FashionProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fashionAttributes, setFashionAttributes] = useState<FashionAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFashionData();
  }, []);

  const loadFashionData = async () => {
    try {
      setLoading(true);

      // Load fashion categories
      const { data: fashionCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('service_type', 'fashion')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Load fashion products/offerings
      const { data: fashionOfferings, error: offeringsError } = await supabase
        .from('offerings')
        .select(`
          *,
          categories!inner(service_type)
        `)
        .eq('categories.service_type', 'fashion')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (offeringsError) throw offeringsError;

      // Load vendors
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);

      if (vendorsError) throw vendorsError;

      // Load fashion-specific attributes
      const { data: attributes, error: attributesError } = await supabase
        .from('attribute_registry')
        .select('*')
        .contains('applicable_types', ['product'])
        .in('group_name', ['fabric', 'style', 'sizing', 'care', 'seasonal'])
        .eq('is_active', true)
        .order('group_name', { ascending: true })
        .order('sort_order', { ascending: true });

      if (attributesError) throw attributesError;

      // Calculate stats
      const fashionStats: FashionStats = {
        totalProducts: fashionOfferings?.length || 0,
        totalCategories: fashionCategories?.length || 0,
        activeVendors: vendors?.length || 0,
        totalRevenue: Math.floor(Math.random() * 100000) + 20000, // Mock revenue
        averageRating: 4.3,
        topCategories: fashionCategories?.slice(0, 5).map(cat => cat.name) || [],
        totalAttributes: attributes?.length || 0
      };

      setStats(fashionStats);
      setCategories(fashionCategories || []);
      setFashionAttributes(attributes || []);

      // Format recent products
      const products: FashionProduct[] = fashionOfferings?.map(offering => ({
        id: offering.id,
        name: offering.name,
        category: offering.category_id || 'Fashion',
        price: offering.base_price || 0,
        status: offering.is_active ? 'Active' : 'Inactive',
        created_at: offering.created_at,
        attributes: [] // Will be loaded separately if needed
      })) || [];

      setRecentProducts(products);

    } catch (error) {
      console.error('Error loading fashion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Fashion Products',
      value: stats.totalProducts,
      icon: ShoppingBag,
      description: 'Total fashion items',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: Package,
      description: 'Fashion categories',
      change: '+3%',
      trend: 'up'
    },
    {
      title: 'Active Attributes',
      value: stats.totalAttributes,
      icon: Package,
      description: 'Fashion attributes',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      description: 'Monthly revenue',
      change: '+15%',
      trend: 'up'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fashion & Apparel Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage fashion products, categories, and vendor operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fashion Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Fashion Categories</CardTitle>
                <CardDescription>Available fashion categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-pink-100 p-2 rounded-full">
                        <ShoppingBag className="h-4 w-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description || 'Fashion category'}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(category.is_active ? 'Active' : 'Inactive')}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Products */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>Latest fashion items added</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center space-x-3">
                      <div className="bg-pink-100 p-2 rounded-full">
                        <ShoppingBag className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                        <p className="text-sm text-gray-900 mt-1">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common fashion management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <ShoppingBag className="h-6 w-6 mb-2" />
                  Add Product
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Manage Categories
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Vendor Relations
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Fashion Product Management</CardTitle>
              <CardDescription>Manage fashion products and inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fashion product management interface will be implemented here</p>
                <Button className="mt-4">Add New Product</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Manage fashion categories and collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Category management interface will be implemented here</p>
                <Button className="mt-4">Add New Category</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle>Fashion Attributes Management</CardTitle>
              <CardDescription>Manage fashion-specific product attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Attributes by Group */}
                {Object.entries(
                  fashionAttributes.reduce((groups, attr) => {
                    const group = attr.group_name || 'Other';
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(attr);
                    return groups;
                  }, {} as Record<string, FashionAttribute[]>)
                ).map(([groupName, attributes]) => (
                  <div key={groupName} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3 capitalize">{groupName.replace('_', ' ')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {attributes.map((attr) => (
                        <div key={attr.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{attr.label}</h5>
                            {attr.is_required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Type: {attr.data_type}</p>
                          {attr.validation_rules?.options && (
                            <div className="text-xs text-gray-500">
                              <p>Options: {attr.validation_rules.options.slice(0, 3).join(', ')}
                                {attr.validation_rules.options.length > 3 && '...'}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {fashionAttributes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No fashion attributes found</p>
                    <Button className="mt-4">Add New Attribute</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Fashion Analytics</CardTitle>
              <CardDescription>Sales and performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fashion analytics interface will be implemented here</p>
                <Button className="mt-4">Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
