# Troubleshooting Firestore Save Errors

If you're seeing "Failed to save portfolio" errors, follow these steps to diagnose and fix the issue.

## Common Causes

### 1. Firestore Security Rules Not Configured

**Symptom**: Error message mentions "Permission denied" or "security rules"

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **personal-fianance-5b5ea**
3. Navigate to **Firestore Database** > **Rules** tab
4. Make sure you have the following rule for the `mutualFunds` collection:

```javascript
match /mutualFunds/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

5. Click **Publish** to save the rules
6. Wait a few seconds for the rules to propagate
7. Try saving your portfolio again

### 2. Firestore Database Not Created

**Symptom**: Error message mentions "unavailable" or connection issues

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **personal-fianance-5b5ea**
3. Navigate to **Firestore Database**
4. If you see "Create database", click it and:
   - Choose **Start in test mode** (for development)
   - Select a location closest to your users
   - Click **Enable**
5. Wait for the database to be created
6. Try saving your portfolio again

### 3. User Not Authenticated

**Symptom**: Error message mentions "unauthenticated" or "must be logged in"

**Solution**:
1. Make sure you're logged in to the application
2. Check the browser console for authentication errors
3. Try logging out and logging back in
4. Verify your user account exists in Firebase Authentication

### 4. Network/Connection Issues

**Symptom**: Error message mentions "unavailable" or timeout

**Solution**:
1. Check your internet connection
2. Check if Firebase services are up: [Firebase Status](https://status.firebase.google.com/)
3. Try refreshing the page
4. Check browser console for network errors

### 5. Data Structure Issues

**Symptom**: Error occurs when saving specific data

**Solution**:
1. Check the browser console for detailed error messages
2. Verify that all holdings have required fields:
   - `id`, `schemeCode`, `schemeName`, `currentNAV`
   - `purchases` array with `id`, `purchaseDate`, `purchasePrice`, `quantity`, `investmentAmount`
3. Make sure all numeric fields are numbers (not strings)
4. Make sure `purchaseDate` is in YYYY-MM format

## Debugging Steps

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Look for error messages when you try to save
4. Check for messages like:
   - "Error saving mutual fund holdings"
   - "Permission denied"
   - "Firestore is unavailable"

### Step 2: Check Firestore Rules

1. Go to Firebase Console > Firestore Database > Rules
2. Verify the rules include the `mutualFunds` collection
3. Make sure the rule allows writes for authenticated users
4. Click **Publish** if you made any changes

### Step 3: Check Firestore Database

1. Go to Firebase Console > Firestore Database > Data
2. Check if the `mutualFunds` collection exists
3. Verify your user ID appears in the collection (after a successful save)
4. Check if there are any documents with your user ID

### Step 4: Check Authentication

1. In the app, verify you're logged in (check the header for your username)
2. Check Firebase Console > Authentication > Users
3. Verify your user account exists
4. Note your user UID (you'll need it to check Firestore data)

### Step 5: Test with Browser Console

Open the browser console and run:

```javascript
// Check if Firebase is initialized
console.log('Firebase Auth:', firebase.auth().currentUser);

// Check Firestore connection
import { db } from './src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Test read access
const testDoc = doc(db, 'mutualFunds', 'test-user-id');
getDoc(testDoc).then(doc => {
  console.log('Firestore connection test:', doc.exists() ? 'Connected' : 'Document does not exist');
}).catch(error => {
  console.error('Firestore connection error:', error);
});
```

## Quick Fix Checklist

- [ ] Firestore Database is created
- [ ] Firestore Security Rules are published with `mutualFunds` collection rules
- [ ] User is authenticated (logged in)
- [ ] Internet connection is stable
- [ ] Browser console shows no errors
- [ ] Firebase project is active (not paused)
- [ ] User has write permissions (check security rules)

## Still Having Issues?

1. **Check Firebase Console Logs**:
   - Go to Firebase Console > Firestore Database > Usage
   - Check for any quota or billing issues

2. **Verify Firebase Configuration**:
   - Check that your Firebase config in `src/config/firebase.ts` is correct
   - Verify the project ID matches your Firebase project

3. **Test with a Simple Save**:
   - Try saving an empty portfolio first
   - Then try saving with one fund
   - This helps isolate if it's a data structure issue

4. **Check Browser Compatibility**:
   - Make sure you're using a modern browser
   - Try in an incognito/private window to rule out extension issues

5. **Contact Support**:
   - Check [Firebase Support](https://firebase.google.com/support)
   - Review [Firestore Documentation](https://firebase.google.com/docs/firestore)

## Expected Behavior

When everything is working correctly:
1. You add a mutual fund to your portfolio
2. After 1 second, you see "Saving..." status
3. Status changes to "Synced" (green cloud icon)
4. Data appears in Firestore Database
5. Portfolio persists after page refresh
6. Changes sync across devices/tabs in real-time

## Security Rules Template

Here's the complete security rules template:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usernames collection
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Mutual Funds collection - CRITICAL for portfolio saving
    match /mutualFunds/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Make sure to **Publish** these rules after updating them!

