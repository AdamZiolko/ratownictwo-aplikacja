import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';

interface ConnectionControlsProps {
  status: "idle" | "scanning" | "connected" | "monitoring" | "error";
  isReconnecting: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  status,
  isReconnecting,
  error,
  onConnect,
  onDisconnect,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {status === "idle" && (
        <View style={styles.connectButtonContainer}>
          <Button
            mode="contained"
            onPress={onConnect}
          >
            Skanuj i połącz
          </Button>
        </View>
      )}

      {status === "scanning" && !isReconnecting && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" animating={true} />
          <Text style={[styles.scanningText, { color: theme.colors.onSurface }]}>
            Skanowanie i łączenie...
          </Text>
        </View>
      )}

      {status === "monitoring" && (
        <View>
          <Text style={[styles.statusOk, { color: theme.colors.primary }]}>
            Połączono z czujnikiem
          </Text>
          <View style={styles.disconnectButton}>
            <Button
              mode="outlined"
              onPress={onDisconnect}
              buttonColor={theme.colors.errorContainer}
              textColor={theme.colors.onErrorContainer}
            >
              Rozłącz
            </Button>
          </View>
        </View>
      )}

      {error && !isReconnecting && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          Błąd: {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  connectButtonContainer: {
    marginTop: 10,
    width: '100%',
  },
  scanningContainer: {
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 8,
    fontSize: 14,
  },
  statusOk: { 
    fontWeight: "bold",
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 16,
  },
  disconnectButton: { 
    marginTop: 16,
    width: '100%',
  },
  error: { 
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
