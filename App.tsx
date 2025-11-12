import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ProfileProvider } from './src/context/ProfileContext';
import * as Location from 'expo-location';
import { AUTO_START_TASK_NAME } from './src/tasks/autoStartTripTask';

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        await Location.requestBackgroundPermissionsAsync();

        const started = await Location.hasStartedLocationUpdatesAsync(AUTO_START_TASK_NAME);
        if (!started) {
          await Location.startLocationUpdatesAsync(AUTO_START_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000, // 30s
            distanceInterval: 25, // meters
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: true,
            activityType: Location.ActivityType.AutomotiveNavigation,
            foregroundService: {
              notificationTitle: 'Mileage auto-start',
              notificationBody: 'Detecting movement to auto-start trips',
              notificationColor: '#ea580c',
            },
          });
        }
      } catch (e) {
        // ignore if user denies background permissions
      }
    })();
  }, []);
  return (
    <ProfileProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </ProfileProvider>
  );
}
