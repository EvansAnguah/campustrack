import { useState } from "react";
import { useStudentsWithStatus, useCreateStudent } from "@/hooks/use-students";
import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Search, Circle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function LecturerStudents() {
  const { data: students, isLoading } = useStudentsWithStatus();
  const createStudent = useCreateStudent();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndex, setNewIndex] = useState("");

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStudent.mutateAsync({ name: newName, indexNumber: newIndex });
      toast({ title: "Success", description: "Student added successfully." });
      setNewName("");
      setNewIndex("");
      setIsAddOpen(false);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const filteredStudents = students?.filter(s =>
    s.student.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student.indexNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Student Directory</h2>
            <p className="text-slate-500">Monitor all students and their recent attendance status.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary">
                <UserPlus className="w-5 h-5 mr-2" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Manually register a student in the system.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="index">Index / ID Number</Label>
                  <Input id="index" value={newIndex} onChange={(e) => setNewIndex(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={createStudent.isPending}>
                  {createStudent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Register Student
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" /> Attended
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" /> Absent
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-slate-300 text-slate-300" /> Off
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Index Number</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead className="text-right">Registration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredStudents?.map((s) => (
                      <motion.tr
                        key={s.student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Circle className={`w-3 h-3 ${s.status === 'attended' ? 'fill-green-500 text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                s.status === 'absent' ? 'fill-red-500 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                  'fill-slate-200 text-slate-200'
                              } transition-all duration-500`} />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{s.student.indexNumber}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{s.student.name}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${s.student.isRegistered ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {s.student.isRegistered ? 'Active' : 'Pending'}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
