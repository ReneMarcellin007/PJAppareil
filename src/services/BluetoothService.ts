export class BluetoothService {
  private static instance: BluetoothService;
  private connected: boolean = false;
  private device: any = null;
  private isMockMode: boolean = true; // Mode simulation

  static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isMockMode) {
      console.log('Mode simulation Bluetooth activé');
      return Promise.resolve();
    }
  }

  async scanForDevices(onDeviceFound: (device: any) => void): Promise<void> {
    if (this.isMockMode) {
      // Simuler la découverte d'un appareil
      setTimeout(() => {
        onDeviceFound({
          id: 'MOCK_DEVICE_001',
          name: 'SecuriteAuto',
          rssi: -60
        });
      }, 1000);
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    if (this.isMockMode) {
      this.connected = true;
      this.device = deviceId;
      return true;
    }
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.isMockMode) {
      this.connected = false;
      this.device = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async saveVideoFromDevice(videoData: Blob, sessionId: string): Promise<string> {
    try {
      // 1. Sauvegarder localement
      const fileName = `accident_${sessionId}_${Date.now()}.mp4`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // 2. Sauvegarder dans Firebase Storage
      const videoRef = storageRef(storage, `accidents/${sessionId}/${fileName}`);
      await uploadBytes(videoRef, videoData);
      const firebaseUrl = await getDownloadURL(videoRef);

      // 3. Sauvegarder localement aussi
      await FileSystem.writeAsStringAsync(filePath, await videoData.text(), {
        encoding: FileSystem.EncodingType.UTF8
      });

      // 4. Retourner les deux URLs
      return JSON.stringify({
        localPath: filePath,
        firebaseUrl: firebaseUrl
      });
    } catch (error) {
      console.error('Erreur sauvegarde vidéo:', error);
      throw error;
    }
  }
}

export const bluetoothService = BluetoothService.getInstance();
