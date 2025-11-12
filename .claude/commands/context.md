# Project Context

**IMPORTANT**: This is a **React Native (Expo)** project, NOT Next.js!

## Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase
- **Navigation**: React Navigation (native-stack)
- **State**: React Context API
- **UI**: React Native components (NOT web components)

## Key Architecture Points

### Component Structure
- Use React Native components: `View`, `Text`, `TouchableOpacity`, `ScrollView`, etc.
- NO HTML tags (div, button, p, etc.)
- Styles use `StyleSheet.create()` NOT CSS files
- No className, use `style={styles.className}`

### File Structure
```
src/
├── screens/     # Screen components (NOT pages/)
├── components/  # Reusable components
├── navigation/  # React Navigation setup (NOT routing/)
├── services/    # API/Supabase services
├── context/     # Context providers
└── types/       # TypeScript types
```

### Key Features
1. **Business/Personal Profile Toggle** - Working, don't break it!
2. **Expense Tracking** - Full CRUD with receipt photos
3. **Mileage Tracking** - GPS-based with IRS rates
4. **Reports** - IRS-compliant generation
5. **Profile with Industry** - Ready but needs database setup

### Database (Supabase)
- Tables: expenses, mileage_trips, expense_categories, user_profiles
- Project URL: https://vckynnyputrvwjhosryl.supabase.co
- All queries use Supabase client, not REST API

### Important Notes
- Business/Personal toggle is WORKING - don't change it
- Profile button is commented out in DashboardScreen.tsx (lines 253-258)
- Industry categories ready but needs `user_profiles` table setup
- App uses `npx expo start` NOT `npm run dev`

Always read README.md for latest status before making changes!
