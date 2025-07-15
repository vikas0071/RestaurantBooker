import { menuItems, orders, users, type MenuItem, type Order, type InsertMenuItem, type InsertOrder, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Menu items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  seedMenuItems(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.isAvailable, true));
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.category, category));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [menuItem] = await db
      .insert(menuItems)
      .values(item)
      .returning();
    return menuItem;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async seedMenuItems(): Promise<void> {
    const existingItems = await db.select().from(menuItems);
    if (existingItems.length > 0) return;

    const seedItems: InsertMenuItem[] = [
      {
        name: "Truffle Arancini",
        description: "Crispy risotto balls with truffle oil and parmesan",
        price: "12.00",
        category: "appetizers",
        isAvailable: true,
      },
      {
        name: "Burrata Caprese",
        description: "Fresh burrata with heirloom tomatoes and basil",
        price: "16.00",
        category: "appetizers",
        isAvailable: true,
      },
      {
        name: "Osso Buco",
        description: "Braised veal shank with saffron risotto and gremolata",
        price: "32.00",
        category: "mains",
        isAvailable: true,
      },
      {
        name: "Lobster Ravioli",
        description: "House-made pasta with lobster in champagne cream sauce",
        price: "28.00",
        category: "mains",
        isAvailable: true,
      },
      {
        name: "Tiramisu",
        description: "Classic Italian dessert with mascarpone and coffee",
        price: "9.00",
        category: "desserts",
        isAvailable: true,
      },
      {
        name: "Panna Cotta",
        description: "Vanilla panna cotta with berry compote",
        price: "8.00",
        category: "desserts",
        isAvailable: true,
      },
      {
        name: "Chianti Classico",
        description: "Full-bodied red wine from Tuscany",
        price: "45.00",
        category: "drinks",
        isAvailable: true,
      },
      {
        name: "Prosecco",
        description: "Sparkling wine from Veneto",
        price: "38.00",
        category: "drinks",
        isAvailable: true,
      },
    ];

    await db.insert(menuItems).values(seedItems);
  }
}

export const storage = new DatabaseStorage();
