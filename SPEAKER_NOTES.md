# Speaker Notes - Learning Management System (LMS)

## 1. Project Overview

### Technology Stack
```
Frontend: React + TypeScript + Vite
Styling: Tailwind CSS + shadcn/ui components
Backend: Lovable Cloud (Supabase)
Database: PostgreSQL
Authentication: Built-in Auth system
```

**Key Point to Explain:**
> "This is a full-stack Learning Management System built with React for the frontend and Lovable Cloud for the backend. We use TypeScript for type safety, Tailwind CSS for styling, and PostgreSQL for our database."

---

## 2. Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui base components (Button, Card, Dialog, etc.)
│   ├── CourseDialog.tsx
│   ├── CourseList.tsx
│   └── ErrorBoundary.tsx
├── pages/            # Route pages
│   ├── Auth.tsx              # Login/Signup
│   ├── Dashboard.tsx         # Role-based routing
│   ├── LecturerDashboard.tsx # Lecturer home
│   ├── StudentDashboard.tsx  # Student home
│   └── ...
├── hooks/            # Custom React hooks
├── integrations/     # Backend integration (Supabase client)
└── lib/              # Utility functions
```

**Key Point to Explain:**
> "We follow a component-based architecture. Pages are in the `pages` folder, reusable components in `components`, and all backend communication goes through the `integrations` folder."

---

## 3. Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User information (name, email) |
| `user_roles` | Role assignments (admin, lecturer, student) |
| `courses` | Course information |
| `enrollments` | Student-course relationships |
| `assignments` | Assignment details |
| `submissions` | Student work submissions |
| `notifications` | User notifications |

### Entity Relationships
```
profiles (1) ←→ (many) user_roles
courses (1) ←→ (many) enrollments
courses (1) ←→ (many) assignments
assignments (1) ←→ (many) submissions
enrollments: links students to courses
```

**Key Point to Explain:**
> "Our database has 7 main tables. The `profiles` table stores user info, `user_roles` defines what each user can do, `courses` contains course data, `enrollments` connects students to courses, `assignments` holds assignment details, and `submissions` stores student work."

---

## 4. Role-Based Access Control (RBAC)

### Three User Roles
1. **Admin** - Can manage all users, courses, and data
2. **Lecturer** - Can create courses, assignments, and grade students
3. **Student** - Can enroll in courses and submit assignments

### How It Works (Dashboard.tsx)
```typescript
// We check the user's role from the database
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .single();

// Then redirect based on role
switch (roleData.role) {
  case "admin":
    navigate("/admin");
    break;
  case "lecturer":
    navigate("/lecturer");
    break;
  case "student":
    navigate("/student");
    break;
}
```

**Key Point to Explain:**
> "When a user logs in, we check their role in the `user_roles` table and redirect them to the appropriate dashboard. This ensures each user type sees only what they need."

---

## 5. Row Level Security (RLS)

### What is RLS?
RLS is a PostgreSQL feature that restricts which rows users can access based on policies.

### Example Policy (Assignments)
```sql
-- Students can only view assignments for courses they're enrolled in
CREATE POLICY "Students can view assignments for enrolled courses" 
ON public.assignments 
FOR SELECT 
USING (course_id IN (
  SELECT course_id FROM enrollments 
  WHERE student_id = auth.uid()
));
```

**Key Point to Explain:**
> "Row Level Security is our main security feature. It ensures students can only see their own data, lecturers can only manage their own courses, and no one can access data they shouldn't. This happens at the database level, so even if someone bypasses the frontend, they can't access unauthorized data."

---

## 6. Key Pages Explained

### 6.1 Authentication (Auth.tsx)
```typescript
// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

// Sign in existing user  
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**Key Point to Explain:**
> "The auth page handles both login and signup. We use Supabase's built-in authentication which securely handles password hashing and session management."

---

### 6.2 Lecturer Dashboard (LecturerDashboard.tsx)
```typescript
// Fetch only courses created by this lecturer
const { data } = await supabase
  .from("courses")
  .select("*")
  .eq("created_by", user.id)  // Filter by creator
  .order("created_at", { ascending: false });
```

**Key Point to Explain:**
> "The lecturer dashboard shows only the courses created by the logged-in lecturer. We use the `eq` filter to match `created_by` with the current user's ID."

---

### 6.3 Student Dashboard (StudentDashboard.tsx)
```typescript
// Get courses the student is enrolled in
const { data: enrollments } = await supabase
  .from("enrollments")
  .select(`
    course_id,
    courses (id, title, description)
  `)
  .eq("student_id", user.id);
```

**Key Point to Explain:**
> "For students, we join the `enrollments` table with `courses` to get their enrolled courses. The nested select `courses (id, title, description)` is a Supabase feature that automatically joins related tables."

---

### 6.4 Grading Submissions (LecturerSubmissionsPage.tsx)
```typescript
// Update submission with grade and feedback
const { error } = await supabase
  .from("submissions")
  .update({
    grade: gradeValue,
    feedback: feedback,
    graded_by: user.id,
    graded_at: new Date().toISOString(),
  })
  .eq("id", submissionId);
```

**Key Point to Explain:**
> "When a lecturer grades a submission, we update the `submissions` table with the grade, feedback, who graded it, and when. This creates a complete audit trail."

---

### 6.5 Student Progress (StudentProgressPage.tsx)
```typescript
// Calculate average grade
const calculateAverageGrade = () => {
  const gradedSubmissions = submissions.filter(s => s.grade !== null);
  if (gradedSubmissions.length === 0) return null;
  
  const total = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
  return Math.round(total / gradedSubmissions.length);
};
```

**Key Point to Explain:**
> "The progress page calculates each student's average grade by filtering graded submissions and computing the mean. We use JavaScript's `reduce` function for the sum calculation."

---

## 7. React Patterns Used

### 7.1 useState - Managing Component State
```typescript
const [courses, setCourses] = useState<Course[]>([]);
const [loading, setLoading] = useState(true);
```

**Key Point to Explain:**
> "useState is React's way of adding state to functional components. We use it to store data like courses and track loading states."

---

### 7.2 useEffect - Side Effects
```typescript
useEffect(() => {
  fetchCourses();  // Runs when component mounts
}, []);  // Empty array = run once on mount
```

**Key Point to Explain:**
> "useEffect runs side effects like data fetching. The empty dependency array `[]` means it runs once when the component first loads."

---

### 7.3 useNavigate - Routing
```typescript
const navigate = useNavigate();

// Navigate to a different page
navigate("/lecturer/courses/123/assignments");
```

**Key Point to Explain:**
> "useNavigate is from React Router. It lets us programmatically navigate users to different pages without a page refresh."

---

### 7.4 Conditional Rendering
```typescript
{loading ? (
  <div>Loading...</div>
) : courses.length === 0 ? (
  <p>No courses yet.</p>
) : (
  <div>{/* Render courses */}</div>
)}
```

**Key Point to Explain:**
> "We use conditional rendering to show different UI based on the app state - a loading spinner while fetching, an empty message if no data, or the actual content when data is ready."

---

## 8. Component Library (shadcn/ui)

### Common Components Used
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
```

**Key Point to Explain:**
> "We use shadcn/ui for our component library. It provides pre-built, accessible components like buttons, cards, and dialogs that we can customize to match our design."

---

## 9. Error Handling

### Try-Catch Pattern
```typescript
try {
  const { data, error } = await supabase.from("courses").select("*");
  
  if (error) throw error;  // Convert Supabase error to exception
  
  setCourses(data);
} catch (error: any) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  });
}
```

**Key Point to Explain:**
> "We wrap database operations in try-catch blocks. If something goes wrong, we show a toast notification to the user with the error message, rather than crashing the app."

---

## 10. Routing (App.tsx)

```typescript
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/lecturer" element={<LecturerDashboard />} />
  <Route path="/student" element={<StudentDashboard />} />
  <Route path="/lecturer/courses/:courseId/assignments" element={<LecturerAssignmentsPage />} />
  <Route path="/lecturer/courses/:courseId/assignments/:assignmentId/submissions" element={<LecturerSubmissionsPage />} />
  {/* More routes... */}
</Routes>
```

### Dynamic Routes
`:courseId` and `:assignmentId` are URL parameters accessed via:
```typescript
const { courseId, assignmentId } = useParams();
```

**Key Point to Explain:**
> "We use React Router for navigation. Routes with colons like `:courseId` are dynamic - they capture the ID from the URL so we can load the right data."

---

## 11. Type Safety with TypeScript

```typescript
// Define the shape of our data
interface Course {
  id: string;
  title: string;
  description: string | null;  // Can be null
  created_at: string;
}

// TypeScript ensures we use data correctly
const [courses, setCourses] = useState<Course[]>([]);
```

**Key Point to Explain:**
> "TypeScript adds type checking to JavaScript. We define interfaces for our data structures, and TypeScript catches errors at compile time if we try to use data incorrectly."

---

## 12. Summary Points for Q&A

### Security
- "All data access is controlled by Row Level Security at the database level"
- "Users can only access data they're authorized to see"
- "Passwords are never stored in plain text"

### Architecture
- "Frontend and backend are separated - React handles UI, Supabase handles data"
- "We use a component-based architecture for reusability"
- "State management uses React's built-in useState and useEffect"

### Technology Choices
- "React for fast, interactive UI updates"
- "TypeScript for catching bugs early"
- "Tailwind CSS for rapid, consistent styling"
- "Supabase for easy database and authentication"

---

## 13. Potential Questions & Answers

**Q: Why use Supabase instead of a custom backend?**
> "Supabase provides authentication, database, and real-time features out of the box, letting us focus on building features rather than infrastructure."

**Q: How do you ensure data security?**
> "We use Row Level Security (RLS) which enforces access rules at the database level. Even if someone bypasses the frontend, they can't access unauthorized data."

**Q: Why React?**
> "React's component-based architecture makes code reusable and maintainable. Its virtual DOM also makes UI updates fast and efficient."

**Q: What happens if a student tries to access lecturer pages?**
> "The RLS policies would prevent them from seeing any data. Additionally, the frontend checks their role and redirects them to the appropriate dashboard."

---

Good luck with your presentation! 🎓
