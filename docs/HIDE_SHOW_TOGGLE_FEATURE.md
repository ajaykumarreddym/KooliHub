# Hide/Show Toggle Feature - Implementation Complete

## ✅ Feature Implemented

### **What's New:**
Added a **hide/show toggle** for all mandatory and custom fields, allowing users to control field visibility in forms on a per-service/category/subcategory basis.

---

## 🎯 Key Features

### **1. Visibility Toggle for Mandatory Fields**
- Each mandatory field now has a **Switch toggle** next to it
- Toggle between "Visible" and "Hidden" states
- Visual indicators:
  - ✅ **Green background** = Visible and active
  - 🔒 **Gray background** = Hidden from form
  - ⚠️ **Yellow background** = Not configured yet

### **2. Visibility Toggle for Custom Attributes**
- All custom attributes have an **eye icon toggle** (👁️)
- Green eye = visible, Gray eye = hidden
- Works independently of the "Required/Optional" toggle

### **3. Service-Specific Storage**
- Visibility settings are stored in the database per service/category/subcategory
- Changes to one service **DO NOT affect** other services
- Each level (service/category/subcategory) maintains its own visibility settings

### **4. Preview Integration**
- Hidden fields **automatically excluded** from form preview
- Only visible fields show in "Preview Form" dialog
- Real-time preview updates when toggling visibility

---

## 📊 How It Works

### **Database Storage:**

```sql
-- Visibility stored in is_visible column
service_attribute_config
  ├─ is_visible BOOLEAN (default: true)
  ├─ is_required BOOLEAN
  └─ service_type_id (determines scope)

category_attribute_config
  ├─ is_visible BOOLEAN (default: true)
  ├─ is_required BOOLEAN
  └─ category_id (determines scope)

subcategory_attribute_config
  ├─ is_visible BOOLEAN (default: true)
  ├─ is_required BOOLEAN
  └─ subcategory_id (determines scope)
```

### **Function Added:**

```typescript
handleToggleFieldVisibility(attrId: string, isVisible: boolean)
  ↓
  Determines correct table (service/category/subcategory)
  ↓
  Updates is_visible column in database
  ↓
  Refreshes UI to show updated state
```

---

## 🎨 UI Changes

### **Mandatory Fields Section:**

**Before Toggle:**
```
[🔒] Product Name
    ✓ Configured at this level
    [Required]
```

**After Toggle Added:**
```
[🔒] Product Name
    ✓ Configured and visible
    [Toggle: ON] [Visible]    ← NEW!
```

**When Hidden:**
```
[🔒] Product Name [👁️ crossed out]
    👁️ Hidden from form preview
    [Toggle: OFF] [Hidden]    ← Gray badge
```

### **Custom Attributes Section:**

Each attribute now has **two toggles**:

```
[Attribute Name]
  [👁️ Toggle] ← Visibility (Green/Gray eye icon)
  [Toggle] [Required/Optional] ← Required status
  [✏️ Edit]
```

---

## 🔄 User Flow

### **For Mandatory Fields:**

1. **Navigate to Attribute Manager**
   - Select Service Type (e.g., "Grocery Delivery")

2. **View Default System Fields Section**
   - See list of mandatory fields with current status

3. **Toggle Visibility**
   - Click the switch next to any field
   - ON = Field shows in forms
   - OFF = Field hidden from forms

4. **Verify in Preview**
   - Click "Preview Form" button
   - Hidden fields won't appear in preview

### **For Custom Attributes:**

1. **Add Custom Attributes**
   - Click "Add Attributes"
   - Select attributes to add

2. **Control Visibility**
   - Each attribute has an eye icon toggle
   - Green eye (👁️) = visible
   - Gray eye = hidden

3. **Independent Controls**
   - Visibility toggle works separately from Required/Optional
   - Can have "Required but Hidden" or "Optional but Visible"

---

## 💾 Database Updates

### **Example: Hiding a Field**

```sql
-- Before toggle
SELECT is_visible FROM service_attribute_config 
WHERE service_type_id = 'grocery' 
  AND attribute_id = '<product_name_id>';
-- Result: true

-- User toggles OFF
UPDATE service_attribute_config 
SET is_visible = false 
WHERE service_type_id = 'grocery' 
  AND attribute_id = '<product_name_id>';

-- After toggle
SELECT is_visible FROM service_attribute_config 
WHERE service_type_id = 'grocery' 
  AND attribute_id = '<product_name_id>';
-- Result: false
```

---

## 🎯 Service-Specific Behavior

### **Scenario 1: Multiple Services**

```
Service A (Grocery):
  Product Name: Visible ✅
  Description: Hidden 🔒
  Price: Visible ✅

Service B (Fashion):
  Product Name: Visible ✅  
  Description: Visible ✅
  Price: Hidden 🔒

Service C (Electronics):
  Product Name: Hidden 🔒
  Description: Visible ✅
  Price: Visible ✅
```

**Each service maintains independent visibility settings!**

### **Scenario 2: Hierarchical Levels**

```
Service Level:
  └─ Price: Visible ✅

Category Level (Fruits):
  └─ Price: Hidden 🔒   ← Overrides service level

Subcategory Level (Organic Fruits):
  └─ Price: Visible ✅   ← Overrides category level
```

**Lower levels can override higher levels!**

---

## 📋 Testing Guide

### **Manual Test Cases:**

**Test 1: Toggle Mandatory Field**
1. Select "Grocery Delivery" service
2. Find "Product Name" in Mandatory Fields
3. Toggle visibility OFF
4. Verify badge changes to "Hidden"
5. Click "Preview Form"
6. Verify "Product Name" is NOT in preview
7. Toggle visibility ON
8. Verify "Product Name" appears in preview

**Test 2: Service Independence**
1. Select "Grocery Delivery"
2. Hide "Description" field
3. Select "Fashion" service
4. Verify "Description" is still visible in Fashion
5. Hide "Description" in Fashion
6. Switch back to Grocery
7. Verify Grocery still has Description hidden
8. Verify Fashion still has Description hidden

**Test 3: Custom Attributes**
1. Add custom attribute "Brand Name"
2. Verify eye icon is green (visible)
3. Click eye icon to hide
4. Verify eye icon turns gray
5. Click "Preview Form"
6. Verify "Brand Name" is NOT in preview

**Test 4: Category Level Override**
1. Select Service → Category → Subcategory
2. At service level: Hide "Price"
3. Move to category level
4. Verify "Price" still hidden (inherited)
5. Show "Price" at category level (override)
6. Verify "Price" now visible at category level

---

## 🔧 Technical Implementation

### **Files Modified:**
- `/client/components/admin/ComprehensiveAttributeManager.tsx`

### **Functions Added/Modified:**

1. **`handleToggleFieldVisibility()`** - NEW
   - Handles visibility toggle for any field
   - Routes to correct table based on level
   - Updates database and refreshes UI

2. **`generatePreviewFields()`** - MODIFIED
   - Now filters out hidden fields
   - Respects `is_visible` flag from database
   - Only shows visible fields in preview

3. **Mandatory Fields Section** - MODIFIED
   - Added visibility toggle switch
   - Added visual indicators for hidden state
   - Shows "Visible" or "Hidden" badge

4. **Custom Attributes Section** - MODIFIED
   - Added eye icon toggle for visibility
   - Separate from required toggle
   - Visual feedback (green/gray eye)

### **Interface Changes:**

```typescript
// Added visibility flag to PreviewField
interface PreviewField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
    help_text: string;
    locked: boolean;
    visible?: boolean;  // ← NEW!
}
```

---

## 🎨 Visual States

### **Mandatory Fields:**

| State | Background | Badge | Toggle |
|-------|-----------|-------|--------|
| Visible & Active | Green | "Visible" | ON |
| Hidden | Gray | "Hidden" | OFF |
| Not Configured | Yellow | "Recommended" | N/A |

### **Custom Attributes:**

| State | Eye Icon | Toggle Position |
|-------|----------|----------------|
| Visible | 👁️ (Green) | Left side |
| Hidden | 👁️ (Gray) | Left side |

---

## ✅ Benefits

1. **Full Control** - Hide unnecessary fields per service
2. **Clean Forms** - Only show relevant fields to users
3. **Service-Specific** - Each service can have different field configurations
4. **Non-Destructive** - Hidden fields remain in database, just not shown
5. **Easy Toggle** - Simple one-click to show/hide
6. **Real-Time Preview** - See exactly how form will look

---

## 🚀 Usage Examples

### **Example 1: Grocery Service**
Hide "Specifications" (not needed for groceries):
```
1. Select "Grocery Delivery"
2. Find "Specifications" in Mandatory Fields
3. Toggle OFF
4. Specifications now hidden from grocery product forms
5. Still visible for other services (Electronics, etc.)
```

### **Example 2: Electronics Service**
Show all technical fields:
```
1. Select "Electronics"
2. Keep "Specifications" visible
3. Add custom "Warranty Period" attribute
4. Keep visible (default)
5. Electronics forms now show full technical details
```

### **Example 3: Fashion Service**
Minimal fields for quick listing:
```
1. Select "Fashion"
2. Hide "Specifications"
3. Hide "Product Images" (use single image instead)
4. Keep "Description", "Price" visible
5. Fashion forms now streamlined
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Functions Added** | 1 (handleToggleFieldVisibility) |
| **Functions Modified** | 3 |
| **UI Components Changed** | 2 sections |
| **Lines of Code** | ~150 |
| **Database Columns Used** | is_visible (existing) |
| **New Tables** | 0 (uses existing) |

---

## 🔍 Database Query Examples

### **Check Visibility Settings:**
```sql
-- View visibility for all fields in Grocery service
SELECT 
    ar.label as field_name,
    sac.is_visible,
    sac.is_required,
    sac.display_order
FROM service_attribute_config sac
JOIN attribute_registry ar ON sac.attribute_id = ar.id
WHERE sac.service_type_id = 'grocery'
ORDER BY sac.display_order;
```

### **Find Hidden Fields:**
```sql
-- List all hidden fields across all services
SELECT 
    st.title as service,
    ar.label as field_name,
    sac.is_required
FROM service_attribute_config sac
JOIN service_types st ON sac.service_type_id = st.id
JOIN attribute_registry ar ON sac.attribute_id = ar.id
WHERE sac.is_visible = false
ORDER BY st.title, ar.label;
```

### **Count Visible vs Hidden:**
```sql
-- Statistics by service
SELECT 
    st.title as service,
    COUNT(*) FILTER (WHERE sac.is_visible = true) as visible_fields,
    COUNT(*) FILTER (WHERE sac.is_visible = false) as hidden_fields,
    COUNT(*) as total_fields
FROM service_attribute_config sac
JOIN service_types st ON sac.service_type_id = st.id
GROUP BY st.title
ORDER BY st.title;
```

---

## 🛠️ Troubleshooting

### **Toggle Not Working:**
1. Check browser console for errors
2. Verify user has admin permissions
3. Check database connection
4. Ensure `is_visible` column exists in config tables

### **Hidden Field Still Showing:**
1. Clear browser cache
2. Check if field is configured at multiple levels
3. Verify correct service/category/subcategory selected
4. Check database value directly

### **Toggle Changes Other Services:**
1. Should NOT happen - each service is independent
2. Check `service_type_id` / `category_id` / `subcategory_id` in database
3. Verify correct filter column is used in update query

---

## 📝 Summary

✅ **Hide/show toggle added** for all fields (mandatory + custom)  
✅ **Service-specific** - changes don't affect other services  
✅ **Database-backed** - settings persist across sessions  
✅ **Preview integration** - hidden fields excluded from preview  
✅ **Visual indicators** - clear status for visible/hidden states  
✅ **Hierarchical support** - works at service/category/subcategory levels  

**The system now provides complete control over field visibility per service while maintaining data integrity and service independence!** 🎉

---

**Date:** October 22, 2025  
**Status:** ✅ Complete and Production Ready  
**Version:** 2.0  

