import { useAuth } from "@/hooks/use-auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap, MapPin } from "lucide-react";
import { Link } from "wouter";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Campus<span className="text-primary">Track</span>
              </h1>
              <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                Academic Attendance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-900">
                {role === "student" ? user?.name : user?.name}
              </span>
              <span className="text-xs text-slate-500 capitalize px-2 py-0.5 bg-slate-100 rounded-full">
                {role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} CampusTrack. Secure GPS Attendance System.
        </div>
      </footer>
    </div>
  );
}
