import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { VoiceMessagePlayer } from '../../../../components/VoiceMessagePlayer';
import { VoiceRecorder } from '../../../../components/VoiceRecorder';
import { API_BASE_URL, apiService, Message } from '../../../../services/api';
import { AudioService } from '../../../../services/audio';
import { bindMessagingRealtime, createSocket, joinConversation, leaveConversation } from '../../../../services/socket';

export default function MedecinConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const idsSeenRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const [contactName, setContactName] = useState<string>('Conversation');
  const [contactPhoto, setContactPhoto] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState<{uri: string, duration: number} | null>(null);
  const audioService = useRef(new AudioService()).current;

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMessages(id);
      setMessages(response.data || []);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
      await apiService.markConversationAsRead(id);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationHeader = async () => {
    try {
      const conv = await apiService.getConversation(String(id));
      const c: any = (conv as any)?.data || conv;
      
      // Récupère mon profil pour connaître mon idutilisateur
      let meId: string | undefined;
      try {
        const me = await apiService.getProfile();
        meId = (me as any)?.data?.idutilisateur || (me as any)?.data?.id;
      } catch {}

      // Garder la structure des participants
      const parts: any[] = Array.isArray(c?.participants) ? c.participants : [];

      // L'autre participant (différent de moi) - le patient
      const others = parts.filter((p: any) => String(p?.utilisateur?.idutilisateur) !== String(meId));
      const target = others.find((p: any) => p?.role_participant === 'MEMBRE') || others[0];

      if (target?.utilisateur) {
        const u = target.utilisateur;
        const fullName = [`${u?.prenom || ''}`.trim(), `${u?.nom || ''}`.trim()].filter(Boolean).join(' ').trim() || u?.nom || 'Patient';
        setContactName(fullName);

        // Utiliser seulement les champs qui existent dans la DB
        let avatar = u.photoprofil || u.photo || target.photoprofil || target.photo;

        // Normaliser l'URL de l'avatar
        if (avatar) {
          let normalizedUrl = avatar;
          if (avatar.startsWith('https://res.cloudinary.com/')) {
            normalizedUrl = avatar;
          } else if (avatar.startsWith('http')) {
            normalizedUrl = avatar;
          } else if (avatar.startsWith('/')) {
            normalizedUrl = `${API_BASE_URL}${avatar}`;
          } else {
            normalizedUrl = `${API_BASE_URL}/${avatar}`;
          }
          setContactPhoto(normalizedUrl);
        } else if (u?.idutilisateur) {
          // Fallback API : récupérer la photo du patient via son ID
          try {
            const userResponse = await apiService.getUserById(u.idutilisateur);
            const userData = (userResponse as any)?.data || userResponse;
            const fallbackAvatar = userData?.photoprofil || userData?.photo;
            
            if (fallbackAvatar) {
              let normalizedUrl = fallbackAvatar;
              if (fallbackAvatar.startsWith('https://res.cloudinary.com/')) {
                normalizedUrl = fallbackAvatar;
              } else if (fallbackAvatar.startsWith('http')) {
                normalizedUrl = fallbackAvatar;
              } else if (fallbackAvatar.startsWith('/')) {
                normalizedUrl = `${API_BASE_URL}${fallbackAvatar}`;
              } else {
                normalizedUrl = `${API_BASE_URL}/${fallbackAvatar}`;
              }
              setContactPhoto(normalizedUrl);
            }
          } catch (e) {
            console.log('❌ Fallback avatar failed:', e);
          }
        }
      }
    } catch (error) {
      console.log('❌ Erreur loadConversationHeader:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    loadConversationHeader();
    let s: any;
    (async () => {
      s = await createSocket();
      joinConversation(s, String(id));
      bindMessagingRealtime(s, {
        onNewMessage: (m) => {
          if (m?.conversation_id !== id) return;
          const mid = String(m.idmessage || '');
          setMessages((prev) => {
            if (mid && idsSeenRef.current.has(mid)) return prev;
            if (mid) idsSeenRef.current.add(mid);
            const withoutTmp = prev.filter(mm => !(String((mm as any).idmessage).startsWith('tmp-') && mm.contenu === m.contenu));
            return [...withoutTmp, m];
          });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        },
        onConversationRead: (data) => {
          // Vérifier que l'événement concerne bien cette conversation
          if (data.conversation_id !== id) return;

          setMessages((prevMessages: any[]) => 
            prevMessages.map((msg: any) => {
              // Mettre à jour uniquement les messages que J'AI envoyés
              // et qui ne sont pas encore marqués comme lus.
              const isMine = msg.est_mien === true || msg.expediteur_id === 'me';
              if (isMine) {
                return {
                  ...msg,
                  // Simuler l'ajout d'une personne dans le tableau `lu_par`
                  // pour que le double checkmark s'affiche.
                  lu_par: [{ id: data.reader_id }], 
                };
              }
              return msg;
            })
          );
        }
      });
    })();
    return () => { try { leaveConversation(s, String(id)); } catch {} };
  }, [id]);

  const send = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    try {
      setSending(true);
      const optimistic: Message = {
        idmessage: `tmp-${Date.now()}`,
        conversation_id: String(id),
        expediteur_id: 'me',
        contenu: content,
        type_message: 'TEXTE' as any,
        dateEnvoi: new Date().toISOString(),
        expediteur: { idutilisateur: 'me', nom: '', prenom: '', email: '', role: '' },
        lu_par: [],
      };
      setMessages((prev) => [...prev, optimistic]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      await apiService.sendMessage(String(id), content);
    } catch (error) {
      Alert.alert('Erreur', 'Envoi impossible');
      setInput(content); // Remettre le texte si l'envoi échoue
    } finally {
      setSending(false);
    }
  };

  const pickAndSendImage = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('contenu', 'Image');
        formData.append('type_message', 'IMAGE');
        formData.append('file', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: `image_${Date.now()}.jpg`,
        } as any);

        const optimistic: any = {
          idmessage: `tmp-${Date.now()}`,
          conversation_id: String(id),
          expediteur_id: 'me',
          contenu: 'Image',
          type_message: 'IMAGE' as any,
          dateEnvoi: new Date().toISOString(),
          expediteur: { idutilisateur: 'me', nom: '', prenom: '', email: '', role: '' },
          lu_par: [],
          fichier_url: asset.uri,
        };
        setMessages((prev) => [...prev, optimistic]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

        await apiService.sendMessageWithFile(String(id), 'Image', formData);
      }
    } catch (error) {
      console.error('Erreur envoi image:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
    } finally {
      setUploading(false);
    }
  };

  const pickAndSendFile = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('contenu', asset.name || 'Fichier');
        formData.append('type_message', 'FICHIER');
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name || `file_${Date.now()}`,
        } as any);

        const optimistic: any = {
          idmessage: `tmp-${Date.now()}`,
          conversation_id: String(id),
          expediteur_id: 'me',
          contenu: asset.name || 'Fichier',
          type_message: 'FICHIER' as any,
          dateEnvoi: new Date().toISOString(),
          expediteur: { idutilisateur: 'me', nom: '', prenom: '', email: '', role: '' },
          lu_par: [],
          fichier_url: asset.uri,
        };
        setMessages((prev) => [...prev, optimistic]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

        await apiService.sendMessageWithFile(String(id), asset.name || 'Fichier', formData);
      }
    } catch (error) {
      console.error('Erreur envoi fichier:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le fichier');
    } finally {
      setUploading(false);
    }
  };

  const openWithSystem = async (url?: string, suggestedName?: string) => {
    if (!url) return;
    let opened = false;
    try {
      // iOS: enregistrer dans la galerie si image, sinon ouvrir dans navigateur (l'utilisateur sauvegarde ensuite)
      if (Platform.OS === 'ios') {
        if (/\.(png|jpe?g|gif|webp|heic)$/i.test(suggestedName || '')) {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            try { await MediaLibrary.saveToLibraryAsync(url); opened = true; Alert.alert('Succès', 'Image enregistrée dans Photos'); } catch {}
          }
        }
        if (!opened) {
          try { await WebBrowser.openBrowserAsync(url); opened = true; } catch {}
        }
        if (opened) return;
      }
      // Android: utiliser le SAF pour enregistrer dans Téléchargements et donner un content:// durable
      if (Platform.OS === 'android') {
        // Cas images: enregistrer dans l'album "Download(s)" pour les voir tout de suite
        if (/\.(png|jpe?g|gif|webp|heic)$/i.test(suggestedName || '')) {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            try {
              const asset = await MediaLibrary.createAssetAsync(url);
              let album = await MediaLibrary.getAlbumAsync('Download');
              if (!album) album = await MediaLibrary.getAlbumAsync('Downloads');
              if (!album) {
                await MediaLibrary.createAlbumAsync('Download', asset, false);
              } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
              }
              try { await Linking.openURL(asset.uri); } catch {}
              return;
            } catch {}
          }
        }
        try {
          const mime = suggestedName?.match(/\.pdf$/i) ? 'application/pdf' : (/\.(png|jpe?g|gif|webp|heic)$/i.test(suggestedName || '') ? 'image/*' : 'application/octet-stream');
          const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (perm.granted) {
            const base64 = await FileSystem.readAsStringAsync(url, { encoding: FileSystem.EncodingType.Base64 });
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(perm.directoryUri, suggestedName || `file_${Date.now()}`, mime);
            try { await Linking.openURL(fileUri); } catch {}
            return;
          }
        } catch {}
        // Fallback: ouvrir via content:// depuis le cache
        try {
          const res = await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + (suggestedName || `file_${Date.now()}`));
          if (Platform.OS === 'android') {
            const contentUri = await FileSystem.getContentUriAsync(res.uri);
            try { await Linking.openURL(contentUri); } catch {}
          } else {
            try { await WebBrowser.openBrowserAsync(res.uri); } catch {}
          }
        } catch {}
      }
    } catch (error) {
      console.error('Erreur ouverture fichier:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
    }
  };

  // Fonction pour gérer l'enregistrement terminé
  const handleRecordingComplete = (audioUri: string, duration: number) => {
    setRecordingAudio({ uri: audioUri, duration });
    setShowVoiceRecorder(false);
  };

  // Fonction pour envoyer la note vocale
  const sendVoiceMessage = async () => {
    if (!recordingAudio) return;

    try {
      setSending(true);
      const optimistic: any = {
        idmessage: `tmp-${Date.now()}`,
        conversation_id: String(id),
        expediteur_id: 'me',
        contenu: `Note vocale (${Math.floor(recordingAudio.duration)}s)`,
        type_message: 'VOICE' as any,
        dateEnvoi: new Date().toISOString(),
        expediteur: { idutilisateur: 'me', nom: '', prenom: '', email: '', role: '' },
        lu_par: [],
        fichier_url: recordingAudio.uri,
      };
      
      setMessages(prev => [...prev, optimistic]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

      // Créer FormData pour l'envoi du fichier audio
      const formData = new FormData();
      formData.append('contenu', `Note vocale (${Math.floor(recordingAudio.duration)}s)`);
      formData.append('type_message', 'VOICE');
      formData.append('file', {
        uri: recordingAudio.uri,
        type: 'audio/m4a',
        name: `voice_${Date.now()}.m4a`,
      } as any);

      // Envoyer via API avec le fichier audio
      await apiService.sendMessageWithFile(String(id), `Note vocale (${Math.floor(recordingAudio.duration)}s)`, formData);
      
      setRecordingAudio(null);
    } catch (error) {
      console.error('Erreur envoi note vocale:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la note vocale');
    } finally {
      setSending(false);
    }
  };

  // Fonction pour jouer un audio
  const playAudio = async (uri: string) => {
    try {
      await audioService.playAudio(uri);
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      Alert.alert('Erreur', 'Impossible de lire l\'audio');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = (item as any).est_mien === true || item.expediteur_id === 'me';
    const typeMessage = (item as any).type_message || (item as any).typemessage;
    const isImageFlag = typeMessage === 'IMAGE';
    const isFile = typeMessage === 'FICHIER';
    const isVoice = typeMessage === 'VOICE';
    const safeTime = (() => {
      const raw = (item as any).dateEnvoi || (item as any).dateenvoi || item.dateEnvoi;
      const d = new Date(raw as any);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    })();
    let fileUrl = (item as any).fichier_url || (item as any).fichierUrl || '';
    if (!fileUrl) {
      fileUrl = (item as any).contenu || '';
      if (fileUrl && fileUrl.startsWith('/')) fileUrl = `${API_BASE_URL}${fileUrl}`;
    }
    let displayUrl = isImageFlag ? fileUrl : fileUrl;
    // Les URLs Cloudinary sont déjà absolues, pas besoin de les modifier
    if (displayUrl && displayUrl.startsWith('/') && !displayUrl.startsWith('https://')) {
      displayUrl = `${API_BASE_URL}${displayUrl}`;
    }
    const fileName = (item as any).fichier_nom || (item as any).fichierNom || '';
    const contentStr = (item as any).contenu || '';
    const urlForImageHeuristic = displayUrl || contentStr;
    const looksLikeImage = /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(urlForImageHeuristic || '');
    const looksLikeAudio = /\.(m4a|mp3|wav|aac|ogg)$/i.test(urlForImageHeuristic || '');
    const isImage = isImageFlag || looksLikeImage;
    const isVoiceFinal = isVoice || looksLikeAudio;
    return (
      <View style={[styles.messageContainer, isMine ? styles.messageContainerRight : styles.messageContainerLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
          {isImage && displayUrl ? (
            <TouchableOpacity onPress={() => { setViewerUri(displayUrl); setViewerVisible(true); }}>
              <Image source={{ uri: displayUrl }} style={styles.messageImage} />
            </TouchableOpacity>
          ) : isFile && (fileName || displayUrl) ? (
            <TouchableOpacity 
              onPress={() => (displayUrl?.startsWith('http') ? WebBrowser.openBrowserAsync(displayUrl) : openWithSystem(displayUrl, fileName))} 
              onLongPress={() => openWithSystem(displayUrl, fileName)}
              style={styles.fileContainer}
            >
              <View style={styles.fileIcon}>
                <Ionicons name="document-outline" size={24} color={isMine ? "#FFFFFF" : "#007AFF"} />
              </View>
              <Text style={[styles.fileName, isMine && styles.fileNameRight]}>{fileName || 'Pièce jointe'}</Text>
            </TouchableOpacity>
          ) : isVoiceFinal && displayUrl ? (
            <VoiceMessagePlayer
              audioUri={displayUrl}
              duration={parseInt(contentStr?.match(/\((\d+)s\)/)?.[1] || '0')}
              isMine={isMine}
            />
          ) : (
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextRight]}>{contentStr}</Text>
          )}
        </View>
        <View style={[styles.messageFooter, isMine ? styles.messageFooterRight : styles.messageFooterLeft]}>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeRight]}>{safeTime}</Text>
          {isMine && (item as any).lu_par?.length > 0 && (
            <Ionicons name="checkmark-done" size={12} color="#34C759" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {contactPhoto ? (
              <Image source={{ uri: contactPhoto }} style={{ width: 28, height: 28, borderRadius: 14 }} />
            ) : (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5F0FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={16} color="#007AFF" />
              </View>
            )}
            <Text style={styles.headerTitle}>{contactName}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90} // ** LA VALEUR MAGIQUE. AJUSTEZ-LA SI BESOIN (ex: 80, 100) **
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => String(item.idmessage)}
              style={styles.messagesListContainer}
              contentContainerStyle={styles.messagesListContent}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          <View style={styles.inputBar}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachButton} onPress={pickAndSendImage} disabled={uploading || sending}>
                <Ionicons name="camera-outline" size={22} color="#8E8E93" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Message"
                placeholderTextColor="#8E8E93"
                value={input}
                onChangeText={setInput}
                editable={!sending && !uploading}
                multiline
              />
              <TouchableOpacity style={styles.attachButton} onPress={pickAndSendFile} disabled={uploading || sending}>
                <Ionicons name="attach-outline" size={22} color="#8E8E93" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.voiceButton} 
                onPress={() => setShowVoiceRecorder(true)}
                disabled={uploading || sending}
              >
                <Ionicons name="mic" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={send} disabled={!input.trim() || sending}>
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Prévisualisation de l'enregistrement vocal */}
          {recordingAudio && (
            <View style={styles.recordingPreview}>
              <Ionicons name="musical-notes" size={20} color="#007AFF" />
              <Text style={styles.recordingText}>
                Note vocale ({Math.floor(recordingAudio.duration)}s)
              </Text>
              <TouchableOpacity onPress={sendVoiceMessage} style={styles.sendRecordingButton}>
                <Ionicons name="send" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRecordingAudio(null)} style={styles.cancelRecordingButton}>
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>

        <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
          <View style={styles.viewerBackdrop}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.headerIconBtn}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => viewerUri && openWithSystem(viewerUri, `image_${Date.now()}.jpg`)} style={[styles.headerIconBtn, { marginLeft: 8 }]}>
                <Ionicons name="download" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.viewerContainer}>
              {viewerUri && <Image source={{ uri: viewerUri }} resizeMode="contain" style={styles.viewerImage} />}
            </View>
          </View>
        </Modal>

        {/* Modal pour l'enregistrement vocal */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Fond d'écran du chat
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D1D1D6',
  },
  backButton: { 
    padding: 4,
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '600', 
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesListContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesListContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: { 
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: { 
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleText: { 
    color: '#000000',
    fontSize: 16,
    lineHeight: 21,
  },
  bubbleTextRight: { 
    color: '#FFFFFF',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileName: {
    fontSize: 16,
    color: '#000000',
    flexShrink: 1,
  },
  fileNameRight: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  messageFooterLeft: {
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
  messageFooterRight: {
    justifyContent: 'flex-end',
    paddingRight: 4,
  },
  bubbleTime: { 
    fontSize: 11, 
    color: '#8E8E93', 
  },
  bubbleTimeRight: { 
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderTopWidth: 0.5,
    borderTopColor: '#D1D1D6',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#D1D1D6',
    paddingHorizontal: 4,
    marginRight: 10,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 16,
    lineHeight: 20,
  },
  attachButton: { 
    padding: 6,
  },
  voiceButton: { 
    padding: 6,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
  },
  voiceIcon: {
    marginRight: 10,
  },
  voiceText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    fontWeight: '500',
  },
  voiceTextRight: {
    color: '#FFFFFF',
  },
  voiceDuration: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  voiceDurationRight: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  recordingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  recordingText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  sendRecordingButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  cancelRecordingButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  viewerBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  viewerHeader: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    paddingHorizontal: 20,
  },
  headerIconBtn: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  viewerContainer: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  viewerImage: { 
    width: '100%', 
    height: '80%',
  },
});