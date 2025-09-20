import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { Notification, PreferencesNotification } from '../../types';

interface NotificationState {
  notifications: Notification[];
  preferences: PreferencesNotification | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  preferences: null,
  unreadCount: 0,
  loading: false,
  error: null,
};

// Actions asynchrones
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getNotificationHistory();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des notifications');
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getNotificationPreferences();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des préférences');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updateNotificationPreferences',
  async (preferences: Partial<PreferencesNotification>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateNotificationPreferences(preferences);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour des préférences');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      // Ici on pourrait appeler une API pour marquer comme lu
      return notificationId;
    } catch (error: any) {
      return rejectWithValue('Erreur lors de la mise à jour de la notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.lu) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(notif => notif.idNotification === action.payload);
      if (notification && !notification.lu) {
        notification.lu = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.lu = true;
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(notif => !notif.lu).length;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Notification Preferences
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Notification Preferences
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark Notification As Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(notif => notif.idNotification === action.payload);
        if (notification && !notification.lu) {
          notification.lu = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  clearNotifications, 
  clearError 
} = notificationSlice.actions;
export default notificationSlice.reducer;
