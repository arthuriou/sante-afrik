import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SanteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ma santé</Text>
        <Text style={styles.subtitle}>Créez votre dossier et ajoutez des documents</Text>

        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Créer un dossier</Text>
            <Text style={styles.cardDesc}>Centralisez vos informations médicales</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Ajouter un document</Text>
            <Text style={styles.cardDesc}>Ordonnances, analyses, imageries...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Liste des documents (à venir)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280' },
  placeholderBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  placeholderText: { color: '#6B7280', textAlign: 'center' },
});


