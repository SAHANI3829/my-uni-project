import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  description: string | null;
}

interface Enrollment {
  id: string;
  course_id: string;
  courses: Course;
}

const StudentDashboard = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);

      if (enrollError) throw enrollError;
      setEnrollments(enrollData || []);

      // Fetch available courses
      const enrolledCourseIds = enrollData?.map(e => e.course_id) || [];
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .not("id", "in", `(${enrolledCourseIds.join(",")})`);

      if (coursesError) throw coursesError;
      setAvailableCourses(coursesData || []);
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

  const handleEnroll = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("enrollments")
        .insert({ student_id: user.id, course_id: courseId });

      if (error) throw error;

      toast({ title: "Successfully enrolled in course!" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={() => navigate("/assignments")} variant="outline">
            Assignments
          </Button>
          <Button onClick={() => navigate("/analytics")} variant="outline">
            My Progress
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <CardTitle>{enrollment.courses.title}</CardTitle>
                    <CardDescription>
                      {enrollment.courses.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge>Enrolled</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Courses</h2>
          {availableCourses.length === 0 ? (
            <p className="text-muted-foreground">No courses available to enroll.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      {course.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handleEnroll(course.id)} className="w-full">
                      Enroll Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
