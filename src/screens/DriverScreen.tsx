import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { SessionTimer } from '../components/SessionTimer';
import { SpeedIndicator } from '../components/SpeedIndicator';
import { StorageService } from '../services/StorageService';
import { bluetoothService } from '../services/BluetoothService';
import { SyncService } from '../services/SyncService';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../services/firebaseConfig';

export const DriverScreen = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Simulation connexion Bluetooth au démarrage
  useEffect(() => {
    setupBluetooth();
  }, []);

  const setupBluetooth = async () => {
    try {
      await bluetoothService.initialize();
      bluetoothService.scanForDevices((device) => {
        if (device.name === 'SecuriteAuto') {
          connectToDevice(device.id);
        }
      });
    } catch (error) {
      Alert.alert('Erreur', 'Configuration Bluetooth impossible');
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      const success = await bluetoothService.connectToDevice(deviceId);
      setDeviceConnected(success);
      if (success) {
        Alert.alert('Connecté', 'Appareil connecté avec succès');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Connexion impossible');
    }
  };

  const startSession = async () => {
    try {
      if (!deviceConnected) {
        Alert.alert('Erreur', 'Veuillez connecter l\'appareil d\'abord');
        return;
      }

      const newSessionId = await StorageService.startNewSession();
      setSessionId(newSessionId);
      setIsSessionActive(true);
      Alert.alert('Succès', 'Session démarrée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la session');
    }
  };

  const endSession = async () => {
    try {
      if (sessionId) {
        // Terminer la session dans Firebase
        await StorageService.endCurrentSession();
        
        // Mettre à jour l'interface
        setIsSessionActive(false);
        setSessionId(null);
        
        Alert.alert('Succès', 'Session terminée');
      }
    } catch (error) {
      console.error('Erreur fin session:', error);
      Alert.alert('Erreur', 'Impossible de terminer la session');
    }
  };

  const testDataRecording = async () => {
    try {
      if (!sessionId || !isSessionActive) {
        Alert.alert('Erreur', 'Aucune session active. Démarrez une session d\'abord.');
        return;
      }

      // Test d'enregistrement
      await StorageService.saveLocationData({
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        location: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10
        },
        speed: 50,
        altitude: 100,
        deviceConnected: true
      });

      Alert.alert('Succès', 'Données enregistrées. Vérifiez Firebase.');
    } catch (error) {
      Alert.alert('Erreur', 'Test échoué: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Statut Bluetooth */}
      <View style={styles.statusBar}>
        <Text style={[styles.statusText, deviceConnected ? styles.connected : styles.disconnected]}>
          {deviceConnected ? 'Appareil connecté' : 'Appareil déconnecté'}
        </Text>
      </View>

      {/* Timer et vitesse si session active */}
      {isSessionActive && sessionId && (
        <>
          <SessionTimer startTime={new Date(parseInt(sessionId)).toISOString()} />
          <SpeedIndicator speed={0} />
        </>
      )}

      {/* Bouton principal */}
      <TouchableOpacity 
        style={[styles.button, isSessionActive ? styles.stopButton : styles.startButton]}
        onPress={isSessionActive ? endSession : startSession}
      >
        <Text style={styles.buttonText}>
          {isSessionActive ? 'Arrêter Session' : 'Démarrer Session'}
        </Text>
      </TouchableOpacity>

      {/* Bouton de test (visible uniquement si session active) */}
      {isSessionActive && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#4CAF50', marginTop: 10 }]}
          onPress={testDataRecording}
        >
          <Text style={styles.buttonText}>Tester Enregistrement</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  statusBar: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    marginBottom: 20,
  },
  statusText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  connected: {
    color: '#28a745',
  },
  disconnected: {
    color: '#dc3545',
  },
  button: {
    padding: 20,
    borderRadius: 15,
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  startButton: {
    backgroundColor: '#007bff',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
