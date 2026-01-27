import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth-context";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/student-dashboard";
import LecturerDashboard from "@/pages/lecturer-dashboard";
import LecturerStudents from "@/pages/lecturer-students";
import LecturerManagement from "@/pages/lecturer-management";
import CourseManagement from "@/pages/course-management";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      {/* Student Routes */}
      <Route path="/">
        {() => <PrivateRoute Component={StudentDashboard} roleRequired="any" />}
      </Route>

      {/* Lecturer Routes - Explicit paths for deep linking */}
      <Route path="/dashboard">
        {() => <PrivateRoute Component={LecturerDashboard} roleRequired="lecturer" />}
      </Route>
      <Route path="/students">
        {() => <PrivateRoute Component={LecturerStudents} roleRequired="lecturer" />}
      </Route>
      <Route path="/lecturers">
        {() => <PrivateRoute Component={LecturerManagement} roleRequired="lecturer" />}
      </Route>
      <Route path="/courses">
        {() => <PrivateRoute Component={CourseManagement} roleRequired="lecturer" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// Wrapper for protected routes to handle access control
function PrivateRoute({ Component, roleRequired }: { Component: React.ComponentType, roleRequired: 'student' | 'lecturer' | 'any' }) {
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

  // If attempting to access a lecturer route but user is a student
  if (roleRequired === 'lecturer' && role !== 'lecturer') {
    return <Redirect to="/" />;
  }

  // If user is a lecturer at root, redirect to dashboard
  if (role === 'lecturer' && window.location.pathname === '/') {
    return <Redirect to="/dashboard" />;
  }

  // If user is a student at root, show student dashboard
  if (role === 'student' && window.location.pathname === '/') {
    return <Component />;
  }

  return <Component />;
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
