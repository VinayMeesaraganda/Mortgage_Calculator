# Vercel Environment Variables Setup - Step by Step

Since login works on localhost but not on Vercel, the environment variables are not set correctly in Vercel.

## Quick Fix Steps

### Step 1: Access Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project (Mortgage Calculator or your project name)
3. Click on **Settings** (gear icon in top navigation)
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Each Environment Variable

You need to add **7 environment variables**. For each one:

1. Click **Add New** button
2. Enter the **Key** (exact name from below)
3. Enter the **Value** (exact value from below)
4. **IMPORTANT**: Check all three environments:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click **Save**

### Step 3: Add These Variables (Copy Exactly)

**Variable 1:**
- Key: `VITE_FIREBASE_API_KEY`
- Value: `AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc`
- Environments: Production, Preview, Development

**Variable 2:**
- Key: `VITE_FIREBASE_AUTH_DOMAIN`
- Value: `personal-fianance-5b5ea.firebaseapp.com`
- Environments: Production, Preview, Development

**Variable 3:**
- Key: `VITE_FIREBASE_PROJECT_ID`
- Value: `personal-fianance-5b5ea`
- Environments: Production, Preview, Development

**Variable 4:**
- Key: `VITE_FIREBASE_STORAGE_BUCKET`
- Value: `personal-fianance-5b5ea.firebasestorage.app`
- Environments: Production, Preview, Development

**Variable 5:**
- Key: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- Value: `432970825901`
- Environments: Production, Preview, Development

**Variable 6:**
- Key: `VITE_FIREBASE_APP_ID`
- Value: `1:432970825901:web:8159ad2b3b9b6f3cb3c624`
- Environments: Production, Preview, Development

**Variable 7:**
- Key: `VITE_FIREBASE_MEASUREMENT_ID`
- Value: `G-Q8LPB2G3HY`
- Environments: Production, Preview, Development

### Step 4: Verify All Variables Are Added

After adding all 7 variables, you should see them listed. Verify:
- ✅ All 7 variables are present
- ✅ Each variable has all 3 environments checked
- ✅ Variable names are exactly as shown (case-sensitive)
- ✅ No extra spaces in variable names or values

### Step 5: Redeploy

**CRITICAL**: After adding environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **three dots** (⋯) menu
4. Click **Redeploy**
5. Wait for deployment to complete

**OR** push a new commit to trigger automatic redeployment.

### Step 6: Verify It Works

1. After redeployment completes, visit your Vercel URL
2. Open browser console (F12)
3. Look for "Firebase Config Status" log message
4. Check that `apiKeyValid: true` and `hasApiKey: true`
5. Try logging in

## Common Mistakes to Avoid

### ❌ Wrong Variable Name
- Wrong: `FIREBASE_API_KEY` (missing `VITE_` prefix)
- Correct: `VITE_FIREBASE_API_KEY`

### ❌ Missing Environment Selection
- Must check all 3: Production, Preview, Development
- If only Production is checked, preview deployments won't work

### ❌ Extra Spaces
- Wrong: `VITE_FIREBASE_API_KEY = AIza...` (spaces around =)
- Correct: `VITE_FIREBASE_API_KEY=AIza...` (no spaces)

### ❌ Quotes Around Values
- Wrong: Value = `"AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc"` (with quotes)
- Correct: Value = `AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc` (no quotes)

### ❌ Not Redeploying
- Environment variables only take effect after redeployment
- Just adding them isn't enough - must redeploy

## Verification Checklist

Before redeploying, verify:
- [ ] All 7 variables are added
- [ ] Variable names match exactly (case-sensitive)
- [ ] Values match exactly (no typos)
- [ ] All 3 environments are selected for each variable
- [ ] No extra spaces or quotes
- [ ] Ready to redeploy

## After Redeployment

Check browser console for:
```
Firebase Config Status: {
  apiKey: "AIzaSyA8y...",
  apiKeyValid: true,
  hasApiKey: true,
  ...
}
```

If you see `apiKeyValid: false` or `hasApiKey: false`, the environment variables are still not loading correctly.

## Still Not Working?

1. **Double-check variable names** - Must start with `VITE_`
2. **Verify values** - Copy directly from `.env.local` file
3. **Check deployment logs** - Look for environment variable errors
4. **Try deleting and re-adding** variables in Vercel
5. **Clear browser cache** and try again

## Quick Copy-Paste for Vercel

If you want to verify your values match, here they are:

```
VITE_FIREBASE_API_KEY=AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc
VITE_FIREBASE_AUTH_DOMAIN=personal-fianance-5b5ea.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=personal-fianance-5b5ea
VITE_FIREBASE_STORAGE_BUCKET=personal-fianance-5b5ea.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=432970825901
VITE_FIREBASE_APP_ID=1:432970825901:web:8159ad2b3b9b6f3cb3c624
VITE_FIREBASE_MEASUREMENT_ID=G-Q8LPB2G3HY
```

Copy each line and split at the `=` sign:
- Left side = Variable Name (Key)
- Right side = Variable Value

