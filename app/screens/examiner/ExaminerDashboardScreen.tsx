import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Appbar, 
  Text, 
  Card, 
  Button, 
  FAB, 
  Dialog, 
  Portal, 
  TextInput, 
  HelperText,
  DataTable, 
  IconButton, 
  useTheme,
  ActivityIndicator,
  Snackbar,
  Chip,
  Divider,
  SegmentedButtons,
  Menu,
  RadioButton,
  List
} from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { sessionService, Session } from "@/services/SessionService";
import { EkgType, NoiseType, EkgFactory } from "@/services/EkgFactory";
import { socketService } from "@/services/SocketService";
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


type Preset = {
  id: string;
  name: string;
  data: typeof FormData;
};


const ExaminerDashboardScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog state
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [soundDialogVisible, setSoundDialogVisible] = useState(false);

  //Sound state
  const [selectedSound, setSelectedSound] = useState<string | null>(null);

   // Presety stan
   const [savePresetDialogVisible, setSavePresetDialogVisible] = useState(false);
   const [loadPresetDialogVisible, setLoadPresetDialogVisible] = useState(false);
   const [presetName, setPresetName] = useState("");
   const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
   const [presets, setPresets] = useState<Preset[]>([]);
  

   const storage = {
    getItem: async (key: string) => {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    }
  };

  // Załaduj presety przy montowaniu komponentu
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const savedPresets = await storage.getItem('presets');
        if (savedPresets) {
          setPresets(JSON.parse(savedPresets));
        }
      } catch (error) {
        console.error('Błąd ładowania presetów:', error);
      }
    };
    loadPresets();
  }, []);

  // Zapisz preset
  const handleSavePreset = async () => {
    if (!presetName) {
      showSnackbar('Podaj nazwę presetu', 'error');
      return;
    }

    try {
      const newPreset: Preset = {
        id: Date.now().toString(),
        name: presetName,
        data: formData
      };

      const updatedPresets = [...presets, newPreset];
      await storage.setItem('presets', JSON.stringify(updatedPresets));
      
      setPresets(updatedPresets);
      setPresetName('');
      setSavePresetDialogVisible(false);
      showSnackbar('Preset został zapisany', 'success');
    } catch (error) {
      console.error('Błąd zapisywania presetu:', error);
      showSnackbar('Błąd zapisywania presetu', 'error');
    }
  };

  // Wczytaj preset
  const handleLoadPreset = async () => {
    if (!selectedPreset) return;

    try {
      const presetToLoad = presets.find(p => p.id === selectedPreset);
      if (presetToLoad) {
        setFormData(presetToLoad.data);
        setLoadPresetDialogVisible(false);
        showSnackbar('Preset został wczytany', 'success');
      }
    } catch (error) {
      console.error('Błąd wczytywania presetu:', error);
      showSnackbar('Błąd wczytywania presetu', 'error');
    }
  };

  // Usuń preset
  const handleDeletePreset = async (presetId: string) => {
    try {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      await storage.setItem('presets', JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
      showSnackbar('Preset został usunięty', 'success');
    } catch (error) {
      console.error('Błąd usuwania presetu:', error);
      showSnackbar('Błąd usuwania presetu', 'error');
    }
  };


  // Session form state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);  const [formData, setFormData] = useState({
    name: "",         // New field for session name
    temperature: "36.6",
    rhythmType: EkgType.NORMAL,
    beatsPerMinute: "72",
    noiseLevel: NoiseType.NONE,
    sessionCode: "",
    isActive: true,   // New field for active status
    // Add new medical parameters
    hr: "80",         // Heart rate (BPM)
    bp: "120/80",     // Blood pressure (mmHg)
    spo2: "98",       // Oxygen saturation (%)
    etco2: "35",      // End-tidal CO2 (mmHg)
    rr: "12"          // Respiratory rate (breaths/min)
  });
  



  
  // Form errors
  const [formErrors, setFormErrors] = useState({
    temperature: "",
    beatsPerMinute: "",
    sessionCode: ""
  });
  
  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");

  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);

  // Load sessions on mount and after actions
  useEffect(() => {
    loadSessions();
  }, []);


  useEffect(() => {
      console.log(sessions)
  }, [sessions])

  // Load all sessions from API
  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      showSnackbar("Nie udało się załadować sesji", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh action
  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  // Show a snackbar message
  const showSnackbar = (message: string, type: "success" | "error" = "success") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // Validate form data
  const validateForm = () => {
    const errors = {
      temperature: "",
      beatsPerMinute: "",
      sessionCode: ""
    };
    
    let isValid = true;

    // Validate temperature
    const temp = parseFloat(formData.temperature);
    if (!formData.temperature || isNaN(temp)) {
      errors.temperature = "Podaj prawidłową temperaturę";
      isValid = false;
    } else if (temp < 30 || temp > 43) {
      errors.temperature = "Temperatura musi być w zakresie 30-43°C";
      isValid = false;
    }

    // Validate BPM
    const bpm = parseInt(formData.beatsPerMinute);
    if (!formData.beatsPerMinute || isNaN(bpm)) {
      errors.beatsPerMinute = "Podaj prawidłowe tętno";
      isValid = false;
    } else if (bpm < 0 || bpm > 300) {
      errors.beatsPerMinute = "Tętno musi być w zakresie 0-300";
      isValid = false;
    }    // Validate session code
    if (!formData.sessionCode) {
      errors.sessionCode = "Kod sesji jest wymagany";
      isValid = false;
    } else if (formData.sessionCode.length !== 6) {
      errors.sessionCode = "Kod musi zawierać 6 znaków";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };
  // Reset form state
  const resetForm = () => {
    setFormData({
      name: "", // Add name field
      temperature: "36.6",
      rhythmType: EkgType.NORMAL,
      beatsPerMinute: "72",
      noiseLevel: NoiseType.NONE,
      sessionCode: sessionService.generateSessionCode(), // Now returns a string directly
      isActive: true, // Add isActive field
      // Reset medical parameters to default values
      hr: "80",         // Heart rate (BPM)
      bp: "120/80",     // Blood pressure (mmHg)
      spo2: "98",       // Oxygen saturation (%)
      etco2: "35",      // End-tidal CO2 (mmHg)
      rr: "12"          // Respiratory rate (breaths/min)
    });
    setFormErrors({
      temperature: "",
      beatsPerMinute: "",
      sessionCode: ""
    });
  };

  // Open create session dialog
  const openCreateDialog = () => {
    resetForm();
    setCreateDialogVisible(true);
  };
  // Open edit session dialog
  const openEditDialog = (session: Session) => {
    setCurrentSession(session);
    setFormData({
      temperature: session.temperature ? session.temperature.toString() : "36.6",
      rhythmType: session.rhythmType as EkgType,
      beatsPerMinute: session.beatsPerMinute ? session.beatsPerMinute.toString() : "72",
      noiseLevel: session.noiseLevel as NoiseType,
      sessionCode: session.sessionCode ? session.sessionCode.toString() : "",
      isActive: session.isActive !== undefined ? session.isActive : true, // Add the isActive property
      // Populate medical parameters if available, otherwise use default values
      hr: session.hr ? session.hr.toString() : "80",
      bp: session.bp || "120/80",
      spo2: session.spo2 ? session.spo2.toString() : "98",
      etco2: session.etco2 ? session.etco2.toString() : "35",
      rr: session.rr ? session.rr.toString() : "12",
      name: session.name || ""
    });
    setEditDialogVisible(true);
  };

  // Open sound dialog
  const openSoundDialog = (session: Session) => {
    setCurrentSession(session);
    setSelectedSound(null);
    setSoundDialogVisible(true);
  };


  // Open delete confirmation dialog
  const openDeleteDialog = (session: Session) => {
    setCurrentSession(session);

    setDeleteDialogVisible(true);
  };
  // Open view session details dialog
  const openViewDialog = (session: Session) => {
    setCurrentSession(session);
    setViewDialogVisible(true);
  };
    // Create a new session
  const handleCreateSession = async () => {
    if (!validateForm()) return;

    try {
      const newSession = {
        name: formData.name || `Sesja ${formData.sessionCode}`, // Use provided name or generate one
        temperature: parseFloat(formData.temperature),
        rhythmType: formData.rhythmType as number,
        beatsPerMinute: parseInt(formData.beatsPerMinute),
        noiseLevel: formData.noiseLevel as number,
        sessionCode: formData.sessionCode, // Keep as string
        isActive: formData.isActive, // Use the isActive field value
        // Add medical parameters
        hr: parseInt(formData.hr) || undefined,
        bp: formData.bp,
        spo2: parseInt(formData.spo2) || undefined,
        etco2: parseInt(formData.etco2) || undefined,
        rr: parseInt(formData.rr) || undefined
      };

      await sessionService.createSession(newSession);
      setCreateDialogVisible(false);
      showSnackbar("Sesja została utworzona", "success");
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      showSnackbar("Nie udało się utworzyć sesji", "error");
    }  };
    // Update an existing session
  const handleUpdateSession = async () => {
    if (!currentSession || !validateForm()) return;

    try {
      const updatedSession = {
        name: formData.name || `Sesja ${formData.sessionCode}`, // Use form data name
        temperature: parseFloat(formData.temperature),
        rhythmType: formData.rhythmType as number,
        beatsPerMinute: parseInt(formData.beatsPerMinute),
        noiseLevel: formData.noiseLevel as number,
        sessionCode: formData.sessionCode, // Keep as string instead of parsing to number
        isActive: formData.isActive, // Use selected active status
        // Add medical parameters
        hr: parseInt(formData.hr) || undefined,
        bp: formData.bp,
        spo2: parseInt(formData.spo2) || undefined,
        etco2: parseInt(formData.etco2) || undefined,
        rr: parseInt(formData.rr) || undefined
      };

      if (!currentSession.sessionId) return;

      await sessionService.updateSession(currentSession.sessionId, updatedSession);
      setEditDialogVisible(false);
      showSnackbar("Sesja została zaktualizowana", "success");
      loadSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      showSnackbar("Nie udało się zaktualizować sesji", "error");
    }
  };

  // Delete a session
  const handleDeleteSession = async () => {
    if (!currentSession) return;

    console.log(currentSession) 

    try {
      await sessionService.deleteSession(currentSession.sessionId!);
      setDeleteDialogVisible(false);
      showSnackbar("Sesja została usunięta", "success");
      loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      showSnackbar("Nie udało się usunąć sesji", "error");
    }
  };

  

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  // Get rhythm type name
  const getRhythmTypeName = (type: number): string => {
    return EkgFactory.getNameForType(type as EkgType);
  };

  // Get noise level name
  const getNoiseLevelName = (type: number): string => {
    switch(type as NoiseType) {
      case NoiseType.NONE: return "Brak";
      case NoiseType.MILD: return "Łagodne";
      case NoiseType.MODERATE: return "Umiarkowane";
      case NoiseType.SEVERE: return "Silne";
      default: return "Nieznane";
    }
  };

  // View EKG projection for a session
  const viewEkgProjection = (session: Session) => {
    router.push({
      pathname: "/screens/ekg-projection/EkgProjection",
      params: {
        rhythmType: session.rhythmType,
        bpm: session.beatsPerMinute.toString(),
        readOnly: "true"
      }
    });
  };
  //play sound for a session
  const handleSendAudioCommand = () => {
    if (!currentSession || !selectedSound) return;
  
    socketService.emitAudioCommand(currentSession.sessionCode, 'PLAY', selectedSound);
    setSoundDialogVisible(false);
    showSnackbar("Polecenie odtworzenia dźwięku wysłane", "success");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Panel Egzaminatora" subtitle={user ? `Zalogowany jako: ${user.username}` : ""} />
        <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          anchorPosition="bottom"
          style={{ marginTop: 40, marginRight: 10 }}
        >
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            handleLogout();
          }} title="Wyloguj" leadingIcon="logout" />
        </Menu>
      </Appbar.Header>

      <View style={styles.contentContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="titleLarge">{sessions?.length || 0}</Text>
                <Text variant="bodyMedium">Wszystkie sesje</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge">{sessions?.filter(s => s.beatsPerMinute > 100)?.length || 0}</Text>
                <Text variant="bodyMedium">Tachykardia</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge">{sessions?.filter(s => s.beatsPerMinute < 60)?.length || 0}</Text>
                <Text variant="bodyMedium">Bradykardia</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>Aktywne Sesje</Text>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Ładowanie sesji...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.tableContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {sessions?.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge">Brak aktywnych sesji</Text>
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  Kliknij przycisk "+" aby utworzyć nową sesję
                </Text>
                <Button 
                  mode="contained" 
                  onPress={openCreateDialog} 
                  style={styles.emptyStateButton}
                >
                  Utwórz pierwszą sesję
                </Button>
              </View>
            ) : (
              <DataTable style={styles.table}>
                <DataTable.Header>
                  <DataTable.Title>Kod</DataTable.Title>
                  <DataTable.Title>Temp.</DataTable.Title>
                  <DataTable.Title>Rytm</DataTable.Title>
                  <DataTable.Title numeric>BPM</DataTable.Title>
                  <DataTable.Title style={styles.actionsColumn}>Akcje</DataTable.Title>
                </DataTable.Header>

                {sessions?.map((session) => (
                  <DataTable.Row key={session.sessionId} onPress={() => openViewDialog(session)}>
                    <DataTable.Cell>{session.sessionCode}</DataTable.Cell>
                    <DataTable.Cell>{session.temperature}°C</DataTable.Cell>
                    <DataTable.Cell>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.rhythmCell}>
                        {getRhythmTypeName(session.rhythmType)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{session.beatsPerMinute}</DataTable.Cell>
                    <DataTable.Cell style={styles.actionsColumn}>
                      <View style={styles.rowActions}>
                        <IconButton 
                          icon="pencil" 
                          size={20} 
                          onPress={() => openEditDialog(session)} 
                          iconColor={theme.colors.primary}
                        />
                        <IconButton 
                          icon="delete" 
                          size={20} 
                          onPress={() => openDeleteDialog(session)} 
                          iconColor={theme.colors.error}
                        />
                        <IconButton 
                          icon="volume-high" 
                          size={20}
                          onPress={() => openSoundDialog(session)}
                          iconColor={theme.colors.secondary}
                        />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            )}
          </ScrollView>
        )}
        
      </View>

      {/* Create Session Dialog */}
      <Portal>
          {/* Save Preset Dialog */}
   
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Utwórz nową sesję</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
              <View style={styles.presetButtonsContainer}>
    <Button 
      mode="outlined" 
      onPress={() => setLoadPresetDialogVisible(true)}
      style={styles.presetButton}
    >
      Wczytaj preset
    </Button>
    <Button 
      mode="contained-tonal" 
      onPress={() => setSavePresetDialogVisible(true)}
      style={styles.presetButton}
    >
      Zapisz jako preset
    </Button>
  </View>
                <TextInput
                  label="Nazwa sesji"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Wprowadź nazwę sesji"
                />

                <TextInput
                  label="Temperatura (°C)"
                  value={formData.temperature}
                  onChangeText={(text) => setFormData({ ...formData, temperature: text })}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.temperature}
                />
                {formErrors.temperature ? (
                  <HelperText type="error">{formErrors.temperature}</HelperText>
                ) : null}

                <Text variant="titleSmall" >Typ rytmu serca</Text>
                <Card style={styles.selectionCard}>
                  <Card.Content>
                    <RadioButton.Group 
                      onValueChange={(value) => setFormData({ ...formData, rhythmType: parseInt(value) })} 
                      value={formData.rhythmType.toString()}
                    >
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.NORMAL)} 
                          value={EkgType.NORMAL.toString()} 
                          position="leading"
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.TACHYCARDIA)} 
                          value={EkgType.TACHYCARDIA.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.BRADYCARDIA)} 
                          value={EkgType.BRADYCARDIA.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.AFIB)} 
                          value={EkgType.AFIB.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.VFIB)} 
                          value={EkgType.VFIB.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.VTACH)} 
                          value={EkgType.VTACH.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.TORSADE)} 
                          value={EkgType.TORSADE.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.ASYSTOLE)} 
                          value={EkgType.ASYSTOLE.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.HEART_BLOCK)} 
                          value={EkgType.HEART_BLOCK.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.PVC)} 
                          value={EkgType.PVC.toString()}
                          position="leading" 
                        />
                      </View>
                    </RadioButton.Group>
                  </Card.Content>
                </Card>

                <TextInput
                  label="Tętno (BPM)"
                  value={formData.beatsPerMinute}
                  onChangeText={(text) => setFormData({ ...formData, beatsPerMinute: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.beatsPerMinute}
                />
                {formErrors.beatsPerMinute ? (
                  <HelperText type="error">{formErrors.beatsPerMinute}</HelperText>
                ) : null}

                <Text variant="titleSmall" >Poziom szumów</Text>
                <SegmentedButtons
                  value={formData.noiseLevel.toString()}
                  onValueChange={(value) => setFormData({ ...formData, noiseLevel: parseInt(value) })}
                  buttons={[
                    { value: NoiseType.NONE.toString(), label: 'Brak' },
                    { value: NoiseType.MILD.toString(), label: 'Łagodne' },
                    { value: NoiseType.MODERATE.toString(), label: 'Umiarkowane' },
                    { value: NoiseType.SEVERE.toString(), label: 'Silne' },
                  ]}
                  style={styles.segmentedButtons}
                />

                <TextInput
                  label="Kod sesji"
                  value={formData.sessionCode}
                  onChangeText={(text) => setFormData({ ...formData, sessionCode: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.sessionCode}
                  maxLength={6}
                />
                {formErrors.sessionCode ? (
                  <HelperText type="error">{formErrors.sessionCode}</HelperText>
                ) : (
                  <HelperText type="info">6-cyfrowy kod do udostępnienia studentom</HelperText>
                )}

                <Button
                  mode="text"
                  onPress={() => setFormData({ ...formData, sessionCode: sessionService.generateSessionCode().toString() })}
                  style={styles.generateButton}
                >
                  Generuj losowy kod
                </Button>
                
                <Text variant="titleMedium" style={styles.sectionTitle}>Parametry medyczne</Text>
                
                <View style={styles.paramRow}>
                  <TextInput
                    label="Tętno (HR)"
                    value={formData.hr}
                    onChangeText={(text) => setFormData({ ...formData, hr: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="BPM" />}
                  />
                  
                  <TextInput
                    label="Ciśnienie krwi (BP)"
                    value={formData.bp}
                    onChangeText={(text) => setFormData({ ...formData, bp: text })}
                    keyboardType="default"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="mmHg" />}
                    placeholder="np. 120/80"
                  />
                </View>
                
                <View style={styles.paramRow}>
                  <TextInput
                    label="SpO₂"
                    value={formData.spo2}
                    onChangeText={(text) => setFormData({ ...formData, spo2: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="%" />}
                  />
                  
                  <TextInput
                    label="EtCO₂"
                    value={formData.etco2}
                    onChangeText={(text) => setFormData({ ...formData, etco2: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="mmHg" />}
                  />
                </View>
                
                <TextInput
                  label="Częstość oddechów (RR)"
                  value={formData.rr}
                  onChangeText={(text) => setFormData({ ...formData, rr: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  right={<TextInput.Affix text="oddechów/min" />}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog visible={savePresetDialogVisible} onDismiss={() => setSavePresetDialogVisible(false)}>
    <Dialog.Title>Zapisz konfigurację jako preset</Dialog.Title>
    <Dialog.Content>
      <TextInput
        label="Nazwa presetu"
        value={presetName}
        onChangeText={setPresetName}
        mode="outlined"
        style={styles.input}
        placeholder="Wprowadź nazwę presetu"
      />
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => setSavePresetDialogVisible(false)}>Anuluj</Button>
      <Button onPress={handleSavePreset}>Zapisz</Button>
    </Dialog.Actions>
  </Dialog>

    {/* Load Preset Dialog */}
    <Dialog visible={loadPresetDialogVisible} onDismiss={() => setLoadPresetDialogVisible(false)}>
    <Dialog.Title>Wybierz preset do wczytania</Dialog.Title>
    <Dialog.ScrollArea style={styles.dialogScrollArea}>
      <ScrollView>
        {presets.length === 0 ? (
          <Text style={styles.emptyStateText}>Brak zapisanych presetów</Text>
        ) : (
          <RadioButton.Group 
            onValueChange={value => setSelectedPreset(value)} 
            value={selectedPreset || ""}
          >
            {presets.map(preset => (
              <List.Item
                key={preset.id}
                title={preset.name}
                description={`Utworzono: ${new Date(parseInt(preset.id)).toLocaleDateString()}`}
                onPress={() => setSelectedPreset(preset.id)}
                right={props => (
                  <View style={styles.presetItemActions}>
                    <RadioButton {...props} value={preset.id} />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeletePreset(preset.id)}
                      iconColor={theme.colors.error}
                    />
                  </View>
                )}
              />
            ))}
          </RadioButton.Group>
        )}
      </ScrollView>
    </Dialog.ScrollArea>
    <Dialog.Actions>
      <Button onPress={() => setLoadPresetDialogVisible(false)}>Anuluj</Button>
      <Button 
        onPress={handleLoadPreset}
        disabled={!selectedPreset}
      >
        Wczytaj
      </Button>
    </Dialog.Actions>
  </Dialog>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Anuluj</Button>
            <Button onPress={handleCreateSession}>Utwórz</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Session Dialog */}
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edytuj sesję</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Nazwa sesji"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Wprowadź nazwę sesji"
                />
                
                <View style={styles.paramRow}>
                  <Text variant="bodyMedium" style={{...styles.inputHalf, marginTop: 8}}>Status sesji:</Text>
                  <SegmentedButtons
                    value={formData.isActive ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                    buttons={[
                      { value: "true", label: 'Aktywna' },
                      { value: "false", label: 'Nieaktywna' },
                    ]}
                    style={{...styles.segmentedButtons, flex: 1}}
                  />
                </View>

                <TextInput
                  label="Temperatura (°C)"
                  value={formData.temperature}
                  onChangeText={(text) => setFormData({ ...formData, temperature: text })}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.temperature}
                />
                {formErrors.temperature ? (
                  <HelperText type="error">{formErrors.temperature}</HelperText>
                ) : null}

                <Text variant="titleSmall" >Typ rytmu serca</Text>
                <Card style={styles.selectionCard}>
                  <Card.Content>
                    <RadioButton.Group 
                      onValueChange={(value) => setFormData({ ...formData, rhythmType: parseInt(value) })} 
                      value={formData.rhythmType.toString()}
                    >
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.NORMAL)} 
                          value={EkgType.NORMAL.toString()} 
                          position="leading"
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.TACHYCARDIA)} 
                          value={EkgType.TACHYCARDIA.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.BRADYCARDIA)} 
                          value={EkgType.BRADYCARDIA.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.AFIB)} 
                          value={EkgType.AFIB.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.VFIB)} 
                          value={EkgType.VFIB.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.VTACH)} 
                          value={EkgType.VTACH.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.TORSADE)} 
                          value={EkgType.TORSADE.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.ASYSTOLE)} 
                          value={EkgType.ASYSTOLE.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.HEART_BLOCK)} 
                          value={EkgType.HEART_BLOCK.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.PVC)} 
                          value={EkgType.PVC.toString()}
                          position="leading" 
                        />
                      </View>
                    </RadioButton.Group>
                  </Card.Content>
                </Card>

                <TextInput
                  label="Tętno (BPM)"
                  value={formData.beatsPerMinute}
                  onChangeText={(text) => setFormData({ ...formData, beatsPerMinute: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.beatsPerMinute}
                />
                {formErrors.beatsPerMinute ? (
                  <HelperText type="error">{formErrors.beatsPerMinute}</HelperText>
                ) : null}

                <Text variant="titleSmall" >Poziom szumów</Text>
                <SegmentedButtons
                  value={formData.noiseLevel.toString()}
                  onValueChange={(value) => setFormData({ ...formData, noiseLevel: parseInt(value) })}
                  buttons={[
                    { value: NoiseType.NONE.toString(), label: 'Brak' },
                    { value: NoiseType.MILD.toString(), label: 'Łagodne' },
                    { value: NoiseType.MODERATE.toString(), label: 'Umiarkowane' },
                    { value: NoiseType.SEVERE.toString(), label: 'Silne' },
                  ]}
                  style={styles.segmentedButtons}
                />

                <TextInput
                  label="Kod sesji"
                  value={formData.sessionCode}
                  onChangeText={(text) => setFormData({ ...formData, sessionCode: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.sessionCode}
                  maxLength={6}
                />
                {formErrors.sessionCode ? (
                  <HelperText type="error">{formErrors.sessionCode}</HelperText>
                ) : (
                  <HelperText type="info">6-cyfrowy kod do udostępnienia studentom</HelperText>
                )}
                
                <Text variant="titleMedium" style={styles.sectionTitle}>Parametry medyczne</Text>
                
                <View style={styles.paramRow}>
                  <TextInput
                    label="Tętno (HR)"
                    value={formData.hr}
                    onChangeText={(text) => setFormData({ ...formData, hr: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="BPM" />}
                  />
                  
                  <TextInput
                    label="Ciśnienie krwi (BP)"
                    value={formData.bp}
                    onChangeText={(text) => setFormData({ ...formData, bp: text })}
                    keyboardType="default"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="mmHg" />}
                    placeholder="np. 120/80"
                  />
                </View>
                
                <View style={styles.paramRow}>
                  <TextInput
                    label="SpO₂"
                    value={formData.spo2}
                    onChangeText={(text) => setFormData({ ...formData, spo2: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="%" />}
                  />
                  
                  <TextInput
                    label="EtCO₂"
                    value={formData.etco2}
                    onChangeText={(text) => setFormData({ ...formData, etco2: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="mmHg" />}
                  />
                </View>
                
                <TextInput
                  label="Częstość oddechów (RR)"
                  value={formData.rr}
                  onChangeText={(text) => setFormData({ ...formData, rr: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  right={<TextInput.Affix text="oddechów/min" />}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Anuluj</Button>
            <Button onPress={handleCreateSession}>Utwórz</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Session Dialog */}
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edytuj sesję</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Nazwa sesji"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Wprowadź nazwę sesji"
                />
                
                <View style={styles.paramRow}>
                  <Text variant="bodyMedium" style={{...styles.inputHalf, marginTop: 8}}>Status sesji:</Text>
                  <SegmentedButtons
                    value={formData.isActive ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                    buttons={[
                      { value: "true", label: 'Aktywna' },
                      { value: "false", label: 'Nieaktywna' },
                    ]}
                    style={{...styles.segmentedButtons, flex: 1}}
                  />
                </View>

                <TextInput
                  label="Temperatura (°C)"
                  value={formData.temperature}
                  onChangeText={(text) => setFormData({ ...formData, temperature: text })}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.temperature}
                />
                {formErrors.temperature ? (
                  <HelperText type="error">{formErrors.temperature}</HelperText>
                ) : null}

                <Text variant="titleSmall" >Typ rytmu serca</Text>
                <Card style={styles.selectionCard}>
                  <Card.Content>
                    <RadioButton.Group 
                      onValueChange={(value) => setFormData({ ...formData, rhythmType: parseInt(value) })} 
                      value={formData.rhythmType.toString()}
                    >
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.NORMAL)} 
                          value={EkgType.NORMAL.toString()} 
                          position="leading"
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.TACHYCARDIA)} 
                          value={EkgType.TACHYCARDIA.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.BRADYCARDIA)} 
                          value={EkgType.BRADYCARDIA.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.AFIB)} 
                          value={EkgType.AFIB.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.VFIB)} 
                          value={EkgType.VFIB.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.VTACH)} 
                          value={EkgType.VTACH.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.TORSADE)} 
                          value={EkgType.TORSADE.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.ASYSTOLE)} 
                          value={EkgType.ASYSTOLE.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.HEART_BLOCK)} 
                          value={EkgType.HEART_BLOCK.toString()}
                          position="leading" 
                        />
                      </View>
                      <View style={styles.radioRow}>
                        <RadioButton.Item 
                          label={EkgFactory.getNameForType(EkgType.PVC)} 
                          value={EkgType.PVC.toString()}
                          position="leading" 
                        />
                      </View>
                    </RadioButton.Group>
                  </Card.Content>
                </Card>

                <TextInput
                  label="Tętno (BPM)"
                  value={formData.beatsPerMinute}
                  onChangeText={(text) => setFormData({ ...formData, beatsPerMinute: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.beatsPerMinute}
                />
                {formErrors.beatsPerMinute ? (
                  <HelperText type="error">{formErrors.beatsPerMinute}</HelperText>
                ) : null}

                <Text variant="titleSmall" >Poziom szumów</Text>
                <SegmentedButtons
                  value={formData.noiseLevel.toString()}
                  onValueChange={(value) => setFormData({ ...formData, noiseLevel: parseInt(value) })}
                  buttons={[
                    { value: NoiseType.NONE.toString(), label: 'Brak' },
                    { value: NoiseType.MILD.toString(), label: 'Łagodne' },
                    { value: NoiseType.MODERATE.toString(), label: 'Umiarkowane' },
                    { value: NoiseType.SEVERE.toString(), label: 'Silne' },
                  ]}
                  style={styles.segmentedButtons}
                />

                <TextInput
                  label="Kod sesji"
                  value={formData.sessionCode}
                  onChangeText={(text) => setFormData({ ...formData, sessionCode: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  error={!!formErrors.sessionCode}
                  maxLength={6}
                />
                {formErrors.sessionCode ? (
                  <HelperText type="error">{formErrors.sessionCode}</HelperText>
                ) : (
                  <HelperText type="info">6-cyfrowy kod do udostępnienia studentom</HelperText>
                )}
                
                <Text variant="titleMedium" style={styles.sectionTitle}>Parametry medyczne</Text>
                
                <View style={styles.paramRow}>
                  <TextInput
                    label="Tętno (HR)"
                    value={formData.hr}
                    onChangeText={(text) => setFormData({ ...formData, hr: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="BPM" />}
                  />
                  
                  <TextInput
                    label="Ciśnienie krwi (BP)"
                    value={formData.bp}
                    onChangeText={(text) => setFormData({ ...formData, bp: text })}
                    keyboardType="default"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="mmHg" />}
                    placeholder="np. 120/80"
                  />
                </View>
                
                <View style={styles.paramRow}>
                  <TextInput
                    label="SpO₂"
                    value={formData.spo2}
                    onChangeText={(text) => setFormData({ ...formData, spo2: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="%" />}
                  />
                  
                  <TextInput
                    label="EtCO₂"
                    value={formData.etco2}
                    onChangeText={(text) => setFormData({ ...formData, etco2: text })}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.inputHalf}
                    right={<TextInput.Affix text="mmHg" />}
                  />
                </View>
                
                <TextInput
                  label="Częstość oddechów (RR)"
                  value={formData.rr}
                  onChangeText={(text) => setFormData({ ...formData, rr: text })}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  right={<TextInput.Affix text="oddechów/min" />}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Anuluj</Button>
            <Button onPress={handleUpdateSession}>Zaktualizuj</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Session Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Usuń sesję</Dialog.Title>
          <Dialog.Content>
            <Text>Czy na pewno chcesz usunąć sesję o kodzie {currentSession?.sessionCode}?</Text>
            <Text style={styles.warningText}>Tej operacji nie można cofnąć.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setDeleteDialogVisible(false)
              }}>Anuluj</Button>
            <Button onPress={handleDeleteSession} textColor={theme.colors.error}>Usuń</Button>
          </Dialog.Actions>
        </Dialog>
          
        <Dialog
  visible={soundDialogVisible}
  onDismiss={() => setSoundDialogVisible(false)}
>
        <Dialog.Title>Odtwórz dźwięk</Dialog.Title>
        <Dialog.Content>
          <Text>
            Wybierz dźwięk do odtworzenia w sesji{" "}
            <Text style={{ fontWeight: "bold" }}>{currentSession?.sessionCode}</Text>
          </Text>
          <RadioButton.Group
            onValueChange={value => setSelectedSound(value)}
            value={selectedSound || ""}
          >
            {[
              { label: "Kaszel", value: "kaszel" },
              { label: "Szum serca", value: "szum-serca" },
              { label: "Normalne bicie", value: "normalne-bicie" },
            ].map(option => (
              <List.Item
                key={option.value}
                title={option.label}
                onPress={() => setSelectedSound(option.value)}
                right={props => (
                  <RadioButton
                    {...props}
                    value={option.value}
                  />
                )}
              />
            ))}
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setSoundDialogVisible(false)}>Anuluj</Button>
          <Button
            onPress={handleSendAudioCommand}
            disabled={!selectedSound}
          >
            Odtwórz
          </Button>
        </Dialog.Actions>
      </Dialog>      


        {/* View Session Details Dialog */}
        <Dialog visible={viewDialogVisible} onDismiss={() => setViewDialogVisible(false)} style={styles.viewDialog}>
          <Dialog.Title>Szczegóły sesji</Dialog.Title>
          <Dialog.Content>
            {currentSession && (
              <View>
                <View style={styles.sessionHeader}>
                  <Chip 
                    icon="key" 
                    mode="outlined" 
                  >
                    Kod: {currentSession.sessionCode}
                  </Chip>
                </View>

                <Text variant="titleLarge" style={{textAlign: 'center', marginVertical: 8}}>
                  {currentSession.name || `Sesja ${currentSession.sessionCode}`}
                </Text>
                
                <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 8}}>
                  <Chip 
                    icon={currentSession.isActive ? "check-circle" : "close-circle"} 
                    mode="flat" 
                    style={{
                      backgroundColor: currentSession.isActive ? "#E8F5E9" : "#FFEBEE",
                    }}
                    textStyle={{
                      color: currentSession.isActive ? "#2E7D32" : "#C62828",
                    }}
                  >
                    {currentSession.isActive ? "Aktywna" : "Nieaktywna"}
                  </Chip>
                </View>

                <Divider style={styles.divider} />
                
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Temperatura:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.temperature}°C
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Rytm serca:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {getRhythmTypeName(currentSession.rhythmType)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Tętno:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.beatsPerMinute} uderzeń/min
                  </Text>
                </View>                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Poziom szumów:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {getNoiseLevelName(currentSession.noiseLevel)}
                  </Text>
                </View>

                {currentSession.createdAt && (
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium" style={styles.detailLabel}>Utworzono:</Text>
                    <Text variant="bodyLarge" style={styles.detailValue}>
                      {new Date(currentSession.createdAt).toLocaleString()}
                    </Text>
                  </View>
                )}
                
                <Divider style={styles.divider} />
                
                <Text variant="titleSmall" style={{marginBottom: 8}}>Parametry medyczne</Text>

                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Tętno (HR):</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.hr != null ? `${currentSession.hr} BPM` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Ciśnienie (BP):</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.bp || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>SpO₂:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.spo2 != null ? `${currentSession.spo2}%` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>EtCO₂:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.etco2 != null ? `${currentSession.etco2} mmHg` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Częstość oddechów (RR):</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {currentSession.rr != null ? `${currentSession.rr} oddechów/min` : 'N/A'}
                  </Text>
                </View>
                
                <Divider style={styles.divider} />
                
                <Button 
                  mode="contained" 
                  icon="monitor-eye"
                  onPress={() => {
                    setViewDialogVisible(false);
                    viewEkgProjection(currentSession);
                  }}
                  style={styles.viewEkgButton}
                >
                  Podgląd EKG
                </Button>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setViewDialogVisible(false)}>Zamknij</Button>
            <Button 
              onPress={() => {
                setViewDialogVisible(false);
                openEditDialog(currentSession!);
              }} 
              icon="pencil"
            >
              Edytuj
            </Button>
          </Dialog.Actions>
        </Dialog>
        
      </Portal>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openCreateDialog}
        color="#fff"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          styles.snackbar, 
          snackbarType === "success" ? styles.successSnackbar : styles.errorSnackbar
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 12,
    fontWeight: "bold",
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  rhythmCell: {
    maxWidth: 100,
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionsColumn: {
    flex: 1.5,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginVertical: 16,
    opacity: 0.7,
  },
  emptyStateButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  inputHalf: {
    flex: 1,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  paramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  pickerLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#ccc",
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  selectionCard: {
    marginBottom: 16,
  },
  radioRow: {
    marginVertical: 2,
  },
  generateButton: {
    marginTop: 0,
    alignSelf: "flex-start",
  },
  warningText: {
    color: "red",
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  snackbar: {
    margin: 16,
  },
  successSnackbar: {
    backgroundColor: "#4CAF50",
  },
  errorSnackbar: {
    backgroundColor: "#F44336",
  },
  viewDialog: {
    maxWidth: 480,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  sessionCode: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: "500",
  },
  viewEkgButton: {
    marginTop: 8,
  },
  dialogScrollArea: {
    maxHeight: 400,
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  presetButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 8,
  },
  presetButton: {
    flex: 1,
  },
  presetItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ExaminerDashboardScreen;