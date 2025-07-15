import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import OrderPage from "@/pages/order";
import AdminPage from "@/pages/admin";
import LoginPage from "@/pages/login";
import { UtensilsCrossed, QrCode, Settings } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-in fade-in duration-700">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-secondary mb-2">Spice Garden</h1>
              <p className="text-gray-600">Authentic Indian Restaurant</p>
            </div>
            
            <div className="space-y-6">
              <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
                <QrCode className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h2 className="text-lg font-semibold text-secondary mb-2">For Customers</h2>
                <p className="text-gray-600 mb-4">Scan the QR code at your table to place an order</p>
                <a 
                  href="/order?table=5" 
                  className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium hover:scale-105"
                >
                  Try Demo - Table 5
                </a>
              </div>
              
              <div className="text-center bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg p-6">
                <Settings className="w-12 h-12 mx-auto mb-3 text-accent" />
                <h2 className="text-lg font-semibold text-secondary mb-2">For Staff</h2>
                <p className="text-gray-600 mb-4">Manage orders and restaurant menu</p>
                <a 
                  href="/login" 
                  className="inline-block bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 transition-all duration-200 font-medium hover:scale-105"
                >
                  Staff Login
                </a>
              </div>
            </div>
          </div>
        </div>
      )} />
      <Route path="/order" component={OrderPage} />
      <Route path="/login" component={LoginPage} />
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
