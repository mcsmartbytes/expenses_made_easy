# Quick Reference

Quick reference for Expenses Made Easy development.

## This is React Native/Expo (NOT Next.js!)

### Start App
```bash
npx expo start
# Press 'w' for web, 'a' for Android, 'i' for iOS
```

### Key Directories
```
src/screens/     # Screen components
src/components/  # Reusable components
src/services/    # Supabase/API
src/context/     # Context providers
src/types/       # TypeScript types
```

### Navigation
- File: `src/navigation/AppNavigator.tsx`
- Stack navigator, NOT file-based routing

### Common Components
```jsx
View, Text, TouchableOpacity, ScrollView,
TextInput, Image, ActivityIndicator, Alert
```

### Styling
```javascript
const styles = StyleSheet.create({
  container: { ... }
})
```

### Supabase Queries
```javascript
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', user.id)
  .eq('profile', activeProfile)
```

### Business/Personal Profile
- Toggle: Dashboard top (ProfileSwitcher)
- Context: useProfile() hook
- Filter all queries by: `.eq('profile', activeProfile)`

### Color Scheme
- Primary: `#ea580c`
- Background: `#f9fafb`
- Text: `#1f2937`
- Business: `#3b82f6`
- Personal: `#10b981`

### Important Files
- Dashboard: `src/screens/Dashboard/DashboardScreen.tsx`
- Add Expense: `src/screens/Expenses/AddExpenseScreen.tsx`
- Supabase: `src/services/supabase.ts`
- Profile Context: `src/context/ProfileContext.tsx`

### Documentation
- README.md - Current status
- BUSINESS_PERSONAL_PROFILES_SETUP.md
- PROFILE_SETUP_GUIDE.md
- MILEAGE_SETUP.md

### Other Slash Commands
- `/context` - Full project context
- `/add-feature` - Add new feature
- `/fix-bug` - Debug issues
- `/supabase-help` - Database help
- `/style-component` - Style components
- `/enable-profiles` - Enable industry feature
