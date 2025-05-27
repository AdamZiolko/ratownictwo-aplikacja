import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = '@app_first_launch';

export class FirstLaunchService {
  /**
   * Sprawdza czy to pierwszym uruchomienie aplikacji
   * @returns Promise<boolean> - true jeśli to pierwszy raz, false w przeciwnym przypadku
   */
  static async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      return hasLaunchedBefore === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return false;
    }
  }

  /**
   * Oznacza aplikację jako uruchomioną (zapisuje flagę w AsyncStorage)
   */
  static async markAsLaunched(): Promise<void> {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'launched');
    } catch (error) {
      console.error('Error marking app as launched:', error);
    }
  }

  /**
   * Resetuje flagę pierwszego uruchomienia (przydatne do testowania)
   */
  static async resetFirstLaunchFlag(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
    } catch (error) {
      console.error('Error resetting first launch flag:', error);
    }
  }
}