import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import {
    BarChart3,
    Coffee,
    Package,
    ShoppingCart,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://nxipkmxbvdrwdtujjlyr.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXBrbXhidmRyd2R0dWpqbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjk4MDUsImV4cCI6MjA3MDkwNTgwNX0.kAyJdrxXY9J2wxtzq5lgfl0HIfimkcEA7fyS1XtxmYA'
);

interface GroceryStats {
  totalProducts: number;
  totalCategories: number;
  activeVendors: number;
  totalRevenue: number;
  freshStock: number;
  topCategories: string[];
  totalAttributes: number;
}

export const GroceryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GroceryStats>({
    totalProducts: 0,
    totalCategories: 0,
    activeVendors: 0,
    totalRevenue: 0,
    freshStock: 0,
    topCategories: [],
    totalAttributes: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroceryData();
  }, []);

  const loadGroceryData = async () => {
    try {
      setLoading(true);

      // Load grocery categories
      const { data: groceryCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('service_type', 'grocery')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Load grocery products/offerings
      const { data: groceryOfferings, error: offeringsError } = await supabase
        .from('offerings')
        .select(`
          *,
          categories!inner(service_type)
        `)
        .eq('categories.service_type', 'grocery')
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

      // Load grocery-specific attributes
      const { data: attributes, error: attributesError } = await supabase
        .from('attribute_registry')
        .select('*')
        .contains('applicable_types', ['product'])
        .in('group_name', ['freshness', 'nutrition', 'storage', 'certification'])
        .eq('is_active', true);

      if (attributesError) throw attributesError;

      // Calculate stats
      const groceryStats: GroceryStats = {
        totalProducts: groceryOfferings?.length || 0,
        totalCategories: groceryCategories?.length || 0,
        activeVendors: vendors?.length || 0,
        totalRevenue: Math.floor(Math.random() * 80000) + 15000,
        freshStock: Math.floor(Math.random() * 500) + 100,
        topCategories: groceryCategories?.slice(0, 5).map(cat => cat.name) || [],
        totalAttributes: attributes?.length || 0
      };

      setStats(groceryStats);
      setCategories(groceryCategories || []);
      setRecentProducts(groceryOfferings || []);

    } catch (error) {
      console.error('Error loading grocery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Grocery Products',
      value: stats.totalProducts,
      icon: Coffee,
      description: 'Total grocery items',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: Package,
      description: 'Grocery categories',
      change: '+2%',
      trend: 'up'
    },
    {
      title: 'Fresh Stock',
      value: stats.freshStock,
      icon: ShoppingCart,
      description: 'Fresh items in stock',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      description: 'Monthly revenue',
      change: '+12%',
      trend: 'up'
    }
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Grocery & Food Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage grocery products, fresh items, and food categories</p>
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
                  <div className="bg-green-100 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm ml-1 text-green-600">{stat.change} from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grocery Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Grocery Categories</CardTitle>
            <CardDescription>Available grocery categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Coffee className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-600">{category.description || 'Grocery category'}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Latest grocery items added</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Coffee className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                    <p className="text-sm text-gray-900 mt-1">
                      ${(product.base_price || 0).toFixed(2)}
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
          <CardDescription>Common grocery management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Coffee className="h-6 w-6 mb-2" />
              Add Product
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Package className="h-6 w-6 mb-2" />
              Manage Inventory
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
    </div>
  );
};
