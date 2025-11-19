import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Enrollment {
  id: string;
  enrolled_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Course {
  title: string;
}

const EnrollmentsPage = () => {
  const { courseId } = useParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrollments();
  }, [courseId]);

  const fetchEnrollments = async () => {
    if (!courseId) return;

    try {
      // Fetch course info
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch enrollments with student info
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, enrolled_at, student_id")
        .eq("course_id", courseId)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each student
      const enrollmentsWithProfiles = await Promise.all(
        (data || []).map(async (enrollment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", enrollment.student_id)
            .single();

          return {
            ...enrollment,
            profiles: profile || { full_name: "Unknown", email: "Unknown" }
          };
        })
      );

      setEnrollments(enrollmentsWithProfiles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enrolled Students</h1>
          <p className="text-muted-foreground">{course?.title}</p>
        </div>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            Total students: {enrollments.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground">No students enrolled yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>{enrollment.profiles.full_name}</TableCell>
                    <TableCell>{enrollment.profiles.email}</TableCell>
                    <TableCell>
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnrollmentsPage;
