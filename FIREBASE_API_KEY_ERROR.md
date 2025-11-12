# Fixing "Firebase: Error (auth/api-key-not-valid)"

This error means Firebase is receiving an invalid or empty API key. Here's how to fix it:

## Quick Fixes

### 1. **Check Environment Variables in Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify all 7 variables are set:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

5. **Check for typos** - Copy the exact values from your `.env.local` file
6. **Redeploy** - After adding/updating variables, redeploy your app

### 2. **Verify API Key Format**

The API key should:
- Start with `AIza`
- Be 39 characters long
- Have no spaces or extra characters

**Correct format:** `AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc`

### 3. **Check Browser Console**

Open browser console (F12) and look for:
- Error messages about missing environment variables
- Debug logs showing which env vars are loaded
- Any Firebase initialization errors

### 4. **For Local Development**

1. **Verify `.env.local` exists** in project root
2. **Check file contents:**
   ```bash
   cat .env.local
   ```
3. **Restart dev server** after creating/updating `.env.local`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### 5. **Common Issues**

#### Issue: Environment variables not loading in Vercel
**Solution:**
- Make sure variable names start with `VITE_`
- Check that variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

#### Issue: API key has extra spaces
**Solution:**
- Remove any leading/trailing spaces
- Don't wrap values in quotes in Vercel
- Copy-paste directly from Firebase Console

#### Issue: Wrong API key
**Solution:**
- Get the correct API key from Firebase Console:
  1. Go to Firebase Console
  2. Project Settings → General
  3. Scroll to "Your apps"
  4. Click on your web app
  5. Copy the `apiKey` value

### 6. **Verify Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **personal-fianance-5b5ea**
3. Go to **Project Settings** → **General**
4. Verify the API key matches what you set in Vercel
5. Check if the project is active (not paused)

### 7. **Test Environment Variables**

Add this temporary code to check if env vars are loaded:

```typescript
console.log('API Key loaded:', !!import.meta.env.VITE_FIREBASE_API_KEY);
console.log('API Key length:', import.meta.env.VITE_FIREBASE_API_KEY?.length);
console.log('API Key starts with AIza:', import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('AIza'));
```

## Step-by-Step Fix

1. **Get correct API key from Firebase Console**
2. **Update Vercel environment variables** (copy exact values)
3. **Redeploy** the application
4. **Check browser console** for any errors
5. **Test login** again

## Still Not Working?

1. **Double-check API key** in Firebase Console matches Vercel
2. **Check Vercel build logs** for environment variable errors
3. **Verify project ID** matches in both places
4. **Try regenerating API key** in Firebase Console (if needed)
5. **Check Firebase project status** (not paused/disabled)

## Expected Values

For your project, the values should be:
- API Key: Starts with `AIzaSyA8yem...`
- Project ID: `personal-fianance-5b5ea`
- Auth Domain: `personal-fianance-5b5ea.firebaseapp.com`

Make sure these match exactly in Vercel environment variables.

