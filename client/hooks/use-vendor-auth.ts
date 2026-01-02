import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface VendorAuthInfo {
  isVendor: boolean;
  vendorId: string | null;
  vendorName: string | null;
  canSelectVendor: boolean;
  loading: boolean;
}

export const useVendorAuth = (): VendorAuthInfo => {
  const { user, isAdminUser } = useAuth();
  const [vendorInfo, setVendorInfo] = useState<VendorAuthInfo>({
    isVendor: false,
    vendorId: null,
    vendorName: null,
    canSelectVendor: false,
    loading: true,
  });

  useEffect(() => {
    const fetchVendorInfo = async () => {
      if (!user) {
        setVendorInfo({
          isVendor: false,
          vendorId: null,
          vendorName: null,
          canSelectVendor: false,
          loading: false,
        });
        return;
      }

      try {
        // Check if user is linked to any vendor
        const { data: vendorUser, error } = await supabase
          .from('vendor_users')
          .select(`
            vendor_id,
            role,
            is_active,
            vendor:vendors(
              id,
              name,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching vendor info:', error);
        }

        const vendor = vendorUser?.vendor as any;
        const isVendor = !!vendorUser && vendor?.status === 'active';
        const canSelectVendor = isAdminUser || !isVendor; // Admins can select any vendor, vendors cannot

        setVendorInfo({
          isVendor,
          vendorId: vendorUser?.vendor_id || null,
          vendorName: vendor?.name || null,
          canSelectVendor,
          loading: false,
        });

      } catch (error) {
        console.error('Error in vendor auth hook:', error);
        setVendorInfo({
          isVendor: false,
          vendorId: null,
          vendorName: null,
          canSelectVendor: isAdminUser,
          loading: false,
        });
      }
    };

    fetchVendorInfo();
  }, [user, isAdminUser]);

  return vendorInfo;
};
