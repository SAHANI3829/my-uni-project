# 🚀 Beginner's Guide: Adding Edge Functions to Supabase

This guide will walk you through deploying your microservices edge functions to Supabase and integrating them into your VS Code project.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ A Supabase account (sign up at https://supabase.com)
- ✅ A Supabase project created
- ✅ VS Code installed
- ✅ Node.js installed (version 16 or higher)

---

## Step 1: Install Supabase CLI

Open your terminal (in VS Code: Terminal → New Terminal) and run:

```bash
npm install -g supabase
```

**Wait for it to complete.** You should see a success message.

---

## Step 2: Login to Supabase

In your terminal, run:

```bash
supabase login
```

**What happens:**
- A browser window will open
- Click "Allow" to authorize the CLI
- Return to your terminal - you should see "Logged in successfully"

---

## Step 3: Link Your Project

You need to connect your local code to your Supabase project.

### 3.1 Find Your Project ID

1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** (gear icon) → **General**
4. Copy your **Project ID** (looks like: `abcdefghijklmnop`)

### 3.2 Link the Project

In your terminal, run:

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

**Replace `YOUR_PROJECT_ID` with the ID you copied.**

When prompted for a database password:
- This is the password you set when creating your Supabase project
- Type it carefully (you won't see it as you type)
- Press Enter

You should see: "Linked successfully"

---

## Step 4: Deploy All Edge Functions

Now we'll deploy all 7 microservices to Supabase.

### 4.1 Deploy One by One

Run these commands **one at a time**, waiting for each to complete:

```bash
supabase functions deploy send-notification
```

Wait for: ✅ "Deployed Function"

```bash
supabase functions deploy course-service
```

Wait for: ✅ "Deployed Function"

```bash
supabase functions deploy assignment-service
```

Wait for: ✅ "Deployed Function"

```bash
supabase functions deploy enrollment-service
```

Wait for: ✅ "Deployed Function"

```bash
supabase functions deploy submission-service
```

Wait for: ✅ "Deployed Function"

```bash
supabase functions deploy grading-service
```

Wait for: ✅ "Deployed Function"

```bash
supabase functions deploy analytics-service
```

Wait for: ✅ "Deployed Function"

### 4.2 Verify Deployment

Check if all functions are deployed:

```bash
supabase functions list
```

You should see all 7 functions listed! 🎉

---

## Step 5: Update Your Frontend Code

Now we need to update your VS Code project to use these edge functions instead of direct database calls.

### 5.1 Create Environment File

1. In VS Code, create a new file called `.env.local` in the root folder
2. Copy this content:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 5.2 Get Your Keys

**To find your Supabase URL and Keys:**

1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** → paste it into `VITE_SUPABASE_URL`
5. Copy the **anon public** key → paste it into `VITE_SUPABASE_ANON_KEY`

**Your `.env.local` should now look like:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 6: Update Supabase Client (If Moving from Lovable Cloud)

If you're migrating from Lovable Cloud, you need to update the Supabase client.

### 6.1 Update the Client File

**Open:** `src/integrations/supabase/client.ts`

**Replace the entire content with:**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

## Step 7: Test Your Setup

Let's make sure everything works!

### 7.1 Restart Your Development Server

In your terminal:

1. Press `Ctrl + C` to stop the current server
2. Run:

```bash
npm run dev
```

### 7.2 Test the Application

1. Open your browser to `http://localhost:5173`
2. Try to:
   - Login or signup
   - Create a course (if you're an admin)
   - View courses

If everything works, **congratulations! 🎉** Your microservices are running!

---

## Step 8: How to Use Edge Functions in Your Code

### Example 1: Creating a Course

**Instead of direct database call:**
```typescript
// ❌ OLD WAY (Direct database)
const { data, error } = await supabase
  .from('courses')
  .insert({ title, description });
```

**Use the edge function:**
```typescript
// ✅ NEW WAY (Edge function)
const { data, error } = await supabase.functions.invoke('course-service', {
  body: {
    action: 'create',
    data: {
      title: 'My Course',
      description: 'Course description',
      lecturer_id: userId,
      created_by: userId,
    }
  }
});
```

### Example 2: Getting Course Analytics

```typescript
const { data, error } = await supabase.functions.invoke('analytics-service', {
  body: {
    action: 'course-analytics',
    data: {
      course_id: 'course-uuid-here',
    }
  }
});

console.log(data.analytics); // { total_students: 10, average_grade: 85, ... }
```

---

## 🐛 Troubleshooting

### Problem: "Function not found"
**Solution:** 
- Make sure you deployed the function: `supabase functions list`
- Redeploy if missing: `supabase functions deploy function-name`

### Problem: "Invalid JWT"
**Solution:** 
- Make sure the user is logged in
- Check that `Authorization` header is being sent
- Verify JWT verification settings in `supabase/config.toml`

### Problem: "CORS error"
**Solution:** 
- Edge functions already have CORS headers configured
- Make sure you're calling from `localhost` or your deployed domain

### Problem: "Environment variables not found"
**Solution:** 
- Check that `.env.local` exists in your root folder
- Restart your dev server: `npm run dev`
- Make sure variables start with `VITE_`

---

## 📝 Next Steps

Now that your edge functions are deployed, you can:

1. **Update your pages** to use edge functions instead of direct database calls
2. **Monitor function logs:** 
   ```bash
   supabase functions logs function-name
   ```
3. **View function details** in Supabase Dashboard → Edge Functions

---

## 🆘 Need Help?

- Check function logs: `supabase functions logs function-name --follow`
- View Supabase docs: https://supabase.com/docs/guides/functions
- Review DEPLOYMENT_GUIDE.md for advanced usage

---

## ✅ Quick Reference Commands

| Command | What it does |
|---------|-------------|
| `supabase login` | Login to Supabase CLI |
| `supabase link --project-ref ID` | Connect to your project |
| `supabase functions deploy NAME` | Deploy a function |
| `supabase functions list` | List all functions |
| `supabase functions logs NAME` | View function logs |
| `npm run dev` | Start development server |

---

**You're all set! 🚀** Your microservices architecture is now deployed and ready to use.
