-- Update app_role enum to include lecturer and student
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'lecturer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';

-- Create enrollments table for Enrollment Service
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollments
CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll in courses"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Lecturers can view enrollments for their courses"
  ON public.enrollments FOR SELECT
  USING (
    has_role(auth.uid(), 'lecturer'::app_role) AND 
    course_id IN (SELECT id FROM public.courses WHERE created_by = auth.uid())
  );

CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create assignments table for Assignment Service
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_grade INTEGER NOT NULL DEFAULT 100,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignments
CREATE POLICY "Students can view assignments for enrolled courses"
  ON public.assignments FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM public.enrollments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Lecturers can manage their course assignments"
  ON public.assignments FOR ALL
  USING (
    has_role(auth.uid(), 'lecturer'::app_role) AND
    course_id IN (SELECT id FROM public.courses WHERE created_by = auth.uid())
  );

CREATE POLICY "Admins can manage all assignments"
  ON public.assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create submissions table for Assignment Service
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES auth.users(id),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for submissions
CREATE POLICY "Students can view their own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can update their own ungraded submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = student_id AND grade IS NULL);

CREATE POLICY "Lecturers can view submissions for their assignments"
  ON public.submissions FOR SELECT
  USING (
    has_role(auth.uid(), 'lecturer'::app_role) AND
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE c.created_by = auth.uid()
    )
  );

CREATE POLICY "Lecturers can grade submissions for their assignments"
  ON public.submissions FOR UPDATE
  USING (
    has_role(auth.uid(), 'lecturer'::app_role) AND
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE c.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all submissions"
  ON public.submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create notifications table for Notification Service
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on assignments
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add lecturer role support to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lecturer_id UUID REFERENCES auth.users(id);

-- Update existing courses to set lecturer_id from created_by
UPDATE public.courses SET lecturer_id = created_by WHERE lecturer_id IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);