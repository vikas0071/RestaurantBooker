import { eq, desc } from "drizzle-orm";
import {
  users,
  menuItems,
  orders,
  tables
} from "../shared/schema.ts";
import type {
  MenuItem,
  InsertMenuItem,
  Order,
  InsertOrder,
  User,
  InsertUser,
  Table,
  InsertTable
} from "../shared/schema.ts";
import { db } from "./db.ts";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Menu items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Tables
  getTables(): Promise<Table[]>;
  getTable(number: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  
  seedData(): Promise<void>;
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

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updatedItem] = await db
      .update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTables(): Promise<Table[]> {
    return await db.select().from(tables).where(eq(tables.isActive, true));
  }

  async getTable(number: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.number, number));
    return table || undefined;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db
      .insert(tables)
      .values(table)
      .returning();
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const [updatedTable] = await db
      .update(tables)
      .set(table)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable || undefined;
  }

  async seedData(): Promise<void> {
    // Seed menu items with Indian dishes and prices
    const existingItems = await db.select().from(menuItems);
    if (existingItems.length === 0) {
      const seedItems: InsertMenuItem[] = [
        {
          name: "Paneer Tikka",
          description: "Marinated cottage cheese grilled with spices",
          price: "320.00",
          category: "appetizers",
          isAvailable: true,
          preparationTime: 15,
          isVegetarian: true,
          isSpicy: true,
        },
        {
          name: "Chicken Seekh Kebab",
          description: "Spiced minced chicken grilled on skewers",
          price: "450.00",
          category: "appetizers",
          isAvailable: true,
          preparationTime: 20,
          isVegetarian: false,
          isSpicy: true,
        },
        {
          name: "Butter Chicken",
          description: "Creamy tomato curry with tender chicken pieces",
          price: "580.00",
          category: "mains",
          isAvailable: true,
          preparationTime: 25,
          isVegetarian: false,
          isSpicy: false,
        },
        {
          name: "Dal Makhani",
          description: "Rich black lentils cooked in butter and cream",
          price: "380.00",
          category: "mains",
          isAvailable: true,
          preparationTime: 30,
          isVegetarian: true,
          isSpicy: false,
        },
        {
          name: "Biryani Chicken",
          description: "Aromatic basmati rice with spiced chicken",
          price: "650.00",
          category: "mains",
          isAvailable: true,
          preparationTime: 35,
          isVegetarian: false,
          isSpicy: true,
        },
        {
          name: "Gulab Jamun",
          description: "Sweet milk dumplings in rose syrup",
          price: "180.00",
          category: "desserts",
          isAvailable: true,
          preparationTime: 5,
          isVegetarian: true,
          isSpicy: false,
        },
        {
          name: "Kulfi",
          description: "Traditional Indian ice cream with cardamom",
          price: "150.00",
          category: "desserts",
          isAvailable: true,
          preparationTime: 5,
          isVegetarian: true,
          isSpicy: false,
        },
        {
          name: "Masala Chai",
          description: "Spiced tea with milk and aromatic spices",
          price: "80.00",
          category: "drinks",
          isAvailable: true,
          preparationTime: 5,
          isVegetarian: true,
          isSpicy: false,
        },
        {
          name: "Lassi",
          description: "Refreshing yogurt drink with sweet or salty flavor",
          price: "120.00",
          category: "drinks",
          isAvailable: true,
          preparationTime: 5,
          isVegetarian: true,
          isSpicy: false,
        },
      ];

      await db.insert(menuItems).values(seedItems);
    }

    // Seed tables
    const existingTables = await db.select().from(tables);
    if (existingTables.length === 0) {
      const seedTables: InsertTable[] = Array.from({ length: 20 }, (_, i) => ({
        number: i + 1,
        capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
        qrCode: `table_${i + 1}_qr`,
        isActive: true,
      }));

      await db.insert(tables).values(seedTables);
    }

    // Seed admin user
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      const adminUser: InsertUser = {
        username: "admin",
        password: "admin123", // In production, this should be hashed
        restaurantName: "Spice Garden Restaurant",
        email: "admin@spicegarden.com",
        phone: "+91 9876543210",
      };

      await db.insert(users).values(adminUser);
    }
  }
}

export const storage = new DatabaseStorage();
