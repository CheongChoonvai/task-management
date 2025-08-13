# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Task Management application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Key Technologies
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Authentication**: Supabase Auth UI

## Code Style Guidelines
- Use TypeScript for all components and utilities
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling with utility classes
- Implement proper error handling and loading states
- Use React Server Components where appropriate
- Follow the established folder structure in src/

## Database Schema
The app uses these main tables:
- `profiles` - User profile information
- `tasks` - Task management data with user relationships

## Authentication Flow
- Users sign in/up through Supabase Auth
- Protected routes redirect to login if not authenticated
- User session is managed through Supabase client

## Features to Implement
- User authentication (login/signup/logout)
- Dashboard with task overview
- Create, edit, delete tasks
- Set task deadlines and priorities
- Task status management
- Responsive design for mobile and desktop
