# NAV Auto-Refresh Feature

The Mutual Funds portfolio tracker now automatically refreshes NAV (Net Asset Value) prices to keep your portfolio up-to-date.

## Features

### 1. **Automatic Refresh on Login**
- When you log in and your portfolio loads, NAVs are automatically refreshed
- Happens 2 seconds after portfolio loads (to avoid blocking UI)
- No loading spinner shown for initial refresh (silent update)

### 2. **Periodic Auto-Refresh**
- NAVs are automatically refreshed every **5 minutes** while you're on the page
- Only refreshes if you're logged in and have holdings
- Shows a loading indicator during refresh

### 3. **Refresh on Page Focus**
- When you switch back to the browser tab, NAVs refresh if:
  - Last refresh was more than 1 minute ago
  - You're logged in and have holdings
- Ensures you always see current prices when you return

### 4. **Manual Refresh**
- **Refresh All NAVs** button in the status bar
- Individual refresh button for each fund (refresh icon next to NAV)
- Both show loading states during refresh

## How It Works

### Refresh Process
1. Fetches latest NAV from MFapi.in for each fund
2. Updates the `currentNAV` for each holding
3. Recalculates portfolio values (current value, gain/loss, etc.)
4. Saves updated NAVs to Firestore automatically
5. Updates the UI with new values

### Rate Limiting
- Requests are spaced 200ms apart to avoid API rate limits
- Multiple funds are refreshed in parallel (with delays)
- Failed refreshes are logged but don't block other updates

## UI Indicators

### Status Bar
- **"Updating NAVs..."** - Shows when NAVs are being refreshed
- **"NAVs updated [time]"** - Shows last refresh time
- **"Refresh NAVs" button** - Manual refresh button

### Individual Funds
- **Refresh icon (↻)** - Button to refresh individual fund NAV
- **Spinner** - Shows when that specific fund is being refreshed

## Refresh Triggers

1. **On Portfolio Load** (after login)
   - Triggers: 2 seconds after portfolio loads
   - Shows loading: No (silent)

2. **Periodic Refresh** (every 5 minutes)
   - Triggers: Automatic interval
   - Shows loading: Yes

3. **Page Focus** (when tab becomes visible)
   - Triggers: When you switch back to the tab
   - Condition: Last refresh > 1 minute ago
   - Shows loading: No (silent)

4. **Manual Refresh** (button click)
   - Triggers: User clicks "Refresh NAVs" button
   - Shows loading: Yes

5. **Individual Refresh** (per fund)
   - Triggers: User clicks refresh icon on a fund
   - Shows loading: Yes (for that fund only)

## Benefits

✅ **Always Up-to-Date**: Your portfolio values are always current  
✅ **Automatic**: No need to manually refresh  
✅ **Efficient**: Only refreshes when needed  
✅ **User-Friendly**: Shows loading states and last refresh time  
✅ **Error Handling**: Failed refreshes don't break the app  
✅ **Rate Limited**: Respects API rate limits  

## Configuration

### Refresh Interval
Current: **5 minutes** (300,000 ms)

To change the interval, modify this in `MutualFunds.tsx`:
```typescript
refreshIntervalRef.current = setInterval(() => {
  refreshAllNAVs(true);
}, 5 * 60 * 1000); // Change 5 to desired minutes
```

### Request Delay
Current: **200ms** between requests

To change the delay, modify this in `MutualFunds.tsx`:
```typescript
await new Promise(resolve => setTimeout(resolve, index * 200)); // Change 200 to desired ms
```

## Troubleshooting

### NAVs Not Refreshing
- Check browser console for errors
- Verify internet connection
- Check if MFapi.in is accessible
- Verify fund scheme codes are valid

### Refresh Too Slow
- Reduce request delay (but may hit rate limits)
- Check network connection
- Verify API response times

### Refresh Too Frequent
- Increase refresh interval
- Check if multiple tabs are open (each refreshes independently)

### Missing Updates
- Check if refresh is running (look for "Updating NAVs..." status)
- Verify fund scheme codes are correct
- Check browser console for API errors

## Technical Details

### State Management
- `isRefreshingNAVs`: Boolean indicating if bulk refresh is in progress
- `refreshingHoldingIds`: Set of holding IDs currently being refreshed
- `lastRefreshTime`: Timestamp of last successful refresh

### API Calls
- Uses `getLatestNAV()` from `src/utils/mfapi.ts`
- Fetches from MFapi.in API
- Handles errors gracefully (logs but continues)

### Data Flow
1. User logs in → Portfolio loads from Firestore
2. Holdings state updates → Triggers refresh effect
3. Refresh fetches NAVs → Updates holdings state
4. Holdings state changes → Triggers Firestore save
5. UI updates → Shows new values

## Future Enhancements

- [ ] Configurable refresh interval (user setting)
- [ ] Refresh only visible funds (lazy loading)
- [ ] Cache NAVs locally (reduce API calls)
- [ ] Background refresh (service worker)
- [ ] Push notifications for significant changes
- [ ] Refresh history/audit log

