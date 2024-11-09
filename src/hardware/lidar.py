from machine import I2C, Pin
from time import sleep
import logging

class LidarException(Exception):
    """Exception personnalisée pour les erreurs LIDAR"""
    pass

class LIDAR:
    def __init__(self, sda_pin, scl_pin):
        try:
            self.i2c = I2C(0, sda=Pin(sda_pin), scl=Pin(scl_pin))
            self._initialize()
            self._derniere_distance = None
        except Exception as e:
            logging.error(f"Erreur initialisation LIDAR: {e}")
            raise LidarException(f"Échec initialisation LIDAR: {e}")
        
    def _initialize(self):
        try:
            # Configuration initiale du LIDAR
            if not self._verifier_connexion():
                raise LidarException("LIDAR non détecté")
        except Exception as e:
            raise LidarException(f"Erreur configuration LIDAR: {e}")
            
    def _verifier_connexion(self):
        try:
            # Vérification de la présence du LIDAR sur le bus I2C
            return len(self.i2c.scan()) > 0
        except:
            return False
        
    def lire_distance(self):
        try:
            # Simulation pour les tests
            distance = 25.0
            self._derniere_distance = distance
            return distance
        except Exception as e:
            logging.error(f"Erreur lecture LIDAR: {e}")
            return self._derniere_distance or None