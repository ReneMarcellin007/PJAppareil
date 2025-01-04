import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Share,
  Alert 
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

export const AccidentDetailsScreen = ({ route }) => {
  const { accident } = route.params;

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Vérifier les permissions de la médiathèque
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la médiathèque est nécessaire pour sauvegarder et partager les vidéos'
        );
      }
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
    }
  };

  const shareToSocial = async (platform: string) => {
    try {
      // Vérifier à nouveau les permissions avant le partage
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible de partager la vidéo sans accès à la médiathèque');
        return;
      }

      const message = "Les amis je viens d'éviter un accident aujourd'hui, regarder la vidéo.";
      
      if (accident.videoPath) {
        await Share.share({
          message,
          url: accident.videoPath
        });
      } else {
        await Share.share({
          message
        });
      }
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  return (
    <View style={styles.container}>
      {accident.videoPath ? (
        <Video
          source={{ uri: accident.videoPath }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay={false}
          isLooping={false}
          style={styles.video}
          useNativeControls
        />
      ) : (
        <View style={styles.noVideoContainer}>
          <Text style={styles.noVideoText}>Vidéo non disponible</Text>
        </View>
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.speedText}>
          Vitesse du véhicule : {Math.round(accident.speed * 3.6)} km/h
        </Text>
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => shareToSocial('facebook')}
        >
          <Ionicons name="logo-facebook" size={30} color="white" />
          <Text style={styles.socialText}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => shareToSocial('twitter')}
        >
          <Ionicons name="logo-twitter" size={30} color="white" />
          <Text style={styles.socialText}>X</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => shareToSocial('instagram')}
        >
          <Ionicons name="logo-instagram" size={30} color="white" />
          <Text style={styles.socialText}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => shareToSocial('tiktok')}
        >
          <Ionicons name="logo-tiktok" size={30} color="white" />
          <Text style={styles.socialText}>TikTok</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  video: {
    width: '100%',
    height: 300,
  },
  noVideoContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noVideoText: {
    fontSize: 16,
    color: '#666',
  },
  detailsContainer: {
    padding: 15,
  },
  speedText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    marginTop: 20,
  },
  socialButton: {
    alignItems: 'center',
    padding: 10,
  },
  socialText: {
    color: '#333',
    marginTop: 5,
    fontSize: 12,
  }
}); 