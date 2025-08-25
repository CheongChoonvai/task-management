# Email Template Configuration for Supabase

This document explains how to configure custom email templates in Supabase for your TaskFlow application.

## Setup Instructions

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Access Email Templates**
   - Go to Authentication → Email Templates
   - You'll see templates for: Confirm signup, Reset password, Magic Link, etc.

## Email Templates

### 1. Confirm Signup Email Template

```html
<h2>Welcome to TaskFlow!</h2>
<p>Hi there,</p>
<p>Welcome to TaskFlow - your new task management companion! We're excited to have you on board.</p>
<p>To complete your registration and start organizing your tasks, please click the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirm Your Account</a></p>
<p>Or copy and paste this link into your browser:</p>
<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
<p>This link will expire in 24 hours for security reasons.</p>
<p>If you didn't create an account with TaskFlow, you can safely ignore this email.</p>
<hr>
<p style="color: #6b7280; font-size: 14px;">
  <strong>TaskFlow Team</strong><br>
  Your productivity, simplified.
</p>
```

### 2. Reset Password Email Template

```html
<h2>Reset Your TaskFlow Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password for your TaskFlow account.</p>
<p>If you requested this password reset, click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a></p>
<p>Or copy and paste this link into your browser:</p>
<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
<p>This link will expire in 1 hour for security reasons.</p>
<p><strong>If you didn't request a password reset:</strong></p>
<ul>
  <li>You can safely ignore this email</li>
  <li>Your password will remain unchanged</li>
  <li>Consider enabling two-factor authentication for extra security</li>
</ul>
<hr>
<p style="color: #6b7280; font-size: 14px;">
  <strong>TaskFlow Team</strong><br>
  Your productivity, simplified.
</p>
```

### 3. Magic Link Email Template

```html
<h2>Sign in to TaskFlow</h2>
<p>Hi there,</p>
<p>Click the button below to sign in to your TaskFlow account:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Sign In to TaskFlow</a></p>
<p>Or copy and paste this link into your browser:</p>
<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
<p>This link will expire in 1 hour for security reasons.</p>
<p>If you didn't request this sign-in link, you can safely ignore this email.</p>
<hr>
<p style="color: #6b7280; font-size: 14px;">
  <strong>TaskFlow Team</strong><br>
  Your productivity, simplified.
</p>
```

### 4. Email Change Confirmation Template

```html
<h2>Confirm Your New Email Address</h2>
<p>Hi there,</p>
<p>You recently requested to change your email address for your TaskFlow account.</p>
<p>To confirm your new email address, click the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirm New Email</a></p>
<p>Or copy and paste this link into your browser:</p>
<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
<p>This link will expire in 24 hours for security reasons.</p>
<p>If you didn't request this email change, please contact our support team immediately.</p>
<hr>
<p style="color: #6b7280; font-size: 14px;">
  <strong>TaskFlow Team</strong><br>
  Your productivity, simplified.
</p>
```

## URL Configuration

Make sure to configure the following URLs in your Supabase project:

### Site URL
- **Production**: `https://yourdomain.com`
- **Development**: `http://localhost:3000`

### Redirect URLs
Add these URLs to your allowed redirect URLs list:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/reset-password`
- `https://yourdomain.com/auth/callback`
- `https://yourdomain.com/auth/reset-password`

## Email Settings

1. **SMTP Configuration** (Optional but recommended for production)
   - Go to Settings → Authentication
   - Enable "Custom SMTP"
   - Configure your SMTP provider (SendGrid, AWS SES, etc.)

2. **Email Rate Limiting**
   - Configure appropriate rate limits for your use case
   - Consider your expected user volume

## Testing

1. **Test in Development**
   - Create a test account
   - Try password reset flow
   - Verify email deliverability

2. **Test Email Templates**
   - Send test emails using Supabase dashboard
   - Check formatting across different email clients
   - Verify all links work correctly

## Troubleshooting

### Common Issues:
1. **Emails not being delivered**: Check spam folder, verify SMTP configuration
2. **Links not working**: Verify redirect URLs are correctly configured
3. **Template not updating**: Clear browser cache, check for syntax errors

### Email Variables Available:
- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - The hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Production Checklist

- [ ] Configure custom SMTP provider
- [ ] Set up proper domain authentication (SPF, DKIM)
- [ ] Test all email flows
- [ ] Configure proper rate limiting
- [ ] Set up email monitoring/analytics
- [ ] Configure unsubscribe handling
- [ ] Test email deliverability across major providers

---

For more information, visit the [Supabase Documentation](https://supabase.com/docs/guides/auth/auth-email-templates).
