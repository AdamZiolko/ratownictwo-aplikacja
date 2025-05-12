import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Text, Card, Surface, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';

const RoleSelectionScreen = () => {
  const theme = useTheme();

  const handleRoleSelect = (role: 'examiner' | 'student') => {
    if (role === 'examiner') {
      router.push('/routes/examiner-login');
    } else {
      router.push('/routes/student-profile');
    }
  };

  const platformLabel =
    Platform.OS === 'android'
      ? 'Wersja mobilna (Android)'
      : 'Wersja webowa';

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Trening Ratownictwa Medycznego
      </Text>

      <Text variant="titleMedium" style={styles.subtitle}>
        Wybierz swoją rolę
      </Text>

      <View style={styles.cardsContainer}>
        <Surface style={[styles.cardSurface, Platform.OS === 'android' && styles.androidCardSurface]} elevation={2}>
          <Card style={[styles.card, styles.fillCard]} onPress={() => handleRoleSelect('examiner')}>
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall">Nauczyciel</Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Zaloguj się aby tworzyć sesje treningowe dla studentów
              </Text>
            </Card.Content>
          </Card>
        </Surface>

        <Surface style={[styles.cardSurface, Platform.OS === 'android' && styles.androidCardSurface]} elevation={2}>
          <Card style={[styles.card, styles.fillCard]} onPress={() => handleRoleSelect('student')}>
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall">Student</Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Wpisz kod dostępu aby dołączyć do sesji
              </Text>
            </Card.Content>
          </Card>
        </Surface>
      </View>

      <Text style={styles.debugText}>{platformLabel}</Text>
      
      {/* Theme Toggle Button */}
      <FloatingThemeToggle position="topRight" size={24} />
    </View>
  );
};

const styles = StyleSheet.create({  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 80 : 50,
    alignItems: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
  },  cardsContainer: {
    width: '100%',
    ...Platform.select({
      android: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        paddingHorizontal: 8,
      },
      web: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        maxWidth: 800,
        alignSelf: 'center',
      },
      default: {
        flexDirection: 'column',
      },
    }),
  },  cardSurface: {
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      android: {
        flex: 1,
        marginHorizontal: 8,
        minHeight: 100,
        overflow: 'hidden',
      },
      web: {
        margin: 16,
        width: 300,
        minHeight: 140,
        overflow: 'hidden',
      },
      default: {
        marginBottom: 16,
        width: '100%',
      },
    }),
  },
  androidCardSurface: {
    elevation: 4,
  },  card: {
    borderRadius: 12,
  },
  fillCard: {
    flex: 1,
    justifyContent: 'center',
    height: Platform.OS === 'web' ? 140 : undefined,
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
});

export default RoleSelectionScreen;