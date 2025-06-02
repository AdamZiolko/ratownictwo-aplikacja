import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Dialog,
  Button,
  Text,
  Divider,
  Chip,
  useTheme,
} from 'react-native-paper';
import { Session } from '../types/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ViewSessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  onEditSession: () => void;
  onShowStudents?: () => void;
  getRhythmTypeName: (type: number) => string;
  getNoiseLevelName: (type: number) => string;
}

const ViewSessionDialog: React.FC<ViewSessionDialogProps> = ({
  visible,
  onDismiss,
  session,
  onEditSession,
  onShowStudents,
  getRhythmTypeName,
  getNoiseLevelName,
}) => {
  const theme = useTheme();

  const themedStyles = {
    hiddenChip: {
      backgroundColor: theme.colors.error,
    },
    visibleChip: {
      backgroundColor: theme.colors.secondary,
    },
  };

  if (!session) return null;

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={[
        styles.viewDialog,
        Platform.OS === 'android' && styles.mobileDialog,
      ]}
    >
      <Dialog.Title style={styles.dialogTitle}>Szczegóły sesji</Dialog.Title>
      <Dialog.Content style={styles.dialogContent}>
        <ScrollView>
          <View style={styles.sessionHeader}>
            <Text
              variant="headlineSmall"
              style={styles.sessionCode}
              numberOfLines={1}
            >
              {session.name || `Sesja ${session.sessionCode}`}
            </Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              icon={session.isActive ? 'check-circle' : 'cancel'}
              style={styles.statusChip}
              textStyle={styles.chipText}
            >
              {session.isActive ? 'Aktywna' : 'Nieaktywna'}
            </Chip>
            <Chip
              icon={session.isEkdDisplayHidden ? 'eye-off' : 'eye'}
              style={[
                styles.statusChip,
                session.isEkdDisplayHidden
                  ? themedStyles.hiddenChip
                  : themedStyles.visibleChip,
              ]}
              textStyle={styles.chipText}
            >
              {session.isEkdDisplayHidden ? 'EKG ukryte' : 'EKG widoczne'}
            </Chip>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.detailsContainer}>
            <DetailRow
              label="Kod sesji:"
              value={session.sessionCode}
              fullWidth
            />
            <DetailRow
              label="Temperatura:"
              value={`${session.temperature}°C`}
            />
            <DetailRow
              label="Typ rytmu:"
              value={getRhythmTypeName(session.rhythmType)}
            />
            <DetailRow label="BPM:" value={session.beatsPerMinute} />
            <DetailRow
              label="Poziom szumu:"
              value={getNoiseLevelName(session.noiseLevel)}
            />
            {session.createdAt && (
              <DetailRow
                label="Utworzono:"
                value={new Date(session.createdAt).toLocaleString()}
              />
            )}
          </View>
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Parametry medyczne
          </Text>
          <View style={styles.detailsContainer}>
            <DetailRow label="Tętno (HR):" value={`${session.hr || '-'} BPM`} />
            <DetailRow label="Ciśnienie (BP):" value={session.bp || '-'} />
            <DetailRow label="SpO₂:" value={`${session.spo2 || '-'}%`} />
            <DetailRow label="EtCO₂:" value={`${session.etco2 || '-'} mmHg`} />
            <DetailRow
              label="Częst. oddechów (RR):"
              value={`${session.rr || '-'} odd./min`}
            />
          </View>
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Uczestnicy
          </Text>
          <View style={styles.studentContainer}>
            <DetailRow
              label="Liczba studentów:"
              value={session.students?.length || 0}
              fullWidth
            />
            {session.students && session.students.length > 0 && (
              <Button
                mode="contained-tonal"
                icon="account-group"
                onPress={onShowStudents}
                style={styles.studentsButton}
                labelStyle={styles.buttonLabel}
              >
                Pokaż studentów
              </Button>
            )}
          </View>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions style={styles.dialogActions}>
        <Button
          onPress={onDismiss}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Zamknij
        </Button>
        <Button
          onPress={onEditSession}
          icon="pencil"
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Edytuj
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

interface DetailRowProps {
  label: string;
  value: string | number;
  fullWidth?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  fullWidth = false,
}) => (
  <View style={[styles.detailRow, fullWidth && styles.fullRow]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  viewDialog: {
    width: '80%',
    maxHeight: '80%',
    alignSelf: 'center',
  },
  mobileDialog: {
    width: SCREEN_WIDTH * 0.95,
    maxWidth: SCREEN_WIDTH * 0.95,
    margin: 8,
    alignSelf: 'center',
  },
  dialogTitle: {
    paddingBottom: 4,
    fontSize: 18,
  },
  dialogContent: {
    paddingHorizontal: 0,
    maxHeight: SCREEN_HEIGHT * 0.6,
    width: '100%',
  },
  sessionHeader: {
    marginBottom: 4,
  },
  sessionCode: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  chipText: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 8,
  },
  detailsContainer: {
    paddingHorizontal: 12,
    width: '100%',
  },
  detailRow: {
    ...Platform.select({
      android: {
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      default: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    }),
    marginVertical: 4,
  },
  fullRow: {
    width: '100%',
    marginBottom: 8,
  },
  detailLabel: {
    opacity: 0.7,
    fontSize: 14,
    flexShrink: 1,
  },
  detailValue: {
    fontWeight: '500',
    fontSize: 14,
    textAlign: Platform.OS === 'android' ? 'left' : 'right',
    marginTop: Platform.OS === 'android' ? 4 : 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    marginBottom: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  studentContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  studentsButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  button: {
    marginLeft: 8,
  },
  buttonLabel: {
    fontSize: 14,
  },
});

export default ViewSessionDialog;
