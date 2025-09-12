import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      {/* Header iOS-style */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Motif du rendez-vous</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.cardTitle}>Décrivez votre motif</Text>
              <Text style={styles.cardSubtitle}>Aidez votre médecin à mieux vous préparer</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Motif de consultation</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Consultation de routine, douleur au dos, suivi médical..."
              placeholderTextColor="#8E8E93"
              value={motif}
              onChangeText={setMotif}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{motif.length}/500</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoTitle}>Information</Text>
          </View>
          <Text style={styles.infoText}>
            Votre motif sera transmis au médecin avant votre rendez-vous pour une meilleure préparation.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.validateButton, loading && styles.validateButtonDisabled]}
          onPress={handleValidate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.validateButtonText}>Confirmer le rendez-vous</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  inputSection: {
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1D1D1F',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  characterCount: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  bottomContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 34,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  validateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  validateButtonDisabled: {
    opacity: 0.6,
  },
  validateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
});
