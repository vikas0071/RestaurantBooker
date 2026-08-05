export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  preparationTime?: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isAvailable?: boolean;
  adminId?: string;
}

export interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string | number;
  items: OrderItem[];
  total: string;
  status: string;
  notes?: string;
  createdAt?: string;
  adminId?: string;
}
