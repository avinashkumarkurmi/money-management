import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function FilterModal({
  visible,
  onClose,
  options,
  onSelect,
  title = "Filter Options",
  secondOptions = [],
  onSecondSelect,
  secondTitle = "Secondary Filter",
  selectedOption,
  selectedSecondOption
}) {
  const [tempPrimary, setTempPrimary] = useState(null);
  const [tempSecondary, setTempSecondary] = useState(null);

  useEffect(() => {
    if (visible) {
      setTempPrimary(selectedOption || options[0]);
      setTempSecondary(secondOptions.length > 0 ? (selectedSecondOption || secondOptions[0]) : null);
    }
  }, [visible]);

  const renderRadioOption = (item, selectedItem, onPress) => {
    const isSelected = selectedItem?.value === item.value;
    return (
      <Pressable style={styles.option} onPress={() => onPress(item)}>
        <View style={styles.radioContainer}>
          <View style={[styles.radioCircle, isSelected && styles.radioSelected]} />
          <Text style={styles.optionLabel}>{item.label || item}</Text>
        </View>
      </Pressable>
    );
  };

  const handleApply = () => {
    onSelect?.(tempPrimary);
    if (secondOptions.length > 0 && tempSecondary) {
      onSecondSelect?.(tempSecondary);
    }
    onClose(); // close after applying
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item, index) => `primary-${index}`}
            renderItem={({ item }) =>
              renderRadioOption(item, tempPrimary, setTempPrimary)
            }
          />

          {secondOptions.length > 0 && (
            <>
              <Text style={styles.title}>{secondTitle}</Text>
              <FlatList
                data={secondOptions}
                keyExtractor={(item, index) => `secondary-${index}`}
                renderItem={({ item }) =>
                  renderRadioOption(item, tempSecondary, setTempSecondary)
                }
              />
            </>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable style={[styles.closeBtn, { flex: 1, backgroundColor: "grey" }]} onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.closeBtn, { flex: 1 }]} onPress={handleApply}>
              <Text style={styles.closeText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  option: {
    paddingVertical: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#555',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#555',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  closeBtn: {
    marginTop: 20,
    marginHorizontal: 5,
    backgroundColor: '#2e86de',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
