import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ExpensesScreen from '../screens/Expenses/ExpensesScreen';
import AddExpenseScreen from '../screens/Expenses/AddExpenseScreen';
import MileageScreen from '../screens/Mileage/MileageScreen';
import AddTripScreen from '../screens/Mileage/AddTripScreen';
import ActiveTripScreen from '../screens/Mileage/ActiveTripScreen';
import CategoriesScreen from '../screens/Settings/CategoriesScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import ProfileScreen from '../screens/Settings/ProfileScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import RulesScreen from '../screens/Settings/RulesScreen';
import BudgetsScreen from '../screens/Settings/BudgetsScreen';
import { theme } from '../theme/colors';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { errorReporting } from '../utils/errorReporting';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  Expenses: undefined;
  AddExpense: { expenseId?: string };
  Mileage: undefined;
  AddTrip: { tripId?: string };
  ActiveTrip: undefined;
  Categories: undefined;
  Rules: undefined;
  Budgets: undefined;
  Reports: undefined;
  Profile: undefined;
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrap screens with error boundaries
const withErrorBoundary = (Component: any, screenName: string) => {
  return (props: any) => (
    <ScreenErrorBoundary screenName={screenName}>
      <Component {...props} />
    </ScreenErrorBoundary>
  );
};

export default function AppNavigator() {
  // Handle navigation-level errors
  const handleNavigationError = (error: Error) => {
    errorReporting.logCritical(error, { screen: 'Navigation' });
  };

  return (
    <ErrorBoundary onError={handleNavigationError}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary[700],
            },
            headerTintColor: theme.colors.text.inverse,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={withErrorBoundary(LoginScreen, 'Login')}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={withErrorBoundary(SignupScreen, 'Signup')}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Dashboard"
            component={withErrorBoundary(DashboardScreen, 'Dashboard')}
            options={{ title: 'Expenses Made Easy' }}
          />
          <Stack.Screen
            name="Expenses"
            component={withErrorBoundary(ExpensesScreen, 'Expenses')}
            options={{ title: 'My Expenses' }}
          />
          <Stack.Screen
            name="AddExpense"
            component={withErrorBoundary(AddExpenseScreen, 'Add Expense')}
            options={{ title: 'Add Expense', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Mileage"
            component={withErrorBoundary(MileageScreen, 'Mileage')}
            options={{ title: 'Mileage Tracking' }}
          />
          <Stack.Screen
            name="AddTrip"
            component={withErrorBoundary(AddTripScreen, 'Add Trip')}
            options={{ title: 'Add Trip', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ActiveTrip"
            component={withErrorBoundary(ActiveTripScreen, 'Active Trip')}
            options={{ title: 'Active Trip', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Categories"
            component={withErrorBoundary(CategoriesScreen, 'Categories')}
            options={{ title: 'Expense Categories' }}
          />
          <Stack.Screen
            name="Rules"
            component={withErrorBoundary(RulesScreen, 'Rules')}
            options={{ title: 'Auto-Categorization Rules' }}
          />
          <Stack.Screen
            name="Budgets"
            component={withErrorBoundary(BudgetsScreen, 'Budgets')}
            options={{ title: 'Monthly Budgets' }}
          />
          <Stack.Screen
            name="Reports"
            component={withErrorBoundary(ReportsScreen, 'Reports')}
            options={{ title: 'Generate Reports' }}
          />
          <Stack.Screen
            name="Profile"
            component={withErrorBoundary(ProfileScreen, 'Profile')}
            options={{ title: 'My Profile' }}
          />
          <Stack.Screen
            name="Analytics"
            component={withErrorBoundary(AnalyticsScreen, 'Analytics')}
            options={{ title: 'Analytics & Charts' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
