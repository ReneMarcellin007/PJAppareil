from detecteur import DetecteurSecurite, DetecteurException
from hardware.bluetooth_beacon import BluetoothBeacon, BeaconException
from power_manager import PowerManager
import time
import logging
import sys

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/sd/security.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def obtenir_vitesse_vehicule():
    try:
        return 70  # km/h
    except Exception as e:
        logging.error(f"Erreur lecture vitesse véhicule: {e}")
        return 0

def enregistrer_incident(distance, vitesse_ego, vitesse_suiveur):
    try:
        with open('/sd/incidents.log', 'a') as f:
            f.write(f"{time.time()},{distance},{vitesse_ego},{vitesse_suiveur}\n")
    except Exception as e:
        logging.error(f"Erreur enregistrement incident: {e}")

def verifier_presence_conducteur(beacon):
    """Vérifie si le conducteur est à proximité via la balise Bluetooth"""
    present, distance = beacon.detecter_balise()
    if present:
        logging.info(f"Conducteur détecté à {distance:.2f}m")
        return True
    return False

def main():
    try:
        # Initialisation du gestionnaire d'alimentation
        power_manager = PowerManager()
        
        # Initialisation de la balise Bluetooth en mode basse consommation
        beacon = BluetoothBeacon()
        power_manager.register_component('bluetooth', beacon)
        
        logging.info("Système initialisé en mode veille")
        power_manager.set_power_mode("SLEEP")
        
        detecteur = None
        beacon_detection_count = 0
        DETECTION_THRESHOLD = 3  # Nombre de détections nécessaires pour activation
        
        while True:
            try:
                present, distance = beacon.detecter_balise()
                
                if present and distance <= 1.5:
                    beacon_detection_count += 1
                    
                    if beacon_detection_count >= DETECTION_THRESHOLD:
                        if power_manager.power_state == "SLEEP":
                            # Initialisation progressive des composants
                            power_manager.set_power_mode("LOW_POWER")
                            time.sleep(0.5)
                            
                            if detecteur is None:
                                detecteur = DetecteurSecurite()
                                power_manager.register_component('camera', detecteur.camera)
                                power_manager.register_component('lidar', detecteur.lidar)
                                power_manager.register_component('led', detecteur.flash)
                                power_manager.register_component('buzzer', detecteur.alarme)
                            
                            power_manager.set_power_mode("ACTIVE")
                            logging.info("Système activé - Mode pleine puissance")
                            
                        # Système actif - surveillance normale
                        distance = detecteur.lidar.lire_distance()
                        vitesse_ego = obtenir_vitesse_vehicule()
                        vehicule_suiveur = detecteur.camera.detecter_vehicule()
                        
                        if vehicule_suiveur and vehicule_suiveur.type == "CAMION":
                            vitesse_suiveur = vehicule_suiveur.estimer_vitesse()
                            
                            niveau_risque, action = detecteur.evaluer_risque(
                                distance, vitesse_ego, vitesse_suiveur
                            )
                            
                            if niveau_risque != "ERREUR":
                                detecteur.executer_alerte(action)
                                
                                if niveau_risque in ["DANGER", "CRITIQUE"]:
                                    enregistrer_incident(distance, vitesse_ego, vitesse_suiveur)
                                    
                else:
                    beacon_detection_count = max(0, beacon_detection_count - 1)
                    
                    if beacon_detection_count == 0 and power_manager.power_state != "SLEEP":
                        logging.info("Balise hors de portée - Passage en mode veille")
                        power_manager.set_power_mode("SLEEP")
                
                # Pause adaptative selon le mode d'alimentation
                if power_manager.power_state == "SLEEP":
                    time.sleep(1.0)  # Scan moins fréquent en mode veille
                elif power_manager.power_state == "LOW_POWER":
                    time.sleep(0.5)
                else:
                    time.sleep(0.1)
                    
            except Exception as e:
                logging.error(f"Erreur: {e}")
                power_manager.set_power_mode("SLEEP")
                time.sleep(5)  # Pause plus longue en cas d'erreur
                
    except Exception as e:
        logging.critical(f"Erreur fatale: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 