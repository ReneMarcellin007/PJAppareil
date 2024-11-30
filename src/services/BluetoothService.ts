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
}

export const bluetoothService = BluetoothService.getInstance();
