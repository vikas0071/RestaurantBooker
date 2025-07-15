# Restaurant Table Ordering System

## Overview

This is a full-stack restaurant table ordering system built with React, Node.js/Express, and PostgreSQL. Customers scan QR codes to access table-specific ordering pages, while restaurant staff use an admin dashboard to manage orders in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live order updates

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket Server for admin notifications
- **API Design**: RESTful endpoints with JSON responses

### Database Schema
- **menuItems**: Stores menu items with name, description, price, category, and availability
- **orders**: Stores customer orders with table ID, items (JSON), status, total, and timestamp
- **users**: Basic user management (likely for admin authentication)

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
- **Live Notifications**: WebSocket-powered real-time order notifications

### Shared Components
- **Database Layer**: Centralized storage interface with seeding capabilities
- **Schema Validation**: Zod schemas for runtime type checking
- **UI Components**: Reusable Shadcn/ui components for consistent design

## Data Flow

1. **Customer Journey**:
   - Customer scans QR code → redirected to `/order?table=X`
   - Frontend fetches menu items from `/api/menu`
   - Customer builds cart and submits order to `/api/order`
   - Order stored in database with table association

2. **Admin Workflow**:
   - Admin dashboard loads all orders via `/api/orders`
   - WebSocket connection established for real-time updates
   - New orders broadcast to all connected admin clients
   - Status updates sent via PATCH requests and broadcast via WebSocket

3. **Real-time Updates**:
   - WebSocket server broadcasts `new-order` events
   - WebSocket server broadcasts `order-update` events
   - Admin dashboard automatically updates UI without refresh

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing library
- **ws**: WebSocket implementation for real-time features

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
- **Single Repository**: Monorepo structure with client, server, and shared directories
- **Development Server**: Vite dev server with Express API integration
- **Hot Module Replacement**: Vite HMR for rapid development iteration
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Vite builds React app to static files
- **Backend**: ESBuild bundles Node.js server for production
- **Database**: PostgreSQL via Neon serverless platform
- **Environment**: Configured for Replit deployment with cartographer integration

### Key Configuration Files
- **drizzle.config.ts**: Database connection and migration settings
- **vite.config.ts**: Frontend build configuration with path aliases
- **tsconfig.json**: TypeScript configuration for monorepo structure
- **tailwind.config.ts**: Styling configuration with custom color scheme

The application uses a restaurant-themed color palette with orange primary colors and green accents, optimized for both mobile and desktop experiences.