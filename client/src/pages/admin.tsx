import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import OrderCard from "@/components/admin/order-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Settings } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

export default function AdminPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Set up WebSocket connection for real-time updates
  useSocket((data) => {
    if (data.type === 'new-order' || data.type === 'order-update') {
      refetch();
    }
  });

  const filteredOrders = orders?.filter(order => {
    const matchesFilter = activeFilter === "all" || order.status === activeFilter;
    const matchesSearch = order.id.toString().includes(searchQuery) || 
                         order.tableId.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  }) || [];

  const getOrderCounts = () => {
    if (!orders) return { all: 0, pending: 0, preparing: 0, served: 0 };
    
    return orders.reduce((counts, order) => {
      counts.all++;
      counts[order.status as keyof typeof counts]++;
      return counts;
    }, { all: 0, pending: 0, preparing: 0, served: 0 });
  };

  const orderCounts = getOrderCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Bella Vista Admin</h1>
              <p className="text-sm text-gray-600">Order Management Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-accent bg-opacity-10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-accent">Live</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-secondary mb-4">Order Status</h2>
            <div className="space-y-2">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                onClick={() => setActiveFilter("all")}
                className="w-full justify-between"
              >
                All Orders
                <Badge variant="secondary">{orderCounts.all}</Badge>
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "ghost"}
                onClick={() => setActiveFilter("pending")}
                className="w-full justify-between"
              >
                Pending
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {orderCounts.pending}
                </Badge>
              </Button>
              <Button
                variant={activeFilter === "preparing" ? "default" : "ghost"}
                onClick={() => setActiveFilter("preparing")}
                className="w-full justify-between"
              >
                Preparing
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {orderCounts.preparing}
                </Badge>
              </Button>
              <Button
                variant={activeFilter === "served" ? "default" : "ghost"}
                onClick={() => setActiveFilter("served")}
                className="w-full justify-between"
              >
                Served
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {orderCounts.served}
                </Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary">Active Orders</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    <SelectItem value="1-10">Table 1-10</SelectItem>
                    <SelectItem value="11-20">Table 11-20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                ))
              ) : (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>

            {!isLoading && filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">No orders found</p>
                  <p className="text-sm">
                    {searchQuery ? 'Try adjusting your search' : 'Orders will appear here when placed'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
