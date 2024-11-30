import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  speed: number; // vitesse en m/s
}

export const SpeedIndicator: React.FC<Props> = ({ speed }) => {
  // Conversion m/s en km/h avec valeur absolue et arrondi
  const speedKmh = Math.max(0, Math.round(Math.abs(speed) * 3.6));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vitesse actuelle</Text>
      <View style={styles.speedContainer}>
        <Text style={styles.speed}>{speedKmh}</Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    margin: 10,
  },
  label: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  speed: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#212529',
  },
  unit: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 10,
    marginLeft: 5,
  },
});
