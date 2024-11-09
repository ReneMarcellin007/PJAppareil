from openmv import sensor, image
import logging

class CameraException(Exception):
    """Exception personnalisée pour les erreurs de caméra"""
    pass

class Camera:
    def __init__(self, resolution, fps):
        self.resolution = resolution
        self.fps = fps
        self._initialize()
        
    def _initialize(self):
        try:
            sensor.reset()
            sensor.set_pixformat(sensor.RGB565)
            sensor.set_framesize(sensor.VGA)
            sensor.set_windowing(self.resolution)
            sensor.skip_frames(time=2000)
            sensor.set_auto_gain(False)
            sensor.set_auto_whitebal(False)
        except Exception as e:
            logging.error(f"Erreur initialisation caméra: {e}")
            raise CameraException(f"Échec initialisation caméra: {e}")
        
    def capturer_image(self):
        try:
            return sensor.snapshot()
        except Exception as e:
            logging.error(f"Erreur capture image: {e}")
            return None
        
    def detecter_vehicule(self):
        try:
            img = self.capturer_image()
            if img is None:
                raise CameraException("Impossible de capturer l'image")
            return VehiculeDetecte()
        except Exception as e:
            logging.error(f"Erreur détection véhicule: {e}")
            return None

class VehiculeDetecte:
    def __init__(self):
        self.type = "CAMION"
        self.position = (0, 0)
        self.taille = (0, 0)
        self._derniere_vitesse = None
        
    def estimer_vitesse(self):
        try:
            # Simulation pour les tests
            vitesse = 80
            self._derniere_vitesse = vitesse
            return vitesse
        except Exception as e:
            logging.error(f"Erreur estimation vitesse: {e}")
            return self._derniere_vitesse or 0