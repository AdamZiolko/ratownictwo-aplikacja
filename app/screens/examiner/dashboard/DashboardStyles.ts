import { StyleSheet, Platform, Dimensions } from "react-native";
import { MD3Theme } from "react-native-paper";

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export const createDashboardStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        flex: 1,
        paddingTop: Platform.select({
            ios: 0,
            android: 0,
            default: 16,
        }),
    },
    tableContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: theme.colors.onBackground,
        marginTop: 16,
    },
    emptyState: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
    },
    emptyStateText: {
        textAlign: "center",
        marginVertical: 16,
        opacity: 0.7,
        color: theme.colors.onBackground,
        fontSize: 16,
    },
    emptyStateButton: {
        marginTop: 16,
    },
    mobileCard: {
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        elevation: 2,
        shadowColor: theme.dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    mobileCardTitle: {
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: "bold",
    },
    mobileCardSubtitle: {
        fontSize: isSmallScreen ? 12 : 14,
        opacity: 0.7,
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
    },
    mobileCardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
        borderRadius: 28,
        elevation: 4,
        shadowColor: theme.dark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    snackbar: {
        margin: 16,
        borderRadius: 4,
    },
    successSnackbar: {
        backgroundColor: "#4CAF50",
    },
    errorSnackbar: {
        backgroundColor: "#F44336",
    },
    statsHeader: {
        position: "absolute",
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
        alignItems: "center",
        flex: 1,
        padding: Platform.select({
            android: 4,
            default: 8,
        }),
    },
    statValue: {
        fontWeight: "bold",
        fontSize: Platform.select({
            android: 16,
            default: 20,
        }),
        color: theme.colors.onSurface,
    },
    statLabel: {
        textAlign: "center",
        fontSize: Platform.select({
            android: 10,
            default: 12,
        }),
        color: theme.colors.onSurface,
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
            android: "auto",
            ios: "auto",
            default: "20%",
        }),
        maxWidth: Platform.select({
            default: "20%",
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
        justifyContent: "flex-end",
        width: Platform.select({
            android: "auto",
            ios: "auto",
            default: "20%",
        }),
        maxWidth: Platform.select({
            default: "20%",
            android: undefined,
            ios: undefined,
        }),
    },
    header: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 8,
    }
});