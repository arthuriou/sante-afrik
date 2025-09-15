import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiService, User } from '../../../services/api';

export default function EditMedecinProfileModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '',
    numordre: '', experience: '', biographie: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const resp = await apiService.getProfile();
      const u = resp.data;
      setUser(u);
      setForm({
        nom: u.nom || '',
        prenom: u.prenom || '',
        telephone: u.telephone || '',
        numordre: u.medecin?.numordre || '',
        experience: String(u.medecin?.experience ?? ''),
        biographie: u.medecin?.biographie || '',
      });
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Chargement impossible');
    } finally { setLoading(false); }
  }

  async function onSave() {
    try {
      setSaving(true);
      const userUpdate: any = {};
      if (form.nom.trim()) userUpdate.nom = form.nom.trim();
      if (form.prenom.trim()) userUpdate.prenom = form.prenom.trim();
      if (form.telephone.trim()) userUpdate.telephone = form.telephone.trim();
      if (Object.keys(userUpdate).length) await apiService.updateUserProfile(userUpdate);

      const medUpdate: any = {};
      if (form.numordre.trim()) medUpdate.numordre = form.numordre.trim();
      if (form.experience.trim()) {
        const exp = parseInt(form.experience, 10);
        if (!isNaN(exp)) medUpdate.experience = exp;
      }
      if (form.biographie.trim()) medUpdate.biographie = form.biographie.trim();
      if (Object.keys(medUpdate).length) await apiService.updateProfileMedecin(medUpdate);

      Alert.alert('Succès', 'Profil mis à jour', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de sauvegarder');
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
        <TouchableOpacity onPress={onSave} style={[styles.saveButton, saving && styles.saveButtonDisabled]} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Enregistrer</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Ionicons name="person" size={20} color="#007AFF" /><Text style={styles.sectionTitle}>Informations générales</Text></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Nom</Text><TextInput style={styles.input} value={form.nom} onChangeText={(t)=>setForm({...form, nom:t})} placeholder="Nom" placeholderTextColor="#8E8E93" /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Prénom</Text><TextInput style={styles.input} value={form.prenom} onChangeText={(t)=>setForm({...form, prenom:t})} placeholder="Prénom" placeholderTextColor="#8E8E93" /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Téléphone</Text><TextInput style={styles.input} value={form.telephone} onChangeText={(t)=>setForm({...form, telephone:t})} placeholder="Téléphone" keyboardType="phone-pad" placeholderTextColor="#8E8E93" /></View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><Ionicons name="medkit-outline" size={20} color="#007AFF" /><Text style={styles.sectionTitle}>Informations professionnelles</Text></View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro d'ordre</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={form.numordre}
              editable={false}
              placeholder="Numéro d'ordre"
              placeholderTextColor="#8E8E93"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.half]}><Text style={styles.label}>Expérience (années)</Text><TextInput style={styles.input} value={form.experience} onChangeText={(t)=>setForm({...form, experience:t})} keyboardType="number-pad" placeholder="5" placeholderTextColor="#8E8E93" /></View>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Spécialités</Text>
              <TextInput style={styles.input} editable={false} placeholder={user?.medecin?.specialites?.map(s=>s.nom).join(', ') || 'Depuis profil'} placeholderTextColor="#8E8E93" />
            </View>
          </View>
          <View style={styles.inputGroup}><Text style={styles.label}>Biographie</Text><TextInput style={[styles.input, styles.textArea]} value={form.biographie} onChangeText={(t)=>setForm({...form, biographie:t})} multiline numberOfLines={3} placeholder="Quelques mots sur vous" placeholderTextColor="#8E8E93" /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#8E8E93' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#C6C6C8' },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#000', textAlign: 'center' },
  saveButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, minWidth: 80, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#8E8E93' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1D1D1F', marginLeft: 8 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#F2F2F7', color: '#1D1D1F' },
  inputDisabled: { opacity: 0.6 },
  textArea: { height: 84, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
});


