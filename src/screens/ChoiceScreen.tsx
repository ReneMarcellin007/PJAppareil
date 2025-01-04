import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const ChoiceScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sélection du Mode</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.driverButton]}
          onPress={() => navigation.navigate('Driver')}
        >
          <Text style={styles.buttonText}>Conducteur Avant</Text>
          <Text style={styles.buttonSubtext}>Véhicule avec appareil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.validatorButton]}
          onPress={() => navigation.navigate('Validator')}
        >
          <Text style={styles.buttonText}>Conducteur Arrière</Text>
          <Text style={styles.buttonSubtext}>Véhicule suiveur</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.settingsButton]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Paramètres</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.visualizationButton]}
          onPress={() => navigation.navigate('Visualization')}
        >
          <Text style={styles.buttonText}>Visualisation</Text>
          <Text style={styles.buttonSubtext}>Voir les accidents évités</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#2c3e50',
  },
  button: {
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  driverButton: {
    backgroundColor: '#3498db',
  },
  validatorButton: {
    backgroundColor: '#2ecc71',
  },
  settingsButton: {
    backgroundColor: '#95a5a6',
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  visualizationButton: {
    backgroundColor: '#9b59b6',
    marginTop: 10,
  },
});
