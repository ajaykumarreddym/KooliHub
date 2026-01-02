import { AddServiceAreaModal } from '@/components/admin/AddServiceAreaModal';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import { EnhancedProductModal } from '@/components/admin/EnhancedProductModal';
import { OfferingDialog } from '@/components/admin/OfferingDialog';
import { OrderViewDialog } from '@/components/admin/OrderViewDialog';
import { VendorDialog } from '@/components/admin/VendorDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Filter,
  Home,
  Layers,
  MapPin,
  Music,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shirt,
  ShoppingCart,
  Smartphone,
  Star,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  Utensils,
  Wine,
  Wrench,
  XCircle
} from 'lucide-react';
import React, { useEffect, useLayoutEffect, useState } from 'react';
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
  icon?: string;
  color?: string;
  created_at: string;
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
  category_id: string;
  is_active: boolean;
  icon?: string;
  color?: string;
  sort_order: number;
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
  vendor_id?: string;
  stock_quantity?: number;
  primary_image_url?: string;
  rating?: number;
  reviews_count?: number;
  category_name?: string;
  vendor_name?: string;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  status: string;
  commission_rate: number;
  business_email: string;
  business_phone?: string;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  payment_status: string;
  service_type: string;
  created_at: string;
  delivery_pincode?: string;
  delivery_address?: string;
  order_items?: any; // JSON field containing order items
}

interface ServiceStats {
  totalOfferings: number;
  totalCategories: number;
  totalSubcategories: number;
  totalOrders: number;
  monthlyRevenue: number;
  activeOfferings: number;
  totalVendors: number;
  activeVendors: number;
  averageRating: number;
  growth: string;
  topCategory: string;
  recentActivity: any[];
  ordersByStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  weeklyOrders: Array<{ day: string; orders: number; revenue: number }>;
  topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>;
  serviceAreas: number;
  avgOrderValue: number;
  conversionRate: number;
  customerSatisfaction: number;
}

const colorOptions = [
  { value: "from-gray-500 to-gray-600", label: "Gray", preview: "bg-gradient-to-r from-gray-500 to-gray-600" },
  { value: "from-red-500 to-red-600", label: "Red", preview: "bg-gradient-to-r from-red-500 to-red-600" },
  { value: "from-orange-500 to-orange-600", label: "Orange", preview: "bg-gradient-to-r from-orange-500 to-orange-600" },
  { value: "from-yellow-500 to-yellow-600", label: "Yellow", preview: "bg-gradient-to-r from-yellow-500 to-yellow-600" },
  { value: "from-green-500 to-green-600", label: "Green", preview: "bg-gradient-to-r from-green-500 to-green-600" },
  { value: "from-blue-500 to-blue-600", label: "Blue", preview: "bg-gradient-to-r from-blue-500 to-blue-600" },
  { value: "from-indigo-500 to-indigo-600", label: "Indigo", preview: "bg-gradient-to-r from-indigo-500 to-indigo-600" },
  { value: "from-purple-500 to-purple-600", label: "Purple", preview: "bg-gradient-to-r from-purple-500 to-purple-600" },
  { value: "from-pink-500 to-pink-600", label: "Pink", preview: "bg-gradient-to-r from-pink-500 to-pink-600" },
  { value: "from-rose-500 to-rose-600", label: "Rose", preview: "bg-gradient-to-r from-rose-500 to-rose-600" },
];

const iconOptions = [
  "🛒", "🚌", "🚗", "🔧", "📱", "🏠", "👗", "🍾", "🎤", "📦", "😄", "🍎", "🎯", "⚡", "🌟", "🏆", "🎪", "🎨", "🎭", "💼", "🍕", "🎮", "⚽", "🎬", "📚"
];

export const ComprehensiveServiceDashboard: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    totalOfferings: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    activeOfferings: 0,
    totalVendors: 0,
    activeVendors: 0,
    averageRating: 0,
    growth: '+0%',
    topCategory: '',
    recentActivity: [],
    ordersByStatus: { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
    weeklyOrders: [],
    topProducts: [],
    serviceAreas: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    customerSatisfaction: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '📦', color: 'from-blue-500 to-blue-600' });
  const [newOffering, setNewOffering] = useState({ name: '', description: '', base_price: 0, category_id: '', stock_quantity: 0 });
  
  // Dialog states
  const [offeringDialogOpen, setOfferingDialogOpen] = useState(false);
  const [enhancedProductModalOpen, setEnhancedProductModalOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [serviceAreaModalOpen, setServiceAreaModalOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');

  // Force scroll to top BEFORE paint (earliest possible)
  useLayoutEffect(() => {
    // Scroll to top immediately before browser paints
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [serviceId]);

  // Additional scroll to top AFTER component mounts
  useEffect(() => {
    if (serviceId) {
      // Force scroll to absolute top immediately
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Also scroll after a short delay to catch any async rendering
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0);
      
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
      
      fetchServiceData();
      setupRealtimeSubscriptions();
    }
  }, [serviceId]);

  // Final scroll to top when component fully renders
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Try to scroll the main container if it exists
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
    };

    scrollToTop();
    
    // Ensure scroll happens after all rendering
    const timeouts = [0, 50, 100, 200].map(delay => 
      setTimeout(scrollToTop, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Ensure page starts at top even during loading
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [loading]);

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

      // Fetch all data in parallel for better performance
      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchOfferings(),
        fetchVendors(),
        fetchOrders(),
        fetchServiceAreas(),
      ]);
      
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

  const fetchSubcategories = async () => {
    try {
      const { data: cats } = await supabase
        .from('categories')
        .select('id')
        .eq('service_type', serviceId);

      if (!cats || cats.length === 0) {
        setSubcategories([]);
        return;
      }

      const categoryIds = cats.map(c => c.id);
      
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .in('category_id', categoryIds)
        .order('sort_order');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchOfferings = async () => {
    try {
      // First, get all category IDs for this service type
      const { data: serviceCategories, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('service_type', serviceId);

      if (catError) throw catError;
      
      if (!serviceCategories || serviceCategories.length === 0) {
        console.log('No categories found for service:', serviceId);
        setOfferings([]);
        return;
      }

      const categoryIds = serviceCategories.map(cat => cat.id);
      
      // Now fetch offerings that belong to these categories
      const { data, error } = await supabase
        .from('offerings')
        .select(`
          *,
          categories!inner(name, service_type),
          vendors(name)
        `)
        .in('category_id', categoryIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const offeringsWithNames = data?.map(offering => ({
        ...offering,
        category_name: offering.categories?.name || 'Uncategorized',
        vendor_name: offering.vendors?.name || 'Direct'
      })) || [];
      
      console.log(`✅ Loaded ${offeringsWithNames.length} offerings for service:`, serviceId);
      setOfferings(offeringsWithNames);
    } catch (error) {
      console.error('Error fetching offerings:', error);
      setOfferings([]);
    }
  };

  const fetchVendors = async () => {
    try {
      // Get offerings first to find vendor IDs for this service
      const { data: serviceOfferings } = await supabase
        .from('offerings')
        .select('vendor_id')
        .eq('type', serviceId)
        .not('vendor_id', 'is', null);

      const vendorIds = [...new Set(serviceOfferings?.map(o => o.vendor_id).filter(Boolean))];

      if (vendorIds.length === 0) {
        setVendors([]);
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .in('id', vendorIds)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('service_type', serviceId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchServiceAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('serviceable_areas')
        .select('id')
        .contains('service_types', [serviceId])
        .eq('is_serviceable', true);

      if (error) throw error;
      
      setStats(prev => ({
        ...prev,
        serviceAreas: data?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching service areas:', error);
    }
  };

  const calculateStats = (orderData: Order[]) => {
      const activeOfferingsCount = offerings.filter(o => o.is_active).length;
    const completedOrders = orderData.filter(o => o.payment_status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    const deliveredOrders = orderData.filter(o => o.status === 'delivered');
    
    // Calculate REAL average rating from offerings
    const ratingsSum = offerings.reduce((sum, o) => sum + (o.rating || 0), 0);
    const ratingsCount = offerings.filter(o => (o.rating || 0) > 0).length;
    const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;
    
    // Order status breakdown
    const ordersByStatus = {
      pending: orderData.filter(o => o.status === 'pending').length,
      confirmed: orderData.filter(o => o.status === 'confirmed').length,
      processing: orderData.filter(o => o.status === 'processing').length,
      shipped: orderData.filter(o => o.status === 'shipped').length,
      delivered: deliveredOrders.length,
      cancelled: orderData.filter(o => o.status === 'cancelled').length,
    };

    // Weekly orders - last 7 days
    const weeklyOrders = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orderData.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= date && orderDate < nextDate;
      });
      
      const dayRevenue = dayOrders
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0);
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayRevenue
      };
    });

    // Calculate REAL growth based on month-over-month comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const currentMonthOrders = orderData.filter(o => {
      const date = new Date(o.created_at);
      return date >= currentMonthStart;
    });
    
    const lastMonthOrders = orderData.filter(o => {
      const date = new Date(o.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
    
    const growth = lastMonthOrders.length > 0 
      ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(1)
      : currentMonthOrders.length > 0 ? '100.0' : '0';

    // Calculate REAL conversion rate
    // Assuming we track views/impressions (if available in future)
    // For now, calculate based on order success rate
    const totalOrderAttempts = orderData.length;
    const successfulOrders = completedOrders.length;
    const conversionRate = totalOrderAttempts > 0 
      ? ((successfulOrders / totalOrderAttempts) * 100).toFixed(1)
      : 0;

    // Calculate customer satisfaction from ratings
    const customerSatisfaction = avgRating > 0 ? (avgRating / 5) * 100 : 0;

    // Find top category by offerings count
    const categoryOfferings: Record<string, number> = {};
    offerings.forEach(offering => {
      if (offering.category_id) {
        categoryOfferings[offering.category_id] = (categoryOfferings[offering.category_id] || 0) + 1;
      }
    });
    
    let topCategoryId = '';
    let maxCount = 0;
    Object.entries(categoryOfferings).forEach(([catId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategoryId = catId;
      }
    });
    
    const topCategory = categories.find(c => c.id === topCategoryId)?.name || 
                       (categories.length > 0 ? categories[0].name : 'No categories');

    // Calculate top products by order frequency
    const productOrderCount: Record<string, { name: string; sales: number; revenue: number }> = {};
    
    orderData.forEach(order => {
      // If order has items data, process it
      if (order.order_items) {
        const items = typeof order.order_items === 'string' 
          ? JSON.parse(order.order_items) 
          : order.order_items;
        
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const productId = item.product_id || item.id;
            const productName = item.name || 'Unknown Product';
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            
            if (!productOrderCount[productId]) {
              productOrderCount[productId] = { name: productName, sales: 0, revenue: 0 };
            }
            productOrderCount[productId].sales += quantity;
            productOrderCount[productId].revenue += price * quantity;
          });
        }
      }
    });

    const topProducts = Object.entries(productOrderCount)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
      
      setStats({
        totalOfferings: offerings.length,
        totalCategories: categories.length,
      totalSubcategories: subcategories.length,
      totalOrders: orderData.length,
        monthlyRevenue: totalRevenue,
        activeOfferings: activeOfferingsCount,
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.status === 'active').length,
      averageRating: avgRating,
      growth: `${parseFloat(growth) >= 0 ? '+' : ''}${growth}%`,
      topCategory,
        recentActivity: [],
      ordersByStatus,
      weeklyOrders,
      topProducts,
      serviceAreas: stats.serviceAreas,
      avgOrderValue: orderData.length > 0 ? totalRevenue / orderData.length : 0,
      conversionRate: parseFloat(conversionRate.toString()),
      customerSatisfaction: customerSatisfaction,
    });
  };

  useEffect(() => {
    if (offerings.length > 0 && orders.length > 0) {
      calculateStats(orders);
    }
  }, [offerings, orders, categories, subcategories, vendors]);

  const setupRealtimeSubscriptions = () => {
    const categoriesSubscription = supabase
      .channel('categories_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories', filter: `service_type=eq.${serviceId}` },
        () => fetchCategories()
      )
      .subscribe();

    const offeringsSubscription = supabase
      .channel('offerings_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'offerings', filter: `type=eq.${serviceId}` },
        () => fetchOfferings()
      )
      .subscribe();

    const ordersSubscription = supabase
      .channel('orders_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `service_type=eq.${serviceId}` },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      categoriesSubscription.unsubscribe();
      offeringsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
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
          icon: newCategory.icon,
          color: newCategory.color,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category added successfully',
      });

      setNewCategory({ name: '', description: '', icon: '📦', color: 'from-blue-500 to-blue-600' });
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

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOffering = async (offeringId: string) => {
    if (!confirm('Are you sure you want to delete this offering? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offerings')
        .delete()
        .eq('id', offeringId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offering deleted successfully',
      });

      fetchOfferings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete offering',
        variant: 'destructive',
      });
    }
  };

  const handleExportOrders = () => {
    try {
      // Prepare CSV data
      const csvHeaders = ['Order ID', 'Date', 'Amount', 'Payment Status', 'Order Status', 'Pincode'];
      const csvData = orders.map(order => [
        order.id,
        new Date(order.created_at).toLocaleDateString(),
        order.total_amount.toFixed(2),
        order.payment_status,
        order.status,
        order.delivery_pincode || 'N/A'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${serviceType?.title || 'service'}-orders-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Orders exported successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export orders',
        variant: 'destructive',
      });
    }
  };

  const handleExportReport = () => {
    try {
      const reportData = {
        service: serviceType?.title,
        generatedDate: new Date().toISOString(),
        stats: {
          totalRevenue: stats.monthlyRevenue,
          totalOrders: stats.totalOrders,
          activeOfferings: stats.activeOfferings,
          averageRating: stats.averageRating,
          growth: stats.growth,
          conversionRate: stats.conversionRate,
        },
        ordersByStatus: stats.ordersByStatus,
        weeklyPerformance: stats.weeklyOrders,
      };

      const jsonContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${serviceType?.title || 'service'}-report-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
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

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOfferings = offerings.filter(offering => {
    const matchesSearch = offering.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offering.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && offering.is_active) ||
      (filterStatus === 'inactive' && !offering.is_active);
    const matchesCategory = selectedCategory === 'all' || offering.category_id === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">Loading Service Dashboard</p>
            <p className="text-sm text-gray-600">Fetching comprehensive service data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !serviceType) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <div>
            <p className="text-xl font-semibold text-red-500">{error || 'Service not found'}</p>
            <p className="text-gray-600 mt-2">Unable to load service data. Please try again.</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/services')} 
            variant="outline" 
            className="mt-4"
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
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" id="service-dashboard-top">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
                onClick={() => {
                  // Scroll to top before navigating back
                  window.scrollTo(0, 0);
                  navigate('/admin/services');
                }}
                className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
              <div className={`p-4 rounded-2xl text-white bg-gradient-to-r ${serviceType.color} shadow-lg`}>
              <ServiceIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{serviceType.title}</h1>
                <p className="text-gray-600 mt-1 text-base">{serviceType.description}</p>
            </div>
              <Badge 
                variant={serviceType.is_active ? "default" : "secondary"}
                className="ml-4"
              >
                {serviceType.is_active ? 'Active' : 'Inactive'}
              </Badge>
          </div>
            <div className="flex space-x-3">
              <Button onClick={fetchServiceData} variant="outline" className="shadow-sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportReport} variant="default" className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Force scroll to top when switching tabs
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-8 h-12 bg-white shadow-sm mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="offerings" className="data-[state=active]:bg-blue-50">
              <Package className="h-4 w-4 mr-2" />
              Offerings
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-50">
              <Layers className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="vendors" className="data-[state=active]:bg-blue-50">
              <Building2 className="h-4 w-4 mr-2" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-50">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-50">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="areas" className="data-[state=active]:bg-blue-50">
              <MapPin className="h-4 w-4 mr-2" />
              Service Areas
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    ${stats.monthlyRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <p className="text-xs text-green-600 font-semibold">
                      {stats.growth} from last month
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    Avg: ${stats.avgOrderValue.toFixed(2)} per order
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Offerings</CardTitle>
                  <Package className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.activeOfferings}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    of {stats.totalOfferings} total offerings
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
                  <Star className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                    <span className="text-lg text-gray-500">/5.0</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {stats.customerSatisfaction.toFixed(1)}% satisfaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                    </div>
                    <Layers className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Vendors</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeVendors}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Service Areas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.serviceAreas}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                    </div>
                    <Percent className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Status & Weekly Trends */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Orders by Status */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                    Orders by Status
                  </CardTitle>
                  <CardDescription>Distribution of order statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {status === 'delivered' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {status === 'cancelled' && <XCircle className="h-5 w-5 text-red-600" />}
                          {status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                          {!['delivered', 'cancelled', 'pending'].includes(status) && <Clock className="h-5 w-5 text-blue-600" />}
                          <span className="text-sm font-medium capitalize text-gray-700">{status}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(status)}>
                            {count}
                          </Badge>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={cn(
                                "h-2 rounded-full",
                                status === 'delivered' && 'bg-green-600',
                                status === 'cancelled' && 'bg-red-600',
                                status === 'pending' && 'bg-yellow-600',
                                !['delivered', 'cancelled', 'pending'].includes(status) && 'bg-blue-600'
                              )}
                              style={{ width: `${(count / stats.totalOrders) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Performance */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Weekly Performance
                  </CardTitle>
                  <CardDescription>Last 7 days orders and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.weeklyOrders.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 text-sm font-medium text-gray-700">{day.day}</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">{day.orders} orders</div>
                            <div className="text-xs text-gray-600">${day.revenue.toFixed(0)} revenue</div>
                          </div>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${Math.min((day.orders / Math.max(...stats.weeklyOrders.map(d => d.orders))) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common management tasks for {serviceType.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => setActiveTab('offerings')}
                  >
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Add Offering</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-300"
                    onClick={() => setActiveTab('categories')}
                  >
                    <Layers className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Manage Categories</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col space-y-2 hover:bg-purple-50 hover:border-purple-300"
                    onClick={() => setActiveTab('vendors')}
                  >
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">View Vendors</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col space-y-2 hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="text-sm">View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-600" />
                    Recent Activity
                  </span>
                  <Button variant="ghost" size="sm">View All</Button>
                </CardTitle>
                <CardDescription>Latest updates for {serviceType.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order, index) => (
                    <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={cn(
                        "p-2 rounded-full",
                        order.status === 'delivered' && 'bg-green-100',
                        order.status === 'cancelled' && 'bg-red-100',
                        order.status === 'pending' && 'bg-yellow-100',
                        !['delivered', 'cancelled', 'pending'].includes(order.status) && 'bg-blue-100'
                      )}>
                        <ShoppingCart className={cn(
                          "h-4 w-4",
                          order.status === 'delivered' && 'text-green-600',
                          order.status === 'cancelled' && 'text-red-600',
                          order.status === 'pending' && 'text-yellow-600',
                          !['delivered', 'cancelled', 'pending'].includes(order.status) && 'text-blue-600'
                        )} />
                      </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(order.created_at).toLocaleString()} • ${order.total_amount}
                        </p>
                    </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                  </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No recent orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offerings Tab */}
          <TabsContent value="offerings" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Offerings Management</h2>
                <p className="text-gray-600">Manage all products and services for {serviceType.title}</p>
                      </div>
              <Button 
                className="shadow-md"
                onClick={() => {
                  setSelectedOffering(null);
                  setEnhancedProductModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Offering
              </Button>
                    </div>

            {/* Filters */}
            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search offerings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                      </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                    </div>
              </CardContent>
            </Card>

            {/* Offerings Table */}
            <Card className="shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Offering</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Vendor</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Stock</TableHead>
                      <TableHead className="font-semibold">Rating</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOfferings.map((offering) => (
                      <TableRow key={offering.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              {offering.primary_image_url ? (
                                <img src={offering.primary_image_url} alt={offering.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                            <div>
                              <div className="font-medium text-gray-900">{offering.name}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">{offering.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{offering.category_name}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{offering.vendor_name}</TableCell>
                        <TableCell className="font-semibold text-gray-900">${offering.base_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-sm font-medium",
                            (offering.stock_quantity || 0) > 10 ? 'text-green-600' : 'text-orange-600'
                          )}>
                            {offering.stock_quantity || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {offering.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-xs text-gray-500">({offering.reviews_count || 0})</span>
                          </div>
                        </TableCell>
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
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View Details"
                              onClick={() => {
                                setSelectedOffering(offering);
                                setDialogMode('view');
                                setOfferingDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Edit"
                              onClick={() => {
                                setSelectedOffering(offering);
                                setEnhancedProductModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700" 
                              title="Delete"
                              onClick={() => handleDeleteOffering(offering.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOfferings.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No offerings found</p>
                    <p className="text-sm">Try adjusting your filters or add a new offering</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6 mt-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
                <p className="text-gray-600">Organize offerings into categories and subcategories</p>
              </div>
              <Button 
                className="shadow-md"
                onClick={() => {
                  setSelectedCategoryForEdit(null);
                  setCategoryDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg text-white bg-gradient-to-r ${category.color || 'from-blue-500 to-blue-600'}`}>
                          <span className="text-2xl">{category.icon || '📦'}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant={category.is_active ? "default" : "secondary"} className="mt-1">
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {offerings.filter(o => o.category_id === category.id).length} offerings
                      </span>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCategoryForEdit(category);
                            setCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {categories.length === 0 && (
                <Card className="col-span-full shadow-md">
                  <CardContent className="p-12 text-center">
                    <Layers className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h3>
                    <p className="text-gray-600 mb-4">Create your first category to organize offerings</p>
                    <Button onClick={() => {
                      setSelectedCategoryForEdit(null);
                      setCategoryDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-6 mt-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
                <p className="text-gray-600">Manage service providers and vendors for {serviceType.title}</p>
              </div>
              <Button 
                className="shadow-md"
                onClick={() => {
                  setSelectedVendor(null);
                  setDialogMode('add');
                  setVendorDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>

            <Card className="shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Vendor Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Commission</TableHead>
                      <TableHead className="font-semibold">Products</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{vendor.name}</TableCell>
                        <TableCell className="text-sm text-gray-700">{vendor.business_email}</TableCell>
                        <TableCell className="text-sm text-gray-700">{vendor.business_phone || 'N/A'}</TableCell>
                        <TableCell className="font-semibold text-blue-600">{vendor.commission_rate}%</TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {offerings.filter(o => o.vendor_id === vendor.id).length}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(vendor.status)}>
                            {vendor.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setDialogMode('view');
                                setVendorDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setDialogMode('edit');
                                setVendorDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {vendors.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No vendors found</p>
                    <p className="text-sm">Add vendors to start managing service providers</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <p className="text-gray-600">Track and manage orders for {serviceType.title}</p>
              </div>
              <Button 
                variant="outline" 
                className="shadow-md"
                onClick={handleExportOrders}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </Button>
            </div>

            <Card className="shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Order ID</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Payment</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 20).map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm text-gray-700">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === 'completed' ? "default" : "secondary"}>
                            {order.payment_status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {order.delivery_pincode}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDialogMode('view');
                                setOrderDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDialogMode('edit');
                                setOrderDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {orders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No orders yet</p>
                    <p className="text-sm">Orders will appear here when customers make purchases</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
              <p className="text-gray-600">Performance metrics and business intelligence for {serviceType.title}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${stats.monthlyRevenue.toLocaleString()}
                    </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{stats.growth}</span>
                  </div>
                  <div className="mt-4 h-24 flex items-end space-x-1">
                    {stats.weeklyOrders.map((day, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" 
                        style={{ height: `${(day.revenue / Math.max(...stats.weeklyOrders.map(d => d.revenue))) * 100}%` }} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Customer Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.customerSatisfaction.toFixed(1)}%
                    </div>
                  <div className="flex items-center text-blue-600">
                    <Star className="h-4 w-4 mr-1 fill-blue-600" />
                    <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}/5.0 Rating</span>
                    </div>
                  <div className="mt-4 space-y-2">
                    {(() => {
                      // Calculate REAL rating distribution from offerings
                      const ratingCounts = [0, 0, 0, 0, 0]; // 1-star to 5-star
                      let totalRatings = 0;
                      
                      offerings.forEach(offering => {
                        const rating = offering.rating || 0;
                        if (rating > 0) {
                          const roundedRating = Math.round(rating);
                          if (roundedRating >= 1 && roundedRating <= 5) {
                            ratingCounts[roundedRating - 1]++;
                            totalRatings++;
                          }
                        }
                      });
                      
                      // Calculate percentages
                      const ratingPercentages = ratingCounts.map(count => 
                        totalRatings > 0 ? ((count / totalRatings) * 100).toFixed(1) : '0'
                      );
                      
                      return [5, 4, 3].map(star => {
                        const index = star - 1;
                        const percentage = ratingPercentages[index];
                        const color = star === 5 ? 'bg-green-500' : star === 4 ? 'bg-blue-500' : 'bg-yellow-500';
                        
                        return (
                          <div key={star} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{star} Star</span>
                            <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 ${color} rounded-full transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                              />
                    </div>
                            <span className="text-gray-900 font-medium w-12 text-right">
                              {percentage}%
                            </span>
                    </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Percent className="h-5 w-5 mr-2 text-purple-600" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.conversionRate}%
            </div>
                  <div className="flex items-center text-purple-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+2.3% this week</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Average Order Value</span>
                      <span className="text-sm font-bold text-gray-900">${stats.avgOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Conversions</span>
                      <span className="text-sm font-bold text-gray-900">{stats.totalOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed analytics for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.activeOfferings}</div>
                    <div className="text-sm text-gray-600">Active Products</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Areas Tab */}
          <TabsContent value="areas" className="space-y-6 mt-0">
            <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Service Area Coverage</h2>
                <p className="text-gray-600">Manage locations where {serviceType.title} is available</p>
            </div>
              <Button 
                className="shadow-md"
                onClick={() => setServiceAreaModalOpen(true)}
              >
                    <Plus className="h-4 w-4 mr-2" />
                Add Service Area
                  </Button>
            </div>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Coverage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600">{stats.serviceAreas}</div>
                    <div className="text-sm text-gray-600 mt-2">Active Service Areas</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600">{Math.round(stats.serviceAreas * 0.85)}</div>
                    <div className="text-sm text-gray-600 mt-2">Cities Covered</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-4xl font-bold text-purple-600">{Math.round(stats.serviceAreas * 1.5)}</div>
                    <div className="text-sm text-gray-600 mt-2">Pincodes Served</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="p-8 text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Area Management</h3>
                <p className="text-gray-600 mb-4">Configure service areas and delivery zones</p>
                <Button onClick={() => navigate('/admin/services/service-areas')}>
                  Manage Service Areas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Service Settings</h2>
              <p className="text-gray-600">Configure settings and preferences for {serviceType.title}</p>
            </div>
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>Manage core service settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="service-title">Service Title</Label>
                    <Input id="service-title" value={serviceType.title} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label htmlFor="service-id">Service ID</Label>
                    <Input id="service-id" value={serviceType.id} readOnly className="bg-gray-50 font-mono" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="service-description">Description</Label>
                  <Textarea id="service-description" value={serviceType.description || ''} readOnly className="bg-gray-50" rows={3} />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Service Status</div>
                    <div className="text-sm text-gray-600">Enable or disable this service</div>
                  </div>
                  <Switch checked={serviceType.is_active} />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Accept New Orders</div>
                    <div className="text-sm text-gray-600">Allow new order placement</div>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Featured Service</div>
                    <div className="text-sm text-gray-600">Show in featured services list</div>
                  </div>
                  <Switch checked={false} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Additional configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sort-order">Display Order</Label>
                  <Input id="sort-order" type="number" value={serviceType.sort_order} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {serviceType.features?.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom padding */}
      <div className="pb-8"></div>
    </div>

      {/* Dialog Components */}
      <OfferingDialog
        isOpen={offeringDialogOpen}
        onClose={() => {
          setOfferingDialogOpen(false);
          setSelectedOffering(null);
        }}
        onSuccess={() => {
          fetchOfferings();
          fetchServiceData();
        }}
        serviceId={serviceId || ''}
        offering={selectedOffering}
        categories={categories}
        mode={dialogMode as 'add' | 'edit'}
      />

      <VendorDialog
        isOpen={vendorDialogOpen}
        onClose={() => {
          setVendorDialogOpen(false);
          setSelectedVendor(null);
        }}
        onSuccess={() => {
          fetchVendors();
          fetchServiceData();
        }}
        vendor={selectedVendor}
        mode={dialogMode as 'add' | 'edit' | 'view'}
      />

      <OrderViewDialog
        isOpen={orderDialogOpen}
        onClose={() => {
          setOrderDialogOpen(false);
          setSelectedOrder(null);
        }}
        onSuccess={() => {
          fetchOrders();
          fetchServiceData();
        }}
        order={selectedOrder}
        mode={dialogMode as 'view' | 'edit'}
      />

      {/* Enhanced Product Modal for comprehensive product/offering management */}
      <EnhancedProductModal
        isOpen={enhancedProductModalOpen}
        onClose={() => {
          setEnhancedProductModalOpen(false);
          setSelectedOffering(null);
        }}
        onSuccess={() => {
          fetchOfferings();
          fetchServiceData();
          toast({
            title: 'Success',
            description: selectedOffering ? 'Offering updated successfully' : 'Offering added successfully',
          });
        }}
        product={selectedOffering}
        mode={selectedOffering ? 'edit' : 'add'}
      />

      {/* Service Area Modal */}
      <AddServiceAreaModal
        isOpen={serviceAreaModalOpen}
        onClose={() => setServiceAreaModalOpen(false)}
        onSuccess={() => {
          fetchServiceData();
          toast({
            title: 'Success',
            description: 'Service area added successfully',
          });
        }}
      />

      {/* Category Dialog */}
      <CategoryDialog
        isOpen={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          setSelectedCategoryForEdit(null);
        }}
        onSuccess={() => {
          fetchCategories();
          fetchServiceData();
        }}
        serviceTypeId={serviceId || ''}
        serviceTypeName={serviceType?.title || ''}
        category={selectedCategoryForEdit}
        mode={selectedCategoryForEdit ? 'edit' : 'add'}
      />
    </>
  );
};
