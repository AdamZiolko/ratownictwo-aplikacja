import React from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Dialog, 
  Button, 
  Text, 
  Divider,
  Chip,
} from 'react-native-paper';
import { Session } from '../types/types';

interface ViewSessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  onEditSession: () => void;
  getRhythmTypeName: (type: number) => string;
  getNoiseLevelName: (type: number) => string;
  onViewEkgProjection: (session: Session) => void;
}

const ViewSessionDialog: React.FC<ViewSessionDialogProps> = ({
  visible,
  onDismiss,
  session,
  onEditSession,
  getRhythmTypeName,
  getNoiseLevelName,
  onViewEkgProjection,
}) => {
  if (!session) return null;

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.viewDialog}>
      <Dialog.Title>Szczegóły sesji</Dialog.Title>
      <Dialog.Content>
        <View>
          <View style={styles.sessionHeader}>
            <Text variant="headlineSmall" style={styles.sessionCode}>
              {session.name || `Sesja ${session.sessionCode}`}
            </Text>
          </View>

          <Chip 
            icon={session.isActive ? "check-circle" : "cancel"} 
            style={{ alignSelf: 'flex-start', marginBottom: 8 }}
          >
            {session.isActive ? "Aktywna" : "Nieaktywna"}
          </Chip>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kod sesji:</Text>
            <Text style={styles.detailValue}>{session.sessionCode}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Temperatura:</Text>
            <Text style={styles.detailValue}>{session.temperature}°C</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Typ rytmu:</Text>
            <Text style={styles.detailValue}>{getRhythmTypeName(session.rhythmType)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>BPM:</Text>
            <Text style={styles.detailValue}>{session.beatsPerMinute}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Poziom szumu:</Text>
            <Text style={styles.detailValue}>{getNoiseLevelName(session.noiseLevel)}</Text>
          </View>

          {session.createdAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Utworzono:</Text>
              <Text style={styles.detailValue}>
                {new Date(session.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium" style={{marginBottom: 8}}>Parametry medyczne</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tętno (HR):</Text>
            <Text style={styles.detailValue}>{session.hr || "-"} BPM</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ciśnienie (BP):</Text>
            <Text style={styles.detailValue}>{session.bp || "-"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SpO₂:</Text>
            <Text style={styles.detailValue}>{session.spo2 || "-"}%</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EtCO₂:</Text>
            <Text style={styles.detailValue}>{session.etco2 || "-"} mmHg</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Częst. oddechów (RR):</Text>
            <Text style={styles.detailValue}>{session.rr || "-"} odd./min</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="outlined" 
            icon="chart-line" 
            style={styles.viewEkgButton} 
            onPress={() => onViewEkgProjection(session)}
          >
            Podgląd EKG
          </Button>
        </View>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Zamknij</Button>
        <Button 
          onPress={onEditSession} 
          icon="pencil"
        >
          Edytuj
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
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
});

export default ViewSessionDialog;