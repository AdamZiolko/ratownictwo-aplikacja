import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { LightTheme: NavigationLightTheme, DarkTheme: NavigationDarkTheme } = adaptNavigationTheme({
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
    },
    fonts: MD3LightTheme.fonts, // Keep Paper's font for PaperProvider
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
    },
    fonts: MD3DarkTheme.fonts, // Keep Paper's font for PaperProvider
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

  const paperTheme = colorScheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme;
  const navigationTheme = colorScheme === 'dark' ? NavigationCompatibleDarkTheme : NavigationCompatibleLightTheme;

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
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            navigationBarHidden: true,
          }}
        >
          <Stack.Screen name="routes/examiner-login" />
          <Stack.Screen name="routes/student-access" />
          <Stack.Screen name="routes/examiner-dashboard" />
          <Stack.Screen name="routes/student-session" />
          <Stack.Screen name="routes/student-profile" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
