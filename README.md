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
- **Exams**: Multi-question-type exams (MCQ, True/False, Short Answer, Long Answer, Numerical)
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
│   ├── supabase.ts        # Supabase client configuration
│   └── storage.ts         # Signed URL helpers for private storage
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
- A Supabase project with the Unified Schema installed
- A Resend account (for email)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/educonnect-1/dashboard1.git
cd dashboard1
git checkout teacher-dashboard-production-build-6975c
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
VITE_REGISTRATION_URL=https://your-registration-site.com
```

## Supabase Setup

### 1. Database

The Unified Supabase Schema should already be installed. Do NOT run the legacy migration file against production.

### 2. Create Teacher Account

1. Go to Supabase Dashboard → Authentication
2. Create a new user with the teacher's email
3. In the `profiles` table, ensure the user has `role = 'teacher'`

### 3. Storage Buckets

Create these storage buckets in Supabase Dashboard → Storage:

| Bucket | Public | Description |
|--------|--------|-------------|
| `avatars` | Yes | Profile pictures (public access) |
| `chat-files` | **No** | Chat file attachments (private, signed URLs) |
| `chat-images` | **No** | Chat image attachments (private, signed URLs) |
| `assignment-submissions` | **No** | Student homework submissions (private) |
| `resources` | **No** | Educational resources (private, signed URLs) |

**Storage Policies:**

For `avatars` (public):
- SELECT: Allow all (public)
- INSERT/UPDATE: Allow authenticated users to upload their own avatar

For `chat-files` (private):
- SELECT: Allow authenticated users who are group members
- INSERT: Allow authenticated users

For `assignment-submissions` (private):
- SELECT: Allow teacher and submitting student
- INSERT: Allow authenticated students

For `resources` (private):
- SELECT: Allow authenticated users in target groups
- INSERT/UPDATE/DELETE: Allow teacher only

### 4. Edge Functions

Deploy the invitation email function:

```bash
# Set secrets (server-side only)
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set REGISTRATION_URL=https://your-registration-site.com
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy function
supabase functions deploy send-invitation-email
```

### 5. Row Level Security

RLS must be enabled on all tables. The Unified Schema includes comprehensive RLS policies:

- Teachers can manage all resources
- Students can only access their own data and their groups' data
- Students cannot modify grades, teacher comments, or other students' data
- Invitation tokens are validated server-side
- Storage objects are properly protected

## Security

### Frontend (Client-Side)
- Only `VITE_*` environment variables are exposed
- No service role keys in browser code
- No Resend API keys in browser code
- Private storage uses signed URLs (not public URLs)

### Backend (Server-Side)
- Edge Function validates:
  - Caller is authenticated
  - Caller is the teacher
  - Invitation exists and is pending
  - Invitation has not expired
  - Email matches invitation email
  - Token matches invitation token
- RLS enforces data access at database level
- Invitation tokens are cryptographically strong UUIDs

### Storage Security
- `chat-files` bucket is PRIVATE - uses signed URLs
- `assignment-submissions` bucket is PRIVATE
- `resources` bucket is PRIVATE - uses signed URLs
- `avatars` bucket is PUBLIC (profile pictures need public access)
- Signed URLs expire after 1-2 hours

## Environment Variables

| Variable | Description | Location |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend (.env) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Frontend (.env) |
| `VITE_JITSI_DOMAIN` | Jitsi Meet domain | Frontend (.env) |
| `VITE_REGISTRATION_URL` | Student registration URL | Frontend (.env) |
| `RESEND_API_KEY` | Resend email API key | Edge Function secrets |
| `REGISTRATION_URL` | Registration URL for emails | Edge Function secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Edge Function secrets |

⚠️ **NEVER** put `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

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
- Storage policies are configured correctly
- Edge Functions are deployed with secrets
- `invitation_groups` table exists for normalized invitation-group relationships

## Integration with Student App

This dashboard shares the same Supabase project with:
1. **Student Mobile App** - Students login, view assignments, submit work, chat
2. **Student Registration Website** - Students register via invitation links

All data flows through the shared Supabase backend:
- Teacher creates assignment → Student sees it in app
- Student submits homework → Teacher reviews in dashboard
- Teacher grades → Student sees grade in app

## Production Fixes Applied

### Security Fixes
1. **Private Storage**: Replaced `getPublicUrl()` with signed URLs for `chat-files` and `resources` buckets
2. **Edge Function Security**: Added full authentication and authorization checks
3. **Invitation Validation**: Server-side verification of invitation status, expiry, email match, and token
4. **No Fake URLs**: Removed fallback registration URL - must be configured
5. **Error Handling**: Email failures are now reported to the teacher

### Feature Fixes
1. **Normalized Invitations**: Uses `invitation_groups` table for proper relational data
2. **Numerical Questions**: Added support for numerical exam question type
3. **Group Member Validation**: Verifies student role before adding to group
4. **Duplicate Prevention**: Prevents duplicate group memberships
5. **Invitation Resend**: Resets status to pending if expired

### Architecture
1. **Storage Helper**: Created `src/lib/storage.ts` for signed URL management
2. **Service Layer**: All file operations now store paths and resolve signed URLs on display
3. **Realtime Cleanup**: Proper subscription cleanup to prevent memory leaks

## License

Private - Educational Platform for الأستاذ مروان الجنيدي
