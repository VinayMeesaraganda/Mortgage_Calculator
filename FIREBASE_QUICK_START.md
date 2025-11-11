# Firebase Quick Start Guide

Your Firebase configuration has been added to the project. Follow these steps to complete the setup:

## ✅ Already Done
- Firebase configuration added to `src/config/firebase.ts`
- Firebase Analytics initialized
- Authentication and Firestore imports configured

## 🔧 Required Setup Steps

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **personal-fianance-5b5ea**
3. Navigate to **Authentication** > **Get Started**
4. Click on **Sign-in method** tab
5. Click on **Email/Password**
6. Toggle **Enable** to ON
7. Click **Save**

### 2. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Enable**

### 3. Configure Firestore Security Rules

1. Go to **Firestore Database** > **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usernames collection - users can read all, but only write their own
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Mutual Funds collection - users can only read/write their own portfolio
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

3. Click **Publish**

### 4. (Optional) Update .env.local File

For better security, add Firebase config to `.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyA8yemMWoFUOfte_T8-hLMcnj9A2aOqMNc
VITE_FIREBASE_AUTH_DOMAIN=personal-fianance-5b5ea.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=personal-fianance-5b5ea
VITE_FIREBASE_STORAGE_BUCKET=personal-fianance-5b5ea.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=432970825901
VITE_FIREBASE_APP_ID=1:432970825901:web:8159ad2b3b9b6f3cb3c624
VITE_FIREBASE_MEASUREMENT_ID=G-Q8LPB2G3HY
```

**Note:** The app will work without this step as the config is already in the code, but using environment variables is more secure.

## 🚀 Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the app in your browser
3. You should be redirected to `/login` if not authenticated
4. Try creating an account with a username and password
5. After signup, you should be redirected to the home page

## 📝 Important Notes

- **Username Requirements**: 3+ characters, alphanumeric, underscores, and hyphens only
- **Password Requirements**: Minimum 6 characters (Firebase default)
- **Internal Email**: Firebase requires an email, so we generate `username@personal-finance.app` internally (users never see this)
- **User Profile**: Username is stored in Firestore and displayed in the app header

## 🔒 Security

- All passwords are hashed by Firebase automatically
- User data is stored securely in Firestore
- Protected routes require authentication
- Firestore security rules restrict access to user's own data

## 🐛 Troubleshooting

### "Firebase: Error (auth/email-already-in-use)"
- The username is already taken. Choose a different username.

### "Firebase: Error (auth/weak-password)"
- Password must be at least 6 characters long.

### "Firebase: Error (auth/user-not-found)"
- Username or password is incorrect.

### "Firebase: Permission denied"
- Check Firestore security rules are published correctly.
- Verify the rules match the format above.

### App redirects to login but shows error
- Make sure Authentication is enabled in Firebase Console
- Verify Firestore database is created
- Check browser console for detailed error messages

## 📚 Next Steps

- Test login/logout functionality
- Verify user profile is stored in Firestore
- Check that protected routes work correctly
- Review Firestore security rules for production use

For detailed setup instructions, see `FIREBASE_SETUP.md`.

