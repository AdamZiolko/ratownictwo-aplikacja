import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { Text, Button, Portal, useTheme } from "react-native-paper";
import RhythmSelectionGrid from "./RhythmSelectionGrid";
import { EkgType } from "../../../../services/EkgFactory";

interface RhythmSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  selectedType: EkgType;
  setSelectedType: (type: EkgType) => void;
}

const RhythmSelectionModal = ({
  visible,
  onDismiss,
  selectedType,
  setSelectedType,
}: RhythmSelectionModalProps) => {
  const theme = useTheme();
  
  const handleRhythmSelect = (type: EkgType) => {
    setSelectedType(type);
    onDismiss();
  };

  return (
    <Portal>      <Modal
        visible={visible}
        onDismiss={onDismiss}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: theme.colors.background }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Wybór rytmu EKG</Text>
              <Button 
                mode="outlined" 
                onPress={onDismiss}
                style={styles.closeButton}
                icon="close"
              >
                Zamknij
              </Button>
            </View>
            
            <ScrollView style={styles.scrollView}>
              <RhythmSelectionGrid
                selectedType={selectedType}
                setSelectedType={handleRhythmSelect}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    paddingTop: 12,
    paddingBottom: 20,
  },  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  closeButton: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
});

export default RhythmSelectionModal;