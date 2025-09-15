import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiService, RendezVous } from '../../../services/api';

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

function getMonthMatrix(date: Date): Date[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const matrix: Date[][] = [];
  let current = new Date(first);
  const startOffset = (first.getDay() + 6) % 7; // Lundi=0
  current.setDate(first.getDate() - startOffset);
  while (current <= last || matrix.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    matrix.push(week);
  }
  return matrix;
}

export default function MedecinAgendaScreen() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [medecinId, setMedecinId] = useState<string | null>(null);
  const [dayCreneaux, setDayCreneaux] = useState<Array<{ idcreneau: string; debut: string; fin: string; disponible: boolean }>>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('week');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [agendaId, setAgendaId] = useState<string | null>(null);
  const [slotType, setSlotType] = useState<'OUVERTURE' | 'ABSENCE'>('OUVERTURE');
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState<0 | 15 | 30 | 45>(0);
  const [endHour, setEndHour] = useState(12);
  const [endMinute, setEndMinute] = useState<0 | 15 | 30 | 45>(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const dayScrollRef = useRef<ScrollView | null>(null);

  const monthMatrix = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const monthLabel = useMemo(() => monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), [monthDate]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Profil pour id médecin
      if (!medecinId) {
        const p = await apiService.getProfile();
        setMedecinId(p.data.medecin?.idmedecin || null);
      }
      const rdvResp = await apiService.getRendezVousMedecin();
      const list = rdvResp.data || [];
      setAppointments(list);
      try {
        const currentMedId = medecinId || (await apiService.getProfile()).data.medecin?.idmedecin;
        if (currentMedId) {
          const ag = await apiService.getAgendasMedecin(currentMedId);
          const first = (ag as any)?.data?.[0] || (ag as any)?.[0] || null;
          const id = first?.idagenda || first?.id || first?.idAgenda || null;
          if (id) setAgendaId(String(id));
        }
      } catch {}
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadDayCreneaux = useCallback(async (date: Date) => {
    try {
      const profile = medecinId ? null : await apiService.getProfile();
      const id = medecinId || profile?.data.medecin?.idmedecin;
      if (!id) return;
      const yyyyMmDd = date.toISOString().slice(0,10);
      const resp = await apiService.getCreneauxDisponibles(id, yyyyMmDd);
      setDayCreneaux((resp as any)?.data || []);
    } catch (e) {
      setDayCreneaux([]);
    }
  }, [medecinId]);

  useEffect(() => { loadDayCreneaux(selectedDate); }, [selectedDate, loadDayCreneaux]);

  const dayAppointments = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    return appointments
      .filter(a => {
        const dt = new Date(a.dateheure);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      })
      .sort((a, b) => new Date(a.dateheure).getTime() - new Date(b.dateheure).getTime());
  }, [appointments, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const changeMonth = (delta: number) => {
    const next = new Date(monthDate);
    next.setMonth(monthDate.getMonth() + delta);
    setMonthDate(next);
  };

  const changeWeek = (deltaWeeks: number) => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() + deltaWeeks * 7);
    setSelectedDate(d);
    if (d.getMonth() !== monthDate.getMonth() || d.getFullYear() !== monthDate.getFullYear()) {
      const m = new Date(d.getFullYear(), d.getMonth(), 1);
      setMonthDate(m);
    }
  };

  const selectMonthFromPicker = (monthIndex: number) => {
    const next = new Date(pickerYear, monthIndex, 1);
    setMonthDate(next);
    // si la date sélectionnée n'appartient pas au mois choisi, on la remet au 1er du mois
    if (selectedDate.getMonth() !== monthIndex || selectedDate.getFullYear() !== pickerYear) {
      setSelectedDate(new Date(next));
    }
    setShowMonthPicker(false);
  };

  const renderDayCell = (date: Date) => {
    const isCurrentMonth = date.getMonth() === monthDate.getMonth();
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const hasAppointments = appointments.some(a => {
      const dt = new Date(a.dateheure);
      return dt.toDateString() === date.toDateString();
    });

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[styles.dayCell, !isCurrentMonth && styles.dayCellMuted, isSelected && styles.dayCellSelected]}
        onPress={() => setSelectedDate(new Date(date))}
      >
        <Text style={[styles.dayNumber, !isCurrentMonth && styles.mutedText, isSelected && styles.dayNumberSelected]}>
          {date.getDate()}
        </Text>
        {isToday && <View style={styles.todayDot} />}
        {hasAppointments && <View style={styles.eventDot} />}
      </TouchableOpacity>
    );
  };

  const renderAppointment = ({ item }: { item: RendezVous }) => {
    const time = new Date(item.dateheure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventTime}>
          <Ionicons name="time-outline" size={14} color="#007AFF" />
          <Text style={styles.eventTimeText}>{time} • {item.duree} min</Text>
        </View>
        <Text style={styles.eventTitle}>{item.motif || 'Consultation'}</Text>
        {item.patient && (
          <Text style={styles.eventSubtitle}>{item.patient.prenom} {item.patient.nom}</Text>
        )}
      </View>
    );
  };

  // === Grille du JOUR façon Google Agenda ===
  const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07h → 19h
  const HOUR_HEIGHT = 72; // hauteur de ligne plus lisible
  const GRID_TOP_PADDING = 72; // marge supérieure encore plus généreuse
  const dayStart = new Date(selectedDate); dayStart.setHours(7,0,0,0);
  const dayEnd = new Date(selectedDate); dayEnd.setHours(20,0,0,0);

  const blocks = useMemo(() => {
    const appts = appointments
      .filter(a => {
        const dt = new Date(a.dateheure);
        return dt >= dayStart && dt <= dayEnd;
      })
      .map(a => {
        const start = new Date(a.dateheure);
        const end = new Date(start.getTime() + (a.duree || 30) * 60000);
        const top = ((start.getHours() - 7) * 60 + start.getMinutes()) * (HOUR_HEIGHT/60);
        const height = Math.max(30, (a.duree || 30) * (HOUR_HEIGHT/60));
        return { id: a.idrendezvous, top, height, color: '#34C75920', border: '#34C759', title: a.motif || 'RDV', subtitle: a.patient ? `${a.patient.prenom} ${a.patient.nom}` : '' };
      });
    const slots = dayCreneaux.map(c => {
      const start = new Date(c.debut);
      const end = new Date(c.fin);
      const top = ((start.getHours() - 7) * 60 + start.getMinutes()) * (HOUR_HEIGHT/60);
      const minutes = Math.max(15, Math.round((end.getTime() - start.getTime())/60000));
      const height = Math.max(24, minutes * (HOUR_HEIGHT/60));
      return { id: c.idcreneau, top, height, color: c.disponible ? '#007AFF15' : '#FF3B3015', border: c.disponible ? '#007AFF' : '#FF3B30', title: c.disponible ? 'Créneau dispo' : 'Indisponible', subtitle: `${start.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - ${end.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}` };
    });
    return [...slots, ...appts];
  }, [appointments, dayCreneaux, selectedDate]);

  // Auto‑scroll: toujours au début de la journée (07:00) pour garantir la marge visible
  useEffect(() => {
    if (viewMode !== 'day') return;
    const id = setTimeout(() => { dayScrollRef.current?.scrollTo({ y: 0, animated: true }); }, 0);
    return () => clearTimeout(id);
  }, [viewMode, selectedDate]);

  // Semaine courante (Lun → Dim) autour du jour sélectionné
  const weekDays = useMemo(() => {
    const base = new Date(selectedDate);
    const day = base.getDay(); // 0=Dim ... 6=Sam
    const mondayOffset = (day === 0 ? -6 : 1 - day);
    const monday = new Date(base);
    monday.setDate(base.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const computeBlocksForDate = (date: Date) => {
    const dStart = new Date(date); dStart.setHours(7,0,0,0);
    const dEnd = new Date(date); dEnd.setHours(20,0,0,0);
    const appts = appointments.filter(a => {
      const dt = new Date(a.dateheure);
      return dt >= dStart && dt <= dEnd;
    }).map(a => {
      const start = new Date(a.dateheure);
      const top = ((start.getHours() - 7) * 60 + start.getMinutes()) * (HOUR_HEIGHT/60);
      const height = Math.max(30, (a.duree || 30) * (HOUR_HEIGHT/60));
      return { id: `${a.idrendezvous}-${date.toDateString()}`, top, height, color: '#34C75920', border: '#34C759', title: a.motif || 'RDV', subtitle: a.patient ? `${a.patient.prenom} ${a.patient.nom}` : '' };
    });
    // Pour simplicité: utiliser les créneaux du jour sélectionné pour toutes colonnes si même semaine
    const slots = dayCreneaux.filter(c => {
      const start = new Date(c.debut);
      return start.toDateString() === date.toDateString();
    }).map(c => {
      const start = new Date(c.debut); const end = new Date(c.fin);
      const minutes = Math.max(15, Math.round((end.getTime() - start.getTime())/60000));
      const top = ((start.getHours() - 7) * 60 + start.getMinutes()) * (HOUR_HEIGHT/60);
      const height = Math.max(24, minutes * (HOUR_HEIGHT/60));
      return { id: c.idcreneau, top, height, color: c.disponible ? '#007AFF15' : '#FF3B3015', border: c.disponible ? '#007AFF' : '#FF3B30', title: c.disponible ? 'Créneau dispo' : 'Indisponible', subtitle: `${start.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - ${end.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}` };
    });
    return [...slots, ...appts];
  };

  const quickCreate = async () => {
    try {
      if (!agendaId) {
        Alert.alert('Info', "Aucun agenda détecté");
        return;
      }
      const d1 = new Date(selectedDate); d1.setHours(startHour, startMinute, 0, 0);
      const d2 = new Date(selectedDate); d2.setHours(endHour, endMinute, 0, 0);
      await apiService.createCreneau({
        agenda_id: agendaId,
        debut: d1.toISOString(),
        fin: d2.toISOString(),
        disponible: slotType === 'OUVERTURE',
      } as any);
      setShowQuickAdd(false);
      await loadDayCreneaux(selectedDate);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Création impossible');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header calendrier */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setPickerYear(monthDate.getFullYear()); setShowMonthPicker(true); }}>
          <View style={styles.monthSelector}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Ionicons name="chevron-down" size={16} color="#0A2540" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
          <Ionicons name="chevron-forward" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Toggle de vues */}
      <View style={styles.toggle}>
        {(['day','week','list'] as const).map(m => (
          <TouchableOpacity key={m} style={[styles.toggleBtn, viewMode===m && styles.toggleBtnActive]} onPress={() => setViewMode(m)}>
            <Text style={[styles.toggleText, viewMode===m && styles.toggleTextActive]}>
              {m==='day' ? 'Jour' : m==='week' ? 'Semaine' : 'Liste'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calendrier semaine (puces de jours) */}
      <View style={styles.weekHeader}>
        <TouchableOpacity style={[styles.weekArrowAbs, styles.weekArrowLeft]} onPress={() => changeWeek(-1)}>
          <Ionicons name="chevron-back" size={16} color="#2E7CF6" />
        </TouchableOpacity>
        <View style={styles.weekHeaderCenter}>
          {weekDays.map((d) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity key={d.toDateString()} style={[styles.dayChip, isSelected && styles.dayChipActive]} onPress={() => setSelectedDate(new Date(d))}>
                <Text style={[styles.dayChipDow, isSelected && styles.dayChipDowActive]}>{DAYS[(d.getDay()+6)%7].charAt(0)}</Text>
                <View style={[styles.dayNumCircle, isSelected && styles.dayNumCircleActive]}>
                  <Text style={[styles.dayNumText, isSelected && styles.dayNumTextActive]}>{d.getDate()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={[styles.weekArrowAbs, styles.weekArrowRight]} onPress={() => changeWeek(1)}>
          <Ionicons name="chevron-forward" size={16} color="#2E7CF6" />
        </TouchableOpacity>
      </View>

      {/* Liste du jour */}
      <View style={styles.dayListHeader}>
        <Text style={styles.dayListTitle}>Aujourd'hui</Text>
        {loading && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      {viewMode === 'list' && (
      <FlatList
        data={dayAppointments}
        keyExtractor={(item) => item.idrendezvous}
        renderItem={renderAppointment}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.dayList}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>Aucun événement</Text>
          </View>
        ) : null}
      />)}

      {/* Vue Jour détaillée */}
      {viewMode === 'day' && (
      <View style={styles.dayGridContainer}>
        <View style={styles.dayGridHeader}>
          <Text style={styles.dayGridTitle}>{selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <TouchableOpacity style={styles.fab} onPress={() => setShowQuickAdd(true)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView ref={ref => { dayScrollRef.current = ref; }} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ height: GRID_TOP_PADDING + HOURS.length * HOUR_HEIGHT, paddingTop: GRID_TOP_PADDING }}>
          {/* Heures et lignes */}
          {HOURS.map((h, idx) => (
            <View key={h} style={[styles.hourRow, { top: idx * HOUR_HEIGHT }]}> 
              <Text style={styles.hourLabel}>{String(h).padStart(2,'0')}:00</Text>
              <View style={styles.hourLine} />
              <View style={[styles.hourHalfLine, { top: HOUR_HEIGHT/2 }]} />
            </View>
          ))}
          {/* Blocs RDV & créneaux */}
          {blocks.map(b => (
            <View key={b.id} style={[styles.block, { top: b.top, height: b.height, backgroundColor: b.color, borderColor: b.border }]}> 
              <Text style={styles.blockTitle}>{b.title}</Text>
              {!!b.subtitle && <Text style={styles.blockSubtitle}>{b.subtitle}</Text>}
            </View>
          ))}
        </ScrollView>
      </View>)}

      {/* Vue Semaine multi-colonnes (7 jours) */}
      {viewMode === 'week' && (
      <View style={styles.weekGridContainer}>
        <View style={styles.dayGridHeader}>
          <Text style={styles.dayGridTitle}>Semaine</Text>
          <TouchableOpacity style={styles.fab} onPress={() => setShowQuickAdd(true)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
            {weekDays.map((d, colIdx) => (
              <View key={d.toDateString()} style={styles.weekCol}>
                <Text style={styles.weekColTitle}>{d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })}</Text>
                <View style={styles.weekColGrid}>
                  {HOURS.map((h, idx) => (
                    <View key={`${colIdx}-${h}`} style={[styles.hourLineThin, { top: idx * HOUR_HEIGHT }]} />
                  ))}
                  {computeBlocksForDate(d).map(b => (
                    <View key={`${d.toDateString()}-${b.id}`} style={[styles.block, { left: 8, right: 8, top: b.top, height: b.height, backgroundColor: b.color, borderColor: b.border }]}>
                      <Text style={styles.blockTitle}>{b.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>)}

      {/* Modale ajout rapide (ouverture/absence + heures) */}
      {showQuickAdd && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajouter une plage</Text>
            <View style={[styles.modalRow, { flexDirection: 'row', gap: 8 }]}>
              <TouchableOpacity style={[styles.modalBtn, slotType==='OUVERTURE' && { backgroundColor: '#2E7CF6' }]} onPress={() => setSlotType('OUVERTURE')}>
                <Ionicons name="calendar-outline" size={18} color={slotType==='OUVERTURE' ? '#FFFFFF' : '#2E7CF6'} />
                <Text style={[styles.modalBtnText, slotType==='OUVERTURE' && { color: '#FFFFFF' }]}>Ouverture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, slotType==='ABSENCE' && { backgroundColor: '#2E7CF6' }]} onPress={() => setSlotType('ABSENCE')}>
                <Ionicons name="remove-circle-outline" size={18} color={slotType==='ABSENCE' ? '#FFFFFF' : '#2E7CF6'} />
                <Text style={[styles.modalBtnText, slotType==='ABSENCE' && { color: '#FFFFFF' }]}>Absence</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Début</Text>
              <View style={styles.timeRow}>
                {([7,8,9,10,11,12,13,14,15,16,17,18,19] as number[]).map(h => (
                  <TouchableOpacity key={`sh-${h}`} style={[styles.timeChip, startHour===h && styles.timeChipActive]} onPress={() => setStartHour(h)}>
                    <Text style={[styles.timeChipText, startHour===h && styles.timeChipTextActive]}>{String(h).padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
                {([0,15,30,45] as (0|15|30|45)[]).map(m => (
                  <TouchableOpacity key={`sm-${m}`} style={[styles.timeChipSm, startMinute===m && styles.timeChipActive]} onPress={() => setStartMinute(m)}>
                    <Text style={[styles.timeChipText, startMinute===m && styles.timeChipTextActive]}>{String(m).padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Fin</Text>
              <View style={styles.timeRow}>
                {([8,9,10,11,12,13,14,15,16,17,18,19,20] as number[]).map(h => (
                  <TouchableOpacity key={`eh-${h}`} style={[styles.timeChip, endHour===h && styles.timeChipActive]} onPress={() => setEndHour(h)}>
                    <Text style={[styles.timeChipText, endHour===h && styles.timeChipTextActive]}>{String(h).padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
                {([0,15,30,45] as (0|15|30|45)[]).map(m => (
                  <TouchableOpacity key={`em-${m}`} style={[styles.timeChipSm, endMinute===m && styles.timeChipActive]} onPress={() => setEndMinute(m)}>
                    <Text style={[styles.timeChipText, endMinute===m && styles.timeChipTextActive]}>{String(m).padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2E7CF6', justifyContent: 'center' }]} onPress={quickCreate}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowQuickAdd(false)}>
              <Text style={[styles.modalCancelText, { color: '#FF3B30' }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sélecteur Mois/Année iOS */}
      {showMonthPicker && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: 12 }] }>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <TouchableOpacity style={styles.navBtn} onPress={() => setPickerYear(y => y - 1)}>
                <Ionicons name="chevron-back" size={18} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{pickerYear}</Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => setPickerYear(y => y + 1)}>
                <Ionicons name="chevron-forward" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.monthGridPicker}>
              {['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'].map((m, idx) => {
                const isCurrent = monthDate.getMonth() === idx && monthDate.getFullYear() === pickerYear;
                return (
                  <TouchableOpacity key={m} style={[styles.monthChip, isCurrent && styles.monthChipActive]} onPress={() => selectMonthFromPicker(idx)}>
                    <Text style={[styles.monthChipText, isCurrent && styles.monthChipTextActive]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMonthPicker(false)}>
              <Text style={[styles.modalCancelText, { color: '#FF3B30' }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  navBtn: { padding: 10, borderRadius: 8, backgroundColor: '#EAF2FF' },
  monthLabel: { color: '#0A2540', fontSize: 18, fontWeight: '700' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, alignItems: 'center' },
  weekHeaderCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, width: '100%', paddingHorizontal: 30 },
  weekHeaderText: { flex: 1, textAlign: 'center', color: '#5B6B7C', fontSize: 12 },
  dayChip: { alignItems: 'center', marginHorizontal: 1, width: 34 },
  dayChipActive: {},
  dayChipDow: { color: '#5B6B7C', fontSize: 11, textAlign: 'center' },
  dayChipDowActive: { color: '#2E7CF6' },
  dayNumCircle: { marginTop: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' },
  dayNumCircleActive: { backgroundColor: '#2E7CF6' },
  dayNumText: { color: '#0A2540', fontWeight: '700' },
  dayNumTextActive: { color: '#FFFFFF' },
  mutedText: { opacity: 0.4 },
  monthGrid: { paddingHorizontal: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  dayCell: {
    flex: 1, aspectRatio: 1, marginHorizontal: 4, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5EAF0'
  },
  dayCellMuted: { opacity: 0.4 },
  dayCellSelected: { backgroundColor: '#EAF2FF', borderWidth: 1, borderColor: '#2E7CF6' },
  dayNumber: { color: '#0A2540', fontWeight: '600' },
  dayNumberSelected: { color: '#0A2540' },
  todayDot: { position: 'absolute', bottom: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#34C759' },
  eventDot: { position: 'absolute', top: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7CF6' },

  dayListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  dayListTitle: { color: '#0A2540', fontSize: 16, fontWeight: '700' },
  dayList: { padding: 16, paddingBottom: 24 },
  eventCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5EAF0' },
  eventTime: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  eventTimeText: { color: '#5B6B7C', marginLeft: 6, fontSize: 12 },
  eventTitle: { color: '#0A2540', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  eventSubtitle: { color: '#6B7280', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#8E8E93', marginTop: 8 },

  // Jour détaillé
  dayGridContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 8 },
  dayGridHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  dayGridTitle: { color: '#0A2540', fontSize: 16, fontWeight: '700' },
  hourRow: { position: 'absolute', left: 0, right: 0, height: 0 },
  hourLabel: { position: 'absolute', left: 16, top: -2, color: '#5B6B7C', fontSize: 12, fontWeight: '600' },
  hourLine: { marginLeft: 72, height: 1, backgroundColor: '#E5EAF0' },
  hourHalfLine: { position: 'absolute', left: 0, right: 0, marginLeft: 72, height: 1, backgroundColor: '#EDF2F7' },
  block: { position: 'absolute', left: 84, right: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  blockTitle: { color: '#0A2540', fontSize: 13, fontWeight: '700' },
  blockSubtitle: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  fab: { backgroundColor: '#2E7CF6', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Toggle
  toggle: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  toggleBtn: { flex: 1, backgroundColor: '#EAF2FF', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#2E7CF6' },
  toggleText: { color: '#0A2540', fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF' },

  // Semaine
  weekGridContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  weekCol: { width: 220, marginHorizontal: 8 },
  weekColTitle: { color: '#0A2540', fontWeight: '700', marginLeft: 8, marginBottom: 6 },
  weekColGrid: { height: 64 * 13, borderLeftWidth: 1, borderColor: '#E5EAF0', borderRadius: 12, backgroundColor: '#FFFFFF', position: 'relative' },
  hourLineThin: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#E5EAF0' },

  // Modal
  modalBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5EAF0' },
  modalTitle: { color: '#0A2540', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalRow: { marginBottom: 8 },
  modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EAF2FF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  modalBtnText: { color: '#0A2540', fontWeight: '600' },
  modalLabel: { color: '#0A2540', fontWeight: '700', marginBottom: 6 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeChip: { backgroundColor: '#EAF2FF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  timeChipSm: { backgroundColor: '#EAF2FF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8 },
  timeChipActive: { backgroundColor: '#2E7CF6' },
  timeChipText: { color: '#0A2540', fontWeight: '600' },
  timeChipTextActive: { color: '#FFFFFF' },
  modalCancel: { marginTop: 8, alignItems: 'center' },
  modalCancelText: { color: '#5B6B7C' },
  monthGridPicker: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  monthChip: { backgroundColor: '#EAF2FF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, width: '48%', alignItems: 'center' },
  monthChipActive: { backgroundColor: '#2E7CF6' },
  monthChipText: { color: '#0A2540', fontWeight: '600' },
  monthChipTextActive: { color: '#FFFFFF' },
  weekArrow: { padding: 6, borderRadius: 10, backgroundColor: '#EAF2FF' },
  weekArrowAbs: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', padding: 4, borderRadius: 10, backgroundColor: '#EAF2FF' },
  weekArrowLeft: { left: 8 },
  weekArrowRight: { right: 8 },
});
