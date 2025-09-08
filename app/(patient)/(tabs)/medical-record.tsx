import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface Document {
  id: string;
  nom: string;
  type: string;
  date: string;
  url: string;
  taille: string;
}

interface Ordonnance {
  id: string;
  medecin: string;
  date: string;
  medicaments: string[];
  statut: 'ACTIVE' | 'TERMINEE';
}

export default function MedicalRecordScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadMedicalData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadMedicalData = async () => {
    setLoading(true);
    try {
      // Simuler le chargement des données médicales
      // À remplacer par les vrais appels API

      const mockDocuments: Document[] = [
        {
          id: '1',
          nom: 'Résultats analyse sang',
          type: 'PDF',
          date: '2024-01-10',
          url: 'https://example.com/doc1.pdf',
          taille: '245 KB',
        },
        {
          id: '2',
          nom: 'Radio thorax',
          type: 'JPG',
          date: '2024-01-05',
          url: 'https://example.com/radio.jpg',
          taille: '1.2 MB',
        },
        {
          id: '3',
          nom: 'ECG',
          type: 'PDF',
          date: '2023-12-20',
          url: 'https://example.com/ecg.pdf',
          taille: '180 KB',
        },
      ];

      const mockOrdonnances: Ordonnance[] = [
        {
          id: '1',
          medecin: 'Dr. Martin Jean',
          date: '2024-01-15',
          medicaments: ['Paracétamol 500mg', 'Vitamine C 1g'],
          statut: 'ACTIVE',
        },
        {
          id: '2',
          medecin: 'Dr. Dubois Marie',
          date: '2023-12-10',
          medicaments: ['Aspirine 100mg', 'Magnésium'],
          statut: 'TERMINEE',
        },
      ];

      setDocuments(mockDocuments);
      setOrdonnances(mockOrdonnances);
    } catch (error) {
      console.error('Erreur chargement données médicales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPress = (document: Document) => {
    Alert.alert(
      document.nom,
      `Type: ${document.type}\nTaille: ${document.taille}\nDate: ${new Date(document.date).toLocaleDateString('fr-FR')}`,
      [
        {
          text: 'Télécharger',
          onPress: () => {
            Alert.alert('Téléchargement', 'Fonctionnalité de téléchargement à venir');
          },
        },
        {
          text: 'Fermer',
          style: 'cancel',
        },
      ]
    );
  };

  const handleOrdonnancePress = (ordonnance: Ordonnance) => {
    Alert.alert(
      'Ordonnance',
      `Médecin: ${ordonnance.medecin}\nDate: ${new Date(ordonnance.date).toLocaleDateString('fr-FR')}\n\nMédicaments:\n${ordonnance.medicaments.map(med => `• ${med}`).join('\n')}`,
      [
        {
          text: 'Voir détails',
          onPress: () => {
            Alert.alert('Détails', 'Affichage détaillé à venir');
          },
        },
        {
          text: 'Fermer',
          style: 'cancel',
        },
      ]
    );
  };

  const getDocumentIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return 'document-text';
      case 'JPG':
      case 'JPEG':
      case 'PNG':
        return 'image';
      case 'DOC':
      case 'DOCX':
        return 'document';
      default:
        return 'document-outline';
    }
  };

  const renderPatientInfo = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons name="person-circle" size={24} color="#007AFF" />
        <Text style={styles.infoTitle}>Informations personnelles</Text>
      </View>
      
      <View style={styles.infoContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom complet :</Text>
          <Text style={styles.infoValue}>
            {user?.prenom} {user?.nom}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date de naissance :</Text>
          <Text style={styles.infoValue}>
            {user?.patient?.datenaissance 
              ? new Date(user.patient.datenaissance).toLocaleDateString('fr-FR')
              : 'Non renseignée'
            }
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Genre :</Text>
          <Text style={styles.infoValue}>
            {user?.patient?.genre === 'M' ? 'Homme' : user?.patient?.genre === 'F' ? 'Femme' : 'Non renseigné'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Groupe sanguin :</Text>
          <Text style={styles.infoValue}>
            {user?.patient?.groupesanguin || 'Non renseigné'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Poids / Taille :</Text>
          <Text style={styles.infoValue}>
            {user?.patient?.poids || 'N/A'}kg / {user?.patient?.taille || 'N/A'}cm
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDocument = (document: Document) => (
    <TouchableOpacity
      key={document.id}
      style={styles.documentItem}
      onPress={() => handleDocumentPress(document)}
    >
      <View style={styles.documentIcon}>
        <Ionicons
          name={getDocumentIcon(document.type) as any}
          size={24}
          color="#007AFF"
        />
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName}>{document.nom}</Text>
        <Text style={styles.documentMeta}>
          {document.type} • {document.taille} • {new Date(document.date).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderOrdonnance = (ordonnance: Ordonnance) => (
    <TouchableOpacity
      key={ordonnance.id}
      style={styles.ordonnanceItem}
      onPress={() => handleOrdonnancePress(ordonnance)}
    >
      <View style={styles.ordonnanceHeader}>
        <View style={styles.ordonnanceIcon}>
          <Ionicons name="medical" size={20} color="#4CAF50" />
        </View>
        <View style={styles.ordonnanceInfo}>
          <Text style={styles.ordonnanceDoctor}>{ordonnance.medecin}</Text>
          <Text style={styles.ordonnanceDate}>
            {new Date(ordonnance.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={[
          styles.statutBadge,
          ordonnance.statut === 'ACTIVE' ? styles.statutActive : styles.statutTerminee
        ]}>
          <Text style={[
            styles.statutText,
            ordonnance.statut === 'ACTIVE' ? styles.statutActiveText : styles.statutTermineeText
          ]}>
            {ordonnance.statut === 'ACTIVE' ? 'En cours' : 'Terminée'}
          </Text>
        </View>
      </View>
      
      <View style={styles.medicamentsList}>
        {ordonnance.medicaments.slice(0, 2).map((medicament, index) => (
          <Text key={index} style={styles.medicamentItem}>
            • {medicament}
          </Text>
        ))}
        {ordonnance.medicaments.length > 2 && (
          <Text style={styles.medicamentMore}>
            +{ordonnance.medicaments.length - 2} autres
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dossier médical</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Alert.alert('Ajouter un document', 'Fonctionnalité à venir');
          }}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPatientInfo()}

        {/* Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents médicaux</Text>
            <Text style={styles.sectionCount}>{documents.length}</Text>
          </View>
          
          <View style={styles.documentsContainer}>
            {documents.length > 0 ? (
              documents.map(document => renderDocument(document))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Aucun document</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ordonnances */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes ordonnances</Text>
            <Text style={styles.sectionCount}>{ordonnances.length}</Text>
          </View>
          
          <View style={styles.ordonnancesContainer}>
            {ordonnances.length > 0 ? (
              ordonnances.map(ordonnance => renderOrdonnance(ordonnance))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Aucune ordonnance</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => Alert.alert('Urgence médicale', 'Contactez immédiatement les services d\'urgence')}
          >
            <Ionicons name="warning" size={24} color="#FF5722" />
            <Text style={styles.quickActionText}>Urgences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => Alert.alert('Carnet de vaccination', 'Fonctionnalité à venir')}
          >
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Vaccins</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => Alert.alert('Allergies', 'Fonctionnalité à venir')}
          >
            <Ionicons name="alert-circle" size={24} color="#FF9500" />
            <Text style={styles.quickActionText}>Allergies</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  infoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  ordonnancesContainer: {
    gap: 12,
  },
  ordonnanceItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ordonnanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ordonnanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ordonnanceInfo: {
    flex: 1,
  },
  ordonnanceDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ordonnanceDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutActive: {
    backgroundColor: '#E8F5E8',
  },
  statutTerminee: {
    backgroundColor: '#F0F0F0',
  },
  statutText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statutActiveText: {
    color: '#4CAF50',
  },
  statutTermineeText: {
    color: '#666',
  },
  medicamentsList: {
    gap: 4,
  },
  medicamentItem: {
    fontSize: 14,
    color: '#666',
  },
  medicamentMore: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});