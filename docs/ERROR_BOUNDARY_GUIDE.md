# Error Boundary Implementation Guide

## Overview

Error boundaries have been implemented throughout the Expenses Made Easy app to catch JavaScript errors, prevent crashes, and provide a better user experience.

## What Are Error Boundaries?

Error boundaries are React components that:
- ✅ Catch JavaScript errors anywhere in their child component tree
- ✅ Log those errors for debugging
- ✅ Display a fallback UI instead of crashing the entire app
- ✅ Allow users to retry the operation or navigate away

**Important**: Error boundaries catch errors during:
- Rendering
- Lifecycle methods
- Constructors of child components

**They do NOT catch errors in**:
- Event handlers (use try/catch)
- Asynchronous code (use try/catch)
- Server-side rendering
- Errors thrown in the error boundary itself

---

## Implementation

### 1. Base Error Boundary (`ErrorBoundary.tsx`)

The base error boundary wraps the entire app and catches any unhandled errors.

**Features**:
- Shows user-friendly error message
- Provides "Try Again" button to reset error state
- Displays debug information in development mode
- Supports custom fallback components
- Logs errors automatically

**Location**: `src/components/ErrorBoundary.tsx`

---

### 2. Screen Error Boundary (`ScreenErrorBoundary.tsx`)

Specialized error boundary for individual screens with navigation support.

**Features**:
- Screen-specific error messages
- Navigation fallback options:
  - Try Again (reloads screen)
  - Go Back (returns to previous screen)
  - Go to Dashboard (safe home base)
- Contextual error information

**Location**: `src/components/ScreenErrorBoundary.tsx`

---

### 3. Error Reporting Service (`errorReporting.ts`)

Centralized error logging and reporting utility.

**Features**:
- Logs errors with severity levels (low, medium, high, critical)
- Stores recent errors for debugging
- Ready for integration with services like Sentry, Bugsnag, or Firebase Crashlytics
- Provides helper functions for safe async/sync operations

**Location**: `src/utils/errorReporting.ts`

---

## Current Coverage

All screens are now wrapped with error boundaries:

✅ **Auth Screens**
- Login
- Signup

✅ **Core Screens**
- Dashboard
- Expenses List
- Add/Edit Expense
- Mileage Tracking
- Add/Edit Trip
- Active Trip Tracking

✅ **Settings Screens**
- Profile
- Categories

✅ **Reporting Screens**
- Reports
- Analytics

---

## How It Works

### Normal Flow (No Errors)
```
User → Screen → Renders Successfully → User Sees Content
```

### Error Flow (With Error Boundary)
```
User → Screen → Error Occurs
  ↓
Error Boundary Catches Error
  ↓
Logs Error (console + errorReporting service)
  ↓
Shows Fallback UI with Options:
  - Try Again (reset error)
  - Go Back (navigate away)
  - Go to Dashboard (safe location)
```

---

## User Experience

### What Users See When an Error Occurs

**Screen-Level Error**:
```
⚠️
[Screen Name] Error

We couldn't load this screen. Your data
is safe and you can try again or go back.

[Try Again]
[Go Back]
[Go to Dashboard]
```

**App-Level Error** (rare):
```
😔
Oops! Something went wrong

The app encountered an unexpected error.
Don't worry, your data is safe.

[Try Again]
```

---

## Using Error Reporting Service

### Log an Error
```typescript
import { errorReporting } from '../utils/errorReporting';

try {
  // Some operation
} catch (error) {
  errorReporting.logError(error as Error, {
    screen: 'Expenses',
    userId: user.id,
    severity: 'high',
  });
}
```

### Log a Warning
```typescript
errorReporting.logWarning('Data sync delayed', {
  screen: 'Dashboard',
  userId: user.id,
});
```

### Log a Critical Error
```typescript
errorReporting.logCritical(error, {
  screen: 'Database Migration',
  userId: user.id,
});
```

### Safe Async Operations
```typescript
import { safeAsync } from '../utils/errorReporting';

const data = await safeAsync(
  async () => {
    return await supabase.from('expenses').select('*');
  },
  {
    fallback: [],
    context: { screen: 'Expenses', userId: user.id },
    onError: (error) => {
      Alert.alert('Error', 'Failed to load expenses');
    },
  }
);
```

---

## Testing Error Boundaries

### Manual Testing

To test error boundaries in development:

**Option 1: Throw Error in Component**
```typescript
// Add this to any screen temporarily
useEffect(() => {
  if (__DEV__) {
    throw new Error('Test error boundary');
  }
}, []);
```

**Option 2: Trigger Runtime Error**
```typescript
// Force null reference error
const testError = () => {
  const obj: any = null;
  obj.property.nested; // Will throw
};
```

**Option 3: Async Error**
```typescript
const testAsyncError = async () => {
  throw new Error('Async test error');
};
```

### Automated Testing

```typescript
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('ErrorBoundary catches and displays error', () => {
  const { getByText } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(getByText(/Something went wrong/i)).toBeTruthy();
});
```

---

## Future Enhancements

### Planned Integrations

**1. Sentry Integration** (Recommended)
```typescript
// In errorReporting.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
});

// Then in logError:
Sentry.captureException(error, {
  contexts: { screen: context.screen },
  user: { id: context.userId },
});
```

**2. Firebase Crashlytics**
```typescript
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().recordError(error);
crashlytics().log(`Error in ${context.screen}`);
```

**3. Custom Backend Logging**
```typescript
await fetch('https://api.yourbackend.com/errors', {
  method: 'POST',
  body: JSON.stringify({
    error: error.message,
    stack: error.stack,
    context,
  }),
});
```

---

## Best Practices

### ✅ Do:
- Use error boundaries for component tree errors
- Log errors with context (screen, userId, severity)
- Provide clear, user-friendly error messages
- Offer recovery options (Try Again, Go Back)
- Test error scenarios regularly
- Monitor error reports in production

### ❌ Don't:
- Don't use error boundaries for event handlers (use try/catch)
- Don't catch errors just to hide them
- Don't show technical stack traces to users (only in dev mode)
- Don't forget to log errors for debugging
- Don't make error messages scary or blame the user

---

## Error Severity Guidelines

**Low (Warning)**:
- Non-critical feature failures
- UI glitches that don't block functionality
- Slow network responses
- Optional data not loading

**Medium (Error)**:
- Feature failures that don't crash the app
- Failed API calls with fallback data
- Validation errors
- Recoverable database errors

**High (Error)**:
- Screen crashes (caught by error boundary)
- Critical features not working
- Data loss risks
- Authentication failures

**Critical (Critical)**:
- App-wide crashes
- Data corruption
- Security issues
- Payment failures

---

## Monitoring Dashboard (Future)

When integrated with an error reporting service, you'll be able to:

📊 **View Metrics**:
- Total errors by day/week/month
- Error rate percentage
- Most common errors
- Affected users count

📍 **Track Locations**:
- Which screens have most errors
- Error distribution across features
- User journey before error

🔍 **Detailed Reports**:
- Full stack traces
- User actions leading to error
- Device/OS information
- App version

---

## Summary

✅ **Implemented**:
- Base ErrorBoundary component
- Screen-specific ScreenErrorBoundary
- Error reporting service
- All screens wrapped with error boundaries
- User-friendly fallback UI
- Navigation recovery options

✅ **Benefits**:
- App doesn't crash completely
- Users can recover from errors
- Errors are logged for debugging
- Better user experience
- Production-ready error handling

✅ **Ready For**:
- Production deployment
- External error reporting integration (Sentry, etc.)
- Automated error monitoring
- User feedback collection

---

*Last updated: October 2025*
