import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { EventList } from '../components/EventList';
import { SpeedIndicator } from '../components/SpeedIndicator';
import { StorageService } from '../services/StorageService';
import { ValidationEvent } from '../types';
import { SyncService } from '../services/SyncService';
import { ref, onValue, off, set } from 'firebase/database';
import { database } from '../services/firebaseConfig';

export const ValidatorScreen = () => {
  const [events, setEvents] = useState<ValidationEvent[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionId = await SyncService.initializeSession(false); // false pour validateur
        setSessionId(sessionId);
        
        // Écouter les mises à jour de la session
        SyncService.listenToSession(sessionId, (sessionData) => {
          if (sessionData.events) {
            setEvents(Object.values(sessionData.events));
          }
        });
      } catch (error) {
        console.error('Erreur initialisation session:', error);
        Alert.alert('Erreur', 'Impossible de rejoindre la session');
      }
    };

    initSession();
  }, []);

  useEffect(() => {
    // Écouter les nouvelles sessions
    const activeSessionRef = ref(database, 'activeSession');
    onValue(activeSessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.val();
        if (sessionData.status === 'active') {
          // Nouvelle session démarrée
          setSessionId(sessionData.sessionId);
          Alert.alert(
            'Nouvelle Session',
            'Le véhicule avant a démarré une session'
          );
        }
      }
    });

    return () => {
      // Nettoyer l'écouteur quand le composant est démonté
      off(activeSessionRef);
    };
  }, []);

  const setupLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire');
        return;
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1
        },
        (location) => setCurrentLocation(location)
      );
    } catch (error) {
      console.error('Erreur configuration localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la localisation');
    }
  };

  const startNewSession = async () => {
    try {
      const newSessionId = await StorageService.startNewSession();
      setSessionId(newSessionId);
    } catch (error) {
      console.error('Erreur création session:', error);
      Alert.alert('Erreur', 'Impossible de créer une session');
    }
  };

  const createEvent = async (type: ValidationEvent['type']) => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Position GPS non disponible');
      return;
    }

    if (!sessionId) {
      Alert.alert('Erreur', 'Aucune session active');
      return;
    }

    try {
      const newEvent: ValidationEvent = {
        eventId: new Date().getTime().toString(),
        sessionId: sessionId,
        type,
        timestamp: new Date().toISOString(),
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || 0,
        },
        speed: currentLocation.coords.speed || 0,
        notes: '',
      };

      await StorageService.saveValidationEvent(newEvent);
      setEvents(prevEvents => [...prevEvents, newEvent]);
    } catch (error) {
      console.error('Erreur création événement:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'événement');
    }
  };

  const getLocationDetails = async (latitude: number, longitude: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (response[0]) {
        return {
          street: response[0].street,
          city: response[0].city,
          region: response[0].region,
          postalCode: response[0].postalCode
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur géocodage:', error);
      return null;
    }
  };

  const testFirebase = async () => {
    try {
      const testRef = ref(database, 'test');
      await set(testRef, {
        message: "Test connection",
        timestamp: new Date().toISOString()
      });
      Alert.alert('Succès', 'Connexion Firebase établie');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {currentLocation && (
        <SpeedIndicator speed={currentLocation.coords.speed || 0} />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.falsePositiveButton]}
          onPress={() => createEvent('FAUX_POSITIF')}
        >
          <Text style={styles.buttonText}>Faux Positif</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]}
          onPress={() => createEvent('DANGER_NON_DETECTE')}
        >
          <Text style={styles.buttonText}>Danger Non Détecté</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.mediumButton]}
          onPress={() => createEvent('MOYEN_NON_DETECTE')}
        >
          <Text style={styles.buttonText}>Risque Moyen Non Détecté</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          onPress={testFirebase}
        >
          <Text style={styles.buttonText}>Tester Firebase</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Événements enregistrés</Text>
        <EventList events={events} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    padding: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  falsePositiveButton: {
    backgroundColor: '#ffc107',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  mediumButton: {
    backgroundColor: '#fd7e14',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
});
