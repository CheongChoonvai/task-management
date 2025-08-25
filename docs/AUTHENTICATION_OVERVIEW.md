# Authentication System Overview

## Password Management Features

### 1. **Forgot Password** (`/auth/forgot-password`)
- **When to use**: User doesn't remember their current password
- **Process**: 
  1. User enters their email address
  2. System sends reset email via Supabase
  3. User clicks link in email
  4. Redirected to reset password page with temporary session
- **Access**: Available from login page ("Forgot your password?" link)
- **Status**: ✅ Implemented

### 2. **Reset Password** (`/auth/reset-password`) 
- **When to use**: User arrives from forgot password email link
- **Process**:
  1. User has temporary session from email link
  2. User enters new password
  3. Password is updated without requiring old password
- **Access**: Only accessible via email link (has session validation)
- **Status**: ✅ Implemented

### 3. **Change Password** (`/auth/change-password`) 
- **When to use**: Logged-in user wants to update their password
- **Process**:
  1. User must enter current password
  2. User enters new password
  3. System verifies current password before updating
- **Access**: Dashboard → User Menu → "Change Password"
- **Status**: ✅ Implemented

## Navigation Flow

```
Login Page
├── "Forgot your password?" → /auth/forgot-password
│   └── Email sent → /auth/reset-password (via email link)
└── Login successful → Dashboard
    └── User Menu → "Change Password" → /auth/change-password
```

## Security Features

### Password Requirements (Change Password & Reset Password)
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

### Authentication Flow
- **Forgot Password**: Email verification + temporary session
- **Reset Password**: Session validation (from email link)
- **Change Password**: Current password verification + user authentication

## File Structure

```
src/app/auth/
├── forgot-password/page.tsx    # Request password reset via email
├── reset-password/page.tsx     # Reset password with email link
├── change-password/page.tsx    # Change password when logged in
├── callback/route.ts           # Handle auth callbacks
└── auth-code-error/page.tsx    # Handle auth errors
```

## User Experience

### From Login Page
- Clear "Forgot your password?" link
- Removes confusion between forgot/reset terminology

### From Dashboard  
- User menu with avatar
- Easy access to "Change Password" 
- Clean dropdown interface

### Error Handling
- Invalid current password detection
- Password mismatch validation
- Session expiration handling
- Clear error messages with icons

## Email Templates
- Custom HTML templates for all auth flows
- Consistent branding with TaskFlow design
- Professional styling and responsive design
- See `EMAIL_TEMPLATES.md` for configuration details
