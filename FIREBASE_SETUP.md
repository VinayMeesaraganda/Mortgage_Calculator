# Firebase Authentication Setup Guide

This application uses Firebase Authentication and Cloud Firestore for secure user authentication and data storage.

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. Firebase account (free tier is sufficient)

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter a project name (e.g., "Personal Finance App")
4. Follow the setup wizard (disable Google Analytics if not needed)

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get Started**
2. Click on **Sign-in method** tab
3. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

### 3. Set up Cloud Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location closest to your users
5. Click **Enable**

### 4. Configure Firestore Security Rules (Important!)

1. Go to **Firestore Database** > **Rules** tab
2. Update the rules to:

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

### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on the **Web icon** (`</>`)
4. Register your app with a nickname (e.g., "Personal Finance Web")
5. Copy the Firebase configuration object

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Firebase config values:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 7. Install Dependencies

Dependencies are already installed, but if needed:
```bash
npm install
```

### 8. Start the Application

```bash
npm run dev
```

## Authentication Flow

- **Signup**: Users create an account with username and password only
- **Login**: Users login with their username and password
- **Internal Email**: Firebase requires an email, so we generate an internal email (`username@personal-finance.app`) that users never see
- **User Profile**: Username is stored in Firestore and displayed in the app
- **Protected Routes**: All pages except `/login` require authentication

## Security Features

1. **Password Encryption**: Firebase handles password hashing automatically
2. **Secure Authentication**: Uses Firebase Auth with secure tokens
3. **Protected Routes**: All app routes require authentication
4. **Firestore Rules**: Database rules restrict access to user's own data
5. **Username Validation**: Only alphanumeric, underscore, and hyphen characters allowed
6. **Password Requirements**: Minimum 6 characters (Firebase default)

## Troubleshooting

### "Firebase: Error (auth/email-already-in-use)"
- The username is already taken. Choose a different username.

### "Firebase: Error (auth/weak-password)"
- Password must be at least 6 characters long.

### "Firebase: Error (auth/user-not-found)"
- Username or password is incorrect.

### "Firebase: Error (auth/network-request-failed)"
- Check your internet connection and Firebase configuration.

### Build Errors
- Make sure `.env` file exists and contains all required variables
- Restart the development server after updating `.env`

## Production Deployment

Before deploying to production:

1. Update Firestore security rules (see step 4 above)
2. Enable Firebase App Check for additional security
3. Configure authorized domains in Firebase Console
4. Set up custom domain (optional)
5. Review and update security rules for production

## Support

For Firebase-specific issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

