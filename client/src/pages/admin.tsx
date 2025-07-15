import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Order } from "@shared/schema";
import OrderCard from "@/components/admin/order-card";
import MenuManagement from "@/components/admin/menu-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Settings, LogOut, ShoppingBag, UtensilsCrossed, Users, IndianRupee, Clock } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

export default function AdminPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Set up WebSocket connection for real-time updates
  useSocket((data) => {
    if (data.type === 'new-order' || data.type === 'order-update') {
      refetch();
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-secondary">
                {user.restaurantName || "Spice Garden"} Admin
              </h1>
              <p className="text-sm text-gray-600">Welcome back, {user.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-accent bg-opacity-10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-accent">Live</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-secondary">{orderCounts.all}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{orderCounts.pending}</p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Preparing</p>
                      <p className="text-2xl font-bold text-orange-600">{orderCounts.preparing}</p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Served</p>
                      <p className="text-2xl font-bold text-green-600">{orderCounts.served}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-secondary">Order Management</h2>
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

                {/* Filter Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant={activeFilter === "all" ? "default" : "outline"}
                    onClick={() => setActiveFilter("all")}
                    size="sm"
                  >
                    All Orders ({orderCounts.all})
                  </Button>
                  <Button
                    variant={activeFilter === "pending" ? "default" : "outline"}
                    onClick={() => setActiveFilter("pending")}
                    size="sm"
                  >
                    Pending ({orderCounts.pending})
                  </Button>
                  <Button
                    variant={activeFilter === "preparing" ? "default" : "outline"}
                    onClick={() => setActiveFilter("preparing")}
                    size="sm"
                  >
                    Preparing ({orderCounts.preparing})
                  </Button>
                  <Button
                    variant={activeFilter === "served" ? "default" : "outline"}
                    onClick={() => setActiveFilter("served")}
                    size="sm"
                  >
                    Served ({orderCounts.served})
                  </Button>
                </div>
              </div>

              {/* Orders Grid */}
              <div className="p-6">
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
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IndianRupee className="w-5 h-5 mr-2" />
                    Today's Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ₹{orders?.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(0) || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    From {orders?.length || 0} orders
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Average Order Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">25 min</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Kitchen efficiency
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Tables Served
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {new Set(orders?.map(order => order.tableId)).size || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Unique tables today
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
