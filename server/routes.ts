import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize database with seed data
  await storage.seedMenuItems();
  
  // WebSocket setup for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Admin connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Admin disconnected from WebSocket');
    });
  });

  // Broadcast new order to all connected admin clients
  function broadcastNewOrder(order: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new-order',
          data: order
        }));
      }
    });
  }

  // Broadcast order status update to all connected admin clients
  function broadcastOrderUpdate(order: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'order-update',
          data: order
        }));
      }
    });
  }

  // API Routes
  app.get('/api/menu', async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error('Error fetching menu:', error);
      res.status(500).json({ error: 'Failed to fetch menu items' });
    }
  });

  app.post('/api/order', async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Broadcast new order to admin clients
      broadcastNewOrder(order);
      
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid order data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const { status } = req.query;
      let orders;
      
      if (status && typeof status === 'string') {
        orders = await storage.getOrdersByStatus(status);
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      const validStatuses = ['pending', 'preparing', 'served'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const order = await storage.updateOrderStatus(parseInt(id), status);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Broadcast order update to admin clients
      broadcastOrderUpdate(order);
      
      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  return httpServer;
}
