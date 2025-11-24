# Edge Functions Deployment Guide

## Overview
All microservices edge functions have been created and are ready to deploy to your Supabase project.

## Created Edge Functions

### 1. **send-notification** (Public)
- Sends notifications to users
- JWT verification: DISABLED (can be called without authentication)
- Location: `supabase/functions/send-notification/index.ts`

### 2. **course-service** (Protected)
- Manages course operations (create, update, delete, list, get)
- JWT verification: ENABLED
- Location: `supabase/functions/course-service/index.ts`

### 3. **assignment-service** (Protected)
- Manages assignments (create, update, delete, list, get)
- Notifies enrolled students when new assignments are posted
- JWT verification: ENABLED
- Location: `supabase/functions/assignment-service/index.ts`

### 4. **enrollment-service** (Protected)
- Manages student enrollments (enroll, unenroll, list, update-status)
- JWT verification: ENABLED
- Location: `supabase/functions/enrollment-service/index.ts`

### 5. **submission-service** (Protected)
- Manages assignment submissions (create, update, list, get)
- Notifies lecturers when students submit assignments
- JWT verification: ENABLED
- Location: `supabase/functions/submission-service/index.ts`

### 6. **grading-service** (Protected)
- Handles grading operations (grade, update-grade, get-statistics)
- Notifies students when assignments are graded
- JWT verification: ENABLED
- Location: `supabase/functions/grading-service/index.ts`

### 7. **analytics-service** (Protected)
- Provides analytics data (course-analytics, student-performance, system-metrics)
- JWT verification: ENABLED
- Location: `supabase/functions/analytics-service/index.ts`

## Deployment Steps

### Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Logged into Supabase: `supabase login`
3. Linked to your project: `supabase link --project-ref your-project-id`

### Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy send-notification
supabase functions deploy course-service
supabase functions deploy assignment-service
supabase functions deploy enrollment-service
supabase functions deploy submission-service
supabase functions deploy grading-service
supabase functions deploy analytics-service
```

### Deploy Individual Function

```bash
# Deploy a single function
supabase functions deploy <function-name>
```

## Calling Edge Functions from Frontend

### Example: Creating a Course

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('course-service', {
  body: {
    action: 'create',
    data: {
      title: 'Introduction to Programming',
      description: 'Learn the basics of programming',
      lecturer_id: 'user-uuid',
      created_by: 'user-uuid',
    }
  }
});
```

### Example: Enrolling a Student

```typescript
const { data, error } = await supabase.functions.invoke('enrollment-service', {
  body: {
    action: 'enroll',
    data: {
      student_id: 'student-uuid',
      course_id: 'course-uuid',
    }
  }
});
```

### Example: Grading a Submission

```typescript
const { data, error } = await supabase.functions.invoke('grading-service', {
  body: {
    action: 'grade',
    data: {
      submission_id: 'submission-uuid',
      grade: 85,
      feedback: 'Great work!',
      graded_by: 'lecturer-uuid',
    }
  }
});
```

### Example: Getting Course Analytics

```typescript
const { data, error } = await supabase.functions.invoke('analytics-service', {
  body: {
    action: 'course-analytics',
    data: {
      course_id: 'course-uuid',
    }
  }
});
```

## Available Actions by Service

### course-service
- `create`: Create a new course
- `update`: Update an existing course
- `delete`: Delete a course
- `list`: List all courses (can filter by lecturer_id)
- `get`: Get a specific course

### assignment-service
- `create`: Create a new assignment
- `update`: Update an existing assignment
- `delete`: Delete an assignment
- `list`: List assignments (can filter by course_id)
- `get`: Get a specific assignment

### enrollment-service
- `enroll`: Enroll a student in a course
- `unenroll`: Remove student from a course
- `list`: List enrollments (can filter by student_id, course_id, status)
- `update-status`: Update enrollment status

### submission-service
- `create`: Submit an assignment
- `update`: Update a submission
- `list`: List submissions (can filter by assignment_id, student_id)
- `get`: Get a specific submission

### grading-service
- `grade`: Grade a submission
- `update-grade`: Update an existing grade
- `get-statistics`: Get grade statistics (by assignment or course)

### analytics-service
- `course-analytics`: Get analytics for a specific course
- `student-performance`: Get performance data for a student
- `system-metrics`: Get overall system metrics

## Testing Edge Functions

### Using Supabase CLI

```bash
# Test locally before deploying
supabase functions serve course-service
```

### Using curl

```bash
curl -i --location --request POST 'https://your-project-id.supabase.co/functions/v1/course-service' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action":"list","data":{}}'
```

## Monitoring and Logs

### View Function Logs

```bash
# View logs for a specific function
supabase functions logs course-service

# Follow logs in real-time
supabase functions logs course-service --follow
```

### In Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" in the left sidebar
3. Click on the function name to view logs and metrics

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure JWT token is included in Authorization header
   - Check if user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`

2. **CORS Errors**
   - All functions include CORS headers
   - Make sure you're calling from the correct origin

3. **Permission Errors**
   - Verify RLS policies are correctly set up
   - Check user roles in `user_roles` table

4. **Function Not Found**
   - Ensure function is deployed: `supabase functions list`
   - Check function name spelling

## Next Steps

1. **Update Frontend Code**: Replace direct database calls with edge function calls
2. **Add Error Handling**: Implement proper error handling in your frontend
3. **Add Loading States**: Show loading indicators while functions execute
4. **Test All Flows**: Test each microservice thoroughly
5. **Monitor Performance**: Keep an eye on function execution times and errors

## Security Notes

- All functions (except send-notification) require authentication
- RLS policies are enforced at the database level
- Sensitive operations should validate user permissions
- Never expose service role keys in frontend code
- Always use the anon key from frontend

## Support

If you encounter issues:
1. Check function logs: `supabase functions logs <function-name>`
2. Verify database RLS policies
3. Check Supabase project status
4. Review function code for errors
