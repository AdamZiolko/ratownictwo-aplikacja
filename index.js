import { AppRegistry, LogBox } from 'react-native';
import RoleSelectionScreen from './app/screens/RoleSelectionScreen';
import { name as appName } from './app.json';

// Wyłączenie ostrzeżeń w konsoli
LogBox.ignoreLogs([
  'Warning: Text strings must be rendered within a <Text> component.',
  'Failed to subscribe to student updates for session',
  'Subscription to', 
  'timed out, assuming failure',
  '[BLE] Monitor error [BleError: Operation was cancelled]',
  '[BLE] Monitor error',
  'BleError: Operation was cancelled',
  '(NOBRIDGE) ERROR  [BLE] Monitor error [BleError: Operation was cancelled]',
  '(NOBRIDGE) ERROR',
  'Operation was cancelled'
]);

AppRegistry.registerComponent(appName, () => RoleSelectionScreen);