# Key Requirements for Task Manager App

## 1. Role-based Access
- Add a `role` field to the `profiles` table in Supabase (e.g., 'admin', 'user').
- Fetch and store the user's role in frontend context after login.
- Use conditional rendering and route guards to restrict access based on role.
- Enforce role-based permissions with Supabase Row Level Security (RLS) policies.

## 2. Drag & Drop
- Use a drag-and-drop library such as `@dnd-kit/core` or `react-beautiful-dnd`.
- Wrap the task list in a drag-and-drop context and make each task draggable.
- On drop, update the task order or status in the database and update the UI.

## 3. Calendar View
- Integrate a calendar component like `react-calendar` or `fullcalendar-react`.
- Map tasks with deadlines to calendar events.
- Allow users to view, create, or drag tasks on the calendar to change deadlines.

## 4. Real-time Sync (via Pusher or Supabase)
- For Pusher: Sign up, install `pusher-js`, and trigger events on backend changes.
- Subscribe to Pusher channels on the frontend to update the UI in real time.
- Alternatively, use Supabase's built-in real-time subscriptions for syncing task changes.
