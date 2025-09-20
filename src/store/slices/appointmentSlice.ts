import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { Creneau, RendezVous } from '../../types';

interface AppointmentState {
  appointments: RendezVous[];
  upcomingAppointments: RendezVous[];
  todayAppointments: RendezVous[];
  availableSlots: Creneau[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  upcomingAppointments: [],
  todayAppointments: [],
  availableSlots: [],
  loading: false,
  error: null,
};

// Actions asynchrones
export const fetchPatientAppointments = createAsyncThunk(
  'appointments/fetchPatientAppointments',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getPatientAppointments(patientId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des rendez-vous');
    }
  }
);

export const fetchTodayAppointments = createAsyncThunk(
  'appointments/fetchTodayAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getTodayAppointments();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des rendez-vous du jour');
    }
  }
);

export const fetchWaitingPatients = createAsyncThunk(
  'appointments/fetchWaitingPatients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getWaitingPatients();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des patients en attente');
    }
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'appointments/fetchAvailableSlots',
  async (medecinId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getAvailableSlots(medecinId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des créneaux disponibles');
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: any, { rejectWithValue }) => {
    try {
      const response = await apiService.createAppointment(appointmentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création du rendez-vous');
    }
  }
);

export const startConsultation = createAsyncThunk(
  'appointments/startConsultation',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.startConsultation(appointmentId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du démarrage de la consultation');
    }
  }
);

export const endConsultation = createAsyncThunk(
  'appointments/endConsultation',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.endConsultation(appointmentId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la fin de la consultation');
    }
  }
);

export const markPatientArrived = createAsyncThunk(
  'appointments/markPatientArrived',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.markPatientArrived(appointmentId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAvailableSlots: (state, action: PayloadAction<Creneau[]>) => {
      state.availableSlots = action.payload;
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },
    updateAppointment: (state, action: PayloadAction<RendezVous>) => {
      const index = state.appointments.findIndex(apt => apt.idRendezVous === action.payload.idRendezVous);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
      
      // Mettre à jour aussi dans les listes filtrées
      const upcomingIndex = state.upcomingAppointments.findIndex(apt => apt.idRendezVous === action.payload.idRendezVous);
      if (upcomingIndex !== -1) {
        state.upcomingAppointments[upcomingIndex] = action.payload;
      }
      
      const todayIndex = state.todayAppointments.findIndex(apt => apt.idRendezVous === action.payload.idRendezVous);
      if (todayIndex !== -1) {
        state.todayAppointments[todayIndex] = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Patient Appointments
      .addCase(fetchPatientAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.upcomingAppointments = action.payload.filter((apt: any) => 
          new Date(apt.dateHeure) > new Date() && 
          ['CONFIRME', 'EN_ATTENTE_CONSULTATION', 'EN_COURS'].includes(apt.statut)
        );
        state.error = null;
      })
      .addCase(fetchPatientAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Today Appointments
      .addCase(fetchTodayAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.todayAppointments = action.payload;
        state.error = null;
      })
      .addCase(fetchTodayAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Waiting Patients
      .addCase(fetchWaitingPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWaitingPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchWaitingPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Available Slots
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSlots = action.payload;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Appointment
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Start Consultation
      .addCase(startConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConsultation.fulfilled, (state, action) => {
        state.loading = false;
        // Mettre à jour le statut du rendez-vous
        const appointment = action.payload;
        const index = state.appointments.findIndex(apt => apt.idRendezVous === appointment.idRendezVous);
        if (index !== -1) {
          state.appointments[index] = appointment;
        }
        state.error = null;
      })
      .addCase(startConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // End Consultation
      .addCase(endConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endConsultation.fulfilled, (state, action) => {
        state.loading = false;
        // Mettre à jour le statut du rendez-vous
        const appointment = action.payload;
        const index = state.appointments.findIndex(apt => apt.idRendezVous === appointment.idRendezVous);
        if (index !== -1) {
          state.appointments[index] = appointment;
        }
        state.error = null;
      })
      .addCase(endConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark Patient Arrived
      .addCase(markPatientArrived.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markPatientArrived.fulfilled, (state, action) => {
        state.loading = false;
        // Mettre à jour le statut du rendez-vous
        const appointment = action.payload;
        const index = state.appointments.findIndex(apt => apt.idRendezVous === appointment.idRendezVous);
        if (index !== -1) {
          state.appointments[index] = appointment;
        }
        state.error = null;
      })
      .addCase(markPatientArrived.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setAvailableSlots, 
  clearAvailableSlots, 
  updateAppointment, 
  clearError 
} = appointmentSlice.actions;
export default appointmentSlice.reducer;
