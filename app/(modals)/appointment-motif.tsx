import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiService } from '../../services/api';

export default function AppointmentMotifScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string; creneauId?: string; start?: string; end?: string; rdvId?: string; doctor?: string }>();
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    console.log('🔍 Validation RDV - Paramètres reçus:', params);
    
    if (!params.doctorId || !params.creneauId) {
      Alert.alert('Erreur', 'Informations incomplètes pour la prise de rendez-vous');
      return;
    }
    try {
      setLoading(true);
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      
      // Utiliser le vrai ID patient depuis les données utilisateur
      const patientId = userData?.patient?.idpatient;
      console.log('🔧 Patient ID récupéré:', patientId);
      
      console.log('🔍 Debug patientId:', { 
        userData, 
        patientId, 
        patientIdpatient: userData?.patient?.idpatient,
        idutilisateur: userData?.idutilisateur 
      });
      
      if (!patientId) {
        throw new Error("Impossible d'identifier le patient - ID manquant");
      }
      const dateheure = params.start || new Date().toISOString();
      const duree = params.end ? Math.max(15, Math.round((new Date(params.end as string).getTime() - new Date(dateheure).getTime()) / 60000)) : 30;

      if (params.rdvId) {
        await apiService.updateRendezVous(params.rdvId as string, {
          dateheure,
          duree,
          motif: motif || 'Consultation',
        } as any);
      } else {
        const rdvData: any = {
          medecin_id: params.doctorId as string,
          dateheure,
          duree,
          motif: motif || 'Consultation',
          creneau_id: params.creneauId,
          type_rdv: 'PRESENTIEL' as const
        };
        
        // Gestion des médecins sans cabinet
        const doctorData = params.doctor ? JSON.parse(params.doctor as string) : null;
        if (!doctorData?.cabinet?.nom) {
          console.log('🏠 Médecin sans cabinet détecté, ajout adresse par défaut');
          // Pour les médecins sans cabinet, on ajoute une adresse par défaut
          // Le lieu exact sera discuté dans la messagerie
          rdvData.adresse_cabinet = 'Lieu à convenir avec le médecin';
        } else {
          console.log('🏥 Médecin avec cabinet:', doctorData.cabinet.nom);
          rdvData.adresse_cabinet = doctorData.cabinet.adresse || doctorData.cabinet.nom;
        }
        
        console.log('📅 Création du RDV:', rdvData);
        const newRdv = await apiService.createRendezVous(rdvData);
        console.log('✅ RDV créé:', newRdv);
        
        // Envoyer une notification au médecin
        try {
          console.log('🔔 Envoi notification au médecin...');
          await apiService.createNotification({
            titre: 'Nouveau rendez-vous',
            contenu: `Nouveau rendez-vous programmé le ${new Date(dateheure).toLocaleDateString('fr-FR')} à ${new Date(dateheure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            type_notification: 'RENDEZ_VOUS',
            data: {
              rdvId: (newRdv as any)?.data?.idrendezvous || (newRdv as any)?.id || 'unknown',
              patientId: patientId,
              dateheure: dateheure,
              motif: motif || 'Consultation'
            }
          });
          console.log('✅ Notification envoyée au médecin');
        } catch (notifError) {
          console.log('⚠️ Erreur notification:', notifError);
          // Ne pas faire échouer la création du RDV pour une erreur de notification
        }
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
        {/* Résumé du RDV */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <Text style={styles.summaryTitle}>Résumé du rendez-vous</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Médecin</Text>
              <Text style={styles.summaryValue}>Dr. {params.doctorId}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date et heure</Text>
              <Text style={styles.summaryValue}>
                {params.start ? new Date(params.start).toLocaleString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Non défini'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durée</Text>
              <Text style={styles.summaryValue}>
                {params.start && params.end 
                  ? `${Math.round((new Date(params.end).getTime() - new Date(params.start).getTime()) / 60000)} minutes`
                  : '30 minutes'
                }
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type</Text>
              <Text style={styles.summaryValue}>
                {(() => {
                  const doctorData = params.doctor ? JSON.parse(params.doctor as string) : null;
                  if (!doctorData?.cabinet?.nom) {
                    return 'Présentiel (lieu à convenir)';
                  }
                  return 'Présentiel';
                })()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lieu</Text>
              <Text style={styles.summaryValue}>
                {(() => {
                  const doctorData = params.doctor ? JSON.parse(params.doctor as string) : null;
                  if (!doctorData?.cabinet?.nom) {
                    return 'À convenir avec le médecin';
                  }
                  return doctorData?.cabinet?.nom || 'Cabinet médical';
                })()}
              </Text>
            </View>
          </View>
        </View>

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
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
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
