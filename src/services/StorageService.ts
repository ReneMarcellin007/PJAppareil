import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData, ValidationEvent, SessionData } from '../types';
import { GoogleDriveService } from './GoogleDriveService';
import { database, storage } from './firebaseConfig';
import { ref, set, push, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export class StorageService {
  private static readonly KEYS = {
    SESSIONS: '@sessions',
    CURRENT_SESSION: '@current_session',
    PENDING_EXPORTS: '@pending_exports',
  };

  static async saveLocationData(data: LocationData): Promise<void> {
    try {
      console.log('Sauvegarde données:', data); // Debug

      // 1. Sauvegarder dans Firebase
      const locationRef = ref(database, `sessions/${data.sessionId}/locationData`);
      await push(locationRef, {
        ...data,
        timestamp: new Date().toISOString()
      });

      // 2. Sauvegarder localement
      const currentSession = await this.getCurrentSession();
      if (currentSession) {
        currentSession.locationData.push(data);
        await AsyncStorage.setItem(
          this.KEYS.CURRENT_SESSION,
          JSON.stringify(currentSession)
        );
      }

      console.log('Données sauvegardées avec succès'); // Debug
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      throw error;
    }
  }

  static async saveValidationEvent(event: ValidationEvent): Promise<void> {
    try {
      const currentSession = await this.getCurrentSession();
      if (!currentSession) return;

      currentSession.events.push(event);
      await this.updateCurrentSession(currentSession);
    } catch (error) {
      console.error('Erreur sauvegarde événement:', error);
      throw error;
    }
  }

  static async startNewSession(): Promise<string> {
    try {
      const sessionId = new Date().getTime().toString();
      const newSession: SessionData = {
        id: sessionId,
        startTime: new Date().toISOString(),
        events: [],
        locationData: [],
      };

      // Sauvegarder dans Firebase
      const sessionRef = ref(database, `sessions/${sessionId}`);
      await set(sessionRef, {
        ...newSession,
        status: 'active',
        type: 'DEVICE'
      });

      // Sauvegarder localement
      await AsyncStorage.setItem(
        this.KEYS.CURRENT_SESSION,
        JSON.stringify(newSession)
      );

      return sessionId;
    } catch (error) {
      console.error('Erreur création session:', error);
      throw error;
    }
  }

  static async endCurrentSession(): Promise<void> {
    try {
      const currentSession = await this.getCurrentSession();
      if (!currentSession) return;

      // Marquer la fin de session
      currentSession.endTime = new Date().toISOString();

      // Sauvegarder dans Firebase
      await this.updateSession(currentSession);

      // Nettoyer la session courante
      await AsyncStorage.removeItem(this.KEYS.CURRENT_SESSION);
    } catch (error) {
      console.error('Erreur fin session:', error);
      throw error;
    }
  }

  static async getCurrentSession(): Promise<SessionData | null> {
    try {
      const sessionStr = await AsyncStorage.getItem(this.KEYS.CURRENT_SESSION);
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (error) {
      console.error('Erreur lecture session:', error);
      return null;
    }
  }

  static async getAllSessions(): Promise<SessionData[]> {
    try {
      const sessionsStr = await AsyncStorage.getItem(this.KEYS.SESSIONS);
      return sessionsStr ? JSON.parse(sessionsStr) : [];
    } catch (error) {
      console.error('Erreur lecture sessions:', error);
      return [];
    }
  }

  static async exportSessionData(): Promise<string> {
    try {
      const sessions = await this.getAllSessions();
      const exportData = {
        exportDate: new Date().toISOString(),
        sessions: sessions,
      };

      // Créer un fichier texte formaté
      const content = JSON.stringify(exportData, null, 2);
      const fileName = `safety_validator_export_${new Date().toISOString().split('T')[0]}.txt`;

      // Dans un vrai cas, ici on sauvegarderait le fichier ou l'enverrait vers Google Drive
      // Pour l'instant, on retourne juste le contenu
      return content;
    } catch (error) {
      console.error('Erreur export données:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Erreur nettoyage données:', error);
      throw error;
    }
  }

  static async savePendingExport(session: any): Promise<void> {
    const pendingExports = await this.getPendingExports();
    pendingExports.push(session);
    await AsyncStorage.setItem(
      this.KEYS.PENDING_EXPORTS,
      JSON.stringify(pendingExports)
    );
  }

  static async retryPendingExports(): Promise<void> {
    const pendingExports = await this.getPendingExports();
    const remainingExports = [];

    for (const session of pendingExports) {
      const deviceType = session.deviceRole === 'driver' ? 'DEVICE' : 'VALIDATION';
      const success = await GoogleDriveService.uploadSessionData(session, deviceType);
      if (!success) {
        remainingExports.push(session);
      }
    }

    await AsyncStorage.setItem(
      this.KEYS.PENDING_EXPORTS,
      JSON.stringify(remainingExports)
    );
  }

  static async setupAutoBackup() {
    setInterval(async () => {
      const pendingExports = await this.getPendingExports();
      if (pendingExports.length > 0) {
        await this.retryPendingExports();
      }
    }, 300000); // Toutes les 5 minutes
  }

  static async saveSessionFiles(sessionId: string, files: {
    videos: Blob[],
    textFiles: { name: string, content: string }[]
  }): Promise<void> {
    try {
      // Créer la référence de session
      const sessionRef = ref(database, `sessions/${sessionId}`);
      
      // Sauvegarder les vidéos
      const videoUrls = await Promise.all(
        files.videos.map(async (video, index) => {
          const videoRef = storageRef(storage, `sessions/${sessionId}/videos/video_${index}.mp4`);
          await uploadBytes(videoRef, video);
          return await getDownloadURL(videoRef);
        })
      );

      // Sauvegarder les fichiers texte
      const textFileRefs = files.textFiles.map((file, index) => ({
        name: file.name,
        content: file.content,
        timestamp: new Date().toISOString()
      }));

      // Sauvegarder les métadonnées de la session
      await set(sessionRef, {
        timestamp: new Date().toISOString(),
        videos: videoUrls,
        textFiles: textFileRefs
      });

    } catch (error) {
      console.error('Erreur sauvegarde session:', error);
      throw error;
    }
  }

  static async getSessionFiles(sessionId: string) {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération session:', error);
      throw error;
    }
  }

  static async getAllSessions() {
    try {
      const sessionsRef = ref(database, 'sessions');
      const snapshot = await get(sessionsRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return {};
    } catch (error) {
      console.error('Erreur récupération sessions:', error);
      throw error;
    }
  }

  static async saveCompleteSession(sessionData: SessionData, files: {
    videos: Blob[],
    textFiles: { name: string, content: string }[],
    sessionExport?: string // Fichier généré en fin de session
  }): Promise<void> {
    try {
      const sessionRef = ref(database, `sessions/${sessionData.id}`);
      
      // 1. Sauvegarder les vidéos
      const videoUrls = await Promise.all(
        files.videos.map(async (video, index) => {
          const videoRef = storageRef(storage, `sessions/${sessionData.id}/videos/video_${index}.mp4`);
          await uploadBytes(videoRef, video);
          return await getDownloadURL(videoRef);
        })
      );

      // 2. Sauvegarder les fichiers texte
      const textFileRefs = files.textFiles.map((file) => ({
        name: file.name,
        content: file.content,
        timestamp: new Date().toISOString()
      }));

      // 3. Sauvegarder le fichier d'export si présent
      let exportFileUrl = null;
      if (files.sessionExport) {
        const exportRef = storageRef(storage, `sessions/${sessionData.id}/export.txt`);
        const blob = new Blob([files.sessionExport], { type: 'text/plain' });
        await uploadBytes(exportRef, blob);
        exportFileUrl = await getDownloadURL(exportRef);
      }

      // 4. Sauvegarder toutes les données de session
      await set(sessionRef, {
        ...sessionData, // Inclut locationData, events, etc.
        files: {
          videos: videoUrls,
          textFiles: textFileRefs,
          exportFile: exportFileUrl
        },
        metadata: {
          startTime: sessionData.startTime,
          endTime: sessionData.endTime || new Date().toISOString(),
          deviceRole: sessionData.deviceRole,
          totalEvents: sessionData.events.length,
          totalLocations: sessionData.locationData.length
        }
      });

    } catch (error) {
      console.error('Erreur sauvegarde session complète:', error);
      throw error;
    }
  }

  static async saveValidationEvent(event: ValidationEvent): Promise<void> {
    try {
      const eventRef = ref(database, `sessions/${event.sessionId}/events`);
      await push(eventRef, {
        ...event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur sauvegarde événement:', error);
      throw error;
    }
  }

  static async endAndExportSession(sessionId: string): Promise<void> {
    try {
      // 1. Récupérer toutes les données de la session
      const sessionData = await this.getSessionData(sessionId);
      
      // 2. Générer le fichier d'export
      const exportContent = JSON.stringify(sessionData, null, 2);

      // 3. Sauvegarder la session complète avec l'export
      await this.saveCompleteSession(sessionData, {
        videos: [], // Les vidéos déjà sauvegardées
        textFiles: [], // Les fichiers texte déjà sauvegardés
        sessionExport: exportContent
      });

      // 4. Marquer la session comme terminée
      const sessionRef = ref(database, `sessions/${sessionId}/metadata/status`);
      await set(sessionRef, 'completed');

    } catch (error) {
      console.error('Erreur fin de session:', error);
      throw error;
    }
  }

  static async getSessionData(sessionId: string) {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération session:', error);
      throw error;
    }
  }

  static async updateSession(sessionData: SessionData): Promise<void> {
    try {
      const sessionRef = ref(database, `sessions/${sessionData.id}`);
      await set(sessionRef, sessionData);
    } catch (error) {
      console.error('Erreur mise à jour session:', error);
      throw error;
    }
  }
}
