import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import OrderPage from "@/pages/order";
import AdminPage from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center text-secondary mb-6">Bella Vista Restaurant</h1>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-secondary mb-2">For Customers</h2>
              <p className="text-gray-600 mb-4">Scan the QR code at your table to place an order</p>
              <a 
                href="/order?table=5" 
                className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Demo - Table 5
              </a>
            </div>
            <div className="border-t pt-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-secondary mb-2">For Staff</h2>
                <p className="text-gray-600 mb-4">Manage orders and update status</p>
                <a 
                  href="/admin" 
                  className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Admin Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>} />
      <Route path="/order" component={OrderPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
