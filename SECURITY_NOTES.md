# Security Notes - Authentication & Firebase

## ✅ What's Secure

### 1. **Passwords**
- ✅ Passwords are **NEVER stored** in plain text
- ✅ Firebase Authentication handles password hashing automatically
- ✅ Passwords are **NEVER exposed** in the code or API calls
- ✅ Password transmission is encrypted (HTTPS)

### 2. **User Data**
- ✅ User data is protected by Firestore Security Rules
- ✅ Users can only access their own data (UID-based isolation)
- ✅ Database queries require authentication
- ✅ No user data is exposed in client-side code

### 3. **Authentication Tokens**
- ✅ Firebase handles authentication tokens securely
- ✅ Tokens are stored in browser (not in code)
- ✅ Tokens expire and refresh automatically
- ✅ Tokens are validated server-side by Firebase

### 4. **Environment Variables**
- ✅ `.env` files are in `.gitignore` (not committed)
- ✅ Sensitive data should be in environment variables
- ✅ Production secrets should be in hosting platform (Vercel/Netlify)

## ⚠️ What's Public (By Design)

### Firebase API Keys
Firebase API keys are **intended to be public** and are safe to expose in client-side code because:

1. **They're Public Keys**: Firebase API keys identify your project, not authorize access
2. **Security Through Rules**: Access is controlled by Firestore Security Rules (not API keys)
3. **Client-Side Requirement**: Client-side apps need these keys to connect to Firebase
4. **Domain Restrictions**: You can restrict API keys to specific domains in Firebase Console

**Current Status**: 
- API keys are hardcoded as fallback values in `src/config/firebase.ts`
- They are also committed to Git (this is acceptable for Firebase API keys)
- For better practice, they should be in environment variables

### What API Keys Cannot Do
- ❌ Cannot access your Firebase project without proper authentication
- ❌ Cannot read/write data without passing Firestore Security Rules
- ❌ Cannot impersonate users (requires user credentials)
- ❌ Cannot access Firebase Admin SDK functions

## 🔒 Security Layers

### Layer 1: Firestore Security Rules
```javascript
// Users can only access their own data
match /mutualFunds/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```
- ✅ Enforced server-side by Firebase
- ✅ Cannot be bypassed by client-side code
- ✅ Validates user authentication

### Layer 2: Authentication
- ✅ Users must be authenticated to access protected routes
- ✅ Authentication tokens are validated by Firebase
- ✅ Invalid tokens are rejected

### Layer 3: Client-Side Protection
- ✅ Protected routes require authentication
- ✅ Unauthenticated users are redirected to login
- ✅ User data is never exposed in client-side code

## 📋 Recommendations

### 1. Move API Keys to Environment Variables (Best Practice)
While Firebase API keys are safe to expose, it's better practice to use environment variables:

**Current (in code):**
```typescript
apiKey: import.meta.env.VITE_FIREBASE_API_KEY
```

**Better (environment only):**
```typescript
apiKey: import.meta.env.VITE_FIREBASE_API_KEY
```
Then require environment variables to be set (fail if missing).

### 2. Enable API Key Restrictions (Firebase Console)
1. Go to Firebase Console > Project Settings > Your apps
2. Click on your web app
3. Under "API Key restrictions", add domain restrictions
4. Restrict to your production domain only

### 3. Monitor Firebase Usage
- Set up billing alerts in Firebase Console
- Monitor authentication attempts
- Review Firestore access logs
- Set up abuse detection

### 4. Use Firebase App Check (Production)
- Enable Firebase App Check for additional security
- Helps prevent abuse and unauthorized access
- Requires additional setup but adds security layer

## 🚨 What to Never Expose

### ❌ Never Expose:
- Firebase Admin SDK private keys
- Service account JSON files
- Database connection strings with passwords
- Any server-side secrets
- User passwords (handled by Firebase)
- Authentication tokens (handled by Firebase)

### ✅ Safe to Expose:
- Firebase API keys (client-side)
- Project ID (public identifier)
- App ID (public identifier)
- Measurement ID (analytics)

## 🔍 Security Checklist

- [x] Passwords are hashed (Firebase handles this)
- [x] User data is protected by security rules
- [x] Protected routes require authentication
- [x] Environment variables are in `.gitignore`
- [x] Firestore security rules are configured
- [ ] API keys are in environment variables (recommended)
- [ ] API key restrictions are enabled (recommended)
- [ ] Firebase App Check is enabled (recommended for production)
- [ ] Billing alerts are set up (recommended)

## 📚 Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Security](https://firebase.google.com/docs/auth/security-best-practices)
- [Firebase API Key Security](https://firebase.google.com/docs/projects/api-keys)
- [Firebase App Check](https://firebase.google.com/docs/app-check)

## Summary

**Your authentication is secure because:**
1. ✅ Passwords are never stored or exposed (Firebase handles this)
2. ✅ User data is protected by Firestore Security Rules
3. ✅ Authentication is handled by Firebase (secure tokens)
4. ✅ Protected routes require authentication
5. ✅ API keys are public by design (security through rules, not keys)

**Recommended improvements:**
1. Move API keys to environment variables only (remove hardcoded fallbacks)
2. Enable API key restrictions in Firebase Console
3. Enable Firebase App Check for production
4. Set up monitoring and billing alerts

