import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';

WebBrowser.maybeCompleteAuthSession();

export class GoogleDriveService {
  private static accessToken: string | null = null;
  private static readonly CLIENT_ID = '767823040006-famgh0hqcsr64o7045fipsu4k7jrqp2c.apps.googleusercontent.com';
  private static readonly BUNDLE_ID = 'com.007trm2024.SafetyValidatorApp';

  private static async signIn(): Promise<boolean> {
    try {
      const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: this.CLIENT_ID,
        iosClientId: this.CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const result = await promptAsync();
      
      if (result?.type === 'success') {
        this.accessToken = result.authentication?.accessToken || null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur authentification Google:', error);
      return false;
    }
  }

  static async uploadSessionData(sessionData: any, deviceType: 'DEVICE' | 'VALIDATION') {
    try {
      if (!this.accessToken) {
        const isSignedIn = await this.signIn();
        if (!isSignedIn) return false;
      }

      const date = new Date();
      const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}_${deviceType}.txt`;

      const data = JSON.stringify(sessionData, null, 2);

      const tempFilePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(tempFilePath, data);

      const metadata = {
        name: fileName,
        mimeType: 'text/plain',
        parents: ['root']
      };

      const form = new FormData();
      form.append('metadata', JSON.stringify(metadata), {
        contentType: 'application/json'
      });
      form.append('file', {
        uri: tempFilePath,
        type: 'text/plain',
        name: fileName
      });

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: form
        }
      );

      await FileSystem.deleteAsync(tempFilePath);

      return response.ok;
    } catch (error) {
      console.error('Erreur upload Drive:', error);
      return false;
    }
  }

  static isSignedIn(): boolean {
    return this.accessToken !== null;
  }

  static signOut(): void {
    this.accessToken = null;
  }
} 