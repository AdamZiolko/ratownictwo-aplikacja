import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import { AuthProvider } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

function ThemedLayout() {
  const { theme } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { LightTheme: NavigationLightTheme, DarkTheme: NavigationDarkTheme } =
    adaptNavigationTheme({
      reactNavigationLight: DefaultTheme,
      reactNavigationDark: DarkTheme,
    });

  const navigationFontConfig = {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as '700',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900' as '900',
    },
  };
  const CombinedLightTheme = {
    ...MD3LightTheme,
    ...NavigationLightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...NavigationLightTheme.colors,
      primary: '#0077B6',
      secondary: '#48CAE4',
      background: '#ffffff',
      surface: '#ffffff',

      onPrimary: '#FFFFFF',
      onSecondary: '#000000',
      onSurface: '#000000',
      onBackground: '#000000',

      buttonTextColor: '#FFFFFF',
      error: '#B00020',
    },
    fonts: MD3LightTheme.fonts,
  };
  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...NavigationDarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...NavigationDarkTheme.colors,
      primary: '#48CAE4',
      secondary: '#90E0EF',
      background: '#121212',
      surface: '#1E1E1E',

      onPrimary: '#000000',
      onSecondary: '#000000',
      onSurface: '#FFFFFF',
      onBackground: '#FFFFFF',

      buttonTextColor: '#FFFFFF',
      error: '#CF6679',
    },
    fonts: MD3DarkTheme.fonts,
  };

  const NavigationCompatibleLightTheme = {
    ...NavigationLightTheme,
    fonts: navigationFontConfig,
    colors: CombinedLightTheme.colors,
  };

  const NavigationCompatibleDarkTheme = {
    ...NavigationDarkTheme,
    fonts: navigationFontConfig,
    colors: CombinedDarkTheme.colors,
  };

  const paperTheme = theme === 'dark' ? CombinedDarkTheme : CombinedLightTheme;
  const navigationTheme =
    theme === 'dark'
      ? NavigationCompatibleDarkTheme
      : NavigationCompatibleLightTheme;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            navigationBarHidden: true,
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen
            name="routes/examiner-login"
            options={{ title: 'Examiner Login' }}
          />
          <Stack.Screen
            name="routes/student-access"
            options={{ title: 'Student Access' }}
          />
          <Stack.Screen
            name="routes/examiner-dashboard"
            options={{ title: 'Examiner Dashboard' }}
          />
          <Stack.Screen
            name="routes/student-session"
            options={{ title: 'Student Session' }}
          />
          <Stack.Screen
            name="routes/student-profile"
            options={{ title: 'Student Profile' }}
          />
          <Stack.Screen
            name="routes/login-screen"
            options={{ title: 'Login' }}
          />
          <Stack.Screen
            name="routes/register-screen"
            options={{ title: 'Register' }}
          />
          <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        </Stack>
      </NavigationThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
