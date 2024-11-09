from machine import Pin, PWM
import time
import logging

class PowerManager:
    def __init__(self):
        self.components = {
            'camera': None,          # OpenMV Cam H7 Plus
            'lidar': None,           # LIDAR-Lite v4 LED
            'audio': None,           # Haut-parleur + PAM8403
            'storage': None,         # Carte SD
            'laser': None,           # LED 20W XML 5050
            'solar': None,           # Panneaux solaires
            'battery': None,         # Batteries LiFePO4
            'converters': [],        # Convertisseurs MT3608
            'bluetooth': None        # Module BLE AT-09
        }
        
        self.power_consumption = {
            'camera': 2.0,           # 2W en fonctionnement
            'lidar': 0.5,           # 500mW
            'audio': 3.0,           # 3W max
            'storage': 0.2,         # 200mW
            'laser': 20.0,          # 20W max
            'bluetooth': 0.1        # 100mW
        }
        
        self._initialize_power_control()

    def _initialize_power_control(self):
        """Initialise les contrôles d'alimentation pour chaque composant"""
        self.power_pins = {
            'camera': Pin(15, Pin.OUT),
            'lidar': Pin(16, Pin.OUT),
            'audio': Pin(17, Pin.OUT),
            'laser': Pin(18, Pin.OUT),
            'storage': Pin(19, Pin.OUT),
            'bluetooth': Pin(20, Pin.OUT)
        }
        
        # Initialisation des convertisseurs DC-DC
        self.converters = [
            {'pin': Pin(21, Pin.OUT), 'voltage': 5.0},   # Pour caméra
            {'pin': Pin(22, Pin.OUT), 'voltage': 12.0},  # Pour laser
            {'pin': Pin(23, Pin.OUT), 'voltage': 3.3},   # Pour logique
            {'pin': Pin(24, Pin.OUT), 'voltage': 5.0},   # Pour audio
            {'pin': Pin(25, Pin.OUT), 'voltage': 3.3}    # Pour Bluetooth
        ]

    def set_power_mode(self, mode):
        """Gestion avancée des modes d'alimentation"""
        if mode == "SLEEP":
            self._sleep_mode()
        elif mode == "LOW_POWER":
            self._low_power_mode()
        elif mode == "ACTIVE":
            self._active_mode()
            
        self._update_converters(mode)
        self.power_state = mode
        self._log_power_status()

    def _sleep_mode(self):
        """Mode veille profonde - économie maximale"""
        # Désactive tout sauf Bluetooth et gestion batterie
        for component, pin in self.power_pins.items():
            if component not in ['bluetooth', 'battery']:
                pin.value(0)
        
        # Désactive les convertisseurs non essentiels
        for conv in self.converters[:-1]:  # Garde le dernier pour Bluetooth
            conv['pin'].value(0)

    def _low_power_mode(self):
        """Mode surveillance minimale"""
        # Active uniquement Bluetooth et LIDAR
        components_needed = ['bluetooth', 'lidar', 'storage']
        for component, pin in self.power_pins.items():
            pin.value(1 if component in components_needed else 0)

    def _active_mode(self):
        """Mode pleine puissance avec gestion intelligente"""
        # Active tous les composants nécessaires
        for pin in self.power_pins.values():
            pin.value(1)

    def _update_converters(self, mode):
        """Gestion intelligente des convertisseurs selon le mode"""
        if mode == "SLEEP":
            # Seul le convertisseur Bluetooth actif
            for conv in self.converters[:-1]:
                conv['pin'].value(0)
            self.converters[-1]['pin'].value(1)
            
        elif mode == "LOW_POWER":
            # Convertisseurs pour Bluetooth et LIDAR
            for i, conv in enumerate(self.converters):
                conv['pin'].value(1 if i in [2, 4] else 0)
                
        else:  # ACTIVE
            # Tous les convertisseurs actifs
            for conv in self.converters:
                conv['pin'].value(1)

    def estimate_battery_life(self):
        """Estime l'autonomie restante"""
        total_consumption = 0
        if self.power_state == "SLEEP":
            total_consumption = 0.2  # 200mW en veille
        elif self.power_state == "LOW_POWER":
            total_consumption = 0.8  # 800mW en mode économique
        else:
            # Calcul basé sur les composants actifs
            for component, consumption in self.power_consumption.items():
                if self.power_pins[component].value():
                    total_consumption += consumption
                    
        # Capacité batterie: 25000mAh * 3.2V * 2 (2 batteries)
        battery_capacity_wh = 25 * 3.2 * 2  # Wh
        estimated_hours = battery_capacity_wh / total_consumption
        
        return estimated_hours

    def _log_power_status(self):
        """Enregistre l'état de consommation"""
        total_consumption = sum(
            consumption 
            for component, consumption in self.power_consumption.items()
            if self.power_pins[component].value()
        )
        
        logging.info(f"""
        Mode: {self.power_state}
        Consommation totale: {total_consumption:.2f}W
        Autonomie estimée: {self.estimate_battery_life():.1f}h
        Composants actifs: {[comp for comp, pin in self.power_pins.items() if pin.value()]}
        """)