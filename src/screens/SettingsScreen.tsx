import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { StorageService } from '../services/StorageService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ref, set } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { GoogleDriveService } from '../services/GoogleDriveService';

export const SettingsScreen = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await StorageService.exportSessionData();
      
      // Créer un fichier temporaire
      const fileUri = `${FileSystem.documentDirectory}safety_validator_export.txt`;
      await FileSystem.writeAsStringAsync(fileUri, data);

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await StorageService.clearAllData();
              Alert.alert('Succès', 'Toutes les données ont été supprimées');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer les données');
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const testConnections = async () => {
    try {
      // Test Firebase
      const testRef = ref(database, 'test');
      await set(testRef, {
        message: "Test Firebase",
        timestamp: new Date().toISOString()
      });
      Alert.alert('Succès', 'Connexion Firebase OK');

      // Test Google Drive
      const isGoogleConnected = await GoogleDriveService.isSignedIn();
      if (isGoogleConnected) {
        Alert.alert('Succès', 'Déjà connecté à Google Drive');
      } else {
        Alert.alert('Info', 'Non connecté à Google Drive. Connexion nécessaire.');
      }

    } catch (error) {
      Alert.alert('Erreur', 'Problème de connexion: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exportation des données</Text>
        <TouchableOpacity 
          style={[styles.button, styles.exportButton]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Exporter les données</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestion des données</Text>
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={handleClearData}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Effacer toutes les données</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test des connexions</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={testConnections}
        >
          <Text style={styles.buttonText}>Tester les connexions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Version: 1.0.0</Text>
          <Text style={styles.infoText}>© 2024 Safety Validator</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#007bff',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
});
