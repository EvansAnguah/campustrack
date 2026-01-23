import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, UserCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const studentLoginSchema = z.object({
  username: z.string().min(1, "Index number is required"),
  password: z.string().min(1, "Password is required"),
});

const lecturerLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const onboardSchema = z.object({
  indexNumber: z.string().min(1, "Index number is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { login, onboard, user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Redirect if logged in
  if (user) {
    setLocation("/");
    return null;
  }

  // --- Student Login Form ---
  const StudentForm = () => {
    const form = useForm<z.infer<typeof studentLoginSchema>>({
      resolver: zodResolver(studentLoginSchema),
    });

    const onSubmit = async (data: z.infer<typeof studentLoginSchema>) => {
      setIsPending(true);
      try {
        await login({ ...data, role: "student" });
      } catch (e) {
        // Handled by context toast
      } finally {
        setIsPending(false);
      }
    };

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="index">Index Number</Label>
          <Input id="index" placeholder="e.g. S12345" {...form.register("username")} className="rounded-lg border-slate-200" />
          {form.formState.errors.username && <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} className="rounded-lg border-slate-200" />
          {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
        </Button>
        <div className="text-center mt-4">
          <button type="button" onClick={() => setIsOnboarding(true)} className="text-sm text-primary hover:underline">
            First time here? Register account
          </button>
        </div>
      </form>
    );
  };

  // --- Lecturer Login Form ---
  const LecturerForm = () => {
    const form = useForm<z.infer<typeof lecturerLoginSchema>>({
      resolver: zodResolver(lecturerLoginSchema),
    });

    const onSubmit = async (data: z.infer<typeof lecturerLoginSchema>) => {
      setIsPending(true);
      try {
        await login({ ...data, role: "lecturer" });
      } catch (e) {
      } finally {
        setIsPending(false);
      }
    };

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="admin_user" {...form.register("username")} className="rounded-lg border-slate-200" />
          {form.formState.errors.username && <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="l-password">Password</Label>
          <Input id="l-password" type="password" placeholder="••••••••" {...form.register("password")} className="rounded-lg border-slate-200" />
          {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg shadow-black/10" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Access Dashboard"}
        </Button>
      </form>
    );
  };

  // --- Onboarding Form ---
  const OnboardForm = () => {
    const form = useForm<z.infer<typeof onboardSchema>>({
      resolver: zodResolver(onboardSchema),
    });

    const onSubmit = async (data: z.infer<typeof onboardSchema>) => {
      setIsPending(true);
      try {
        await onboard(data);
        setIsOnboarding(false);
      } catch (e) {
      } finally {
        setIsPending(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setIsOnboarding(false)} className="p-0 h-auto hover:bg-transparent text-slate-500 hover:text-slate-900">
            ← Back to Login
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Activate Account</h2>
        <p className="text-slate-500 text-sm mb-6">Set up your password for the first time.</p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-index">Index Number</Label>
            <Input id="reg-index" placeholder="S12345" {...form.register("indexNumber")} className="rounded-lg" />
            {form.formState.errors.indexNumber && <p className="text-xs text-red-500">{form.formState.errors.indexNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pass">New Password</Label>
            <Input id="new-pass" type="password" {...form.register("newPassword")} className="rounded-lg" />
            {form.formState.errors.newPassword && <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pass">Confirm Password</Label>
            <Input id="confirm-pass" type="password" {...form.register("confirmPassword")} className="rounded-lg" />
            {form.formState.errors.confirmPassword && <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Registration"}
          </Button>
        </form>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Brand Side */}
        <div className="hidden md:block space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/30">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight font-display">
            Attendance <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Reimagined.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-md">
            Secure, location-based attendance tracking for the modern campus.
            Verify presence with GPS precision.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-full border shadow-sm">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Anti-spoofing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-full border shadow-sm">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Real-time Sync</span>
            </div>
          </div>
        </div>

        {/* Auth Card Side */}
        <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-8">
            {isOnboarding ? (
              <OnboardForm />
            ) : (
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-slate-100 rounded-xl">
                  <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Student</TabsTrigger>
                  <TabsTrigger value="lecturer" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Lecturer</TabsTrigger>
                </TabsList>
                <TabsContent value="student">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Student Portal</h2>
                    <p className="text-slate-500 text-sm">Log in to mark attendance</p>
                  </div>
                  <StudentForm />
                </TabsContent>
                <TabsContent value="lecturer">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Lecturer Access</h2>
                    <p className="text-slate-500 text-sm">Manage sessions and reports</p>
                  </div>
                  <LecturerForm />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
