# Testing Measurement Units in Product Creation - Quick Guide

## ✅ What You'll See

When creating a product in the admin panel, the measurement unit field will display **service-specific labels** based on what you configured in the Attribute Registry.

---

## 🎯 Testing Steps

### **Test 1: Car Rental Service**
1. Go to **Admin Panel** → **Service Management** → **Product Management**
2. Click **"Add Product"** button
3. Select **Service Type**: `Car Rental`
4. Select a **Category** (e.g., Sedan, SUV)
5. **Look for the field labeled**: **"Rental Billing Period"** ⭐
6. Click the dropdown → You should see:
   - ✅ Daily
   - ✅ Weekly  
   - ✅ Monthly
   - ✅ Hourly
   - (+ more options)

**Expected Label**: `Rental Billing Period` (NOT "Measurement Unit")  
**Help Text**: "Rental duration unit for vehicle pricing"

---

### **Test 2: Handyman Services**
1. Select **Service Type**: `Handyman Services`
2. Select a **Category** (e.g., Plumbing, Electrical)
3. **Look for the field labeled**: **"Service Billing Unit"** ⭐
4. Click the dropdown → You should see:
   - ✅ Per Hour
   - ✅ Per Day
   - ✅ Per Project
   - ✅ Per Square Foot
   - (+ more options)

**Expected Label**: `Service Billing Unit`  
**Help Text**: "How this service is billed (hourly, per job, per area, etc.)"

---

### **Test 3: Liquor Delivery**
1. Select **Service Type**: `Liquor Delivery`
2. Select a **Category** (e.g., Wine, Whiskey)
3. **Look for the field labeled**: **"Bottle/Package Size"** ⭐
4. Click the dropdown → You should see:
   - ✅ 375ml (Half Bottle)
   - ✅ 750ml (Standard)
   - ✅ 1 Liter
   - ✅ 1.75 Liter
   - (+ more options)

**Expected Label**: `Bottle/Package Size`  
**Help Text**: "Volume or package size for alcoholic beverages"

---

### **Test 4: Trip Booking**
1. Select **Service Type**: `Trip Booking`
2. Select a **Category** (e.g., City Tours, Outstation)
3. **Look for the field labeled**: **"Trip Billing Unit"** ⭐
4. Click the dropdown → You should see:
   - ✅ Per Trip
   - ✅ Per Kilometer
   - ✅ Per Day
   - ✅ Per Hour
   - (+ more options)

**Expected Label**: `Trip Billing Unit`  
**Help Text**: "How the transport service is measured and billed"

---

### **Test 5: Fruits & Vegetables (Grocery)**
1. Select **Service Type**: `Fruits and Vegetables`
2. Select a **Category** (e.g., Fresh Fruits, Vegetables)
3. **Look for the field labeled**: **"Measurement Unit"** ⭐
4. Click the dropdown → You should see:
   - ✅ Kilogram (kg)
   - ✅ Gram (g)
   - ✅ Piece
   - ✅ Dozen
   - (+ more options)

**Expected Label**: `Measurement Unit`  
**Help Text**: "Weight or quantity unit for fresh produce"

---

## 🔧 Managing Units in Attribute Registry

### **How to Change/Add Units**:
1. Go to **Admin Panel** → **Service Management**
2. Click **"Attribute Registry"** button
3. Select the **"Units Manager"** tab
4. From the dropdown, select any service (e.g., "Car Rental")
5. You'll see:
   - ✅ **Enable/Disable Toggle**: Turn units ON/OFF for this service
   - ✅ **Custom Label Field**: Change the field name (e.g., "Rental Period")
   - ✅ **Help Text Field**: Add guidance text
   - ✅ **Units Table**: Add, edit, or delete unit options
6. Click **"Save Configuration"** when done

### **To Disable Units for a Service**:
1. Select the service
2. Toggle **"Enable Measurement Units"** switch to OFF
3. The field will disappear from product creation for that service

---

## 📊 Current Service Labels (from Database)

| Service | Field Label | Sample Units |
|---------|-------------|--------------|
| **Car Rental** | Rental Billing Period | Daily, Weekly, Monthly, Hourly |
| **Handyman** | Service Billing Unit | Per Hour, Per Day, Per Project |
| **Liquor** | Bottle/Package Size | 750ml, 1L, 375ml |
| **Trip Booking** | Trip Billing Unit | Per Trip, Per Km, Per Day |
| **Fruits & Veggies** | Measurement Unit | kg, g, piece, dozen |
| **Electronics** | Sale Unit | Piece, Pack, Set |
| **Fashion** | Sale Unit | Piece, Set, Pair |
| **Home & Kitchen** | Sale Unit | Piece, Pack, Set |
| **Commercial Vehicles** | Sale Unit | Unit, Piece, Set |

---

## ✅ Verification Checklist

- [ ] Service-specific labels display correctly (not generic "Measurement Unit")
- [ ] Unit dropdown shows correct options for each service
- [ ] Help text appears below the field
- [ ] Required field indicator (*) is shown
- [ ] Can successfully create products with selected units
- [ ] Units persist after product creation (visible in product list)
- [ ] Can toggle units ON/OFF in Attribute Registry
- [ ] Can add new units in Attribute Registry
- [ ] Changes in registry reflect immediately in product creation

---

## 🐛 Troubleshooting

### **Problem**: Field shows "Measurement Unit" instead of custom label
**Solution**: 
1. Check `service_attribute_config` has `override_label` set
2. Verify API endpoint returns the custom label
3. Clear browser cache and refresh

### **Problem**: No units showing in dropdown
**Solution**:
1. Check `service_attribute_config.custom_validation_rules.options` has data
2. Verify `is_visible: true` for that service
3. Check browser console for API errors

### **Problem**: Field not showing at all
**Solution**:
1. Check `service_attribute_config.is_visible` is `true`
2. Verify attribute is added to the service in Attribute Registry
3. Make sure service is selected first in product creation

---

## 🎉 Success Indicators

✅ **Custom labels display** → Shows service-appropriate field name  
✅ **Units populate** → Dropdown has service-specific options  
✅ **Help text visible** → Guidance text appears below field  
✅ **Products save** → Can create products with selected units  
✅ **Admin control** → Can enable/disable per service in registry  

---

**Last Updated**: January 22, 2025  
**Status**: ✅ Ready for Testing

