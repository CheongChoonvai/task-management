# Task Manager App

A modern task management application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **User Authentication** - Secure login/signup with Supabase Auth
- 📊 **Dashboard** - Overview of all tasks with statistics
- ✅ **Task Management** - Create, edit, delete, and update task status
- 🎯 **Priority Levels** - Set task priorities (Low, Medium, High)
- 📅 **Deadlines** - Set and track task deadlines
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Real-time Updates** - Changes sync automatically across sessions

## User Flow

```
Login → Dashboard → Create Task → Add Details → Set Deadline → Save
Task → Back to Dashboard → Edit/Delete → Log out
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd task-menagemnent
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.local.example` to `.env.local`
4. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set up Database

Run the SQL migration in your Supabase SQL editor:

```sql
-- Copy and run the contents of supabase-migration.sql
```

This will create:
- `profiles` table for user information
- `tasks` table for task data
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── callback/      # Auth callback handler
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset confirmation
│   │   └── auth-code-error/ # Auth error handling
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Authentication page
│   ├── tasks/            # Task management pages
│   │   ├── create/       # Create new task
│   │   └── [id]/edit/   # Edit existing task
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── page.tsx          # Home page (redirects)
├── contexts/
│   └── AuthContext.tsx   # Authentication context
├── lib/
│   └── supabase.ts       # Supabase client and types
└── components/           # Reusable components (add as needed)
```

## Authentication Features

### Email Authentication
- **Sign Up**: Create account with email and password
- **Sign In**: Login with existing credentials
- **Password Reset**: Request and confirm password reset via email
- **Email Verification**: Confirm email address for new accounts

### Auth Flow Pages
- `/login` - Main authentication page
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password` - Set new password after reset
- `/auth/callback` - Handle email confirmation links
- `/auth/auth-code-error` - Error handling for invalid links

### Email Templates
Custom email templates are configured in Supabase for:
- Account confirmation
- Password reset
- Magic link authentication
- Email change confirmation

See `EMAIL_TEMPLATES.md` for setup instructions.

## Database Schema

### profiles
- `id` (UUID, Primary Key) - References auth.users
- `email` (Text, Unique) - User email
- `full_name` (Text, Optional) - User's full name
- `avatar_url` (Text, Optional) - Profile picture URL
- `created_at` (Timestamp) - Account creation time

### tasks
- `id` (UUID, Primary Key) - Unique task identifier
- `title` (Text, Required) - Task title
- `description` (Text, Optional) - Task description
- `status` (Enum) - 'todo', 'in_progress', 'completed'
- `priority` (Enum) - 'low', 'medium', 'high'
- `deadline` (Timestamp, Optional) - Task deadline
- `user_id` (UUID, Foreign Key) - References auth.users
- `created_at` (Timestamp) - Task creation time
- `updated_at` (Timestamp) - Last update time

## Key Features Implementation

### Authentication
- Supabase Auth UI for login/signup
- Protected routes with useAuth hook
- Automatic redirect based on auth state

### Task Management
- CRUD operations for tasks
- Real-time updates with Supabase
- Form validation with React Hook Form and Zod
- Status transitions (Todo → In Progress → Completed)

### Dashboard
- Task statistics and overview
- Quick status updates
- Task filtering and organization

## Customization

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/app/`
3. Update database schema in Supabase
4. Add new types to `src/lib/supabase.ts`

### Styling
- Modify Tailwind classes for design changes
- Add custom CSS in `src/app/globals.css`
- Use Tailwind config for theme customization

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Build with `npm run build`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
