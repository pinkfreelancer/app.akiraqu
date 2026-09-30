import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer, collection, serverTimestamp } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

let appInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;
let dbInstance: any = null;

try {
  const firebaseConfig = {
    apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
    authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
    projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
    storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
    messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
    appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
  };

  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(appInstance);
  googleProviderInstance = new GoogleAuthProvider();
  googleProviderInstance.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const dbId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      dbInstance = getFirestore(appInstance, dbId);
    } else {
      dbInstance = getFirestore(appInstance);
    }
  } catch (dbErr) {
    console.warn('Custom Firestore databaseId initialization warning, falling back to default db:', dbErr);
    dbInstance = getFirestore(appInstance);
  }
} catch (err) {
  console.error('Firebase initialization notice:', err);
}

export const app = appInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const db = dbInstance;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  isAnonymous?: boolean;
}

/**
 * Sign in with Google (Gmail)
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Trader',
      photoURL: user.photoURL,
      lastLoginAt: new Date().toISOString(),
    };

    // Sync to Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore user profile sync non-critical notice:', fsErr);
    }

    return profile;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    // If popup blocked in restricted iframe, throw descriptive error so fallback modal can assist
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Validate connection to Firestore on boot
 */
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check notice:', error.message);
    }
  }
}
testConnection();
