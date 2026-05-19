

# Pharmacy Admin Dashboard

A comprehensive admin dashboard for a pharmacy application, connected to the backend API at `https://pharmacy-webapp-backend-uz5m.onrender.com`, styled with a dark professional theme inspired by the uploaded reference image.

## 1. Design System & Theme
- Dark theme matching the reference image (dark navy background, colorful stat cards, vibrant accents)
- Update CSS variables for dark-first design
- Color palette: dark navy (#1a1f37), colorful gradient cards (green, pink, blue, yellow), blue accent table headers

## 2. Layout & Navigation
- **Sidebar**: Collapsible sidebar with pharmacy logo, menu items (Dashboard, Products, Orders, Customers, Categories, Settings) with icons and expandable sub-menus
- **Header bar**: Search input, notification bell, user avatar/name
- **Responsive**: Sidebar collapses to icon-only on mobile, with hamburger trigger
- Pages connected via React Router

## 3. API Service Layer
- Central API client with base URL pointing to the backend
- Bearer token authentication (stored in localStorage after login)
- API modules: `auth`, `products`, `orders`, `users`, `categories`, `dashboard`
- TanStack React Query hooks for each resource (queries + mutations)
- Global error handling with toast notifications
- Login page for authentication

## 4. Dashboard Page (Overview)
- 4 colorful stat cards: Total Revenue, New Orders, Products, Customers (each with icon, value, "Last Month" subtitle) — styled like the reference with green, pink, blue, yellow backgrounds
- **Total Sales** card with pie chart (Recharts) showing yearly breakdown
- **Revenue over time** line chart
- **Best Selling Products** table with filters (Show By, Category By dropdowns), columns: UID, Product (image+name), Category, Brand, Price, Stock (star rating), Rating, Order, Sales, Action (view/edit/delete icons)

## 5. Products Management
- Table with columns: image, name, description, price, stock, category, status
- Pagination, search bar, category filter dropdown
- Add/Edit product via dialog form (all fields including image URL)
- Delete with confirmation dialog
- Connected to products API endpoints

## 6. Orders Management
- Table with status filter tabs (All, Pending, Processing, Completed, Cancelled)
- Columns: order ID, customer, date, total, status badge, actions
- Order detail drawer/dialog showing items, shipping info, payment info
- Update order status via dropdown/buttons
- Connected to orders API endpoints

## 7. Customers Management
- Customer list table with search
- Columns: name, email, phone, registration date, total orders
- Detail dialog showing customer info and purchase history
- Connected to users API endpoints

## 8. Categories Management
- Simple CRUD table for product categories
- Columns: ID, name, description, product count, actions
- Add/Edit via inline dialog form
- Delete with confirmation
- Connected to categories API endpoints

## 9. Authentication
- Login page with email/password form
- Token storage and auth context/provider
- Protected routes redirecting to login if unauthenticated
- Logout functionality in sidebar/header

