# KooliHub Project Functionality Map
**Complete File-by-File Documentation**

Generated: October 11, 2025

---

## Table of Contents
1. [Client Pages](#client-pages)
2. [Client Components](#client-components)
3. [Client Contexts](#client-contexts)
4. [Client Hooks](#client-hooks)
5. [Client Libraries](#client-libraries)
6. [Server Routes](#server-routes)
7. [Server Libraries](#server-libraries)
8. [Shared Code](#shared-code)
9. [Database Files](#database-files)

---

## Client Pages

### Consumer Pages (Public)

#### `/` - Index.tsx
**Purpose:** Home page / landing page  
**Functionality:**
- Displays service type cards (8 services)
- Hero section with branding
- Service navigation
- Featured categories
- Quick access to all services

**Dependencies:**
- ServiceCard component
- Hero component
- Navigation

**Routes to:**
- `/grocery`
- `/trips`
- `/car-rental`
- `/handyman`
- `/electronics`
- `/fashion`
- `/beauty`
- `/home`

---

#### `/grocery` - Grocery.tsx
**Purpose:** Grocery marketplace interface  
**Functionality:**
- Product catalog for grocery items
- Category filtering
- Add to cart functionality
- Search products
- Product details view
- Wishlist integration

**State Management:**
- CartContext
- WishlistContext

**API Calls:**
- Fetch products by category='grocery'
- Check serviceable area
- Load inventory

---

#### `/trips` - Trips.tsx
**Purpose:** Trip booking service  
**Functionality:**
- Browse available trips
- Filter by destination, date, price
- View trip details
- Book trip
- View booking history

**Features:**
- Date picker
- Price range filter
- Destination search
- Trip gallery
- Reviews and ratings

---

#### `/car-rental` - CarRental.tsx
**Purpose:** Car rental service  
**Functionality:**
- Browse available vehicles
- Filter by type, price, availability
- View vehicle details
- Book rental
- Manage bookings

**Features:**
- Date range picker
- Vehicle type filter
- Price calculator
- Insurance options
- Booking calendar

---

#### `/handyman` - Handyman.tsx
**Purpose:** Handyman services marketplace  
**Functionality:**
- Browse service providers
- Service category filtering
- Request service
- Schedule appointment
- View provider ratings

**Features:**
- Service type selection
- Provider search
- Rating and reviews
- Appointment scheduling
- Service history

---

#### `/electronics` - Electronics.tsx
**Purpose:** Electronics marketplace  
**Functionality:**
- Electronics product catalog
- Category browsing
- Product comparison
- Technical specifications
- Add to cart

**Features:**
- Detailed specifications
- Product comparison tool
- Price filtering
- Brand filtering
- Product reviews

---

#### `/fashion` - Fashion.tsx
**Purpose:** Fashion marketplace  
**Functionality:**
- Fashion products catalog
- Style browsing
- Size selection
- Color variants
- Try-on options

**Features:**
- Size guide
- Color variations
- Style categories
- Wishlist
- Fashion trends

---

#### `/beauty` - Beauty.tsx
**Purpose:** Beauty services and products  
**Functionality:**
- Beauty product catalog
- Service booking
- Product recommendations
- Brand exploration

**Features:**
- Product categories
- Service scheduling
- Beauty tips
- Product reviews

---

#### `/home` - HomeKitchen.tsx
**Purpose:** Home and kitchen products  
**Functionality:**
- Home goods catalog
- Kitchen appliances
- Furniture browsing
- Home decor

**Features:**
- Room-based categories
- Product dimensions
- Material information
- Installation services

---

### User Pages

#### `/profile` - Profile.tsx
**Purpose:** User profile management  
**Functionality:**
- View user profile
- Edit personal information
- Change password
- View order history
- Manage addresses
- View wishlist
- Notification settings

**State Management:**
- AuthContext (user data)

**API Calls:**
- GET /api/users/:userId
- PUT /api/users/:userId
- GET /api/orders (filtered by user)

---

#### `/user-test` - UserTest.tsx
**Purpose:** User testing page  
**Functionality:**
- Test user-related features
- Debug user state
- Test authentication
- Test profile operations

**Usage:** Development/testing only

---

### Authentication Pages

#### `/auth/callback` - AuthCallback.tsx
**Purpose:** OAuth callback handler  
**Functionality:**
- Handle OAuth redirects
- Process authentication tokens
- Redirect to intended page
- Handle auth errors

**Supported Providers:**
- Google OAuth
- Facebook OAuth
- Email confirmation

---

### Admin Pages

#### `/admin/login` - AdminLogin.tsx
**Purpose:** Admin authentication page  
**Functionality:**
- Admin login form
- Email/password authentication
- Remember me option
- Forgot password link
- Admin-specific validation

**Security:**
- Admin role verification
- Session management
- CSRF protection

---

#### `/admin/dashboard` - Dashboard.tsx
**Purpose:** Main admin dashboard  
**Functionality:**
- Overview statistics
  - Total users
  - Total products
  - Total orders
  - Total revenue
- Recent orders
- Top products
- Vendor performance
- Service analytics
- Quick actions

**Widgets:**
- Stats cards
- Revenue chart
- Orders chart
- Product performance
- Vendor metrics

**API Calls:**
- GET /api/admin/dashboard/stats
- GET /api/admin/analytics
- GET /api/admin/realtime/stats (SSE)

---

#### `/admin/product-management` - UnifiedProductManagement.tsx
**Purpose:** Comprehensive product management (PRIMARY)  
**Functionality:**
- **Products Tab:**
  - List all products (with pagination)
  - Search products
  - Filter by vendor, category, status
  - Create new product
  - Edit product
  - Delete product (soft delete)
  - Bulk operations
  - Product variants
  - Dynamic attributes
  - Image gallery
  - SEO fields

- **Inventory Tab:**
  - View inventory levels
  - Update stock quantities
  - Track inventory by location
  - Low stock alerts
  - Inventory history

- **Service Areas Tab:**
  - Manage serviceable pincodes
  - Add/edit service areas
  - Set delivery charges
  - Set delivery times
  - Map picker integration
  - Bulk import/export

- **Service Types Tab:**
  - Manage service types
  - Configure service-specific fields
  - Enable/disable services
  - Set service icons and colors
  - Service-level settings

**Components Used:**
- ComprehensiveProductModal
- ServiceTypeCRUD
- AddServiceAreaModal
- MapPicker
- DataTable

**State Management:**
- AdminDataContext (products, categories, vendors)
- Local state for filters and pagination

**API Calls:**
- GET /api/admin/products
- POST /api/admin/products
- PUT /api/admin/products/:id
- DELETE /api/admin/products/:id
- GET /api/admin/categories
- GET /api/admin/vendors

**Features:**
- Real-time updates via Supabase subscriptions
- Debounced search
- Optimistic UI updates
- Error handling with toast notifications
- Loading states
- Empty states

---

#### `/admin/services/*` - ServiceManagement.tsx
**Purpose:** Service-specific management  
**Functionality:**
- Route to service-specific dashboards
- Service type selection
- Service analytics
- Service configuration

**Sub-routes:**
- `/admin/services/grocery` → GroceryDashboard
- `/admin/services/transport` → TransportDashboard
- `/admin/services/handyman` → HandymanDashboard
- `/admin/services/fashion` → FashionDashboard

---

#### Service Dashboards

##### ComprehensiveServiceDashboard.tsx
**Purpose:** All-in-one service management dashboard  
**Functionality:**
- Service-specific analytics
- Product management for service
- Order management
- Customer insights
- Performance metrics

---

##### GroceryDashboard.tsx
**Purpose:** Grocery service specific management  
**Functionality:**
- Grocery product catalog
- Category management
- Inventory tracking
- Supplier management
- Fresh produce tracking
- Expiry date management

**Unique Features:**
- Weight-based products
- Organic/conventional toggle
- Farm-to-table tracking

---

##### TransportDashboard.tsx
**Purpose:** Transport/trips/car rental management  
**Functionality:**
- Vehicle fleet management
- Booking calendar
- Driver management
- Route planning
- Pricing tiers
- Availability management

**Unique Features:**
- Vehicle type management
- Booking slots
- Dynamic pricing
- GPS integration

---

##### HandymanDashboard.tsx
**Purpose:** Handyman service management  
**Functionality:**
- Service provider management
- Service categories
- Appointment scheduling
- Service areas
- Pricing per service
- Provider ratings

**Unique Features:**
- Skill-based filtering
- Availability calendar
- Job tracking
- Before/after photos

---

##### FashionDashboard.tsx
**Purpose:** Fashion marketplace management  
**Functionality:**
- Fashion product catalog
- Size variants
- Color variants
- Style categories
- Brand management
- Seasonal collections

**Unique Features:**
- Size chart management
- Color swatches
- Style tags
- Collection management

---

#### `/admin/vendors` - Vendors.tsx
**Purpose:** Vendor management  
**Functionality:**
- List all vendors
- Create new vendor
- Edit vendor details
- Update vendor status (active/inactive/pending/suspended)
- Delete vendor
- View vendor statistics
- Vendor profile details
- Vendor service zones
- Vendor commission settings

**Table Columns:**
- Vendor name
- Business email
- Status badge
- Commission rate
- Created date
- Actions (view, edit, delete)

**API Calls:**
- GET /api/admin/vendors
- POST /api/admin/vendors
- PUT /api/admin/vendors/:id
- PATCH /api/admin/vendors/:id/status
- DELETE /api/admin/vendors/:id
- GET /api/admin/vendors/stats

**Components:**
- EnhancedVendorModal
- VendorDetailsView
- VendorStatusBadge
- VendorImageUpload

---

#### `/admin/users` - Users.tsx
**Purpose:** User management  
**Functionality:**
- List all users
- Search users
- Filter by role
- View user details
- Update user role
- Disable/enable user accounts
- View user activity
- User statistics

**User Roles:**
- admin
- vendor_admin
- vendor_user
- customer
- guest

**API Calls:**
- GET /api/users
- GET /api/users/:userId
- PUT /api/users/:userId/role

---

#### `/admin/orders` - Orders.tsx
**Purpose:** Order management  
**Functionality:**
- List all orders
- Filter by status, date, service type
- Search orders
- View order details
- Update order status
- Process refunds
- Order timeline
- Customer information
- Payment status

**Order Statuses:**
- pending
- confirmed
- processing
- shipped
- delivered
- cancelled
- refunded

**Features:**
- Order status workflow
- Email notifications
- Invoice generation
- Shipping label creation

**API Calls:**
- GET /api/admin/orders
- PUT /api/admin/orders/:id/status
- POST /api/admin/orders/:id/refund

---

#### `/admin/order-fulfillment` - OrderFulfillment.tsx
**Purpose:** Order fulfillment workflow  
**Functionality:**
- View pending orders
- Assign orders to vendors/drivers
- Pack orders
- Generate shipping labels
- Update shipping status
- Track deliveries
- Handle exceptions

**Workflow Steps:**
1. Order received
2. Vendor confirmation
3. Packing
4. Shipping
5. Out for delivery
6. Delivered

**Features:**
- Kanban board view
- Drag-and-drop status updates
- Real-time order updates
- Delivery route optimization

---

#### `/admin/order-analytics` - OrderAnalytics.tsx
**Purpose:** Order analytics and reporting  
**Functionality:**
- Order trends over time
- Revenue analysis
- Service type breakdown
- Vendor performance
- Peak hours analysis
- Conversion metrics
- Customer lifetime value

**Charts:**
- Line chart (orders over time)
- Bar chart (orders by service type)
- Pie chart (order status distribution)
- Area chart (revenue trends)

**Metrics:**
- Total orders
- Average order value
- Fulfillment rate
- Cancellation rate
- Customer satisfaction

---

#### `/admin/pos` - POS.tsx
**Purpose:** Point of Sale system  
**Functionality:**
- Quick product search
- Scan barcodes
- Add items to cart
- Calculate totals
- Apply discounts
- Multiple payment methods
- Print receipt
- Customer lookup

**Use Case:**
- In-store purchases
- Quick checkout
- Walk-in customers
- Offline mode support

**Features:**
- Barcode scanner integration
- Cash drawer integration
- Receipt printer
- Customer display
- Offline capability

---

#### `/admin/coupons` - Coupons.tsx
**Purpose:** Discount coupon management  
**Functionality:**
- Create coupon codes
- Set discount type (percentage/fixed)
- Set validity period
- Usage limits
- Minimum order amount
- Coupon analytics
- Active/inactive toggle

**Coupon Types:**
- Percentage discount
- Fixed amount discount
- Free shipping
- Buy X Get Y

**Fields:**
- Code (unique)
- Name
- Description
- Discount type
- Discount value
- Minimum order amount
- Usage limit
- Valid from/until
- Is active

---

#### `/admin/banners` - Banners.tsx
**Purpose:** Marketing banner management  
**Functionality:**
- Create promotional banners
- Set banner position
- Schedule banner display
- Target device type
- Set priority
- Upload images
- Link URLs
- Active/inactive toggle

**Banner Positions:**
- Hero (main slider)
- Middle (content area)
- Footer
- Sidebar

**Device Types:**
- All devices
- Desktop only
- Mobile only

---

#### `/admin/notifications` - Notifications.tsx
**Purpose:** System notification management  
**Functionality:**
- Create notifications
- Target audience selection
- Delivery method
- Schedule notifications
- Track delivery status
- Notification analytics

**Target Audiences:**
- All users
- Customers only
- Vendors only
- Admins only

**Delivery Methods:**
- In-app
- Email
- SMS
- Push notification

---

#### `/admin/firebase-notifications` - FirebaseNotifications.tsx
**Purpose:** Push notification management via Firebase  
**Functionality:**
- Send push notifications
- Create notification campaigns
- Target specific users/topics
- Schedule notifications
- Track notification metrics
- Device token management

**Features:**
- Topic-based messaging
- User-specific notifications
- Rich media notifications
- Action buttons
- Deep linking

**API Calls:**
- POST /api/fcm/send-to-user
- POST /api/fcm/send-to-topic
- POST /api/fcm/send-order-notification

---

#### `/admin/payments` - Payments.tsx
**Purpose:** Payment gateway configuration  
**Functionality:**
- Configure payment methods
- Stripe settings
- Razorpay settings
- Payment fees
- Refund policy
- Transaction logs
- Payment analytics

**Payment Gateways:**
- Stripe
- Razorpay
- Cash on delivery

**Settings:**
- API keys
- Webhook URLs
- Sandbox/production mode
- Currency settings
- Fee structure

---

#### `/admin/app-config` - AppConfig.tsx
**Purpose:** Application-wide settings  
**Functionality:**
- App name and branding
- Logo and favicon
- Color scheme
- Dark mode toggle
- Maintenance mode
- Registration settings
- Email verification
- Analytics integration (GA, FB Pixel)
- Support contact info
- Terms and privacy URLs
- File upload settings
- Rate limiting
- Session timeout

**Configuration Sections:**
- General
- Branding
- Security
- Email (SMTP)
- Social authentication
- Features
- Analytics

---

#### `/admin/analytics` - Analytics.tsx
**Purpose:** Business intelligence dashboard  
**Functionality:**
- Key performance indicators
- Revenue analytics
- User growth
- Product performance
- Vendor performance
- Service analytics
- Geographic distribution
- Time-based trends

**Metrics:**
- Total revenue
- Order count
- Active users
- New customers
- Repeat customers
- Average order value
- Customer acquisition cost
- Lifetime value

**Charts:**
- Revenue trends
- User growth
- Popular products
- Service type distribution
- Geographic heat map

---

#### `/admin/area-inventory` - AreaInventory.tsx
**Purpose:** Area-specific inventory management  
**Functionality:**
- View inventory by service area
- Set area-specific pricing
- Stock levels per area
- Transfer stock between areas
- Low stock alerts
- Area demand forecasting

**Features:**
- Area selection
- Product availability toggle
- Price overrides
- Stock adjustments
- Bulk updates

---

#### `/admin/database-setup` - DatabaseSetup.tsx
**Purpose:** Database initialization and setup  
**Functionality:**
- Run database migrations
- Create initial admin account
- Setup default data
- Test database connectivity
- View database status
- Run database utilities

**Operations:**
- Check database connection
- Create tables
- Setup RLS policies
- Insert seed data
- Create admin user

---

#### `/admin/custom-fields-test` - CustomFieldsTest.tsx
**Purpose:** Test dynamic custom fields system  
**Functionality:**
- Test field definitions
- Test field rendering
- Test field validation
- Test field values
- Debug custom fields

**Usage:** Development and testing

---

#### `/admin/debug` - Debug.tsx
**Purpose:** Debugging utilities  
**Functionality:**
- View application state
- Test API endpoints
- View logs
- Clear cache
- Test integrations
- Database queries

**Usage:** Development and debugging

---

#### Legacy Admin Pages (Being Replaced)

##### Products.tsx
**Status:** Legacy - replaced by UnifiedProductManagement  
**Functionality:** Basic product CRUD

##### ProductsInventory.tsx
**Status:** Legacy - replaced by UnifiedProductManagement  
**Functionality:** Inventory management

##### Inventory.tsx
**Status:** Legacy - replaced by UnifiedProductManagement  
**Functionality:** Stock management

##### ServiceAreas.tsx
**Status:** Legacy - replaced by UnifiedProductManagement  
**Functionality:** Service area management

##### ServiceTypes.tsx
**Status:** Legacy - replaced by UnifiedProductManagement  
**Functionality:** Service type management

---

### Utility Pages

#### `/404` - NotFound.tsx
**Purpose:** 404 error page  
**Functionality:**
- Display 404 message
- Provide navigation options
- Suggest popular pages
- Search functionality

---

## Client Components

### Admin Components (`client/components/admin/`)

#### AdminLayout.tsx
**Purpose:** Admin panel layout wrapper  
**Functionality:**
- Sidebar navigation
- Top bar with user menu
- Main content area
- Breadcrumbs
- Mobile responsive menu
- Logout functionality

**Navigation Items:**
- Dashboard
- Services
- Products
- Vendors
- Orders
- Users
- Analytics
- Settings

---

#### AdminRoute.tsx
**Purpose:** Protected route wrapper for admin pages  
**Functionality:**
- Check if user is authenticated
- Verify admin role
- Redirect to login if not admin
- Show loading state
- Handle auth errors

**Security:**
- Validates JWT token
- Checks user role
- Prevents unauthorized access

---

#### ComprehensiveProductModal.tsx
**Purpose:** Full-featured product creation/editing modal  
**Functionality:**
- Multi-step form
- Basic information
- Pricing
- Inventory
- Images
- SEO
- Dynamic attributes
- Variants
- Form validation
- Image upload
- Preview mode

**Form Sections:**
1. Basic Info (name, description, category)
2. Pricing (price, discount, currency)
3. Inventory (stock, SKU, tracking)
4. Images (gallery, primary image)
5. SEO (meta title, description, keywords)
6. Attributes (service-specific fields)
7. Variants (size, color, etc.)

---

#### EnhancedProductModal.tsx
**Purpose:** Simplified product modal (alternative)  
**Functionality:**
- Single-page form
- Essential fields only
- Quick product creation
- Inline validation

---

#### EnhancedVendorModal.tsx
**Purpose:** Vendor creation/editing modal  
**Functionality:**
- Vendor information form
- Business details
- Contact information
- Commission settings
- Payment terms
- Logo upload
- Banner upload
- Status selection

**Fields:**
- Name
- Slug (auto-generated)
- Description
- Business email
- Business phone
- Business address
- Registration number
- Tax ID
- Commission rate
- Payment terms (days)
- Minimum order amount
- Status (active/inactive/pending/suspended)
- Logo
- Banner

---

#### RobustVendorModal.tsx
**Purpose:** Alternative vendor modal with enhanced validation  
**Functionality:**
- Similar to EnhancedVendorModal
- Additional validation
- Better error handling

---

#### VendorDetailsView.tsx
**Purpose:** Detailed vendor information display  
**Functionality:**
- View all vendor details
- Vendor statistics
- Product count
- Order history
- Performance metrics
- Edit button

---

#### VendorStatusBadge.tsx
**Purpose:** Visual vendor status indicator  
**Functionality:**
- Display vendor status with color
- Status text
- Tooltip on hover

**Statuses:**
- Active (green)
- Inactive (gray)
- Pending Approval (yellow)
- Suspended (red)

---

#### VendorImageUpload.tsx
**Purpose:** Vendor logo/banner upload component  
**Functionality:**
- Drag and drop upload
- File type validation
- Image preview
- Crop image
- Upload progress
- Remove image

**Supported Formats:**
- JPG
- PNG
- WebP

---

#### AddProductModal.tsx
**Purpose:** Quick product creation modal  
**Functionality:**
- Simplified product form
- Essential fields only
- Fast product creation

---

#### AddServiceAreaModal.tsx
**Purpose:** Add new service area  
**Functionality:**
- Pincode input
- City and state
- Service types selection
- Delivery charge
- Delivery time
- Serviceable toggle
- Map picker integration

---

#### EditServiceAreaModal.tsx
**Purpose:** Edit existing service area  
**Functionality:**
- Similar to AddServiceAreaModal
- Pre-filled values
- Update service area

---

#### AddUserModal.tsx
**Purpose:** Create new user  
**Functionality:**
- User registration form
- Email, password
- Full name
- Role selection
- Phone number

---

#### MapPicker.tsx
**Purpose:** Interactive map for location selection  
**Functionality:**
- Display map (Leaflet)
- Click to select location
- Show marker
- Get coordinates
- Reverse geocoding
- Search location

**Map Features:**
- Zoom in/out
- Pan
- Search address
- Get current location
- Display service areas

---

#### ServiceTypeCRUD.tsx
**Purpose:** Service type CRUD operations  
**Functionality:**
- List service types
- Create service type
- Edit service type
- Delete service type
- Configure service settings
- Set icon and color
- Enable/disable service

**Service Type Fields:**
- Title
- Description
- Icon
- Color
- Features (array)
- Image URL
- Is active
- Sort order

---

#### ComprehensiveAttributeManager.tsx
**Purpose:** Manage dynamic product attributes  
**Functionality:**
- Create attribute definitions
- Edit attributes
- Delete attributes
- Set data type
- Set input type
- Validation rules
- Options for select fields
- Group attributes
- Sort attributes

**Attribute Types:**
- Text
- Number
- Boolean
- Select (dropdown)
- Multi-select
- Date
- DateTime
- URL
- Email
- Telephone
- Textarea

---

#### ServiceAttributeManager.tsx
**Purpose:** Manage service-specific attributes  
**Functionality:**
- Configure attributes per service type
- Set required/optional fields
- Override labels and placeholders
- Custom validation per service
- Field grouping

---

#### CategoryAttributeManager.tsx
**Purpose:** Manage category-specific attributes  
**Functionality:**
- Configure attributes per category
- Inherit from service type
- Override inherited attributes
- Category-specific fields

---

#### CustomFieldManager.tsx
**Purpose:** General custom field management  
**Functionality:**
- Create custom fields
- Field templates
- Apply templates
- Field validation
- Field ordering

---

#### DynamicFormGenerator.tsx
**Purpose:** Generate forms from field definitions  
**Functionality:**
- Render fields dynamically
- Handle all field types
- Validation
- Error messages
- Form submission

---

#### ProductManagement.tsx
**Purpose:** Product management utilities  
**Functionality:**
- Product list table
- Bulk actions
- Export products
- Import products

---

#### UnifiedProductInventory.tsx
**Purpose:** Unified inventory interface  
**Functionality:**
- View all inventory
- Multi-location inventory
- Stock adjustments
- Inventory reports

---

#### ProductAreaPricing.tsx
**Purpose:** Area-specific pricing management  
**Functionality:**
- Set prices per area
- Copy pricing between areas
- Bulk price updates
- Price analytics

---

#### VendorManagement.tsx
**Purpose:** Vendor management utilities  
**Functionality:**
- Vendor list table
- Vendor filters
- Export vendors

---

#### ServiceAdminLayout.tsx
**Purpose:** Layout for service-specific admin pages  
**Functionality:**
- Service navigation
- Service selector
- Breadcrumbs

---

#### ConnectionStatus.tsx
**Purpose:** Display connection status  
**Functionality:**
- Show online/offline status
- Supabase connection status
- Reconnect button

---

#### NotificationSettings.tsx
**Purpose:** User notification preferences  
**Functionality:**
- Enable/disable notification types
- Email preferences
- Push notification preferences
- SMS preferences

---

### Authentication Components (`client/components/auth/`)

#### LoginForm.tsx
**Purpose:** User login form  
**Functionality:**
- Email/password inputs
- Remember me checkbox
- Forgot password link
- Social login buttons
- Form validation
- Error messages

---

#### SignupForm.tsx
**Purpose:** User registration form  
**Functionality:**
- Email, password, confirm password
- Full name
- Phone number
- Terms acceptance
- Email verification
- Form validation

---

#### ForgotPasswordForm.tsx
**Purpose:** Password reset request  
**Functionality:**
- Email input
- Send reset link
- Success message
- Resend link

---

### Common Components (`client/components/common/`)

#### Header.tsx
**Purpose:** Site header/navigation  
**Functionality:**
- Logo
- Main navigation menu
- Search bar
- Cart icon with count
- User menu
- Mobile hamburger menu

---

#### Footer.tsx
**Purpose:** Site footer  
**Functionality:**
- Links (About, Contact, Terms, Privacy)
- Social media links
- Newsletter signup
- Copyright notice

---

#### ProductCard.tsx
**Purpose:** Product display card  
**Functionality:**
- Product image
- Title
- Price
- Rating
- Add to cart button
- Wishlist button
- Quick view

---

#### CartSummary.tsx
**Purpose:** Shopping cart summary  
**Functionality:**
- List cart items
- Quantities
- Subtotal
- Tax
- Shipping
- Total
- Checkout button

---

#### Pagination.tsx
**Purpose:** Pagination controls  
**Functionality:**
- Page numbers
- Previous/Next buttons
- First/Last buttons
- Page size selector
- Total count display

---

#### SearchBar.tsx
**Purpose:** Product search  
**Functionality:**
- Search input
- Auto-suggestions
- Search button
- Recent searches
- Popular searches

---

### Layout Components (`client/components/layout/`)

#### Layout.tsx
**Purpose:** Main layout wrapper  
**Functionality:**
- Header
- Main content area
- Footer
- Sidebar (optional)

---

#### Sidebar.tsx
**Purpose:** Sidebar navigation  
**Functionality:**
- Navigation links
- Filters
- Categories
- Collapsible sections

---

#### Breadcrumb.tsx
**Purpose:** Breadcrumb navigation  
**Functionality:**
- Show page hierarchy
- Clickable links
- Current page indicator

---

#### PageHeader.tsx
**Purpose:** Page title and actions  
**Functionality:**
- Page title
- Subtitle
- Action buttons
- Back button

---

### UI Components (`client/components/ui/`)

The UI component library consists of 50 pre-built components based on Radix UI primitives. These are headless, accessible components with Tailwind styling:

**Form Components:**
- Button
- Input
- Textarea
- Select
- Checkbox
- Radio Group
- Switch
- Slider
- Label

**Layout Components:**
- Card
- Separator
- Aspect Ratio
- Scroll Area
- Resizable Panels

**Overlay Components:**
- Dialog (Modal)
- Alert Dialog
- Sheet (Drawer)
- Popover
- Tooltip
- Hover Card
- Context Menu
- Dropdown Menu

**Navigation Components:**
- Tabs
- Accordion
- Navigation Menu
- Menubar
- Breadcrumb

**Feedback Components:**
- Toast (Sonner)
- Alert
- Progress
- Skeleton
- Badge
- Avatar

**Data Display:**
- Table
- Command (Command Palette)
- Calendar
- Date Picker

**Other:**
- Toggle
- Toggle Group
- Collapsible

All components follow consistent API patterns and support:
- Accessibility (ARIA)
- Keyboard navigation
- Dark mode
- Custom styling via className
- Composition

---

## Client Contexts

### AuthContext.tsx
**Purpose:** Global authentication state  
**Functionality:**
- User authentication
- Login/logout operations
- Session management
- Profile data
- Admin role checking
- Retry logic for profile fetching
- Error handling

**Provided Values:**
- `user` - Current user object
- `profile` - User profile data
- `session` - Auth session
- `loading` - Loading state
- `isAuthenticated` - Boolean
- `isAdminUser` - Boolean
- `profileError` - Error message
- `signIn()` - Login function
- `signUp()` - Register function
- `signOut()` - Logout function
- `refreshProfile()` - Reload profile
- `clearProfileError()` - Clear errors

**Dependencies:**
- Supabase Auth
- Profiles table

---

### AdminDataContext.tsx
**Purpose:** Admin data caching and management  
**Functionality:**
- Cache all admin entities
- Real-time subscriptions
- Debounced updates
- Loading states
- Refresh functions
- Cache statistics

**Cached Data:**
- Offerings/Products
- Service Areas
- Service Types
- Categories
- Vendors
- Merchants

**Provided Values:**
- `offerings` - Product array
- `products` - Alias for offerings (backward compatibility)
- `serviceAreas` - Service areas array
- `serviceTypes` - Service types array
- `categories` - Categories array
- `vendors` - Vendors array
- `merchants` - Merchants array
- `loading` - Loading states object
- `refreshOfferings()` - Reload products
- `refreshServiceAreas()` - Reload areas
- `refreshServiceTypes()` - Reload service types
- `refreshCategories()` - Reload categories
- `refreshVendors()` - Reload vendors
- `refreshMerchants()` - Reload merchants
- `refreshAll()` - Reload everything
- `isDataLoaded` - Boolean
- `lastUpdated` - Timestamps object
- `getCacheStats()` - Cache metrics

**Real-time Subscriptions:**
- Products changes
- Service areas changes
- Categories changes
- Service types changes

**Performance:**
- Debouncing (500ms default)
- Prevents duplicate fetches
- Optimistic updates

---

### CartContext.tsx
**Purpose:** Shopping cart state  
**Functionality:**
- Add items to cart
- Remove items
- Update quantities
- Calculate totals
- Clear cart
- Persist cart (localStorage)

**Provided Values:**
- `cart` - Cart items array
- `addToCart(product, quantity)` - Add item
- `removeFromCart(productId)` - Remove item
- `updateQuantity(productId, quantity)` - Update qty
- `clearCart()` - Empty cart
- `cartTotal` - Total price
- `cartCount` - Total items

**Cart Item Structure:**
```typescript
{
  product_id: string,
  name: string,
  price: number,
  quantity: number,
  image_url: string,
  variant?: object
}
```

---

### WishlistContext.tsx
**Purpose:** User wishlist/favorites  
**Functionality:**
- Add to wishlist
- Remove from wishlist
- Check if in wishlist
- Persist wishlist
- Sync with server

**Provided Values:**
- `wishlist` - Wishlist array
- `addToWishlist(productId)` - Add
- `removeFromWishlist(productId)` - Remove
- `isInWishlist(productId)` - Check
- `toggleWishlist(productId)` - Toggle

---

## Client Hooks

### use-realtime-products.ts
**Purpose:** Real-time product updates  
**Functionality:**
- Subscribe to product changes
- Handle INSERT events
- Handle UPDATE events
- Handle DELETE events
- Automatic cleanup

**Usage:**
```typescript
const { products, loading } = useRealtimeProducts();
```

---

### use-realtime-vendors.ts
**Purpose:** Real-time vendor updates  
**Functionality:**
- Subscribe to vendor changes
- Vendor status updates
- Automatic cleanup

---

### use-area-products.ts
**Purpose:** Fetch products for specific service area  
**Functionality:**
- Load products by service area
- Filter by pincode
- Check availability
- Get area-specific pricing

**Usage:**
```typescript
const { products, loading } = useAreaProducts(areaId);
```

---

### use-firebase.ts
**Purpose:** Firebase integration  
**Functionality:**
- Initialize Firebase
- Request notification permissions
- Get FCM token
- Handle incoming notifications
- Subscribe to topics

**Returns:**
- `fcmToken` - Device token
- `requestPermission()` - Ask for notification permission
- `subscribeToTopic(topic)` - Subscribe
- `unsubscribeFromTopic(topic)` - Unsubscribe

---

### use-vendor-auth.ts
**Purpose:** Vendor-specific authentication  
**Functionality:**
- Check if user is vendor
- Get vendor permissions
- Check vendor status
- Validate vendor access

**Returns:**
- `isVendor` - Boolean
- `vendorId` - Vendor ID
- `permissions` - Permission object
- `canManageProducts` - Boolean
- `canViewOrders` - Boolean

---

### use-custom-fields.ts
**Purpose:** Dynamic custom fields  
**Functionality:**
- Load field definitions
- Get field values
- Save field values
- Validate fields

**Usage:**
```typescript
const { fields, values, saveValues } = useCustomFields(productId);
```

---

### use-search.ts
**Purpose:** Product search  
**Functionality:**
- Debounced search query
- Search across fields
- Filter results
- Search history

**Usage:**
```typescript
const { query, setQuery, results, loading } = useSearch();
```

---

### use-wishlist.ts
**Purpose:** Wishlist operations  
**Functionality:**
- Wrapper around WishlistContext
- Simplified API
- Additional utilities

---

### use-mobile.tsx
**Purpose:** Mobile device detection  
**Functionality:**
- Detect mobile viewport
- Responsive breakpoints
- Orientation detection

**Usage:**
```typescript
const isMobile = useMobile();
```

**Breakpoint:** 768px

---

### use-toast.ts
**Purpose:** Toast notifications  
**Functionality:**
- Show toast messages
- Success, error, info, warning types
- Customizable duration
- Action buttons
- Queue management

**Usage:**
```typescript
const { toast } = useToast();

toast({
  title: "Success",
  description: "Product added to cart",
  variant: "default"
});
```

---

### use-realtime.ts
**Purpose:** Generic real-time subscription  
**Functionality:**
- Reusable Supabase subscription
- Listen to table changes
- Handle events
- Auto cleanup

---

## Client Libraries

### `client/lib/supabase.ts`
**Purpose:** Supabase client configuration  
**Functionality:**
- Create Supabase client
- Configure auth settings
- Helper functions

**Exports:**
- `supabase` - Supabase client
- `getUser()` - Get current user
- `getProfile(userId)` - Get user profile
- `isAdmin(userId)` - Check admin role
- `signInWithEmail()` - Email login
- `signUpWithEmail()` - Email signup
- `signOut()` - Logout

**Database Types:**
- TypeScript interfaces for all tables
- Insert/Update types
- Row types

---

### `client/lib/api.ts`
**Purpose:** API client utilities  
**Functionality:**
- `authenticatedFetch()` - Fetch with auth token
- Request interceptors
- Response interceptors
- Error handling

---

### `client/lib/utils.ts`
**Purpose:** General utility functions  
**Functionality:**
- `cn()` - Classname merger (clsx + tailwind-merge)
- Date formatting
- Currency formatting
- String utilities
- Array utilities

---

### `client/lib/firebase.ts`
**Purpose:** Firebase configuration  
**Functionality:**
- Initialize Firebase app
- FCM setup
- Get messaging instance

---

### `client/lib/validations.ts`
**Purpose:** Form validation schemas  
**Functionality:**
- Zod schemas
- Email validation
- Phone validation
- Password strength

---

### Additional Libraries (23 total)

Other utility libraries include:
- Date/time utilities
- Form helpers
- Image processing
- Geolocation utilities
- Analytics helpers
- Error handling
- Logging utilities
- Storage helpers
- Constants and enums

---

## Server Routes

### `server/routes/admin.ts`
**Purpose:** Admin dashboard APIs  
**Endpoints:**
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/analytics` - Analytics data
- `POST /api/admin/products/bulk` - Bulk product operations
- `GET /api/admin/service-areas/export` - Export areas as CSV
- `GET /api/admin/realtime/stats` - Real-time stats (SSE)

**Functionality:**
- Aggregate statistics
- Revenue calculations
- Order analytics
- User growth metrics
- Bulk operations
- CSV export
- Server-Sent Events

**Middleware:**
- `requireAdmin` - Admin authentication check

---

### `server/routes/products.ts`
**Purpose:** Product management APIs  
**Endpoints:**
- `GET /api/admin/products` - List products
- `GET /api/admin/products/:id` - Get product
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product (soft)
- `GET /api/admin/products/:id/variants` - Get variants
- `POST /api/admin/products/:id/variants` - Create variant
- `PUT /api/admin/products/variants/:variantId` - Update variant
- `DELETE /api/admin/products/variants/:variantId` - Delete variant

**Functionality:**
- CRUD operations
- Pagination
- Filtering (vendor, category, status)
- Search
- Includes (vendor, category, variants, images)
- Slug generation
- Soft delete

**Request Validation:**
- Required fields check
- Slug uniqueness
- SKU uniqueness

---

### `server/routes/vendors.ts`
**Purpose:** Vendor management APIs  
**Endpoints:**
- `GET /api/admin/vendors` - List vendors
- `GET /api/admin/vendors/:id` - Get vendor
- `POST /api/admin/vendors` - Create vendor
- `PUT /api/admin/vendors/:id` - Update vendor
- `PATCH /api/admin/vendors/:id/status` - Update status
- `DELETE /api/admin/vendors/:id` - Delete vendor (soft)
- `GET /api/admin/vendors/stats` - Vendor statistics

**Functionality:**
- CRUD operations
- Status management
- Slug auto-generation
- Default vendor config creation
- Statistics (via database function)

---

### `server/routes/categories.ts`
**Purpose:** Category management APIs  
**Endpoints:**
- `GET /api/categories` - Public category list
- `GET /api/categories/tree` - Category hierarchy
- `GET /api/categories/:id` - Get category
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

**Functionality:**
- Hierarchical categories
- Parent-child relationships
- Service type filtering
- Sort order management

---

### `server/routes/custom-fields.ts`
**Purpose:** Dynamic custom fields APIs  
**Endpoints:**
- `GET /api/admin/custom-fields/:serviceTypeId` - Get fields
- `POST /api/admin/custom-fields` - Create field
- `PUT /api/admin/custom-fields/:fieldId` - Update field
- `DELETE /api/admin/custom-fields/:fieldId` - Delete field
- `GET /api/admin/custom-fields/templates` - Get templates
- `POST /api/admin/custom-fields/:serviceTypeId/apply-template` - Apply template
- `GET /api/admin/custom-field-values/:productId` - Get values
- `POST /api/admin/custom-field-values/:productId` - Save values

**Functionality:**
- Field definition management
- Field templates
- Template application
- Field value storage
- Validation rule management

---

### `server/routes/firebase.ts`
**Purpose:** Firebase Cloud Messaging APIs  
**Endpoints:**
- `POST /api/fcm/save-token` - Save device token
- `POST /api/fcm/subscribe-topic` - Subscribe to topic
- `POST /api/fcm/unsubscribe-topic` - Unsubscribe from topic
- `POST /api/fcm/send-to-user` - Send notification to user
- `POST /api/fcm/send-to-topic` - Send notification to topic
- `POST /api/fcm/send-order-notification` - Order notification
- `POST /api/fcm/test` - Test notification
- `GET /api/fcm/settings/:userId` - Get notification settings

**Functionality:**
- Token management
- Topic subscriptions
- Push notifications
- Batch notifications
- Order notifications
- Test notifications

**Dependencies:**
- Firebase Admin SDK
- FCM tokens table

---

### `server/routes/upload.ts`
**Purpose:** File upload handling  
**Endpoints:**
- `POST /api/upload/vendor-image` - Upload vendor image
- `POST /api/upload/product-image` - Upload product image

**Functionality:**
- Multer file upload
- File type validation
- File size limits
- Image optimization
- Unique filename generation
- Store in `public/uploads/`

**Supported Types:**
- JPG, JPEG
- PNG
- WebP
- GIF

**Configuration:**
- Max file size: 10MB
- Storage: Local filesystem
- Path: `public/uploads/vendors/` or `public/uploads/products/`

---

### `server/routes/product-area-pricing.ts`
**Purpose:** Area-specific pricing (legacy)  
**Endpoints:**
- `GET /api/pricing/effective` - Get effective price
- `GET /api/pricing/area/:serviceAreaId/products` - Area products
- `POST /api/pricing/area/:serviceAreaId/bulk-update` - Bulk update
- `POST /api/pricing/copy-area` - Copy pricing
- `GET /api/pricing/area/:serviceAreaId/analytics` - Analytics

**Functionality:**
- Calculate effective price
- Area-specific overrides
- Bulk price updates
- Copy pricing between areas
- Pricing analytics

**Note:** This is legacy code being replaced by the new price_lists system.

---

### `server/routes/auth.ts`
**Purpose:** Authentication utilities  
**Endpoints:**
- `POST /api/auth/resend-confirmation` - Resend email
- `POST /api/auth/confirm-email` - Confirm email

**Functionality:**
- Email verification
- Resend confirmation
- Password reset (via Supabase)

---

### `server/routes/users.ts`
**Purpose:** User management APIs  
**Endpoints:**
- `POST /api/users/create` - Create user
- `POST /api/users/login` - User login
- `GET /api/users/:userId` - Get user
- `GET /api/users` - List users
- `PUT /api/users/:userId/role` - Update role

**Functionality:**
- User CRUD
- Login (via Supabase)
- Role management
- User listing

---

### `server/routes/setup.ts`
**Purpose:** Initial setup and testing  
**Endpoints:**
- `POST /api/setup/admin` - Create admin account
- `POST /api/test/auth` - Test authentication
- `GET /api/check/database` - Check database

**Functionality:**
- Create initial admin
- Test database connection
- Test authentication
- Setup validation

---

### `server/routes/demo.ts`
**Purpose:** Demo endpoint  
**Endpoints:**
- `GET /api/demo` - Demo response

**Functionality:**
- Test endpoint
- Example API response

---

## Server Libraries

### `server/lib/supabase.ts`
**Purpose:** Server-side Supabase client  
**Functionality:**
- Create Supabase client with service role key
- Bypass RLS for admin operations
- Server-side database access

**Exports:**
- `supabase` - Supabase client (service role)

---

### `server/lib/firebase-admin.ts`
**Purpose:** Firebase Admin SDK setup  
**Functionality:**
- Initialize Firebase Admin
- Server-side Firebase operations
- FCM messaging
- Token verification

**Exports:**
- `admin` - Firebase Admin app
- `messaging` - FCM messaging instance

---

## Shared Code

### `shared/api.ts`
**Purpose:** Shared TypeScript types  
**Functionality:**
- Type definitions for all entities
- API request/response types
- Enum definitions
- Interface definitions

**Main Types:**
- `User`, `UserRole`
- `Vendor`, `VendorStatus`
- `Product`, `Offering`
- `Category`
- `Order`, `OrderStatus`
- `ServiceType`
- `ServiceableArea`
- `ApiResponse<T>`
- `PaginatedResponse<T>`
- And 80+ more types

**Total Lines:** 907 lines of TypeScript type definitions

---

## Database Files

### `database-schema.sql`
**Purpose:** Base database schema  
**Functionality:**
- Create core tables
- Define relationships
- Setup indexes
- Enable RLS
- Create policies
- Create triggers
- Insert seed data

**Tables:**
- profiles
- categories
- products
- serviceable_areas
- orders
- app_stats

---

### `APPLY_THIS_IN_SUPABASE_SQL_EDITOR.sql`
**Purpose:** Comprehensive attribute system  
**Functionality:**
- Enhance attribute_registry
- Create service_attribute_config
- Create category_attribute_config
- Create default_mandatory_fields
- Setup RLS policies
- Create helper functions
- Insert default fields

**Functions:**
- `get_service_attributes()`
- `get_category_attributes()`
- `validate_attribute_value()`

---

### `database-comprehensive-attribute-system.sql`
**Purpose:** Dynamic attribute system  
**Functionality:**
- Similar to APPLY_THIS_IN_SUPABASE_SQL_EDITOR.sql
- Full attribute system

---

### `database-custom-fields-migration.sql`
**Purpose:** Custom fields enhancement  
**Functionality:**
- Add custom field support
- Field templates
- Field validation

---

### `database-add-vendor-to-products.sql`
**Purpose:** Multi-vendor support  
**Functionality:**
- Add vendor_id to products
- Create vendors table
- Create vendor relationships
- Migrate existing data

---

### `database-fixes-part1-translations.sql`
**Purpose:** Internationalization support  
**Functionality:**
- Create translations table
- Create locales table
- Create locale_settings table
- Setup i18n functions

---

### `database-fixes-part2-spatial.sql`
**Purpose:** Spatial/geographic queries  
**Functionality:**
- Add PostGIS extension
- Add geography columns
- Create spatial indexes
- Create distance functions

**Functions:**
- `find_nearby_areas(lat, lng, radius)`
- `check_serviceability(lat, lng)`

---

### `database-fixes-part3-indexes.sql`
**Purpose:** Performance optimization indexes  
**Functionality:**
- Add missing indexes
- Optimize existing indexes
- Create composite indexes
- Create partial indexes

---

### `database-fixes-part4-service-attributes.sql`
**Purpose:** Service-specific attributes  
**Functionality:**
- Create service_field_definitions
- Create product_service_attributes
- Setup service field system

---

### `database-fixes-part5-order-canonical.sql`
**Purpose:** Enhanced order system  
**Functionality:**
- Create order_items table
- Create order_addresses table
- Create order_adjustments table
- Create order_workflow table
- Create order_promotions table
- Create order_delivery table
- Create delivery_slots table

---

### `database-fixes-part6-partitioning.sql`
**Purpose:** Table partitioning  
**Functionality:**
- Partition orders by date
- Partition domain_events by date
- Create partition functions
- Automatic partition creation

---

### `database-fixes-part7-event-sourcing.sql`
**Purpose:** Event sourcing and audit  
**Functionality:**
- Create domain_events table
- Create audit_logs table
- Setup event triggers
- Create event functions

---

### `supabase/migrations/20240101000010_create_admin_tables.sql`
**Purpose:** Admin feature tables  
**Functionality:**
- Create coupons table
- Create banners table
- Create notifications table
- Create payment_methods table
- Create payment_config table
- Create app_config table
- Create smtp_config table
- Create social_config table
- Setup RLS policies
- Insert default configs

---

### Other Database Files

Additional SQL files for various features and fixes:
- `database-product-area-pricing.sql` - Area pricing
- `database-migration-dynamic-fields.sql` - Dynamic fields
- `RUN_THIS_IN_SUPABASE.sql` - Quick setup
- `EXECUTE_DATABASE_FIXES.sql` - Consolidated fixes

---

## Summary Statistics

**Total Files Analyzed:** 200+

**Client:**
- Pages: 51
- Components: 59 (UI: 50, Admin: 27, Auth: 3, Common: 6, Other: 23)
- Contexts: 4
- Hooks: 11
- Libraries: 23

**Server:**
- Route Files: 12
- Library Files: 2
- Total Endpoints: 58+

**Shared:**
- Type Definitions: 1 file (907 lines)

**Database:**
- SQL Files: 19
- Tables: 50+
- Functions: 22+
- Policies: 85+

**Configuration:**
- Config Files: 10+

**Documentation:**
- Markdown Files: 25+

**Total Estimated Lines of Code:** ~45,000

---

## Key Architectural Patterns

1. **Component-Based Architecture**
   - React functional components
   - Composition over inheritance
   - Hooks for logic reuse

2. **Context + Hooks Pattern**
   - Global state via Context
   - Local logic via custom hooks
   - React Query for server state

3. **API Layer**
   - RESTful endpoints
   - Shared TypeScript types
   - Authenticated fetch utility

4. **Database First**
   - Strong schema design
   - RLS for security
   - Real-time subscriptions

5. **Feature Folders**
   - Co-locate related code
   - Clear boundaries
   - Easy to navigate

---

**End of Functionality Map**


