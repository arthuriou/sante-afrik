import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mes messages</Text>
        <TouchableOpacity style={styles.newButton}>
          <Text style={styles.newButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Conversations (à venir)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  newButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  newButtonText: { color: '#FFFFFF', fontWeight: '600' },
  placeholder: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#6B7280' },
});


