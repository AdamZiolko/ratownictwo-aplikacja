const axios = require('axios');
const path = require('path');
const sound = require('sound-play');

const DATABASE_URL = 'https://ratownictwo-503b1-default-rtdb.firebaseio.com'; // URL Twojej bazy danych
const API_KEY = 'AIzaSyCR89wp6BHJw3LtaBittinn9peKmmkvqJw'; // Klucz API Firebase

// Ścieżka do pliku kaszel.mp3 na komputerze
const soundFilePath = path.join('C:\\Users\\Kuba\\Desktop\\projekt M\\ratownictwo-aplikacja\\assets\\kaszel.mp3');

let lastCommand = null; // Przechowuje ostatnią odebraną komendę

// Nasłuchuj zmian w bazie danych
const listenForCommands = async () => {
  try {
    const response = await axios.get(`${DATABASE_URL}/soundCommand.json?auth=${API_KEY}`);
    const data = response.data;

    // Sprawdź, czy otrzymano nową komendę
    if (data && data.command && data.command === 'PLAY_KASZEL') {
      console.log('Odtwarzanie dźwięku kaszel.mp3...');

      sound.play(soundFilePath)
        .then(() => {
          console.log('Dźwięk odtworzony pomyślnie');
        })
        .catch((err) => {
          console.error('Błąd odtwarzania dźwięku:', err);
        });

      // Wyczyść komendę po odtworzeniu dźwięku
      await axios.put(`${DATABASE_URL}/soundCommand.json?auth=${API_KEY}`, {});
    }
  } catch (error) {
    console.error('Błąd odbierania komendy:', error);
  }
};

// Nasłuchuj co 1 sekundę
setInterval(listenForCommands, 1000);
console.log('Nasłuchiwanie komend...');