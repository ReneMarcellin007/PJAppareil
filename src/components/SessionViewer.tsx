import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Video } from 'react-native';
import { StorageService } from '../services/StorageService';

export const SessionViewer = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await StorageService.getAllSessions();
      setSessions(Object.entries(allSessions).map(([id, data]) => ({
        id,
        ...data
      })));
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    }
  };

  const renderSession = ({ item }) => (
    <TouchableOpacity 
      style={styles.sessionItem}
      onPress={() => setSelectedSession(item)}
    >
      <Text style={styles.sessionTitle}>Session {item.id}</Text>
      <Text>Date: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text>Vidéos: {item.videos?.length || 0}</Text>
      <Text>Fichiers texte: {item.textFiles?.length || 0}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {selectedSession ? (
        <View style={styles.sessionDetail}>
          <TouchableOpacity onPress={() => setSelectedSession(null)}>
            <Text style={styles.backButton}>← Retour</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Vidéos</Text>
          {selectedSession.videos?.map((videoUrl, index) => (
            <Video
              key={index}
              source={{ uri: videoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
            />
          ))}

          <Text style={styles.title}>Fichiers texte</Text>
          {selectedSession.textFiles?.map((file, index) => (
            <View key={index} style={styles.textFile}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text>{file.content}</Text>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sessionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionDetail: {
    padding: 15,
  },
  backButton: {
    fontSize: 18,
    color: 'blue',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  video: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  textFile: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginVertical: 5,
    borderRadius: 5,
  },
  fileName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
