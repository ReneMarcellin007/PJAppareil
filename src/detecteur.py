from hardware.camera import Camera, CameraException
from hardware.lidar import LIDAR, LidarException
from hardware.alertes import LED, Buzzer, AlerteException
from config import *
import time
import logging

class DetecteurException(Exception):
    """Exception personnalisée pour les erreurs du détecteur"""
    pass

class DetecteurSecurite:
    def __init__(self):
        try:
            self.camera = Camera(CAMERA_RESOLUTION, CAMERA_FPS)
            self.lidar = LIDAR(PIN_LIDAR_SDA, PIN_LIDAR_SCL)
            self.flash = LED(PIN_LED)
            self.alarme = Buzzer(PIN_BUZZER)
        except Exception as e:
            logging.error(f"Erreur initialisation détecteur: {e}")
            raise DetecteurException(f"Échec initialisation détecteur: {e}")
        
    def calculer_distance_securite(self, vitesse_ego, vitesse_suiveur):
        try:
            distance_temps = (vitesse_suiveur / 3.6) * 3
            marge_vitesse = max(0, (vitesse_suiveur - vitesse_ego) / 3.6) * 2
            return distance_temps + marge_vitesse
        except Exception as e:
            logging.error(f"Erreur calcul distance sécurité: {e}")
            return DISTANCE_SECURITE_BASE

    def evaluer_risque(self, distance_actuelle, vitesse_ego, vitesse_suiveur):
        try:
            if distance_actuelle is None:
                return ("ERREUR", "AUCUNE")
                
            distance_securite = self.calculer_distance_securite(vitesse_ego, vitesse_suiveur)
            taux_rapprochement = max(0, vitesse_suiveur - vitesse_ego) / 3.6
            
            if distance_actuelle <= DISTANCE_CRITIQUE:
                return ("CRITIQUE", "FLASH_ET_ALARME")
            elif distance_actuelle <= DISTANCE_DANGEREUSE:
                if taux_rapprochement > 5:
                    return ("DANGER", "FLASH_ET_ALARME")
                return ("DANGER", "FLASH")
            elif distance_actuelle < distance_securite:
                if taux_rapprochement > 10:
                    return ("ATTENTION", "FLASH_ET_ALARME")
                elif taux_rapprochement > 5:
                    return ("ATTENTION", "FLASH")
            return ("NORMAL", "AUCUNE")
        except Exception as e:
            logging.error(f"Erreur évaluation risque: {e}")
            return ("ERREUR", "AUCUNE")

    def executer_alerte(self, action):
        try:
            if action == "FLASH_ET_ALARME":
                self.flash.sequence_urgence()
                self.alarme.activer()
            elif action == "FLASH":
                self.flash.sequence_attention()
        except Exception as e:
            logging.error(f"Erreur exécution alerte: {e}")