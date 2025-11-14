# Firestore Setup for Stock Holdings

This document explains the manual setup required in Firebase Console to enable stock holdings storage with proper security.

## Overview

Stock holdings are stored in Firestore under the `stockHoldings` collection. Each user's holdings are stored in a document with their user ID as the document ID. This ensures complete data isolation between users.

## Collection Structure

```
stockHoldings/
  └── {userId}/
      ├── holdings: Array<StockHolding>
      └── updatedAt: string (ISO timestamp)
```

### StockHolding Document Structure

```typescript
{
  holdings: [
    {
      id: string,
      symbol: string,
      isSME: boolean,
      exchange: string,
      currentPrice: number,
      previousClose: number,
      openingPrice: number,
      manualPrice: boolean,
      lastFetched: string,
      lastFetchedDate: string,
      status: 'active' | 'sold',
      soldDate: string,
      realizedGainLoss: number,
      purchases: Array<{
        id: string,
        purchaseDate: string,
        purchasePrice: number,
        quantity: number
      }>,
      transactions: Array<{
        id: string,
        date: string,
        type: 'buy' | 'sell',
        price: number,
        quantity: number
      }>
    }
  ],
  updatedAt: string
}
```

## Required Manual Setup in Firebase Console

### Step 1: Update Firestore Security Rules

You need to add security rules for the `stockHoldings` collection to ensure:
1. Only authenticated users can access their data
2. Users can only read/write their own data
3. No user can access another user's stock holdings

#### How to Update Security Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Add the following rule for `stockHoldings` collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing rules for other collections (mortgages, mutualFunds, etc.)
    // ... keep your existing rules ...
    
    // Stock Holdings Collection Rules
    match /stockHoldings/{userId} {
      // Allow read/write only if:
      // 1. User is authenticated
      // 2. The document ID matches the authenticated user's UID
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // If you want to allow users to read their own data only (more restrictive)
    // match /stockHoldings/{userId} {
    //   allow read: if request.auth != null && request.auth.uid == userId;
    //   allow write: if request.auth != null && request.auth.uid == userId;
    // }
  }
}
```

#### Complete Example with All Collections:

If you want to see a complete example with all collections (mortgages, mutualFunds, stockHoldings):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usernames lookup collection
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    
    // Mortgages collection
    match /mortgages/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Mutual Funds collection
    match /mutualFunds/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stock Holdings collection
    match /stockHoldings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 2: Publish the Rules

1. After adding the rules, click **Publish** button
2. Wait for the confirmation message
3. Rules will be active immediately

### Step 3: Verify Rules (Optional but Recommended)

1. Go to **Firestore Database** → **Rules** tab
2. Click **Rules Playground** (if available)
3. Test scenarios:
   - Authenticated user accessing their own data: ✅ Should allow
   - Authenticated user accessing another user's data: ❌ Should deny
   - Unauthenticated user accessing any data: ❌ Should deny

## Security Features

### ✅ Data Isolation
- Each user's stock holdings are stored in a document with their user ID
- Users can only access documents where the document ID matches their UID
- No user can read or write another user's data

### ✅ Authentication Required
- All operations require authentication
- Unauthenticated users cannot access any stock holdings data

### ✅ Real-time Updates
- Uses Firestore's `onSnapshot` for real-time synchronization
- Changes are automatically synced across all user's devices

### ✅ Automatic Saving
- Changes are automatically saved to Firestore after 10 seconds of inactivity
- Prevents excessive writes while allowing real-time updates

## Testing the Setup

### Test 1: Save Stock Holdings
1. Log in to your application
2. Add a stock to your portfolio
3. Wait 10 seconds
4. Check Firebase Console → Firestore Database
5. Verify a document exists in `stockHoldings` collection with your user ID

### Test 2: Load Stock Holdings
1. Log in to your application
2. Navigate to Stock Investments page
3. Verify your previously saved stocks are loaded

### Test 3: Security Test
1. Try to access Firestore directly (if you have access)
2. Attempt to read another user's document
3. Should be denied by security rules

## Troubleshooting

### Error: "Permission denied"
- **Cause**: Security rules not properly configured
- **Solution**: Verify the security rules match the format above and are published

### Error: "User ID is required"
- **Cause**: User is not authenticated
- **Solution**: Ensure user is logged in before accessing stock holdings

### Error: "Firestore is not initialized"
- **Cause**: Firebase configuration is missing
- **Solution**: Check that all Firebase environment variables are set correctly

### Data not saving
- **Cause**: Security rules might be blocking writes
- **Solution**: 
  1. Check browser console for specific error messages
  2. Verify security rules allow writes for authenticated users
  3. Check that the user ID matches the document ID

## Collection Indexes

No composite indexes are required for the stock holdings collection as we only query by document ID (user ID).

## Cost Considerations

- **Reads**: Each time holdings are loaded or updated, 1 read operation
- **Writes**: Each time holdings are saved, 1 write operation
- **Real-time**: Each subscription counts as a read when data changes
- **Estimated cost**: Very low for typical usage (Firestore free tier: 50K reads/day, 20K writes/day)

## Additional Notes

- Stock holdings are automatically saved after 10 seconds of inactivity (debounced)
- Real-time subscriptions ensure data is synced across devices
- All data is stored in Firestore, so it persists even if the user clears browser cache
- The collection is created automatically when the first stock is saved

