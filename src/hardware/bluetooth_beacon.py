from machine import UART
import time
import logging

class BeaconException(Exception):
    """Exception personnalisée pour les erreurs de balise Bluetooth"""
    pass

class BluetoothBeacon:
    def __init__(self, uart_id=0, tx_pin=0, rx_pin=1):
        try:
            self.uart = UART(uart_id, baudrate=9600, tx=tx_pin, rx=rx_pin)
            self.target_uuid = "FDA50693-A4E2-4FB1-AFCF-C6FB0764"
            self.target_name = "HOLY-IOT"
            self.last_detection = None
            self._initialize()
        except Exception as e:
            logging.error(f"Erreur initialisation Bluetooth: {e}")
            raise BeaconException(f"Échec initialisation Bluetooth: {e}")
    
    def _initialize(self):
        try:
            # Configuration du module BLE
            self.uart.write("AT+ROLE0\r\n")  # Mode scanner
            time.sleep(0.1)
            self.uart.write("AT+IMME1\r\n")  # Scan manuel
            time.sleep(0.1)
            self.uart.write("AT+RESET\r\n")  # Reset pour appliquer les paramètres
            time.sleep(1)
        except Exception as e:
            raise BeaconException(f"Erreur configuration Bluetooth: {e}")
    
    def detecter_balise(self):
        """
        Détecte si la balise cible est à proximité (≤ 1.5m)
        Retourne: (bool, float) - (détecté, distance estimée en mètres)
        """
        try:
            self.uart.write("AT+DISI?\r\n")  # Démarre le scan
            time.sleep(0.5)
            
            while self.uart.any():
                data = self.uart.readline().decode('utf-8')
                if self.target_uuid in data:
                    # Analyse du RSSI pour estimer la distance
                    rssi = self._extraire_rssi(data)
                    distance = self._calculer_distance(rssi)
                    
                    if distance <= 1.5:
                        self.last_detection = time.time()
                        return True, distance
                        
            return False, None
            
        except Exception as e:
            logging.error(f"Erreur détection balise: {e}")
            return False, None
    
    def _extraire_rssi(self, data):
        """Extrait la valeur RSSI des données reçues"""
        try:
            # Format exemple: OK+DISC:HOLY-IOT,-65,FDA50693-A4E2...
            parts = data.split(',')
            return int(parts[1])
        except:
            return -100  # Valeur par défaut faible
    
    def _calculer_distance(self, rssi):
        """Calcule la distance approximative basée sur le RSSI"""
        # Formule simplifiée de calcul de distance basée sur RSSI
        # Distance = 10 ^ ((Measured Power - RSSI) / (10 * N))
        # où N est le facteur de perte de propagation (généralement entre 2 et 4)
        MEASURED_POWER = -59  # RSSI à 1 mètre
        N = 2.5
        
        return 10 ** ((MEASURED_POWER - rssi) / (10 * N)) 