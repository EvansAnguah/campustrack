import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth-context";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/student-dashboard";
import LecturerDashboard from "@/pages/lecturer-dashboard";
import NotFound from "@/pages/not-found";

function PrivateRoute() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-500 text-sm font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (role === "student") {
    return <StudentDashboard />;
  }

  if (role === "lecturer") {
    return <LecturerDashboard />;
  }

  return <Redirect to="/auth" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={PrivateRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
