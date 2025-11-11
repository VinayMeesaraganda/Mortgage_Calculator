# Mutual Funds Portfolio - Firestore Integration

This document describes how mutual fund portfolio data is stored and synchronized with Firestore.

## Data Structure

### Collection: `mutualFunds`

Each user has a single document in the `mutualFunds` collection, with the document ID being the user's UID.

```typescript
{
  holdings: MutualFundHolding[];
  updatedAt: string; // ISO timestamp
}
```

### MutualFundHolding Structure

```typescript
{
  id: string;
  schemeCode: string; // MFapi.in scheme code
  schemeName: string;
  category: 'flexi-cap'; // Default category
  currentNAV: number; // Latest NAV for current value calculation
  purchases: MutualFundPurchase[];
}
```

### MutualFundPurchase Structure

```typescript
{
  id: string;
  purchaseDate: string; // YYYY-MM format
  purchasePrice: number; // NAV at purchase date
  quantity: number; // Number of units
  investmentAmount: number; // Total amount invested
}
```

## Features

### 1. Automatic Synchronization
- Portfolio data is automatically saved to Firestore whenever holdings change
- Changes are debounced by 1 second to reduce write operations
- Real-time updates are enabled via Firestore `onSnapshot`

### 2. User-Specific Data
- Each user can only access their own portfolio
- Firestore security rules enforce user data isolation
- Data is stored per user UID

### 3. Loading States
- Shows loading indicator while fetching portfolio from Firestore
- Displays sync status (Synced, Saving, Not synced)
- Error messages for failed save/load operations

### 4. Real-Time Updates
- Portfolio automatically updates when changed from another device
- Uses Firestore real-time listeners for instant synchronization
- Prevents overwriting local changes during initial load

## Security Rules

The Firestore security rules for the `mutualFunds` collection:

```javascript
match /mutualFunds/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

This ensures:
- Users must be authenticated to access the collection
- Users can only read/write their own portfolio (matching UID)
- Other users' data is completely inaccessible

## Usage

### Loading Portfolio

```typescript
import { loadMutualFundHoldings } from '../services/mutualFundService';

const holdings = await loadMutualFundHoldings(userId);
```

### Saving Portfolio

```typescript
import { saveMutualFundHoldings } from '../services/mutualFundService';

await saveMutualFundHoldings(userId, holdings);
```

### Real-Time Subscription

```typescript
import { subscribeToMutualFundHoldings } from '../services/mutualFundService';

const unsubscribe = subscribeToMutualFundHoldings(userId, (holdings) => {
  // Handle updated holdings
});

// Cleanup
unsubscribe();
```

## Component Integration

The `MutualFunds` component automatically:
1. Loads portfolio from Firestore on mount
2. Saves changes to Firestore whenever holdings are modified
3. Subscribes to real-time updates
4. Displays sync status and error messages

## Error Handling

- Network errors are caught and displayed to the user
- Failed saves show an error message but don't block the UI
- Local changes are preserved even if Firestore save fails
- Retry mechanism can be added for failed operations

## Future Enhancements

- Add conflict resolution for simultaneous edits
- Implement offline support with local storage fallback
- Add version history for portfolio changes
- Support for portfolio sharing (read-only access)
- Export portfolio data to CSV/PDF

## Testing

To test the Firestore integration:

1. **Create an account** and log in
2. **Add mutual funds** to your portfolio
3. **Check Firestore Console** to verify data is saved
4. **Refresh the page** to verify data loads correctly
5. **Open in another browser/device** to test real-time sync
6. **Verify security rules** by trying to access another user's data (should fail)

## Troubleshooting

### Portfolio not loading
- Check if user is authenticated
- Verify Firestore security rules are published
- Check browser console for errors
- Verify Firestore database is created

### Changes not saving
- Check network connection
- Verify Firestore security rules allow writes
- Check browser console for error messages
- Verify user is authenticated

### Sync status not updating
- Check Firestore connection
- Verify real-time listeners are active
- Check browser console for errors
- Restart the application

## Data Migration

If you need to migrate existing portfolio data:

1. Export data from old storage format
2. Transform to Firestore format
3. Import using Firestore admin SDK or console
4. Verify data structure matches expected format

## Performance Considerations

- Debouncing saves reduces Firestore write operations
- Real-time listeners only subscribe when component is mounted
- Large portfolios may require pagination (future enhancement)
- Consider batch operations for bulk updates

