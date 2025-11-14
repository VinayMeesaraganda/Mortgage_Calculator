# Stock Holdings Firestore Troubleshooting Guide

If stock data is not being saved to Firebase, follow these steps to diagnose and fix the issue.

## Quick Checks

### 1. Check if you're logged in
- The Stock Investments page requires authentication
- If you're not logged in, you'll be redirected to the home page
- **Solution**: Log in first, then navigate to Stock Investments

### 2. Check Browser Console
Open your browser's Developer Console (F12 or Right-click → Inspect → Console) and look for:
- ✅ Success messages: "Saving stock holdings to Firestore..." followed by "Stock holdings saved successfully"
- ❌ Error messages: Any red error messages will tell you what's wrong

### 3. Check Firestore Security Rules
The most common issue is incorrect Firestore security rules.

**Verify your rules include:**
```javascript
match /stockHoldings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**To check:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Verify the `stockHoldings` rule exists and is published

## Debugging Steps

### Step 1: Check User Authentication
Open browser console and run:
```javascript
// Check if user is logged in
console.log('Current user:', firebase.auth().currentUser);
```

If `null`, you need to log in first.

### Step 2: Test Manual Save
1. Add a stock to your portfolio
2. Click the **"Save"** button in the header (green button with checkmark)
3. Check the console for:
   - "Manual save triggered" message
   - Any error messages
   - "Stock holdings saved successfully" message

### Step 3: Check Firestore Console
1. Go to Firebase Console → Firestore Database → Data
2. Look for a collection named `stockHoldings`
3. Check if a document exists with your user ID
4. If the document exists, click on it to see the data structure

### Step 4: Check Network Tab
1. Open Developer Tools → Network tab
2. Add a stock and click Save
3. Look for requests to `firestore.googleapis.com`
4. Check the response:
   - **200 OK**: Success (data should be saved)
   - **403 Forbidden**: Permission denied (check security rules)
   - **401 Unauthorized**: Not authenticated (log in again)

## Common Issues and Solutions

### Issue 1: "Permission denied" Error
**Cause**: Firestore security rules are blocking the save
**Solution**: 
1. Verify security rules are published (see above)
2. Make sure the rule is BEFORE the deny-all rule
3. Check that `request.auth.uid == userId` condition is correct

### Issue 2: "User ID is required" Error
**Cause**: User is not authenticated
**Solution**: 
1. Log out and log back in
2. Check that you're on the Stock Investments page (protected route)

### Issue 3: Data saves but doesn't persist
**Cause**: Security rules might allow write but not read, or vice versa
**Solution**: 
1. Check that both `read` and `write` are allowed in security rules
2. Verify the rule uses `allow read, write:` (both permissions)

### Issue 4: No error but data not appearing in Firestore
**Cause**: 
- Save is debounced (waits 10 seconds)
- Save might have failed silently

**Solution**:
1. Wait 10 seconds after making changes
2. Click the "Save" button to force immediate save
3. Check console for any errors

### Issue 5: Data appears in console but not in Firestore
**Cause**: Security rules might be blocking writes
**Solution**:
1. Check Firebase Console → Firestore → Rules
2. Test rules using Rules Playground
3. Verify user ID matches document ID

## Testing the Setup

### Test 1: Add a Stock
1. Log in to your application
2. Go to Stock Investments page
3. Add a stock (e.g., "RELIANCE")
4. Wait 10 seconds OR click "Save" button
5. Check Firebase Console → Firestore → `stockHoldings` collection
6. Verify a document exists with your user ID

### Test 2: Verify Data Structure
The document should have this structure:
```json
{
  "holdings": [
    {
      "id": "...",
      "symbol": "RELIANCE",
      "currentPrice": 2500,
      "transactions": [...],
      "purchases": [...]
    }
  ],
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### Test 3: Reload Page
1. Add a stock and save it
2. Refresh the page
3. The stock should still be there (loaded from Firestore)

## Console Logging

The code now includes detailed console logging. When you:
- **Add a stock**: Check console for "Saving stock holdings to Firestore..."
- **Load page**: Check console for "Loading stock holdings from Firestore..."
- **Save manually**: Check console for "Manual save triggered"

All errors are also logged to the console with detailed information.

## Manual Verification

### Check Firestore Directly
1. Go to Firebase Console
2. Navigate to Firestore Database → Data
3. Look for `stockHoldings` collection
4. Find document with your user ID (from `currentUser.uid`)
5. Verify the data structure matches expected format

### Check Security Rules
1. Go to Firestore Database → Rules
2. Verify `stockHoldings` rule exists
3. Test using Rules Playground:
   - Authenticated: ✅ Should allow
   - Unauthenticated: ❌ Should deny
   - Wrong user ID: ❌ Should deny

## Still Not Working?

If none of the above solutions work:

1. **Check browser console** for specific error messages
2. **Check Firebase Console** → Firestore → Usage tab for any errors
3. **Verify environment variables** are set correctly
4. **Check network connectivity** - Firestore requires internet connection
5. **Try in incognito mode** to rule out browser extension issues

## Expected Behavior

✅ **Working correctly:**
- When you add a stock, it saves automatically after 10 seconds
- "Saving..." indicator appears in header
- Console shows "Stock holdings saved successfully"
- Data appears in Firestore Console
- When you reload the page, stocks are still there

❌ **Not working:**
- No "Saving..." indicator
- Console shows errors
- Data doesn't appear in Firestore
- Stocks disappear after page reload

