import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import {
  Text,
  Card,
  Surface,
  useTheme,
  Appbar,
  Avatar,
} from 'react-native-paper';
import { router } from 'expo-router';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import BackgroundGradient from '@/components/BackgroundGradient';
import { useOrientation } from '@/hooks/useOrientation';
import { DebugModeDialog } from '@/components/DebugModeDialog';
import { FirstLaunchService } from '@/services/FirstLaunchService';

const RoleSelectionScreen = () => {
  const theme = useTheme();
  const { orientation } = useOrientation();
  const isLandscape = orientation === 'landscape';

  const [showFirstLaunchDialog, setShowFirstLaunchDialog] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const isFirst = await FirstLaunchService.isFirstLaunch();
      if (isFirst) {
        setShowFirstLaunchDialog(true);
      }
    };

    checkFirstLaunch();
  }, []);

  const handleFirstLaunchDialogClose = async () => {
    setShowFirstLaunchDialog(false);
    await FirstLaunchService.markAsLaunched();
  };

  const handleRoleSelect = (role: 'examiner' | 'student') => {
    if (role === 'examiner') {
      router.push('/routes/examiner-login');
    } else {
      router.push('/routes/student-profile');
    }
  };

  const platformLabel =
    Platform.OS === 'android' ? 'Wersja mobilna (Android)' : 'Wersja webowa';

  const cardBackgroundColor = theme.dark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.8)';
  const cardContentBackgroundColor = theme.dark
    ? 'rgba(30, 30, 30, 0.7)'
    : 'rgba(255, 255, 255, 0.7)';

  return (
    <BackgroundGradient containerStyle={styles.container}>
      <View
        style={[
          styles.cardsContainer,
          isLandscape && styles.landscapeCardsContainer,
        ]}
      >
        <Text
          variant={isLandscape ? 'titleMedium' : 'titleLarge'}
          style={[styles.subtitle, isLandscape && styles.landscapeTitle]}
        >
          Wybierz swoją rolę:
        </Text>

        <View style={isLandscape ? styles.landscapeCardRow : undefined}>
          <Surface
            style={[
              styles.cardSurface,
              Platform.OS === 'android' && styles.androidCardSurface,
              isLandscape && styles.landscapeCardSurface,
              { backgroundColor: cardBackgroundColor },
            ]}
            elevation={4}
          >
            <Card
              style={[
                styles.card,
                styles.fillCard,
                { backgroundColor: cardContentBackgroundColor },
              ]}
              onPress={() => handleRoleSelect('examiner')}
              mode="elevated"
            >
              <Card.Title
                title="Nauczyciel"
                subtitle="Zaloguj się aby tworzyć sesje treningowe dla studentów"
                titleNumberOfLines={2}
                subtitleNumberOfLines={3}
                titleVariant={isLandscape ? 'titleSmall' : 'titleMedium'}
                subtitleVariant={isLandscape ? 'bodySmall' : 'bodyMedium'}
                left={props => (
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: '#D32F2F' },
                      isLandscape && styles.landscapeIconContainer,
                    ]}
                  >
                    <Avatar.Icon
                      {...props}
                      icon="account-tie"
                      size={isLandscape ? 28 : 36}
                      color="#fff"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </View>
                )}
                titleStyle={{ fontWeight: '600' }}
              />
            </Card>
          </Surface>

          <Surface
            style={[
              styles.cardSurface,
              Platform.OS === 'android' && styles.androidCardSurface,
              isLandscape && styles.landscapeCardSurface,
              { backgroundColor: cardBackgroundColor },
            ]}
            elevation={4}
          >
            <Card
              style={[
                styles.card,
                styles.fillCard,
                { backgroundColor: cardContentBackgroundColor },
              ]}
              onPress={() => handleRoleSelect('student')}
              mode="elevated"
            >
              <Card.Title
                title="Student"
                subtitle="Wpisz kod dostępu aby dołączyć do sesji"
                titleNumberOfLines={2}
                subtitleNumberOfLines={3}
                titleVariant={isLandscape ? 'titleSmall' : 'titleMedium'}
                subtitleVariant={isLandscape ? 'bodySmall' : 'bodyMedium'}
                left={props => (
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: '#8B0000' },
                      isLandscape && styles.landscapeIconContainer,
                    ]}
                  >
                    <Avatar.Icon
                      {...props}
                      icon="account"
                      size={isLandscape ? 28 : 36}
                      color="#fff"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </View>
                )}
                titleStyle={{ fontWeight: '600' }}
              />
            </Card>
          </Surface>
        </View>

        <Text
          variant={isLandscape ? 'bodySmall' : 'titleSmall'}
          style={[
            styles.subtitle,
            styles.footer,
            isLandscape && styles.landscapeFooter,
          ]}
        >
          Aplikacja służąca do nauki i ćwiczeń z zakresu ratownictwa medycznego.
        </Text>
      </View>
      <Text
        style={[styles.debugText, isLandscape && styles.landscapeDebugText]}
      >
        {platformLabel}
      </Text>
      <FloatingThemeToggle position="topRight" size={isLandscape ? 20 : 24} />

      {}
      <DebugModeDialog
        visible={showFirstLaunchDialog}
        onDismiss={handleFirstLaunchDialogClose}
      />
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 16,
    paddingTop: Platform.OS === 'web' ? 80 : 50,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    marginTop: 16,
  },
  cardsContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    ...Platform.select({
      android: {
        flexDirection: 'column',
        alignItems: 'stretch',
        paddingHorizontal: 16,
        marginHorizontal: 0,
      },
      ios: {
        flexDirection: 'column',
        alignItems: 'stretch',
        paddingHorizontal: 16,
        marginHorizontal: 0,
      },
      web: {
        flexDirection: 'column',
        alignItems: 'stretch',
        maxWidth: 600,
        alignSelf: 'center',
      },
      default: {
        flexDirection: 'column',
        width: '100%',
      },
    }),
  },
  landscapeCardsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  landscapeCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  cardSurface: {
    borderRadius: 12,
    ...Platform.select({
      android: {
        marginVertical: 8,
        marginHorizontal: 0,
        minHeight: 120,
        overflow: 'hidden',
        alignSelf: 'stretch',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      ios: {
        marginVertical: 8,
        marginHorizontal: 0,
        minHeight: 120,
        overflow: 'hidden',
        alignSelf: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      web: {
        margin: 16,
        minHeight: 140,
        overflow: 'hidden',
      },
      default: {
        marginBottom: 16,
        width: '100%',
      },
    }),
  },
  landscapeCardSurface: {
    flex: 1,
    marginHorizontal: 8,
    minHeight: 90,
    marginVertical: 4,
  },
  androidCardSurface: {
    elevation: 6,
  },
  card: {
    borderRadius: 12,
  },
  fillCard: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cardDescription: {
    marginTop: 8,
    textAlign: 'center',
  },
  debugText: {
    marginTop: 32,
    fontSize: 12,
    color: 'gray',
  },
  landscapeDebugText: {
    marginTop: 16,
    fontSize: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  landscapeIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeTitle: {
    marginBottom: 8,
  },
  landscapeFooter: {
    marginTop: 8,
  },
});

export default RoleSelectionScreen;
