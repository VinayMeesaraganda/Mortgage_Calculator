# Fixing 404 NOT_FOUND Error on Vercel

## Problem
Getting `404: NOT_FOUND` error when accessing routes on Vercel (but works on localhost).

## Cause
Vercel needs special routing configuration for Single Page Applications (SPA) using React Router. Without it, direct URL access or page refreshes result in 404 errors.

## Solution Applied

Updated `vercel.json` to include rewrite rules that redirect all routes to `index.html`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## What This Does

- **Rewrites all routes** to `/index.html`
- Allows React Router to handle client-side routing
- Fixes 404 errors on direct URL access
- Fixes 404 errors on page refresh

## Next Steps

1. **Push the updated `vercel.json` to Git**
2. **Vercel will automatically redeploy**
3. **Test your routes** - they should work now

## Testing

After redeployment, test:
- ✅ `/` - Home page
- ✅ `/login` - Login page
- ✅ `/mortgage-calculator` - Mortgage calculator
- ✅ `/mutual-funds` - Mutual funds tracker
- ✅ `/stock-investments` - Stock investments
- ✅ Refresh any page - should not show 404

## Alternative: Vercel Dashboard Configuration

If the `vercel.json` doesn't work, you can also configure this in Vercel Dashboard:

1. Go to **Settings** → **Functions**
2. Add a rewrite rule:
   - Source: `/(.*)`
   - Destination: `/index.html`

But the `vercel.json` approach is preferred as it's version-controlled.

## Still Getting 404?

1. **Verify `vercel.json` is committed** to your repository
2. **Check Vercel build logs** - ensure the file is being read
3. **Redeploy manually** after pushing the changes
4. **Clear browser cache** and try again
5. **Check Vercel project settings** - ensure framework is set to Vite

## Additional Notes

- The rewrite rule `/(.*)` matches all paths
- This is standard for SPAs using client-side routing
- Works with React Router, Vue Router, and other SPA frameworks
- Doesn't affect API routes or static assets

