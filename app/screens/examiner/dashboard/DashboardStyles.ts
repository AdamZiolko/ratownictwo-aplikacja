import { StyleSheet, Platform, Dimensions } from 'react-native';
import { Surface, MD3Theme } from 'react-native-paper';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export const createDashboardStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 0,
      margin: 0,
      flex: 1,
    },
    contentContainer: {
      flex: 1,
    },
    statsCard: {
      marginBottom: Platform.select({
        ios: 12,
        android: 12,
        default: 20,
      }),
      backgroundColor: theme.colors.surface,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    sectionTitle: {
      marginBottom: 0,
      marginTop: 12,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
    },
    table: {
      marginBottom: 20,
    },
    rowActions: {
      flexDirection: Platform.select({
        android: 'row',
        ios: 'row',
        default: 'column',
      }),
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: Platform.select({
        android: 'wrap',
        ios: 'wrap',
        default: 'nowrap',
      }),
    },
    actionButtonRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: Platform.select({
        android: 0,
        ios: 0,
        default: 4,
      }),
      marginRight: Platform.select({
        android: 0,
        ios: 0,
        default: 0,
      }),
    },
    actionsTitleContainer: {
      flexDirection: 'column',
    },
    actionsSubtitle: {
      fontSize: 10,
      opacity: 0.6,
      color: theme.colors.onSurface,
    },
    studentButtonContainer: {
      position: 'relative',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentCountBadge: {
      position: 'absolute',
      right: 2,
      top: 2,
      backgroundColor: '#ff5722',
      borderRadius: 10,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    studentCountText: {
      color: 'white',
      fontSize: 9,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      color: theme.colors.onBackground,
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      textAlign: 'center',
      marginVertical: 16,
      opacity: 0.7,
      color: theme.colors.onBackground,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.onBackground,
    },
    emptySubtext: {
      textAlign: 'center',
      fontSize: 14,
      opacity: 0.7,
      color: theme.colors.onBackground,
    },
    audioCard: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      borderRadius: 8,
    },
    audioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    audioInfo: {
      flex: 1,
      marginRight: 16,
    },
    audioTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    audioDetails: {
      fontSize: 12,
      opacity: 0.7,
      marginBottom: 2,
      color: theme.colors.onSurface,
    },
    audioActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    emptyStateButton: {
      marginTop: 16,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    snackbar: {
      margin: 16,
    },
    successSnackbar: {
      backgroundColor: '#4CAF50',
    },
    errorSnackbar: {
      backgroundColor: '#F44336',
    },
    statsHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      paddingHorizontal: Platform.select({
        android: 8,
        default: 16,
      }),
    },
    statsContent: {
      paddingVertical: Platform.select({
        android: 8,
        default: 16,
      }),
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
      padding: Platform.select({
        android: 4,
        default: 8,
      }),
    },
    statValue: {
      fontWeight: 'bold',
      fontSize: Platform.select({
        android: 16,
        default: 20,
      }),
      color: theme.colors.onSurface,
    },
    statLabel: {
      textAlign: 'center',
      fontSize: Platform.select({
        android: 10,
        default: 12,
      }),
      color: theme.colors.onSurface,
    },
    tableContainer: {
      marginTop: Platform.select({
        default: 0,
      }),
      width: '100%',
    },
    rhythmCell: {
      maxWidth: Platform.select({
        android: 80,
        ios: 80,
        default: 100,
      }),
      fontSize: Platform.select({
        android: 11,
        ios: 11,
        default: 14,
      }),
      color: theme.colors.onSurface,
    },
    tableColumn: {
      flex: Platform.select({
        android: 0.6,
        ios: 0.6,
        default: 0,
      }),
      width: Platform.select({
        android: 'auto',
        ios: 'auto',
        default: '20%',
      }),
      maxWidth: Platform.select({
        default: '20%',
        android: undefined,
        ios: undefined,
      }),
    },
    actionsColumn: {
      flex: Platform.select({
        android: 1,
        ios: 1,
        default: 0,
      }),
      justifyContent: 'flex-end',
      width: Platform.select({
        android: 'auto',
        ios: 'auto',
        default: '20%',
      }),
      maxWidth: Platform.select({
        default: '20%',
        android: undefined,
        ios: undefined,
      }),
    },
    mobileCard: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    mobileCardTitle: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    mobileCardSubtitle: {
      fontSize: isSmallScreen ? 12 : 14,
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    mobileCardContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    mobileCardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    mobileCardText: {
      fontSize: isSmallScreen ? 13 : 14,
      color: theme.colors.onSurface,
    },
    mobileCardActions: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    mobileIconContainer: {
      position: 'relative',
    },
    header: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 8,
    },
    sidebar: {
      backgroundColor: theme.colors.background,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outline,
      height: '100%',
    },
    sidebarContent: {
      padding: 16,
    },
    sidebarTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.primary,
    },
    sidebarEmpty: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 16,
    },
    sessionItem: {
      marginBottom: 8,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
    },
    sessionCodeText: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    studentsList: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
    },
    studentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    studentName: {
      marginLeft: 8,
      color: theme.colors.onSurface,
    },
    avatar: {
      backgroundColor: theme.colors.primaryContainer,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.2)',
      zIndex: 1000,
    },

    globalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.2)',
      zIndex: 1000,
    },

    studentPopup: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      maxHeight: 400,
      width: 280,
      padding: 16,
      zIndex: 1001,
    },

    popupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    checklistContent: {
      maxHeight: 340,
    },

    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 6,
    },
    historyButton: {
      marginHorizontal: 8,
      borderRadius: 8,
    },

    sessionActions: {
      paddingTop: 8,
      paddingBottom: 4,
    },

    colorConfigButton: {
      marginHorizontal: 4,
      borderRadius: 6,
    },
  });
