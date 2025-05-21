import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform, ScrollView } from 'react-native';
import { socketService } from '../services/SocketService';
import { Button, Card, Divider } from 'react-native-paper';
import { WS_URL, API_URL } from '../constants/Config';
import { wifiKeepAliveService } from '../services/WifiKeepAliveService';
import { networkMonitorService } from '../services/NetworkMonitorService';

const SocketConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState({
    connected: socketService.getConnectionStatus().connected,
    id: socketService.getConnectionStatus().id,
    wifiLockStatus: 'Nieznany',
    networkConnected: true,
    connectionType: 'nieznany',
    lastSuccessfulConnection: null as Date | null,
    connectionAttempts: 0,
    expanded: false
  });
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const checkStatus = async () => {
      const currentStatus = socketService.getConnectionStatus();
      let wifiLockStatus = 'Nie dotyczy';
      let networkInfo = { isConnected: true, connectionType: 'nieznany' };
      
      
      if (Platform.OS === 'android') {
        try {
          wifiLockStatus = await wifiKeepAliveService.getStatus();
          networkInfo = await networkMonitorService.getNetworkInfo();
        } catch (error) {
          wifiLockStatus = 'Błąd sprawdzania statusu';
        }
      }
      
      
      let lastSuccessful = status.lastSuccessfulConnection;
      let attempts = status.connectionAttempts;
      
      if (!status.connected && currentStatus.connected) {
        lastSuccessful = new Date();
        attempts = 0;
      } else if (status.connected && !currentStatus.connected) {
        attempts += 1;
      }
      
      setStatus(prev => ({
        ...prev,
        connected: currentStatus.connected,
        id: currentStatus.id,
        wifiLockStatus,
        networkConnected: networkInfo.isConnected,
        connectionType: networkInfo.connectionType,
        lastSuccessfulConnection: lastSuccessful,
        connectionAttempts: attempts
      }));
    };

    
    checkStatus();

    
    const interval = setInterval(checkStatus, 2000);
      
    return () => clearInterval(interval);
  }, [refreshKey]);
  const reconnectSocket = async () => {
    await socketService.disconnect();
    setTimeout(async () => {
      await socketService.connect();
      setRefreshKey(prev => prev + 1);
    }, 500);
  };
  
  
  const enableWifiLock = async () => {
    if (Platform.OS !== 'android') return;
    await wifiKeepAliveService.enableWebSocketKeepAlive();
    setRefreshKey(prev => prev + 1);
  };
  const toggleExpanded = () => {
    setStatus(prev => ({
      ...prev,
      expanded: !prev.expanded
    }));
  };

  return (
    <Card style={styles.container}>      <Card.Title 
        title="Status Połączenia" 
        subtitle={status.connected ? "Połączono" : "Rozłączono"}
        right={(props) => (
          <Button 
            mode={status.connected ? "contained" : "outlined"} 
            onPress={toggleExpanded}
            compact
            style={{marginRight: 8}}
          >
            {status.expanded ? "Mniej" : "Więcej"}
          </Button>
        )}
      />
        <Card.Content>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, {color: status.connected ? '#4CAF50' : '#F44336'}]}>
            Socket: {status.connected ? '✓ Połączono' : '✗ Rozłączono'}
          </Text>
          {Platform.OS === 'android' && (
            <Text style={[styles.networkText, {color: status.networkConnected ? '#4CAF50' : '#F44336'}]}>
              Sieć: {status.networkConnected ? `✓ ${status.connectionType}` : '✗ Offline'}
            </Text>
          )}
        </View>        {status.expanded && (
          <ScrollView style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Szczegóły Połączenia</Text>
            <Divider style={styles.divider} />
            
            {status.id && <Text style={styles.detailText}>ID Socketu: {status.id}</Text>}
            <Text style={styles.detailText}>URL: {WS_URL}</Text>
            <Text style={styles.detailText}>API: {API_URL}</Text>
            <Text style={styles.detailText}>Platforma: {Platform.OS}</Text>
            
            {status.lastSuccessfulConnection && (
              <Text style={styles.detailText}>
                Ostatnie Połączenie: {status.lastSuccessfulConnection.toLocaleTimeString()}
              </Text>
            )}
            
            <Text style={styles.detailText}>Próby Połączenia: {status.connectionAttempts}</Text>
          </ScrollView>
        )}
      </Card.Content>
        <Card.Actions style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={reconnectSocket}
          style={styles.button}
        >
          Połącz Ponownie
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 4,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  networkText: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
  detailsContainer: {
    maxHeight: 200,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  divider: {
    marginVertical: 4,
  },
  detailText: {
    fontSize: 12,
    opacity: 0.8,
    marginVertical: 2,
  },
  buttonContainer: {
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    flex: 1,
  }
});

export default SocketConnectionStatus;