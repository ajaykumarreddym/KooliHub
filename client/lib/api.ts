import { supabase } from "./supabase";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get the current session token
const getAuthToken = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Make authenticated API request
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// Vendor API functions
export const vendorApi = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch("/api/admin/vendors");

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        return {
          success: false,
          error: response.ok ? "Invalid response format" : `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (response.ok) {
        return { success: true, data: responseData.vendors || [] };
      } else {
        return {
          success: false,
          error: responseData?.error || "Failed to fetch vendors",
        };
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return { success: false, error: "Network error" };
    }
  },

  create: async (vendorData: any): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch("/api/admin/vendors", {
        method: "POST",
        body: JSON.stringify(vendorData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        return {
          success: false,
          error: response.ok ? "Invalid response format" : `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (response.ok) {
        return { success: true, data: responseData };
      } else {
        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error creating vendor:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },

  update: async (id: string, vendorData: any): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch(`/api/admin/vendors/${id}`, {
        method: "PUT",
        body: JSON.stringify(vendorData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        return {
          success: false,
          error: response.ok ? "Invalid response format" : `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (response.ok) {
        return { success: true, data: responseData };
      } else {
        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch(`/api/admin/vendors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        return { success: true };
      } else {
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error("Error parsing error response JSON:", jsonError);
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }

        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch(
        `/api/admin/vendors/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        return { success: true };
      } else {
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error("Error parsing error response JSON:", jsonError);
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }

        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error updating vendor status:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },
};

// Product API functions
export const productApi = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch(
        "/api/admin/products?include=vendor,category,variants",
      );

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        return {
          success: false,
          error: response.ok ? "Invalid response format" : `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (response.ok) {
        return { success: true, data: responseData.products || [] };
      } else {
        return {
          success: false,
          error: responseData?.error || "Failed to fetch products",
        };
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      return { success: false, error: "Network error" };
    }
  },

  create: async (productData: any): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        return {
          success: false,
          error: response.ok ? "Invalid response format" : `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (response.ok) {
        return { success: true, data: responseData };
      } else {
        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error creating product:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },

  update: async (id: string, productData: any): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch(`/api/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(productData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        return {
          success: false,
          error: response.ok ? "Invalid response format" : `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (response.ok) {
        return { success: true, data: responseData };
      } else {
        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error updating product:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await authenticatedFetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        return { success: true };
      } else {
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error("Error parsing error response JSON:", jsonError);
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }

        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },
};

// Upload API functions
export const uploadApi = {
  vendorImage: async (
    file: File,
    type: "logo" | "banner",
  ): Promise<ApiResponse> => {
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/upload/vendor-image", {
        method: "POST",
        body: formData,
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Upload failed" };
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return { success: false, error: "Upload failed" };
    }
  },

  productImage: async (file: File): Promise<ApiResponse> => {
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/upload/product-image", {
        method: "POST",
        body: formData,
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Upload failed" };
      }
    } catch (error) {
      console.error("Error uploading product image:", error);
      return { success: false, error: "Upload failed" };
    }
  },
};
