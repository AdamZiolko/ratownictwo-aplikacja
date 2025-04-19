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
  RadioButton
} from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { sessionService, Session } from "@/services/SessionService";
import { EkgType, NoiseType, EkgFactory } from "@/services/EkgFactory";

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
  
  // Session form state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    temperature: "36.6",
    rhythmType: EkgType.NORMAL,
    beatsPerMinute: "72",
    noiseLevel: NoiseType.NONE,
    sessionCode: ""
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
    }

    // Validate session code
    const code = parseInt(formData.sessionCode);
    if (!formData.sessionCode) {
      errors.sessionCode = "Kod sesji jest wymagany";
      isValid = false;
    } else if (isNaN(code) || formData.sessionCode.length !== 6) {
      errors.sessionCode = "Kod musi być 6-cyfrowy";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      temperature: "36.6",
      rhythmType: EkgType.NORMAL,
      beatsPerMinute: "72",
      noiseLevel: NoiseType.NONE,
      sessionCode: sessionService.generateSessionCode().toString()
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
      sessionCode: session.sessionCode ? session.sessionCode.toString() : ""
    });
    setEditDialogVisible(true);
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
        temperature: parseFloat(formData.temperature),
        rhythmType: formData.rhythmType as number,
        beatsPerMinute: parseInt(formData.beatsPerMinute),
        noiseLevel: formData.noiseLevel as number,
        sessionCode: parseInt(formData.sessionCode)
      };

      await sessionService.createSession(newSession);
      setCreateDialogVisible(false);
      showSnackbar("Sesja została utworzona", "success");
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      showSnackbar("Nie udało się utworzyć sesji", "error");
    }
  };

  // Update an existing session
  const handleUpdateSession = async () => {
    if (!currentSession || !validateForm()) return;

    try {
      const updatedSession = {
        temperature: parseFloat(formData.temperature),
        rhythmType: formData.rhythmType as number,
        beatsPerMinute: parseInt(formData.beatsPerMinute),
        noiseLevel: formData.noiseLevel as number,
        sessionCode: parseInt(formData.sessionCode)
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
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Utwórz nową sesję</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
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
                </View>

                <View style={styles.detailRow}>
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
});

export default ExaminerDashboardScreen;