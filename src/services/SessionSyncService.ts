import { io } from 'socket.io-client';
import { ref, set, onValue, push } from 'firebase/database';
import { database } from './firebaseConfig';
import { Alert } from 'react-native';

export class SessionSyncService {
  private static socket: any;
  private static sessionId: string | null = null;

  static initialize(role: 'driver' | 'validator') {
    this.socket = io('VOTRE_URL_SERVEUR');
    
    if (role === 'driver') {
      // Générer et partager le sessionId
      this.sessionId = new Date().getTime().toString();
      this.socket.emit('create_session', this.sessionId);
    } else {
      // Écouter le sessionId
      this.socket.on('session_created', (id: string) => {
        this.sessionId = id;
      });
    }
  }

  static getSessionId() {
    return this.sessionId;
  }

  static shareData(data: any) {
    if (this.socket && this.sessionId) {
      this.socket.emit('share_data', {
        sessionId: this.sessionId,
        data
      });
    }
  }

  static async initializeSession(isDriver: boolean) {
    try {
      if (isDriver) {
        // Test de la connexion à Firebase
        Alert.alert('Debug', 'Tentative de connexion à Firebase');
        
        // Création de la session
        const sessionId = new Date().getTime().toString();
        Alert.alert('Debug', `SessionID créé: ${sessionId}`);

        try {
          // Test de la référence
          const sessionRef = ref(database, `sessions/${sessionId}`);
          Alert.alert('Debug', 'Référence Firebase créée');

          // Test de l'écriture
          const data = {
            startTime: new Date().toISOString(),
            active: true
          };
          Alert.alert('Debug', 'Tentative d\'écriture...');
          
          await set(sessionRef, data);
          Alert.alert('Succès', 'Données envoyées à Firebase !');

          this.sessionId = sessionId;
          return sessionId;
        } catch (innerError) {
          Alert.alert('Erreur Firebase', innerError.message);
          throw innerError;
        }
      } else {
        // Écouter le sessionId
        this.socket.on('session_created', (id: string) => {
          this.sessionId = id;
        });
      }
    } catch (error) {
      Alert.alert('Erreur Générale', error.message);
      throw error;
    }
  }
} 