import cors from "cors";
import "dotenv/config";
import express from "express";
import {
    bulkUpdateProducts,
    exportServiceAreas,
    getAnalyticsData,
    getDashboardStats,
    getRealtimeStats,
    requireAdmin,
} from "./routes/admin";
import {
    createSubcategory,
    getAttributeHierarchy,
    getSubcategories,
    previewProductForm,
    reorderAttributes,
    validateProductAttributes
} from "./routes/attributes";
import { confirmEmail, resendConfirmation } from "./routes/auth";
import {
    createCategory,
    deleteCategory,
    getCategories,
    getCategory,
    getCategoryTree,
    updateCategory,
} from "./routes/categories";
import {
    applyFieldTemplate,
    createCustomField,
    deleteCustomField,
    getCustomFields,
    getCustomFieldValues,
    getFieldTemplates,
    saveCustomFieldValues,
    updateCustomField,
} from "./routes/custom-fields";
import { handleDemo } from "./routes/demo";
import {
    getNotificationSettings,
    saveFCMToken,
    sendNotificationToTopic,
    sendNotificationToUser,
    sendOrderNotification,
    sendTestNotification,
    subscribeToTopic,
    unsubscribeFromTopic,
} from "./routes/firebase";
import {
    bulkUpdatePricing,
    copyAreaPricing,
    getAreaPricingAnalytics,
    getAreaProducts,
    getEffectivePrice,
} from "./routes/product-area-pricing";
import {
    createProduct,
    createProductVariant,
    deleteProduct,
    deleteProductVariant,
    getProduct,
    getProducts,
    getProductVariants,
    updateProduct,
    updateProductVariant,
} from "./routes/products";
import {
    checkDatabase,
    setupAdminAccount,
    testAdminAuth,
} from "./routes/setup";
import { handleUploadError, uploadProductImage, uploadVendorImage } from "./routes/upload";
import {
    createUser,
    getUserById,
    listUsers,
    loginUser,
    updateUserRole,
} from "./routes/users";
import {
    createVendor,
    deleteVendor,
    getVendor,
    getVendors,
    getVendorStats,
    updateVendor,
    updateVendorStatus,
} from "./routes/vendors";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files for uploads
  app.use("/uploads", express.static("public/uploads"));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Setup routes (for development)
  app.post("/api/setup/admin", setupAdminAccount);
  app.post("/api/test/auth", testAdminAuth);
  app.get("/api/check/database", checkDatabase);

  // User management routes
  app.post("/api/users/create", createUser);
  app.post("/api/users/login", loginUser);
  app.get("/api/users/:userId", getUserById);
  app.get("/api/users", listUsers);
  app.put("/api/users/:userId/role", updateUserRole);

  // Auth routes
  app.post("/api/auth/resend-confirmation", resendConfirmation);
  app.post("/api/auth/confirm-email", confirmEmail);

  // Admin API routes (protected)
  app.get("/api/admin/dashboard/stats", requireAdmin, getDashboardStats);
  app.get("/api/admin/analytics", requireAdmin, getAnalyticsData);
  app.post("/api/admin/products/bulk", requireAdmin, bulkUpdateProducts);
  app.get("/api/admin/service-areas/export", requireAdmin, exportServiceAreas);
  app.get("/api/admin/realtime/stats", requireAdmin, getRealtimeStats);

  // Firebase/FCM routes
  app.post("/api/fcm/save-token", saveFCMToken);
  app.post("/api/fcm/subscribe-topic", subscribeToTopic);
  app.post("/api/fcm/unsubscribe-topic", unsubscribeFromTopic);
  app.post("/api/fcm/send-to-user", requireAdmin, sendNotificationToUser);
  app.post("/api/fcm/send-to-topic", requireAdmin, sendNotificationToTopic);
  app.post(
    "/api/fcm/send-order-notification",
    requireAdmin,
    sendOrderNotification,
  );
  app.post("/api/fcm/test", sendTestNotification);
  app.get("/api/fcm/settings/:userId", getNotificationSettings);

  // Product Area Pricing routes (legacy)
  app.get("/api/pricing/effective", getEffectivePrice);
  app.get("/api/pricing/area/:serviceAreaId/products", getAreaProducts);
  app.post(
    "/api/pricing/area/:serviceAreaId/bulk-update",
    requireAdmin,
    bulkUpdatePricing,
  );
  app.post("/api/pricing/copy-area", requireAdmin, copyAreaPricing);
  app.get(
    "/api/pricing/area/:serviceAreaId/analytics",
    getAreaPricingAnalytics,
  );

  // Multi-vendor management routes
  app.get("/api/admin/vendors", requireAdmin, getVendors);
  app.get("/api/admin/vendors/:id", requireAdmin, getVendor);
  app.post("/api/admin/vendors", requireAdmin, createVendor);
  app.put("/api/admin/vendors/:id", requireAdmin, updateVendor);
  app.patch("/api/admin/vendors/:id/status", requireAdmin, updateVendorStatus);
  app.delete("/api/admin/vendors/:id", requireAdmin, deleteVendor);
  app.get("/api/admin/vendors/stats", requireAdmin, getVendorStats);

  // Upload routes
  app.post("/api/upload/vendor-image", requireAdmin, uploadVendorImage);
  app.post("/api/upload/product-image", requireAdmin, uploadProductImage);
  app.use(handleUploadError);

  // Multi-vendor product management routes
  app.get("/api/admin/products", requireAdmin, getProducts);
  app.get("/api/admin/products/:id", requireAdmin, getProduct);
  app.post("/api/admin/products", requireAdmin, createProduct);
  app.put("/api/admin/products/:id", requireAdmin, updateProduct);
  app.delete("/api/admin/products/:id", requireAdmin, deleteProduct);

  // Product variant routes
  app.get("/api/admin/products/:id/variants", requireAdmin, getProductVariants);
  app.post(
    "/api/admin/products/:id/variants",
    requireAdmin,
    createProductVariant,
  );
  app.put(
    "/api/admin/products/variants/:variantId",
    requireAdmin,
    updateProductVariant,
  );
  app.delete(
    "/api/admin/products/variants/:variantId",
    requireAdmin,
    deleteProductVariant,
  );

  // Public category routes (for frontend components)
  app.get("/api/categories", getCategories);
  app.get("/api/categories/tree", getCategoryTree);
  app.get("/api/categories/:id", getCategory);

  // Admin category management routes (protected)
  app.get("/api/admin/categories", requireAdmin, getCategories);
  app.get("/api/admin/categories/tree", requireAdmin, getCategoryTree);
  app.get("/api/admin/categories/:id", requireAdmin, getCategory);
  app.post("/api/admin/categories", requireAdmin, createCategory);
  app.put("/api/admin/categories/:id", requireAdmin, updateCategory);
  app.delete("/api/admin/categories/:id", requireAdmin, deleteCategory);

  // Custom fields management routes (protected)
  app.get("/api/admin/custom-fields/:serviceTypeId", requireAdmin, getCustomFields);
  app.post("/api/admin/custom-fields", requireAdmin, createCustomField);
  app.put("/api/admin/custom-fields/:fieldId", requireAdmin, updateCustomField);
  app.delete("/api/admin/custom-fields/:fieldId", requireAdmin, deleteCustomField);
  app.get("/api/admin/custom-fields/templates", requireAdmin, getFieldTemplates);
  app.post("/api/admin/custom-fields/:serviceTypeId/apply-template", requireAdmin, applyFieldTemplate);
  
  // Custom field values routes (protected)
  app.get("/api/admin/custom-field-values/:productId", requireAdmin, getCustomFieldValues);
  app.post("/api/admin/custom-field-values/:productId", requireAdmin, saveCustomFieldValues);

  // Attribute management endpoints (NEW - Naming Convention System)
  app.post("/api/attributes/reorder", requireAdmin, reorderAttributes);
  app.get("/api/attributes/preview", previewProductForm);
  app.post("/api/attributes/validate", validateProductAttributes);
  app.get("/api/attributes/hierarchy/:productId", getAttributeHierarchy);
  app.get("/api/attributes/subcategories", getSubcategories);
  app.post("/api/attributes/subcategories", requireAdmin, createSubcategory);

  return app;
}
