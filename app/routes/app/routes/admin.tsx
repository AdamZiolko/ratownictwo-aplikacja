import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Text,
  Appbar,
  Button,
  useTheme,
  Menu,
  Card,
  Divider,
  Snackbar,
  Surface,
} from 'react-native-paper';
import { router } from 'expo-router';
import apiService from '@/services/ApiService';

const AVAILABLE_ROLES = ['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN'];

const AdminPage = () => {
  const theme = useTheme();

  const [users, setUsers] = useState<Array<any>>([]);

  const [menuUserId, setMenuUserId] = useState<number | null>(null);

  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [updatingRoles, setUpdatingRoles] = useState<{
    [key: number]: boolean;
  }>({});

  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const handleBack = () => {
    router.back();
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiService.get('users');
      setUsers(response);
    } catch (err: any) {
      console.error('Błąd przy pobieraniu użytkowników:', err);
      setSnackbarMessage('Nie udało się pobrać listy użytkowników.');
      setSnackbarVisible(true);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeUserRole = async (userId: number, newRole: string) => {
    setMenuUserId(null);
    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    try {
      await apiService.put(`users/${userId}/roles`, {
        roles: [newRole],
      });

      await fetchUsers();
      setSnackbarMessage('Rola użytkownika została zaktualizowana.');
      setSnackbarVisible(true);
    } catch (err: any) {
      console.error('Błąd przy zmianie roli:', err);
      setSnackbarMessage('Nie udało się zmienić roli użytkownika.');
      setSnackbarVisible(true);
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const currentRole =
      Array.isArray(item.roles) && item.roles.length > 0 ? item.roles[0] : '—';
    const isUpdating = updatingRoles[item.id] === true;
    const isMenuVisible = menuUserId === item.id;

    return (
      <Card style={styles.userCard} mode="outlined">
        <Card.Content>
          <View style={styles.userRow}>
            {}
            <View style={styles.userInfo}>
              <Text variant="titleMedium">{item.username}</Text>
              <Text variant="bodySmall" style={styles.emailText}>
                {item.email}
              </Text>
            </View>

            {}
            <View style={styles.roleSection}>
              <Text variant="bodyMedium" style={styles.roleLabel}>
                {currentRole}
              </Text>
              <Menu
                visible={isMenuVisible}
                onDismiss={() => setMenuUserId(null)}
                anchor={
                  <Button
                    mode="text"
                    compact
                    onPress={() => setMenuUserId(item.id)}
                    disabled={isUpdating}
                  >
                    Zmień rolę
                  </Button>
                }
              >
                {AVAILABLE_ROLES.map(role => (
                  <Menu.Item
                    key={role}
                    onPress={() => changeUserRole(item.id, role)}
                    title={role.replace('ROLE_', '')}
                  />
                ))}
              </Menu>
            </View>

            {isUpdating && (
              <ActivityIndicator
                style={styles.updatingIndicator}
                size="small"
                color={theme.colors.primary}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="Panel Administratora" />
      </Appbar.Header>

      <Surface style={styles.container}>
        {loadingUsers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={item => item.id.toString()}
            renderItem={renderUserItem}
            ItemSeparatorComponent={() => <Divider />}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? 'transparent' : 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  userCard: {
    marginHorizontal: 12,
    marginVertical: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  emailText: {
    color: '#666',
    marginTop: 2,
  },
  roleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    marginRight: 8,
  },
  updatingIndicator: {
    marginLeft: 8,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default AdminPage;
