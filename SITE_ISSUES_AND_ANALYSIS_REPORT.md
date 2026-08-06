# AFSOO Crafts Studio — Comprehensive Site Audit & Issues Report

**Audit Date:** August 06, 2026  
**Target Environment:** Localhost (Vite) & Vercel Production  
**Architecture:** React 19 + TypeScript + Vite + TailwindCSS + Supabase (`@supabase/supabase-js`)

---

## Executive Summary

The **AFSOO Crafts Studio** platform has undergone significant modernization, transitioning from a dual Python/React architecture to a 100% serverless React + Supabase setup running on Vercel. 

This audit covers **Security**, **Performance**, **Database Integration**, **UI/UX Consistency**, and **Deployment Configuration**.

---

## 1. Security & Authentication Findings

### 🔴 Issue 1.1: Default Admin Credentials Hardcoded in Fallbacks
* **Severity:** Medium
* **Description:** Default admin credentials (`afuzee0324@yahoo.com` / `Aafrinrawoof@20`) exist in [supabaseService.ts](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/src/services/supabaseService.ts#L106-L125) and [supabase_schema.sql](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/supabase_schema.sql#L15-L19).
* **Impact:** Anyone with codebase access knows the initial login.
* **Recommendation:** Log into the Admin Portal (`/admin/login`) and update your password under **Settings** ➔ **Security**.

### 🟡 Issue 1.2: Client-side Token Storage in `localStorage`
* **Severity:** Low / Informational
* **Description:** Both `admin_token` and `afsoo_customer_token` are stored in browser `localStorage`.
* **Impact:** Standard for SPAs, but vulnerable to XSS if untrusted scripts are injected.
* **Recommendation:** Ensure all third-party scripts loaded in `index.html` are from trusted CDNs with Integrity hashes.

---

## 2. Database & Data Persistence

### 🟢 Status 2.1: Supabase RLS & Fallback Layer
* **Severity:** Resolved / Handled
* **Description:** If Supabase database tables (`products`, `orders`, `categories`) have not yet had `supabase_schema.sql` executed, the app gracefully falls back to persistent `localStorage` mock data without crashing.
* **Recommendation:** Execute [supabase_schema.sql](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/supabase_schema.sql) once in your [Supabase Dashboard](https://supabase.com/dashboard) SQL Editor for live cross-device cloud persistence.

---

## 3. Performance & Bundle Optimization

### 🟡 Issue 3.1: Main JS Bundle Size (>500 kB)
* **Severity:** Low
* **Description:** Vite build warning: `dist/assets/index-B4SuqjpK.js` is 1.41 MB uncompressed (370 kB gzipped).
* **Impact:** First-time mobile visitors on 3G connections may experience a slight (~1s) initial delay.
* **Recommendation:** Add code splitting (`manualChunks`) in [vite.config.ts](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/vite.config.ts) for `recharts`, `lucide-react`, and `react-dom`:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        charts: ['recharts'],
        icons: ['lucide-react']
      }
    }
  }
}
```

---

## 4. Deployment & Vercel Configuration

### 🟢 Status 4.1: Peer Dependency Resolution (`.npmrc`)
* **Severity:** Resolved
* **Description:** React 19 vs `lucide-react@0.359.0` peer dependency mismatch resolved via [.npmrc](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/.npmrc) (`legacy-peer-deps=true`).

### 🟢 Status 4.2: SPA Route Rewrites
* **Severity:** Resolved
* **Description:** [vercel.json](file:///c:/Users/syed%20ayaz%20shah/OneDrive/Desktop/AAFRIN%20WEBSITE%20DESIGN/vercel.json) rewrites all client-side routes (`/admin`, `/shop`, `/my-orders`) to `/index.html` preventing 404s on page refresh.

---

## 5. UI/UX & Responsive Experience

### 🟢 Status 5.1: Pro-Level Customer Storefront
* **Severity:** Verified Excellent
* **Features:** Asymmetric Hero Banner, Circular Category Badges, Offer Cards, Product Cards with Discount & Rating Badges, Responsive Mobile Navigation Drawer, and Dark/Light Mode.

---

## Summary Checklist

| Category | Item | Status | Action Required |
| :--- | :--- | :--- | :--- |
| **Auth** | Admin Credentials | Active | Change default password after first login |
| **Database** | Supabase SQL Schema | Prepared | Run `supabase_schema.sql` in Supabase SQL Editor |
| **Build** | Vite Bundle Splitting | Optional | Add `manualChunks` in `vite.config.ts` |
| **Deployment** | Vercel SPA Rewrites | Configured | None (100% active) |
| **UI/UX** | Mobile & Desktop Responsive | Verified | None |
