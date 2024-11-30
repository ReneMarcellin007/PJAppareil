import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { ValidationEvent } from '../types';

interface Props {
  events: ValidationEvent[];
  onEventPress?: (event: ValidationEvent) => void;
}

export const EventList: React.FC<Props> = ({ events, onEventPress }) => {
  const getEventTypeColor = (type: ValidationEvent['type']) => {
    switch (type) {
      case 'FAUX_POSITIF':
        return '#ffc107';
      case 'DANGER_NON_DETECTE':
        return '#dc3545';
      case 'MOYEN_NON_DETECTE':
        return '#fd7e14';
      default:
        return '#6c757d';
    }
  };

  const getEventTypeLabel = (type: ValidationEvent['type']) => {
    switch (type) {
      case 'FAUX_POSITIF':
        return 'Faux Positif';
      case 'DANGER_NON_DETECTE':
        return 'Danger Non Détecté';
      case 'MOYEN_NON_DETECTE':
        return 'Risque Moyen Non Détecté';
      default:
        return type;
    }
  };

  const renderItem = ({ item }: { item: ValidationEvent }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => onEventPress && onEventPress(item)}
    >
      <View style={styles.eventHeader}>
        <View 
          style={[
            styles.eventType, 
            { backgroundColor: getEventTypeColor(item.type) }
          ]}
        >
          <Text style={styles.eventTypeText}>
            {getEventTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={styles.eventTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <View style={styles.eventDetails}>
        <Text style={styles.eventSpeed}>
          {Math.round(item.speed * 3.6)} km/h
        </Text>
        {item.notes && (
          <Text style={styles.eventNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={events}
      renderItem={renderItem}
      keyExtractor={(item) => item.eventId}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucun événement enregistré
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventType: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  eventTypeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  eventTime: {
    color: '#666',
    fontSize: 12,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventSpeed: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  eventNotes: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
});
