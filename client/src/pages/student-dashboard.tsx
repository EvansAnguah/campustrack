import { useState } from "react";
import { useAuth } from "@/hooks/use-auth-context";
import { useActiveSessions } from "@/hooks/use-sessions";
import { useMarkAttendance, useAttendanceHistory } from "@/hooks/use-attendance";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertCircle, Clock, History, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const { user, deviceId } = useAuth();
  const { data: activeSessions, isLoading: isLoadingSessions } = useActiveSessions();
  const { data: history } = useAttendanceHistory();
  const markAttendance = useMarkAttendance();
  const { toast } = useToast();

  const [markingId, setMarkingId] = useState<number | null>(null);

  const handleMarkAttendance = async (sessionId: number) => {
    setMarkingId(sessionId);
    
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
      setMarkingId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await markAttendance.mutateAsync({
            sessionId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            deviceId,
          });
          toast({ 
            title: "Success!", 
            description: "Attendance marked successfully.",
            className: "bg-green-50 border-green-200 text-green-900"
          });
        } catch (e) {
          toast({ 
            title: "Failed", 
            description: (e as Error).message, 
            variant: "destructive" 
          });
        } finally {
          setMarkingId(null);
        }
      },
      (err) => {
        toast({ title: "Location Error", description: err.message, variant: "destructive" });
        setMarkingId(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <LayoutShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h2>
            <p className="text-slate-500 font-mono text-sm">{user?.indexNumber}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Time</p>
            <p className="text-xl font-mono text-slate-700">{format(new Date(), "HH:mm")}</p>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="active" className="rounded-lg">Active Sessions</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">My History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoadingSessions ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : activeSessions?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No Active Sessions</h3>
                <p className="text-slate-500">Check back when your lecturer starts a class.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activeSessions?.map(({ session, course }) => (
                  <motion.div 
                    key={session.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="font-display text-xl">{course.code}</CardTitle>
                            <CardDescription>{course.name}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Live
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Clock className="w-4 h-4" />
                          Started {format(new Date(session.startTime), "h:mm a")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          Within {session.radius}m range
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                          onClick={() => handleMarkAttendance(session.id)}
                          disabled={markingId === session.id}
                        >
                          {markingId === session.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Location...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark Attendance
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Record</CardTitle>
                <CardDescription>Your verified attendance history.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history?.map(({ record, session, course }) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{course.code}</p>
                          <p className="text-sm text-slate-500">{course.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium text-slate-900">
                          {format(new Date(record.timestamp), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(record.timestamp), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {history?.length === 0 && (
                    <div className="text-center py-8 text-slate-500">No history found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}
