import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { database } from '../services/firebaseConfig';
import { ref, get } from 'firebase/database';
import * as Location from 'expo-location';

export const VisualizationScreen = ({ navigation }) => {
  const [totalAccidents, setTotalAccidents] = useState(0);
  const [monthlyAccidents, setMonthlyAccidents] = useState(0);
  const [accidents, setAccidents] = useState([]);

  useEffect(() => {
    loadAccidentData();
  }, []);

  const loadAccidentData = async () => {
    try {
      const sessionsRef = ref(database, 'sessions');
      const snapshot = await get(sessionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const accidentsList = [];
        let total = 0;
        let monthly = 0;
        const currentMonth = new Date().getMonth();

        for (const sessionId in data) {
          const session = data[sessionId];
          if (session.locationData) {
            for (const locationData of Object.values(session.locationData)) {
              const accident = locationData;
              const accidentDate = new Date(accident.timestamp);
              
              const address = await getLocationAddress(
                accident.location.latitude,
                accident.location.longitude
              );
              accident.address = address;
              
              accidentsList.push(accident);
              total++;
              
              if (accidentDate.getMonth() === currentMonth) {
                monthly++;
              }
            }
          }
        }

        setAccidents(accidentsList);
        setTotalAccidents(total);
        setMonthlyAccidents(monthly);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const getLocationAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (response[0]) {
        const { street, city, region, country, postalCode } = response[0];
        return `${street}, ${city}, ${region} ${postalCode}, ${country}`;
      }
      return "Adresse inconnue";
    } catch (error) {
      console.error('Erreur géocodage:', error);
      return "Adresse inconnue";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Statistiques</Text>
        <Text style={styles.statsText}>
          Total d'accidents sauvés dans le monde : {totalAccidents}
        </Text>
        <Text style={styles.statsText}>
          Nombre total d'accidents sauvés ce mois : {monthlyAccidents}
        </Text>
      </View>

      <FlatList
        data={accidents}
        keyExtractor={(item) => item.sessionId}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.accidentItem}
            onPress={() => navigation.navigate('AccidentDetails', { accident: item })}
          >
            <Text style={styles.address}>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statsContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  accidentItem: {
    padding: 15,
  },
  address: {
    fontSize: 16,
  },
}); 