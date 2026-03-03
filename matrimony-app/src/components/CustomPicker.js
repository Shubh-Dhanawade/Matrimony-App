import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "../utils/constants";

const CustomPicker = ({
  label,
  value,
  options,
  placeholder,
  onSelect,
  error,
  disabled,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.pickerTrigger,
          error && styles.errorBorder,
          disabled && styles.disabledTrigger,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text
          style={[
            styles.valueText,
            (!value || disabled) && styles.placeholderText,
          ]}
        >
          {!disabled && typeof options[0] === "object"
            ? options.find((o) => o.value === value)?.label || placeholder
            : !disabled && value
              ? value
              : placeholder}
        </Text>
        <Text style={[styles.arrow, disabled && styles.disabledArrow]}>▼</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible && !disabled}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <FlatList
                data={options}
                keyExtractor={(item, index) =>
                  typeof item === "object" ? item.value : item
                }
                renderItem={({ item }) => {
                  const isObject = typeof item === "object";
                  const labelStr = isObject ? item.label : item;
                  const itemValue = isObject ? item.value : item;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        itemValue === value && styles.selectedOption,
                      ]}
                      onPress={() => handleSelect(itemValue)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          itemValue === value && styles.selectedOptionText,
                        ]}
                      >
                        {labelStr}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
  },
  valueText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  arrow: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  disabledTrigger: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
    opacity: 0.7,
  },
  disabledArrow: {
    color: "#BDBDBD",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    maxHeight: "80%",
    padding: SPACING.md,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  optionItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedOption: {
    backgroundColor: COLORS.primary + "10", // Light primary background
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
});

export default CustomPicker;
