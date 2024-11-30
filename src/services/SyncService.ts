import { Alert } from 'react-native';
import { database } from './firebaseConfig';
import { ref, set, update, onValue } from 'firebase/database';

export class SyncService {
  static async initializeSession(isDriver: boolean) {
    const sessionId = new Date().getTime().toString();
    
    // Créer la session
    await set(ref(database, `sessions/${sessionId}`), {
      startTime: new Date().toISOString(),
      status: 'active',
      type: isDriver ? 'DEVICE' : 'VALIDATION'
    });

    // Notifier le véhicule suiveur
    if (isDriver) {
      await set(ref(database, 'activeSession'), {
        sessionId,
        status: 'active',
        startTime: new Date().toISOString()
      });
    }

    return sessionId;
  }

  static listenToSession(sessionId: string, callback: (data: any) => void) {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  }

  // Méthode pour le véhicule suiveur pour rejoindre la session
  static async joinSession(sessionId: string) {
    try {
      // Mettre à jour la session avec les infos du véhicule suiveur
      await update(ref(database, `sessions/${sessionId}/vehicles`), {
        follower: {
          type: 'VALIDATION',
          connected: true,
          timestamp: new Date().toISOString()
        }
      });

      return true;
    } catch (error) {
      console.error('Erreur jonction session:', error);
      return false;
    }
  }
} 