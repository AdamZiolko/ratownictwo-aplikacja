import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
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
  IconButton,
  Portal,
  Modal,
  TextInput,
  HelperText,
} from 'react-native-paper';
import { router } from 'expo-router';
import apiService from '@/services/ApiService';
import { EkgType, NoiseType } from '@/services/EkgFactory';
import SessionFormFields from '../../../screens/examiner/components/SessionFormFields';
import { FormData, FormErrors } from '../../../screens/examiner/types/types';

const AVAILABLE_ROLES = ['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN'];

const AdminPage = () => {
  const theme = useTheme();

  const [users, setUsers] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);

  const [menuUserId, setMenuUserId] = useState<number | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState<{ [key: number]: boolean }>({});

  const [savingPreset, setSavingPreset] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const initialFormData: FormData = {
    name: '',
    temperature: '37',
    rhythmType: EkgType.NORMAL_SINUS_RHYTHM,
    beatsPerMinute: '',
    noiseLevel: NoiseType.NONE,
    sessionCode: '',
    isActive: true,
    isEkdDisplayHidden: false,
    bp: '',
    spo2: '95',
    etco2: '40',
    rr: '16',
    showColorsConfig: false,
  };
  const [formData, setFormData] = useState<FormData>({ ...initialFormData });

  const [formErrors, setFormErrors] = useState<FormErrors & {
    name: string;
    bp: string;
    presetName: string;
  }>({
    name: '',
    temperature: '',
    beatsPerMinute: '',
    sessionCode: '',
    spo2: '',
    etco2: '',
    rr: '',
    bp: '',
    presetName: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleBack = () => {
    router.back();
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const resp = await apiService.get('users');
      setUsers(resp);
    } catch (err: any) {
      console.error('Błąd pobierania użytkowników:', err);
      setSnackbarMessage('Nie udało się pobrać użytkowników.');
      setSnackbarVisible(true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPresets = async () => {
    setLoadingPresets(true);
    try {
      const resp = await apiService.get('presets/default');
      setPresets(resp);
    } catch (err: any) {
      console.error('Błąd pobierania presetów:', err);
      setSnackbarMessage('Nie udało się pobrać presetów.');
      setSnackbarVisible(true);
    } finally {
      setLoadingPresets(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPresets();
  }, []);

  const changeUserRole = async (userId: number, newRole: string) => {
    setMenuUserId(null);
    setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));
    try {
      await apiService.put(`users/${userId}/roles`, { roles: [newRole] });
      await fetchUsers();
      setSnackbarMessage('Rola użytkownika zaktualizowana.');
      setSnackbarVisible(true);
    } catch (err) {
      console.error('Błąd zmiany roli:', err);
      setSnackbarMessage('Nie udało się zmienić roli.');
      setSnackbarVisible(true);
    } finally {
      setUpdatingRoles((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const performDeleteUser = async (userId: number) => {
    try {
      await apiService.delete(`users/${userId}`);
      setSnackbarMessage('Użytkownik usunięty.');
      setSnackbarVisible(true);
      await fetchUsers();
    } catch (err) {
      console.error('Błąd usuwania użytkownika:', err);
      setSnackbarMessage('Nie udało się usunąć użytkownika.');
      setSnackbarVisible(true);
    }
  };

  const confirmDeleteUser = (userId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Usunąć tego użytkownika?')) {
        performDeleteUser(userId);
      }
    } else {
      Alert.alert(
        'Usuń użytkownika',
        'Czy na pewno?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Usuń', style: 'destructive', onPress: () => performDeleteUser(userId) },
        ]
      );
    }
  };

  const performDeletePreset = async (presetId: string) => {
    try {
      await apiService.delete(`presets/default/${presetId}`);
      setSnackbarMessage('Preset usunięty.');
      setSnackbarVisible(true);
      await fetchPresets();
    } catch (err) {
      console.error('Błąd usuwania presetu:', err);
      setSnackbarMessage('Nie udało się usunąć presetu.');
      setSnackbarVisible(true);
    }
  };

  const confirmDeletePreset = (presetId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Usunąć ten preset?')) {
        performDeletePreset(presetId);
      }
    } else {
      Alert.alert(
        'Usuń preset',
        'Czy na pewno?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Usuń', style: 'destructive', onPress: () => performDeletePreset(presetId) },
        ]
      );
    }
  };


  const validateForm = (): typeof formErrors => {
    const errors: typeof formErrors = {
      name: '',
      temperature: '',
      beatsPerMinute: '',
      sessionCode: '',
      spo2: '',
      etco2: '',
      rr: '',
      bp: '',
      presetName: '', 
    };

    if (!formData.name.trim()) {
      errors.name = 'Pole nazwa sesji jest wymagane.';
    }

    if (!formData.bp.trim()) {
      errors.bp = 'Pole ciśnienie krwi jest wymagane.';
    }

    if (!formData.temperature) {
      errors.temperature = 'Pole temperatura jest wymagane.';
    }

    if (!/^[0-9]{1,3}$/.test(formData.beatsPerMinute)) {
      errors.beatsPerMinute = 'Podaj poprawne BPM (30–220).';
    }

    if (!/^[0-9]{6}$/.test(formData.sessionCode)) {
      errors.sessionCode = 'Kod musi mieć 6 cyfr.';
    }

    if (!/^[0-9]{1,3}$/.test(formData.spo2)) {
      errors.spo2 = 'SpO₂ (0–100).';
    }

    if (!/^[0-9]{1,3}$/.test(formData.etco2)) {
      errors.etco2 = 'EtCO₂ (0–100).';
    }

    if (!/^[0-9]{1,3}$/.test(formData.rr)) {
      errors.rr = 'RR (0–100).';
    }

    return errors;
  };

  const handleSavePreset = async () => {
    const errors = validateForm();

    if (!presetName.trim()) {
      errors.presetName = 'Pole nazwa presetu jest wymagane.';
    }

    setFormErrors(errors);
    const hasErrors = Object.values(errors).some((msg) => msg !== '');
    if (hasErrors) {
      return;
    }

    setSavingPreset(true);

    const payload = {
      name: presetName.trim(),
      data: formData,
    };
    try {
      await apiService.post('presets/default', payload);
      setSnackbarMessage('Preset zapisany.');
      setSnackbarVisible(true);

      setModalVisible(false);
      setPresetName('');
      setFormData({ ...initialFormData });
      await fetchPresets();
    } catch (err) {
      console.error('Błąd zapisu presetu:', err);
      setSnackbarMessage('Nie udało się zapisać presetu.');
      setSnackbarVisible(true);
    } finally {
      setSavingPreset(false);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const currentRole = Array.isArray(item.roles) && item.roles.length > 0 ? item.roles[0] : '—';
    const isUpdating = updatingRoles[item.id] === true;
    const isMenuVisible = menuUserId === item.id;

    return (
      <Card style={styles.userCard} mode="outlined">
        <Card.Content>
          <View style={styles.userRow}>
            <View style={styles.userInfo}>
              <Text variant="titleMedium">{item.username}</Text>
              <Text variant="bodySmall" style={styles.emailText}>
                {item.email}
              </Text>
            </View>
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
                {AVAILABLE_ROLES.map((role) => (
                  <Menu.Item
                    key={role}
                    onPress={() => changeUserRole(item.id, role)}
                    title={role.replace('ROLE_', '')}
                  />
                ))}
              </Menu>
            </View>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => confirmDeleteUser(item.id)}
              disabled={isUpdating}
              iconColor={theme.colors.error}
            />
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

  const renderPresetItem = ({ item }: { item: any }) => (
    <Card style={styles.presetCard} mode="outlined">
      <Card.Content>
        <View style={styles.presetRow}>
          <View style={styles.presetInfo}>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall" style={styles.presetDetail}>
              Kod: {item.data.sessionCode}
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => confirmDeletePreset(item.id)}
            iconColor={theme.colors.error}
          />
        </View>
      </Card.Content>
    </Card>
  );

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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUserItem}
            ItemSeparatorComponent={() => <Divider />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<Text style={styles.sectionHeader}>Użytkownicy</Text>}
          />
        )}

        <View style={styles.presetsHeader}>
          <Text style={styles.sectionHeader}>Presety</Text>
          <Button
            mode="contained"
            onPress={() => {
              setFormErrors({
                name: '',
                temperature: '',
                beatsPerMinute: '',
                sessionCode: '',
                spo2: '',
                etco2: '',
                rr: '',
                bp: '',
                presetName: '',
              });
              setModalVisible(true);
            }}
            style={styles.addButton}
          >
            Dodaj preset
          </Button>
        </View>

        {loadingPresets ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={presets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPresetItem}
            ItemSeparatorComponent={() => <Divider />}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
          }}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <TextInput
              label="Nazwa presetu"
              value={presetName}
              onChangeText={(text) => {
                setPresetName(text);
                if (formErrors.presetName) {
                  setFormErrors((prev) => ({ ...prev, presetName: '' }));
                }
              }}
              mode="outlined"
              placeholder="Wprowadź nazwę presetu"
              style={styles.input}
              error={!!formErrors.presetName}
            />
            <HelperText type="error" visible={!!formErrors.presetName}>
              {formErrors.presetName}
            </HelperText>

            <SessionFormFields
              formData={formData}
              setFormData={setFormData}
              formErrors={formErrors}
              showGenerateCodeButton
            />

            <HelperText type="error" visible={!!formErrors.name}>
              {formErrors.name}
            </HelperText>
            <HelperText type="error" visible={!!formErrors.bp}>
              {formErrors.bp}
            </HelperText>

            <View style={styles.modalButtons}>
              <Button
                mode="text"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
                disabled={savingPreset}
              >
                Anuluj
              </Button>
              <Button
                mode="contained"
                onPress={handleSavePreset}
                style={styles.modalButton}
                loading={savingPreset}
                disabled={savingPreset}
              >
                Zapisz
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Platform.OS === 'android' ? 'transparent' : 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 8 },
  sectionHeader: { marginHorizontal: 12, marginVertical: 4, fontWeight: 'bold' },
  presetsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 8 },
  addButton: { marginRight: 12 },
  userCard: { marginHorizontal: 12, marginVertical: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { flex: 1 },
  emailText: { color: '#666', marginTop: 2 },
  roleSection: { flexDirection: 'row', alignItems: 'center' },
  roleLabel: { marginRight: 8 },
  updatingIndicator: { marginLeft: 8 },
  presetCard: { marginHorizontal: 12, marginVertical: 6 },
  presetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  presetInfo: { flex: 1 },
  presetDetail: { color: '#666', marginTop: 2 },
  snackbar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalContent: { maxHeight: '80%', margin: 20, borderRadius: 8, overflow: 'hidden' },
  modalScrollContent: { padding: 20 },
  input: { marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  modalButton: { marginLeft: 8 },
});

export default AdminPage;
