import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, Card, Surface, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

const RoleSelectionScreen = () => {
  const theme = useTheme();

  const DATABASE_URL = 'https://ratownictwo-503b1-default-rtdb.firebaseio.com'; // URL Twojej bazy danych
  const API_KEY = 'AIzaSyCR89wp6BHJw3LtaBittinn9peKmmkvqJw'; // Zmień na klucz API Firebase

  const handleRoleSelect = (role: 'examiner' | 'student') => {
    if (role === 'examiner') {
      router.push('/routes/examiner-login');
    } else {
      router.push('/routes/student-profile');
    }
  };

  const sendSoundCommand = async () => {
    try {
      console.log('Wysyłanie komendy do Firebase...');
      const response = await fetch(`${DATABASE_URL}/soundCommand.json?auth=${API_KEY}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: 'PLAY_KASZEL' }),
      });
      console.log('Komenda wysłana: PLAY_KASZEL');
      console.log('Odpowiedź z Firebase:', await response.json());
    } catch (error) {
      console.error('Błąd wysyłania komendy:', error);
    }
  };

  const playSoundLocally = async () => {
    try {
      console.log('Próba odtworzenia dźwięku...');
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/kaszel.mp3') // Odtwórz kaszel.mp3 z assets
      );
      await sound.playAsync();
      console.log('Dźwięk odtworzony pomyślnie');
    } catch (error) {
      console.log('Błąd odtwarzania dźwięku:', error);
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
      <Button mode="contained" onPress={sendSoundCommand} style={styles.playSoundButton}>
        Odtwórz kaszel na komputerze
      </Button>
      <Button mode="contained" onPress={playSoundLocally} style={styles.playSoundButton}>
        Odtwórz kaszel lokalnie
      </Button>
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
  playSoundButton: {
    marginTop: 24,
  },
});

export default RoleSelectionScreen;