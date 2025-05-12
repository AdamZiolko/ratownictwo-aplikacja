import { StyleSheet, Platform } from "react-native";
import { Surface } from "react-native-paper";

export const dashboardStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    contentContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: "#000",
    },
    statsCard: {
        marginBottom: 20,
        backgroundColor: "#111",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    sectionTitle: {
        marginBottom: 0,
        marginTop: 12,
        fontWeight: "bold",
        color: "#fff",
    },
    table: {
        marginBottom: 20,
    },    rowActions: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    actionButtonRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 4,
    },
    actionsTitleContainer: {
        flexDirection: "column",
    },
    actionsSubtitle: {
        fontSize: 10,
        opacity: 0.6,
        color: "#fff",
    },
    studentButtonContainer: {
        position: "relative",
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    studentCountBadge: {
        position: "absolute",
        right: 2,
        top: 2,
        backgroundColor: "#ff5722",
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 2,
    },
    studentCountText: {
        color: "white",
        fontSize: 9,
        fontWeight: "bold",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        color: "#fff",
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
        color: "#fff",
    },
    emptyStateButton: {
        marginTop: 16,
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
        color: "#fff",
    },
    statLabel: {
        textAlign: "center",
        fontSize: Platform.select({
            android: 10,
            default: 12,
        }),
        color: "#fff",
    },
    tableContainer: {
        marginTop: Platform.select({
            android: 60,
            default: 0,
        }),
    },
    rhythmCell: {
        maxWidth: Platform.select({
            android: 60,
            default: 100,
        }),
        fontSize: Platform.select({
            android: 12,
            default: 14,
        }),
        color: "#fff",
    },    tableColumn: {
        flex: 1,
        width: "20%",
    },
    actionsColumn: {
        flex: 1,
        justifyContent: "flex-end",
        width: "20%",
    },
});
