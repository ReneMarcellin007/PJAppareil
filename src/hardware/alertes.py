from machine import Pin, PWM
from time import sleep
import logging

class AlerteException(Exception):
    """Exception personnalisée pour les erreurs d'alerte"""
    pass

class LED:
    def __init__(self, pin):
        try:
            self.led = Pin(pin, Pin.OUT)
        except Exception as e:
            logging.error(f"Erreur d'initialisation LED sur pin {pin}: {e}")
            raise AlerteException(f"Échec initialisation LED: {e}")
        
    def sequence_urgence(self):
        try:
            self._executer_pattern([0.1, 0.1] * 3)
        except Exception as e:
            logging.error(f"Erreur séquence urgence: {e}")
            self._securiser_led()
            
    def sequence_attention(self):
        try:
            self._executer_pattern([0.2, 0.3] * 2)
        except Exception as e:
            logging.error(f"Erreur séquence attention: {e}")
            self._securiser_led()
            
    def _executer_pattern(self, pattern):
        try:
            for duree in pattern:
                self.led.value(not self.led.value())
                sleep(duree)
            self.led.value(0)
        except Exception as e:
            raise AlerteException(f"Erreur pattern LED: {e}")
            
    def _securiser_led(self):
        """Assure que la LED est éteinte en cas d'erreur"""
        try:
            self.led.value(0)
        except:
            pass

class Buzzer:
    def __init__(self, pin):
        try:
            self.pwm = PWM(Pin(pin))
            self.pwm.freq(2000)
            self.pwm.duty_u16(0)
        except Exception as e:
            logging.error(f"Erreur d'initialisation Buzzer sur pin {pin}: {e}")
            raise AlerteException(f"Échec initialisation Buzzer: {e}")
        
    def activer(self):
        try:
            self.pwm.duty_u16(32768)
            sleep(1.0)
            self.pwm.duty_u16(0)
        except Exception as e:
            logging.error(f"Erreur activation buzzer: {e}")
            self._securiser_buzzer()
            
    def _securiser_buzzer(self):
        """Assure que le buzzer est éteint en cas d'erreur"""
        try:
            self.pwm.duty_u16(0)
        except:
            pass