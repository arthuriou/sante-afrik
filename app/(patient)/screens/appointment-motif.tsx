import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiService } from '../../../services/api';

export default function AppointmentMotifScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string; creneauId?: string; start?: string; end?: string; rdvId?: string }>();
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!params.doctorId || !params.creneauId) {
      Alert.alert('Erreur', 'Informations incomplètes pour la prise de rendez-vous');
      return;
    }
    try {
      setLoading(true);
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const patientId = userData?.patient?.idpatient || userData?.idutilisateur;
      if (!patientId) {
        throw new Error("Impossible d'identifier le patient");
      }
      const dateheure = params.start || new Date().toISOString();
      const duree = params.end ? Math.max(15, Math.round((new Date(params.end as string).getTime() - new Date(dateheure).getTime()) / 60000)) : 30;

      if (params.rdvId) {
        await apiService.updateRendezVous(params.rdvId as string, {
          dateheure,
          duree,
          motif: motif || 'Consultation',
          creneau_id: params.creneauId as string,
        });
      } else {
        await apiService.createRendezVous({
          patient_id: patientId,
          medecin_id: params.doctorId as string,
          dateheure,
          duree,
          motif: motif || 'Consultation',
          creneau_id: params.creneauId as string,
        });
      }
      Alert.alert('Succès', 'Rendez-vous créé avec succès');
      router.replace('/(patient)/screens/appointments' as any);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={22} color="#007AFF" />
        <Text style={styles.headerTitle}>Motif du rendez-vous</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Motif</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Consultation de routine"
          placeholderTextColor="#9CA3AF"
          value={motif}
          onChangeText={setMotif}
          multiline
        />

        <TouchableOpacity
          style={[styles.validateButton, loading && styles.validateButtonDisabled]}
          onPress={handleValidate}
          disabled={loading}
        >
          <Text style={styles.validateButtonText}>{loading ? 'Validation...' : 'Valider le rendez-vous'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  form: { backgroundColor: 'white', margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  input: { minHeight: 120, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, color: '#111827', textAlignVertical: 'top' },
  validateButton: { marginTop: 16, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  validateButtonDisabled: { opacity: 0.6 },
  validateButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
