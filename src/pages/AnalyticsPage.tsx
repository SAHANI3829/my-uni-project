import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface CourseProgress {
  course_title: string;
  total_assignments: number;
  submitted_assignments: number;
  average_grade: number | null;
}

const AnalyticsPage = () => {
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(title)")
        .eq("student_id", user.id);

      if (!enrollments) return;

      const courseProgress: CourseProgress[] = [];

      for (const enrollment of enrollments) {
        const courseId = enrollment.course_id;
        const courseTitle = enrollment.courses.title;

        // Get total assignments
        const { count: totalAssignments } = await supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", courseId);

        // Get submitted assignments and grades
        const { data: submissions } = await supabase
          .from("submissions")
          .select("grade, assignment_id")
          .eq("student_id", user.id)
          .in("assignment_id", 
            (await supabase
              .from("assignments")
              .select("id")
              .eq("course_id", courseId)
            ).data?.map(a => a.id) || []
          );

        const submittedCount = submissions?.length || 0;
        const grades = submissions?.filter(s => s.grade !== null).map(s => s.grade as number) || [];
        const avgGrade = grades.length > 0 
          ? grades.reduce((a, b) => a + b, 0) / grades.length 
          : null;

        courseProgress.push({
          course_title: courseTitle,
          total_assignments: totalAssignments || 0,
          submitted_assignments: submittedCount,
          average_grade: avgGrade,
        });
      }

      setProgress(courseProgress);
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
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Progress</h1>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {progress.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No progress data available.</p>
        ) : (
          progress.map((course, index) => {
            const completionRate = course.total_assignments > 0
              ? (course.submitted_assignments / course.total_assignments) * 100
              : 0;

            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{course.course_title}</CardTitle>
                  <CardDescription>Course Analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {course.submitted_assignments}/{course.total_assignments}
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  {course.average_grade !== null && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Average Grade</span>
                        <span className="text-2xl font-bold">
                          {course.average_grade.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Assignments</p>
                      <p className="font-semibold">{course.total_assignments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-semibold">{course.submitted_assignments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
