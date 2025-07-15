# Restaurant Table Ordering System

## Overview

This is a full-stack restaurant table ordering system built with React, Node.js/Express, and **Firebase (Firestore + Auth)**. Customers scan QR codes to access table-specific ordering pages, while restaurant staff use an admin dashboard to manage orders in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: Firestore realtime features for live order updates

### Backend Architecture
- **Framework**: Node.js with Express.js (for serving static files and API proxy if needed)
- **Language**: TypeScript with ES modules
- **Database**: **Firebase Firestore** for all data (menu, orders, tables, users)
- **Authentication**: **Firebase Auth** for secure admin login/registration
- **API Design**: RESTful endpoints with JSON responses (if needed)

### Database Schema
- **Firestore Collections**: `menuItems`, `orders`, `admins`, `tables`

## Key Components

### Customer Interface (`/order?table=X`)
- **Menu Display**: Categorized menu items with descriptions and prices
- **Shopping Cart**: Add items, adjust quantities, and add notes
- **Order Placement**: Submit orders with table number linkage
- **Mobile Responsive**: Optimized for mobile devices with touch-friendly UI

### Admin Dashboard (`/admin`)
- **Order Management**: View all orders with real-time updates
- **Status Tracking**: Update order status (pending → preparing → served)
- **Filtering**: Filter orders by status and search functionality
- **Live Notifications**: Firestore-powered real-time order notifications

### Shared Components
- **Firestore Layer**: Centralized storage interface for all data
- **Schema Validation**: Zod schemas for runtime type checking (optional)
- **UI Components**: Reusable Shadcn/ui components for consistent design

## Data Flow

1. **Customer Journey**:
   - Customer scans QR code → redirected to `/order?table=X`
   - Frontend fetches menu items from Firestore
   - Customer builds cart and submits order to Firestore
   - Order stored in Firestore with table association

2. **Admin Workflow**:
   - Admin dashboard loads all orders via Firestore
   - Firestore realtime listeners for live updates
   - New orders appear instantly for staff
   - Status updates are written to Firestore and reflected in real-time

3. **Real-time Updates**:
   - Firestore listeners broadcast `new-order` and `order-update` events
   - Admin dashboard automatically updates UI without refresh

## External Dependencies

### Core Framework Dependencies
- **firebase**: Firestore database and authentication
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing library

### UI Dependencies
- **@radix-ui/***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Type-safe styling variants

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Setup
- **Single Repository**: Monorepo structure with client and server directories
- **Development Server**: Vite dev server with Express API integration (if needed)
- **Hot Module Replacement**: Vite HMR for rapid development iteration

### Production Build
- **Frontend**: Vite builds React app to static files
- **Backend**: ESBuild bundles Node.js server for production (if needed)
- **Database**: **Firebase Firestore**
- **Environment**: Configured for Replit deployment with cartographer integration

### Key Configuration Files
- **vite.config.ts**: Frontend build configuration with path aliases
- **tsconfig.json**: TypeScript configuration for monorepo structure
- **tailwind.config.ts**: Styling configuration with custom color scheme

The application uses a restaurant-themed color palette with orange primary colors and green accents, optimized for both mobile and desktop experiences.