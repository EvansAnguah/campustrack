import { useState } from "react";
import { useAuth } from "@/hooks/use-auth-context";
import { useCourses, useCreateCourse } from "@/hooks/use-courses";
import { useActiveSessions, useCreateSession, useStopSession, useSessionReport } from "@/hooks/use-sessions";
import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, StopCircle, Clock, Users, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Queries & Mutations
  const { data: courses } = useCourses();
  const { data: activeSessions } = useActiveSessions();
  const createSession = useCreateSession();
  const stopSession = useStopSession();
  const createCourse = useCreateCourse();

  // Create Session State
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [radius, setRadius] = useState([50]); // Meters
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const handleGetLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        toast({ title: "Location Acquired", description: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}` });
      },
      (err) => {
        setIsLocating(false);
        toast({ title: "Location Failed", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCreateSession = async () => {
    if (!selectedCourse || !coords) return;
    try {
      await createSession.mutateAsync({
        courseId: parseInt(selectedCourse),
        latitude: coords.lat,
        longitude: coords.lng,
        radius: radius[0],
      });
      setIsCreateOpen(false);
      toast({ title: "Session Started", description: "Students can now mark attendance." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
            <p className="text-slate-500">Manage active attendance sessions.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary shadow-lg shadow-primary/25">
                <Plus className="w-5 h-5 mr-2" /> Start New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Start Attendance Session</DialogTitle>
                <DialogDescription>Set location and range for student verification.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Select Course</Label>
                  <Select onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Allowed Radius (meters)</Label>
                    <span className="text-sm font-mono font-bold text-primary">{radius[0]}m</span>
                  </div>
                  <Slider value={radius} onValueChange={setRadius} min={10} max={500} step={10} />
                  <p className="text-xs text-slate-500">Students must be within this distance from your current location.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Location Source
                    </Label>
                    {coords && <span className="text-xs text-green-600 font-medium">Locked ✓</span>}
                  </div>
                  <Button
                    variant={coords ? "outline" : "secondary"}
                    className="w-full"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                    {coords ? "Update Location" : "Get Current Location"}
                  </Button>
                  {coords && (
                    <p className="text-xs text-center font-mono text-slate-400">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                  )}
                </div>

                <Button className="w-full" onClick={handleCreateSession} disabled={!selectedCourse || !coords || createSession.isPending}>
                  {createSession.isPending ? "Creating..." : "Launch Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Sessions Grid */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-slate-800">Active Sessions</h3>
          </div>
          
          {activeSessions?.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-12 h-12 mb-4 opacity-50" />
              <p>No active sessions running.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {activeSessions?.map(({ session, course }) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all">
                      <CardHeader className="pb-3 bg-slate-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-display">{course.code}</CardTitle>
                            <CardDescription>{course.name}</CardDescription>
                          </div>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between text-sm text-slate-600 border-b border-slate-100 pb-2">
                          <span>Started</span>
                          <span className="font-mono">{format(new Date(session.startTime), 'HH:mm')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Radius</span>
                          <span className="font-mono">{session.radius}m</span>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedReportId(session.id)}>
                              <Users className="w-4 h-4 mr-2" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                             <ReportView sessionId={session.id} />
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => stopSession.mutate(session.id)}
                          disabled={stopSession.isPending}
                        >
                          <StopCircle className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </LayoutShell>
  );
}

function ReportView({ sessionId }: { sessionId: number }) {
  const { data: report, isLoading } = useSessionReport(sessionId);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Attendance Report</DialogTitle>
        <DialogDescription>Live list of present students.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-500 py-8">No records yet</TableCell>
              </TableRow>
            ) : (
              report?.map(({ student, record }) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs">{student.indexNumber}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-right text-slate-500 text-xs font-mono">
                    {format(new Date(record.timestamp), 'HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
