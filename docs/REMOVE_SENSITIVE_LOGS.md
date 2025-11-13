# Sensitive Console.log Removal Plan

## ⚠️ CRITICAL SECURITY ISSUES

### Files with Sensitive Logging:

1. **LoginScreen.tsx** (5 console statements)
   - Line 39: Logs user email
   - Line 46: Logs login response with potential tokens
   - Line 49: console.error (OK)
   - Line 54: Logs success message (OK)
   - Line 61: console.error (OK)

2. **SignupScreen.tsx** (6 console statements)
   - Line 51: Logs user email
   - Line 62: Logs signup response with user data
   - Line 65: console.error (OK)
   - Line 72: Logs success (OK)
   - Line 85: Logs confirmation status (OK)
   - Line 98: console.error (OK)

3. **ProfileScreen.tsx** (9 console statements)
   - Line 69: console.error (OK)
   - Line 71: console.log info message (OK)
   - Line 83: console.error (OK)
   - Line 85: console.log info message (OK)
   - Line 100: **CRITICAL** - Logs user ID
   - Line 101: **CRITICAL** - Logs full profile data
   - Line 114: console.error (OK)
   - Line 118: **CRITICAL** - Logs saved profile data
   - Line 121: console.error (OK)

## Recommended Actions:

### Keep (for production debugging):
- All `console.error()` statements
- Generic success/failure messages

### REMOVE (security risk):
- Any log containing: email, password, tokens, user_id, profile data
- Any log containing API responses

## Implementation:
Will remove lines logging:
- User emails
- Auth responses
- User IDs
- Profile data

