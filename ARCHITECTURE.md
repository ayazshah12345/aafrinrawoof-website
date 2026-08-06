# AFSOO Crafts Studio — Overall System Architecture

**Document Version:** 2.0  
**Target Environment:** 100% Serverless React 19 + Supabase on Vercel  
**Repository:** [https://github.com/ayazshah12345/aafrinrawoof-website](https://github.com/ayazshah12345/aafrinrawoof-website)

---

## 1. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer (User Devices)
        DesktopBrowser["Desktop Browser (Chrome/Safari/Edge)"]
        MobileBrowser["Mobile Browser (iOS / Android)"]
    end

    subgraph CDN & Hosting Layer (Vercel Edge Network)
        VercelCDN["Vercel Global Edge Network (CDN)"]
        SPARoutes["Single Page App Rewrite Controller (/index.html)"]
    end

    subgraph Frontend Application Layer (React 19 + Vite + TailwindCSS)
        subgraph Customer Portal
            CustomerHome["CustomerHome (Pro UI)"]
            ShopCatalog["CustomerShop & Filters"]
            ProductDetail["Product Detail Modal / Page"]
            CartCheckout["Cart -> Checkout -> UPI Payment"]
            OrderStatus["Live Order Status Tracking"]
        end

        subgraph Admin Portal
            AdminDashboard["Admin Dashboard Overview"]
            ProductManager["Products & Inventory Management"]
            CategoryManager["Categories & Handlooms"]
            OrderFulfillment["Order Status & Invoice Generator"]
            AnalyticsSettings["Sales Analytics & Store Settings"]
        end

        subgraph Context & State Management
            CartContext["CartContext (Local Persistence)"]
            WishlistContext["WishlistContext (Favs)"]
            AuthContext["Admin AuthContext"]
            CustomerAuthContext["Customer AuthContext"]
            ThemeContext["ThemeContext (Dark/Light)"]
        end

        subgraph API Adapter & Services
            ApiClient["api/client.ts (Unified API Adapter)"]
            SupabaseService["services/supabaseService.ts (Data Layer)"]
        end
    end

    subgraph Cloud Infrastructure Layer (Supabase Cloud)
        SupabaseClient["@supabase/supabase-js Client"]
        SupabaseDB[("Supabase PostgreSQL Database")]
        SupabaseAuth["Supabase Authentication Service"]
        SupabaseStorage["Supabase Media Storage (Images & Logos)"]
        LocalStorageFallback[("Browser LocalStorage Fallback")]
    end

    DesktopBrowser --> VercelCDN
    MobileBrowser --> VercelCDN
    VercelCDN --> SPARoutes
    SPARoutes --> CustomerHome & AdminDashboard
    
    CustomerHome & ShopCatalog & CartCheckout --> CartContext & CustomerAuthContext
    AdminDashboard & ProductManager & OrderFulfillment --> AuthContext

    CartContext & CustomerAuthContext & AuthContext --> ApiClient
    ApiClient --> SupabaseService
    SupabaseService --> SupabaseClient
    SupabaseClient --> SupabaseDB & SupabaseAuth & SupabaseStorage
    SupabaseService -. Fallback .- LocalStorageFallback
```

---

## 2. Layered Architecture Breakdown

### A. Presentation & UI Layer (`src/pages/`, `src/components/`)
* **Core Framework:** React 19 + TypeScript + Vite 5.
* **Styling Engine:** Vanilla TailwindCSS + Google Fonts (`Outfit`, `Inter`) + Lucide Icons.
* **Customer Front-End Pages:**
  - `CustomerHome.tsx`: Asymmetric Hero Banner, Circular Category Pills, Offer Cards, Popular Products.
  - `CustomerShop.tsx`: Filterable catalog with search, price sliders, and category facets.
  - `ProductDetail.tsx`: High-resolution photo gallery, stock availability, and Quick Buy modal.
  - `CartPage.tsx`, `CheckoutPage.tsx`, `PaymentPage.tsx`: Interactive multi-step shopping cart & UPI payment.
  - `OrderStatusPage.tsx`: Live order tracking for customers using phone or order number.
* **Admin Management Pages:**
  - `Dashboard.tsx`: High-level metrics, revenue cards, recent orders, and fast actions.
  - `Products.tsx`, `ProductForm.tsx`: Full product CRUD with stock alerts & discount toggles.
  - `Orders.tsx`, `Invoices.tsx`: Live order status updates (Pending ➔ Confirmed ➔ Shipped ➔ Delivered) and PDF/print invoice generation.
  - `Categories.tsx`, `Coupons.tsx`, `Reviews.tsx`, `Customers.tsx`, `SalesAnalytics.tsx`, `Settings.tsx`.

### B. State Management Layer (`src/context/`)
* **`CartContext.tsx`**: Manages cart items, quantities, subtotal calculations, and `localStorage` syncing.
* **`WishlistContext.tsx`**: Toggles favorite products with real-time badge counts.
* **`AuthContext.tsx`**: Manages Admin session token (`admin_token`), Superadmin user state, and protected route access.
* **`CustomerAuthContext.tsx`**: Manages Customer login/registration state (`afsoo_customer_token`).
* **`ThemeContext.tsx`**: Controls dark/light mode toggle across the UI.

### C. Data & API Service Layer (`src/services/`, `src/api/`)
* **`src/lib/supabase.ts`**: Initialized Supabase client instance using environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
* **`src/services/supabaseService.ts`**: Core data service executing queries on Supabase tables (`admins`, `products`, `categories`, `orders`, `settings`) with graceful fallback handling.
* **`src/api/client.ts`**: Universal generic API adapter (`api.get`, `api.post`, `api.put`, `api.delete`) providing a unified interface so UI components remain decoupled from specific backends.

---

## 3. Key Data & User Flows

### Order Checkout & Customer Tracking Flow

```mermaid
sequenceFlow
actor Customer
participant ShopUI as Customer Shop / Cart
participant Payment as UPI Payment Page
participant SupabaseSvc as Supabase Service
participant DB as Supabase PostgreSQL
participant AdminUI as Admin Dashboard

Customer ->> ShopUI: Adds items to cart & clicks Checkout
ShopUI ->> Payment: Redirects to PaymentPage (UPI QR Code)
Customer ->> Payment: Completes UPI payment & clicks "Confirm Order"
Payment ->> SupabaseSvc: createOrder(orderData)
SupabaseSvc ->> DB: INSERT INTO orders & order_items
DB -->> SupabaseSvc: Order Created (#AFS-XXXXXX)
SupabaseSvc -->> Payment: Returns Order Details
Payment ->> Customer: Displays Order Confirmation & Receipt

AdminUI ->> SupabaseSvc: getOrders()
SupabaseSvc ->> DB: SELECT * FROM orders
DB -->> AdminUI: List of Orders
AdminUI ->> SupabaseSvc: updateOrderStatus(orderId, 'Shipped')
SupabaseSvc ->> DB: UPDATE orders SET order_status = 'Shipped'
Customer ->> OrderStatus: Checks Live Status (#AFS-XXXXXX)
OrderStatus -->> Customer: Displays "Shipped" status update!
```

---

## 4. Build & Deployment Architecture

* **Build Tooling:** Vite 5 with Rollup code-splitting (`manualChunks` in [vite.config.ts](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/vite.config.ts)).
* **Chunk Split Strategy:**
  - `vendor.js`: React & React Router Core
  - `icons.js`: Lucide Icon Library
  - `query.js`: TanStack React Query
  - `supabase.js`: Supabase Client SDK
  - `charts.js`: Recharts Data Visualization
* **Hosting:** Vercel Global Edge Network.
* **Routing Rules:** Single Page App rewrites in [vercel.json](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/vercel.json) rewrite all non-static asset routes to `/index.html`.
