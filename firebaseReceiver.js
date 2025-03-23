const axios = require('axios');
const path = require('path');
const sound = require('sound-play');

const DATABASE_URL = 'https://ratownictwo-503b1-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyCR89wp6BHJw3LtaBittinn9peKmmkvqJw';

const soundFilePath = path.join(__dirname, 'assets', 'kaszel.mp3');
const deviceId = 'pc'; // Identyfikator urządzenia - komputer

const listenForCommands = async () => {
  try {
    const response = await axios.get(`${DATABASE_URL}/soundCommand.json?auth=${API_KEY}`);
    const data = response.data;

    if (data && data.command === 'PLAY_KASZEL' && data.target === deviceId) {
      console.log('Odtwarzanie dźwięku kaszel.mp3 na komputerze...');

      sound.play(soundFilePath)
        .then(() => console.log('Dźwięk odtworzony pomyślnie'))
        .catch((err) => console.error('Błąd odtwarzania dźwięku:', err));

      // Wyczyść komendę po odtworzeniu dźwięku
      await axios.put(`${DATABASE_URL}/soundCommand.json?auth=${API_KEY}`, {});
    }
  } catch (error) {
    console.error('Błąd odbierania komendy:', error);
  }
};

setInterval(listenForCommands, 1000);
console.log('Nasłuchiwanie komend...');
