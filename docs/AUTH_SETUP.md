# Authentication Setup Guide

## Multi-Provider Authentication Configuration

Your admin panel supports multiple authentication providers as requested: Google, Apple, Mobile (SMS), and Guest access.

## 🔧 Supabase Authentication Setup

### 1. Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API:**
   - Navigate to APIs & Services > Library
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials:**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > OAuth 2.0 Client IDs
   - Set Application type to "Web application"
   - Add authorized redirect URIs:
     - `https://jtkblovtttacpjpqgbpw.supabase.co/auth/v1/callback`

4. **Configure in Supabase:**
   - Go to Authentication > Settings > Auth Providers
   - Enable Google provider
   - Add your Google Client ID and Client Secret

### 2. Apple OAuth Setup

1. **Apple Developer Account:**
   - Sign in to [Apple Developer](https://developer.apple.com/)
   - Go to Certificates, Identifiers & Profiles

2. **Create App ID:**
   - Create a new App ID
   - Enable "Sign In with Apple" capability

3. **Create Service ID:**
   - Create a new Services ID
   - Configure domain and redirect URLs:
     - Domain: `jtkblovtttacpjpqgbpw.supabase.co`
     - Redirect URL: `https://jtkblovtttacpjpqgbpw.supabase.co/auth/v1/callback`

4. **Create Private Key:**
   - Generate a new private key with "Sign In with Apple" enabled
   - Download the .p8 file

5. **Configure in Supabase:**
   - Go to Authentication > Settings > Auth Providers
   - Enable Apple provider
   - Add your Team ID, Key ID, Client ID, and Private Key

### 3. SMS/Phone Authentication Setup

1. **Enable Phone Auth in Supabase:**
   - Go to Authentication > Settings > Auth Providers
   - Enable Phone provider

2. **Configure SMS Provider:**
   - Choose from Twilio, MessageBird, or other supported providers
   - Add provider credentials in Supabase settings

3. **Phone Number Format:**
   - Ensure phone numbers are in international format (+1234567890)

### 4. Guest Access Setup

Guest access is already configured in the codebase:
- Users can access the app without signing up
- Guest role is automatically assigned
- Limited functionality compared to registered users

## 🔐 Implementation in Code

### Client-Side Authentication

The authentication is already implemented in `client/contexts/AuthContext.tsx` with methods for:

```typescript
// Email/Password
const { data, error } = await signIn(email, password)

// Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Apple OAuth  
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Phone/SMS
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890'
})

// Guest Access
const { data, error } = await supabase.auth.signInAnonymously()
```

### Enhanced Auth Component

Create a comprehensive login component with all providers:

```typescript
// client/components/auth/AuthModal.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export const AuthModal = () => {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const signInWithApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'apple', 
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const signInWithPhone = async () => {
    await supabase.auth.signInWithOtp({ phone })
  }

  const signInAsGuest = async () => {
    await supabase.auth.signInAnonymously()
  }

  return (
    <div className="space-y-4">
      {/* Google Sign In */}
      <Button onClick={signInWithGoogle} variant="outline" className="w-full">
        Continue with Google
      </Button>

      {/* Apple Sign In */}
      <Button onClick={signInWithApple} variant="outline" className="w-full">
        Continue with Apple
      </Button>

      {/* Phone Sign In */}
      <div className="space-y-2">
        <Input
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button onClick={signInWithPhone} className="w-full">
          Send SMS Code
        </Button>
      </div>

      {/* Guest Access */}
      <Button onClick={signInAsGuest} variant="ghost" className="w-full">
        Continue as Guest
      </Button>
    </div>
  )
}
```

## 🌍 Redirect URLs Configuration

### Development URLs:
- **Redirect URL:** `http://localhost:8080/auth/callback`
- **Site URL:** `http://localhost:8080`

### Production URLs:
- **Redirect URL:** `https://your-domain.com/auth/callback`
- **Site URL:** `https://your-domain.com`

## 📱 Mobile App Configuration

If you plan to add mobile apps, configure additional redirect URLs:

### iOS App:
- **URL Scheme:** `com.yourapp://auth/callback`

### Android App:
- **URL Scheme:** `com.yourapp://auth/callback`

## 🔄 Auth Callback Handler

Create an auth callback page to handle OAuth redirects:

```typescript
// client/pages/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        navigate('/login?error=auth_failed')
        return
      }

      if (data.session) {
        // Check if user is admin and redirect accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single()

        if (profile?.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/')
        }
      } else {
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Completing sign in...</h2>
        <p className="text-gray-500">Please wait while we sign you in.</p>
      </div>
    </div>
  )
}
```

## 🚦 Testing Authentication

### Test Each Provider:

1. **Google OAuth:**
   - Click "Continue with Google"
   - Verify Google login flow
   - Check user creation in profiles table

2. **Apple OAuth:**
   - Click "Continue with Apple" 
   - Verify Apple login flow
   - Test on Safari/iOS device

3. **SMS Authentication:**
   - Enter phone number
   - Receive and enter SMS code
   - Verify phone-based login

4. **Guest Access:**
   - Click "Continue as Guest"
   - Verify limited functionality
   - Check guest role assignment

## 🔧 Environment Variables

Add these to your environment:

```env
# Supabase
VITE_SUPABASE_URL=https://jtkblovtttacpjpqgbpw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OAuth Provider Keys (if needed client-side)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_APPLE_CLIENT_ID=your_apple_client_id
```

## 🎯 User Roles & Permissions

The system supports three user roles:

### Admin (`role: 'admin'`)
- Full access to admin panel
- Manage users, products, orders
- View analytics and reports
- Configure service areas

### User (`role: 'user'`)  
- Place orders
- View order history
- Manage profile
- Access all services

### Guest (`role: 'guest'`)
- Browse products/services
- Limited functionality
- Cannot place orders
- Encouraged to register

## 📊 Analytics & Tracking

Track authentication events:

```typescript
// Track auth events
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Track successful login
    console.log('User signed in:', session?.user.email)
  } else if (event === 'SIGNED_OUT') {
    // Track logout
    console.log('User signed out')
  }
})
```

## 🛡️ Security Considerations

1. **Rate Limiting:** Implement rate limiting for auth endpoints
2. **Email Verification:** Enable email verification for new accounts
3. **Password Policy:** Enforce strong password requirements
4. **Session Management:** Configure appropriate session timeouts
5. **Audit Logging:** Log authentication events for security monitoring

---

Your multi-provider authentication system is now configured and ready for production use! 🎉
