import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService } from '../../../services/api';

interface Creneau {
  idcreneau: string;
  agenda_id: string;
  debut: string;
  fin: string;
  disponible: boolean;
  duree: number;
}

interface Agenda {
  idagenda: string;
  medecin_id: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  duree_creneau: number;
  pause_debut?: string;
  pause_fin?: string;
}

export default function CreneauxScreen() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newCreneau, setNewCreneau] = useState({
    debut: '',
    fin: '',
    duree: 30,
  });

  useEffect(() => {
    loadAgendas();
    loadCreneaux();
  }, [selectedDate]);

  const loadAgendas = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'ID du médecin depuis le profil
      const profile = await apiService.getProfile();
      const medecinId = profile.data.medecin?.idmedecin;
      
      if (!medecinId) {
        throw new Error('ID médecin non trouvé');
      }
      
      // Récupérer les agendas du médecin
      const response = await apiService.getAgendasMedecin(medecinId);
      setAgendas(response.data || []);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des agendas:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les agendas');
    } finally {
      setLoading(false);
    }
  };

  const loadCreneaux = async () => {
    try {
      // Récupérer l'ID du médecin depuis le profil
      const profile = await apiService.getProfile();
      const medecinId = profile.data.medecin?.idmedecin;
      
      if (!medecinId) {
        throw new Error('ID médecin non trouvé');
      }
      
      // Récupérer les créneaux pour la date sélectionnée
      const date = selectedDate.toISOString().split('T')[0];
      const response = await apiService.getCreneauxDisponibles(medecinId, date);
      setCreneaux(response.data || []);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des créneaux:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les créneaux');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCreneaux().finally(() => setRefreshing(false));
  };

  const handleAddCreneau = async () => {
    if (!newCreneau.debut || !newCreneau.fin) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const agendaId = agendas[0]?.idagenda; // Utiliser le premier agenda
      if (!agendaId) {
        Alert.alert('Erreur', 'Aucun agenda configuré');
        return;
      }

      // Utiliser l'API service pour créer un créneau
      await apiService.createCreneau({
        agenda_id: agendaId,
        debut: `${selectedDate.toISOString().split('T')[0]}T${newCreneau.debut}:00Z`,
        fin: `${selectedDate.toISOString().split('T')[0]}T${newCreneau.fin}:00Z`,
        disponible: true,
      });

      Alert.alert('Succès', 'Créneau ajouté avec succès');
      setShowAddModal(false);
      setNewCreneau({ debut: '', fin: '', duree: 30 });
      loadCreneaux();
      
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le créneau');
    }
  };

  const handleToggleDisponibilite = async (creneauId: string, disponible: boolean) => {
    try {
      // Utiliser l'API service pour modifier le créneau
      await apiService.updateCreneau(creneauId, { disponible: !disponible });
      loadCreneaux();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier le créneau');
    }
  };

  const handleDeleteCreneau = async (creneauId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce créneau ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Utiliser l'API service pour supprimer le créneau
              await apiService.deleteCreneau(creneauId);
              Alert.alert('Succès', 'Créneau supprimé');
              loadCreneaux();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le créneau');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const renderCreneau = ({ item }: { item: Creneau }) => (
    <View style={styles.creneauCard}>
      <View style={styles.creneauHeader}>
        <View style={styles.timeInfo}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.timeText}>
            {formatTime(item.debut)} - {formatTime(item.fin)}
          </Text>
        </View>
        <View style={styles.durationInfo}>
          <Text style={styles.durationText}>{item.duree} min</Text>
        </View>
      </View>

      <View style={styles.creneauActions}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.disponible ? styles.availableButton : styles.unavailableButton
          ]}
          onPress={() => handleToggleDisponibilite(item.idcreneau, item.disponible)}
        >
          <Ionicons
            name={item.disponible ? "checkmark-circle" : "close-circle"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.statusButtonText}>
            {item.disponible ? 'Disponible' : 'Indisponible'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCreneau(item.idcreneau)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Chargement des créneaux...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestion des Créneaux</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => changeDate('prev')}
        >
          <Ionicons name="chevron-back" size={20} color="#E53E3E" />
        </TouchableOpacity>
        
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => changeDate('next')}
        >
          <Ionicons name="chevron-forward" size={20} color="#E53E3E" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={creneaux}
        renderItem={renderCreneau}
        keyExtractor={(item) => item.idcreneau}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Aucun créneau</Text>
            <Text style={styles.emptySubtext}>
              Aucun créneau configuré pour cette date
            </Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un créneau</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Heure de début</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newCreneau.debut}
                  onChangeText={(text) => setNewCreneau({ ...newCreneau, debut: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Heure de fin</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newCreneau.fin}
                  onChangeText={(text) => setNewCreneau({ ...newCreneau, fin: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Durée (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  value={newCreneau.duree.toString()}
                  onChangeText={(text) => setNewCreneau({ ...newCreneau, duree: parseInt(text) || 30 })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddCreneau}
              >
                <Text style={styles.saveButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#E53E3E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateButton: {
    padding: 8,
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  creneauCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creneauHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  durationInfo: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  creneauActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  availableButton: {
    backgroundColor: '#10B981',
  },
  unavailableButton: {
    backgroundColor: '#EF4444',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'System',
  },
});
