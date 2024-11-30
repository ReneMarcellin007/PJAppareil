export interface LocationData {
  sessionId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  speed: number;
  altitude: number;
  deviceConnected: boolean;
}

export interface ValidationEvent {
  eventId: string;
  sessionId: string;
  type: 'FAUX_POSITIF' | 'DANGER_NON_DETECTE' | 'MOYEN_NON_DETECTE';
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
  };
  speed: number;
  notes: string;
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  events: ValidationEvent[];
  locationData: LocationData[];
}

export interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  connected: boolean;
}
