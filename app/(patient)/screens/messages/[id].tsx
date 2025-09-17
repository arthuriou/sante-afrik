import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useNotifications } from '../../../../services/notificationContext';
import { bindMessagingRealtime, createSocket, joinConversation, leaveConversation } from '../../../../services/socket';

export default function PatientConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
  const { updateUnreadCount } = useNotifications();

  // Fonctions de cache local pour les messages
  const saveMessagesToCache = async (messages: Message[]) => {
    try {
      const cacheKey = `messages_${id}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(messages));
      console.log('💾 Messages sauvegardés en cache:', messages.length);
    } catch (error) {
      console.log('❌ Erreur sauvegarde cache:', error);
    }
  };

  const loadMessagesFromCache = async (): Promise<Message[]> => {
    try {
      const cacheKey = `messages_${id}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const messages = JSON.parse(cached);
        console.log('📂 Messages chargés depuis le cache:', messages.length);
        return messages;
      }
    } catch (error) {
      console.log('❌ Erreur chargement cache:', error);
    }
    return [];
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des messages pour la conversation:', id);
      
      // D'abord, charger depuis le cache pour un affichage immédiat
      const cachedMessages = await loadMessagesFromCache();
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        console.log('📱 Messages affichés depuis le cache:', cachedMessages.length);
      }
      
      // Ensuite, charger depuis l'API pour avoir les données à jour
      const response = await apiService.getMessages(String(id), 100, 0);
      console.log('📨 Messages reçus de l\'API:', response);
      
      const apiMessages = response.data || response || [];
      console.log('📝 Nombre de messages chargés depuis l\'API:', apiMessages.length);
      
      // Mettre à jour avec les messages de l'API
      setMessages(apiMessages);
      
      // Sauvegarder en cache
      await saveMessagesToCache(apiMessages);
      
      // Scroll vers le bas après que les messages soient rendus
      requestAnimationFrame(() => {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: false });
        }, 200);
      });
      
      // Marquer la conversation comme lue
      await apiService.markConversationAsRead(String(id));
      console.log('✅ Conversation marquée comme lue');
      
      // Mettre à jour le compteur de notifications
      updateUnreadCount();
      
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      
      // En cas d'erreur API, essayer de charger depuis le cache
      const cachedMessages = await loadMessagesFromCache();
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        console.log('📱 Messages de secours chargés depuis le cache:', cachedMessages.length);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les messages');
      }
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

      // L'autre participant (différent de moi) - le médecin
      const others = parts.filter((p: any) => String(p?.utilisateur?.idutilisateur) !== String(meId));
      const target = others.find((p: any) => p?.role === 'MEDECIN' || p?.role_participant === 'MEDECIN') || others[0];

      if (target?.utilisateur) {
        const u = target.utilisateur;
        const fullName = [`${u?.prenom || ''}`.trim(), `${u?.nom || ''}`.trim()].filter(Boolean).join(' ').trim() || u?.nom || 'Médecin';
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
          // Fallback API : récupérer la photo du médecin via son ID
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

  // Rafraîchir automatiquement quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Focus sur la conversation patient - rafraîchissement automatique');
      loadMessages();
      
      // Forcer le scroll vers le bas après un court délai
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 300);
    }, [id])
  );

  // Effet pour scroller vers le bas quand les messages changent
  useEffect(() => {
    if (messages.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le rendu est terminé
      requestAnimationFrame(() => {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });
    }
  }, [messages.length]);

  // Nettoyer le cache quand on quitte l'écran
  useEffect(() => {
    return () => {
      // Nettoyer le cache après 5 minutes d'inactivité
      setTimeout(async () => {
        try {
          const cacheKey = `messages_${id}`;
          await AsyncStorage.removeItem(cacheKey);
          console.log('🧹 Cache nettoyé pour la conversation:', id);
        } catch (error) {
          console.log('❌ Erreur nettoyage cache:', error);
        }
      }, 5 * 60 * 1000); // 5 minutes
    };
  }, [id]);

  useEffect(() => {
    loadMessages();
    loadConversationHeader();
    
    // Marquer la conversation comme lue quand on entre dedans
    const markAsRead = async () => {
      try {
        await apiService.markConversationAsRead(String(id));
      } catch (error) {
        console.log('Erreur marquer comme lu:', error);
      }
    };
    markAsRead();
    
    let s: any;
    (async () => {
      s = await createSocket();
      joinConversation(s, String(id));
      bindMessagingRealtime(s, {
        onNewMessage: (data) => {
          console.log('📨 Nouveau message reçu dans conversation patient:', data);
          
          // Essayer différentes structures de données
          let message = data;
          let conversationId = String(id);
          
          if (data?.message) {
            message = data.message;
            conversationId = String(data.conversationId || data.conversation_id || id);
          }
          
          // Vérifier que c'est bien pour cette conversation
          if (conversationId !== String(id)) {
            console.log('❌ Message ignoré - mauvaise conversation:', conversationId, 'vs', String(id));
            return;
          }
          
          const mid = String(message?.idmessage || '');
          if (!mid) {
            console.log('❌ Message ignoré - pas d\'ID');
            return;
          }
          
          setMessages((prev) => {
            // Éviter les doublons
            if (idsSeenRef.current.has(mid)) {
              console.log('❌ Message ignoré - déjà vu');
              return prev;
            }
            idsSeenRef.current.add(mid);
            
            // Supprimer les messages temporaires avec le même contenu
            const withoutTmp = prev.filter(mm => {
              const isTmp = String((mm as any).idmessage).startsWith('tmp-');
              const sameContent = mm.contenu === message.contenu;
              return !(isTmp && sameContent);
            });
            
            console.log('✅ Ajout du nouveau message patient:', message);
            return [...withoutTmp, message];
          });
          
          // Scroll vers le bas après un court délai
          setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
          }, 100);
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
    
    try {
      setSending(true);
      setMessages((prev) => [...prev, optimistic]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      
      await apiService.sendMessage(String(id), content);
      console.log('✅ Message envoyé avec succès');
      
      // Sauvegarder les messages en cache après envoi
      setTimeout(async () => {
        const currentMessages = await loadMessagesFromCache();
        await saveMessagesToCache([...currentMessages, optimistic]);
      }, 100);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      
      // Retirer le message optimiste en cas d'échec
      setMessages((prev) => prev.filter(msg => msg.idmessage !== optimistic.idmessage));
      
      // Proposer de réessayer
      Alert.alert(
        'Erreur d\'envoi', 
        'Impossible d\'envoyer le message. Voulez-vous réessayer ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => setInput(content) },
          { 
            text: 'Réessayer', 
            onPress: () => {
              setInput(content);
              setTimeout(() => send(), 500); // Réessayer après un court délai
            }
          }
        ]
      );
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
    // Logique robuste pour déterminer si c'est mon message
    const isMine = item.expediteur_id === 'me' || 
                   (item as any).est_mien === true ||
                   (item as any).expediteur_id === 'me';
    
    // Déterminer si le message a été lu (double checkmark)
    const isRead = isMine && (item as any).lu_par?.length > 0;
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
          {isMine && (
            <Ionicons 
              name={isRead ? "checkmark-done" : "checkmark"} 
              size={12} 
              color={isRead ? "#34C759" : "#8E8E93"} 
              style={{ marginLeft: 4 }} 
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
                <Ionicons name="mic-outline" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={send} disabled={!input.trim() || sending}>
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Prévisualisation de l'enregistrement vocal */}
          {recordingAudio && (
            <View style={styles.recordingPreview}>
              <View style={styles.recordingIconContainer}>
                <Ionicons name="mic-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.recordingText}>
                Note vocale ({Math.floor(recordingAudio.duration)}s)
              </Text>
              <TouchableOpacity onPress={sendVoiceMessage} style={styles.sendRecordingButton}>
                <Ionicons name="checkmark" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRecordingAudio(null)} style={styles.cancelRecordingButton}>
                <Ionicons name="close-outline" size={16} color="white" />
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
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
  },
  messagesListContent: {
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: '80%',
    marginHorizontal: 4,
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleLeft: { 
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  bubbleRight: { 
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  bubbleText: { 
    color: '#000000',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  },
  bubbleTextRight: { 
    color: '#FFFFFF',
  },
  messageImage: {
    width: 240,
    height: 240,
    borderRadius: 16,
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
    marginTop: 4,
    justifyContent: 'space-between',
  },
  messageFooterLeft: {
    justifyContent: 'flex-start',
    paddingLeft: 6,
  },
  messageFooterRight: {
    justifyContent: 'flex-end',
    paddingRight: 6,
  },
  bubbleTime: { 
    fontSize: 12, 
    color: '#8E8E93',
    fontWeight: '400',
  },
  bubbleTimeRight: { 
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: '#C6C6C8',
    paddingHorizontal: 6,
    marginRight: 12,
    minHeight: 44,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  },
  attachButton: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  voiceButton: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  voiceIcon: {
    marginRight: 12,
  },
  voiceText: {
    fontSize: 17,
    color: '#000000',
    flex: 1,
    fontWeight: '500',
  },
  voiceTextRight: {
    color: '#FFFFFF',
  },
  voiceDuration: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 10,
    fontWeight: '400',
  },
  voiceDurationRight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  recordingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.15)',
  },
  recordingIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 10,
    fontWeight: '400',
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
    marginLeft: 6,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
