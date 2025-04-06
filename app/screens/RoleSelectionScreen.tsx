import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, Card, Surface, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import BluetoothComponent from '../../components/BluetoothComponent'; 
import { Platform } from 'react-native';

const RoleSelectionScreen = () => {
  const theme = useTheme();

  const handleRoleSelect = (role: 'examiner' | 'student') => {
    if (role === 'examiner') {
      router.push('/routes/examiner-login');
    } else {
      router.push('/routes/student-profile');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Trening Ratownictwa Medycznego
      </Text>

      <Text variant="titleMedium" style={styles.subtitle}>
        Wybierz swoją rolę
      </Text>

      <View style={styles.cardsContainer}>
        <Surface style={styles.cardSurface} elevation={2}>
          <Card
            style={styles.card}
            onPress={() => handleRoleSelect('examiner')}
          >
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall">Nauczyciel</Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Zaloguj się aby tworzyć sesje treningowe dla studentów
              </Text>
            </Card.Content>
          </Card>
        </Surface>

        <Surface style={styles.cardSurface} elevation={2}>
          <Card
            style={styles.card}
            onPress={() => handleRoleSelect('student')}
          >
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall">Student</Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Wpisz kod dostępu aby dołączyć do sesji
              </Text>
            </Card.Content>
          </Card>
        </Surface>
      </View>

      {Platform.OS === 'android' && <BluetoothComponent />} {/* Bluetooth tylko dla androida */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    gap: 24,
  },
  cardSurface: {
    marginBottom: 16,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cardDescription: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;
