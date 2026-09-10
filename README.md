# Teacher Dashboard - الأستاذ مروان الجنيدي

## Overview

A complete production-ready Teacher Dashboard for the educational platform of **الأستاذ مروان الجنيدي (Marwan Elgendi)**. This is a single-teacher platform that integrates with a Student Mobile App and Student Registration Website through a shared Supabase backend.

## Features

- **Authentication**: Secure teacher-only login with Supabase Auth
- **Dashboard**: Real-time statistics and overview
- **Groups Management**: Create, edit, delete groups; manage members
- **Student Management**: View students, profiles, academic data
- **Invitation System**: Email-based student invitations with secure tokens
- **Group Chat**: Real-time messaging with file sharing and pinned messages
- **Assignments**: Create, manage, review submissions, grade
- **Exams**: Multi-question-type exams with grading
- **Attendance**: Session-based attendance tracking
- **Announcements**: Send announcements to groups or all students
- **Resources Library**: Upload and manage educational files
- **Gradebook**: Comprehensive grade tracking and averages
- **Calendar**: View assignments, exams, sessions, events
- **Live Sessions (Jitsi)**: Create meeting rooms for groups
- **Notifications**: Real-time notification center
- **Search**: Global search across all entities
- **Settings**: Profile management, password change

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Email**: Resend (via Edge Function)
- **Video**: Jitsi Meet
- **Build Tool**: Vite

## Architecture

```
src/
├── App.tsx                 # Main app with routing
├── main.tsx               # Entry point
├── index.css              # Global styles
├── vite-env.d.ts          # TypeScript env declarations
├── lib/
│   └── supabase.ts        # Supabase client configuration
├── types/
│   └── index.ts           # TypeScript interfaces
├── services/
│   └── index.ts           # All service functions (database operations)
├── hooks/
│   └── useAuth.ts         # Auth store (Zustand)
├── components/
│   └── Layout.tsx         # UI components + Dashboard layout
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── Groups.tsx
    ├── GroupDetail.tsx
    ├── Students.tsx
    ├── StudentProfile.tsx
    ├── Invitations.tsx
    ├── Assignments.tsx
    ├── Exams.tsx
    ├── Attendance.tsx
    ├── Announcements.tsx
    ├── Resources.tsx
    ├── Grades.tsx
    ├── Calendar.tsx
    ├── Jitsi.tsx
    └── Settings.tsx
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project
- A Resend account (for email)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd teacher-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Fill in your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_JITSI_DOMAIN=meet.jit.si
```

## Supabase Setup

### 1. Database

Run the migration file to create all tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in supabase/migrations/001_initial_schema.sql
# via the Supabase SQL Editor
```

### 2. Create Teacher Account

1. Go to Supabase Dashboard → Authentication
2. Create a new user with the teacher's email
3. In the `profiles` table, ensure the user has `role = 'teacher'`

### 3. Storage Buckets

Create these storage buckets in Supabase Dashboard → Storage:

| Bucket | Public | Description |
|--------|--------|-------------|
| `avatars` | Yes | Profile pictures |
| `chat-files` | No | Chat file attachments |
| `chat-images` | No | Chat image attachments |
| `assignment-submissions` | No | Student homework submissions |
| `resources` | Yes | Educational resources |

**Storage Policies:**

For `avatars`:
- SELECT: Allow all (public)
- INSERT/UPDATE: Allow authenticated users to upload their own avatar

For `chat-files` and `chat-images`:
- SELECT: Allow authenticated users who are group members
- INSERT: Allow authenticated users

For `assignment-submissions`:
- SELECT: Allow teacher and submitting student
- INSERT: Allow authenticated students

For `resources`:
- SELECT: Allow all (public)
- INSERT/UPDATE/DELETE: Allow teacher only

### 4. Edge Functions

Deploy the invitation email function:

```bash
# Set secrets
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set REGISTRATION_URL=https://your-registration-site.com

# Deploy function
supabase functions deploy send-invitation-email
```

### 5. Row Level Security

The migration includes comprehensive RLS policies. Key rules:

- Teachers can manage all resources
- Students can only access their own data and their groups' data
- Students cannot modify grades, teacher comments, or other students' data
- Invitation tokens are validated server-side
- Storage objects are properly protected

## Environment Variables

| Variable | Description | Location |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend (.env) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Frontend (.env) |
| `VITE_JITSI_DOMAIN` | Jitsi Meet domain | Frontend (.env) |
| `RESEND_API_KEY` | Resend email API key | Edge Function secrets |
| `REGISTRATION_URL` | Student registration site URL | Edge Function secrets |

⚠️ **NEVER** put `RESEND_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## Local Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Frontend

Deploy the `dist/` folder to any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

### Supabase

The Supabase project handles all backend needs. Ensure:
- RLS is enabled on all tables
- Storage policies are configured
- Edge Functions are deployed
- Secrets are set

## Security Notes

1. **Authentication**: Only the teacher account with `role = 'teacher'` can access the dashboard
2. **Authorization**: RLS policies enforce data access at the database level
3. **Invitations**: Tokens are UUID-based, validated server-side, expire after 7 days
4. **Email**: Sent via Edge Function (server-side), API keys never exposed to client
5. **Storage**: Private buckets with proper access policies
6. **Realtime**: Subscriptions respect RLS policies
7. **Input Validation**: Both client-side and server-side validation

## Integration with Student App

This dashboard shares the same Supabase project with:
1. **Student Mobile App** - Students login, view assignments, submit work, chat
2. **Student Registration Website** - Students register via invitation links

All data flows through the shared Supabase backend:
- Teacher creates assignment → Student sees it in app
- Student submits homework → Teacher reviews in dashboard
- Teacher grades → Student sees grade in app

## Testing

Key areas to test:
- [ ] Teacher login/logout
- [ ] Protected route access
- [ ] Group CRUD operations
- [ ] Student invitation flow
- [ ] Assignment creation and grading
- [ ] Exam creation with questions
- [ ] Attendance marking
- [ ] Chat messaging (realtime)
- [ ] File uploads
- [ ] Calendar events
- [ ] Jitsi room creation
- [ ] Notification delivery
- [ ] Search functionality
- [ ] RLS enforcement (student cannot access teacher data)

## License

Private - Educational Platform for الأستاذ مروان الجنيدي
