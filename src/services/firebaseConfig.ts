import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCeWGo5rw54dpmGVPApC6m0AtQr20kiKpg",
  authDomain: "pj-app-741ee.firebaseapp.com",
  databaseURL: "https://pj-app-741ee-default-rtdb.firebaseio.com",
  projectId: "pj-app-741ee",
  storageBucket: "pj-app-741ee.firebasestorage.app",
  messagingSenderId: "862897858031",
  appId: "1:862897858031:web:9d6cc920b0c12c01f9021a"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const storage = getStorage(app);
