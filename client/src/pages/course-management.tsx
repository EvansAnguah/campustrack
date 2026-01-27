import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Course } from "@shared/schema";

const formSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
});

export default function CourseManagement() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            name: "",
        },
    });

    const { data: courses, isLoading } = useQuery<Course[]>({
        queryKey: ["/api/courses"],
    });

    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            // We need to pass lecturerId, but it's handled by backend from session.
            // Wait, the schema requires lecturerId? 
            // Checking shared/routes.ts -> insertCourseSchema omits id. 
            // Checking shared/schema.ts -> courses table has lecturerId notNull.
            // Checking server/routes.ts -> createCourse receives body.
            // server/storage.ts -> createCourse inserts value.
            // Wait, server/routes.ts line 173: const input = api.courses.create.input.parse(req.body);
            // api.courses.create.input is insertCourseSchema.
            // insertCourseSchema omits id. But does it include lecturerId?
            // Yes, createInsertSchema(courses) includes lecturerId.
            // However, usually we want the backend to assign the logged-in lecturer's ID.
            // Let's check server/routes.ts line 173 again.
            // It just calls createCourse(input).
            // So the client needs to send lecturerId? Or the server should inject it.
            // Let's update the server route to inject it if missing, or update the client to send it.
            // Ideally server injects it.
            // Let's assume for now I need to fix server/routes.ts to inject lecturerId.
            // I will fix server route first.
            const res = await apiRequest("POST", "/api/courses", { ...values, lecturerId: 0 }); // Placeholder, server should override or we fetch user id.
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course created successfully.",
            });
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create course",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/courses/${id}`);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course deleted.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to delete",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        // We need the current user's ID to set as lecturerId.
        // However, the `insertCourseSchema` expects `lecturerId`. 
        // The server implementation of `create` endpoint blindly passes the body to storage.
        // I should update the server to attach the current user's ID.
        // For now, I'll rely on the server patch I'm about to do.
        createMutation.mutate(values);
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <BookOpen className="w-6 h-6" />
                        <span>Course Management</span>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 grid gap-8 md:grid-cols-2">
                {/* Create Form */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                Add New Course
                            </CardTitle>
                            <CardDescription>
                                Create a new course that you teach.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Course Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="CS101" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Course Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Introduction to Programming" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending
                                            ? "Creating..."
                                            : "Create Course"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                {/* Existing Courses List */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Courses</CardTitle>
                            <CardDescription>
                                Manage existing courses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : courses?.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">No courses found.</div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courses?.map((course) => (
                                                <TableRow key={course.id}>
                                                    <TableCell className="font-mono font-medium">{course.code}</TableCell>
                                                    <TableCell>{course.name}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => {
                                                                if (confirm("Are you sure? This will delete all history for this course.")) {
                                                                    deleteMutation.mutate(course.id);
                                                                }
                                                            }}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
