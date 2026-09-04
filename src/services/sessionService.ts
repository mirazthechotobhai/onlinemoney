import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { RemoteMessage, RemoteSession } from '../types';

export const SESSIONS_COLLECTION = 'remote_sessions';

/**
 * Generates a permanent, deterministic 6-character code from a Gmail/User identity.
 * The SAME Gmail account will ALWAYS produce the EXACT SAME permanent code on any device.
 * No random codes are generated.
 */
export function getPermanentCodeForUser(email?: string | null, uid?: string | null): string {
  const key = (email || uid || 'remote-user@gmail.com').toLowerCase().trim();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 30 unambiguous uppercase chars

  // High-entropy 32-bit FNV-1a hash
  let h1 = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h1 ^= key.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }

  // Secondary hash (Murmur3/DJB2 blend) for uniform diffusion
  let h2 = 5381;
  for (let i = key.length - 1; i >= 0; i--) {
    h2 = (Math.imul(h2, 33) ^ key.charCodeAt(i)) >>> 0;
  }

  let combined = (BigInt(h1 >>> 0) << 32n) | BigInt(h2 >>> 0);
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = Number(combined % BigInt(chars.length));
    code += chars[idx];
    combined = combined / BigInt(chars.length);
  }

  return code;
}

/**
 * Remote creates or claims a session with the user's permanent code after Google Sign-In.
 * Crucial: If the session was already activated by the main screen, it PRESERVES 'active' status!
 */
export async function createRemoteSession(
  code: string,
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; isAlreadyActive?: boolean; error?: string }> {
  try {
    const formattedCode = code.trim().toUpperCase();
    const sessionRef = doc(db, SESSIONS_COLLECTION, formattedCode);

    // Check if session already exists to preserve active status across reloads
    const existingSnap = await getDoc(sessionRef);
    let currentStatus: 'waiting' | 'active' = 'waiting';
    let isAlreadyActive = false;

    if (existingSnap.exists()) {
      const data = existingSnap.data();
      if (data?.status === 'active') {
        currentStatus = 'active';
        isAlreadyActive = true;
      }
    }

    await setDoc(
      sessionRef,
      {
        code: formattedCode,
        userId: user.uid,
        userEmail: user.email || '',
        userDisplayName: user.displayName || 'Remote User',
        userPhoto: user.photoURL || '',
        status: currentStatus,
        lastActive: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return { success: true, isAlreadyActive };
  } catch (err: any) {
    console.error('Failed to create permanent remote session in Firestore:', err);
    return { success: false, error: err?.message || 'Failed to save code in Firebase' };
  }
}

/**
 * Main site verifies and activates the permanent pairing code against Firebase Firestore.
 * Once activated, it stays active indefinitely until explicit logout.
 */
export async function activateSessionOnMain(code: string): Promise<{ success: boolean; session?: RemoteSession; error?: string }> {
  try {
    const formattedCode = code.trim().toUpperCase();
    const sessionRef = doc(db, SESSIONS_COLLECTION, formattedCode);
    const snap = await getDoc(sessionRef);

    if (!snap.exists()) {
      return {
        success: false,
        error: `Permanent code "${formattedCode}" not found in Firebase. Please sign into Google on the remote first.`,
      };
    }

    const data = snap.data() as RemoteSession;
    await updateDoc(sessionRef, {
      status: 'active',
      lastActive: Date.now(),
      activatedAt: Date.now(),
    });

    return { success: true, session: { ...data, status: 'active' } };
  } catch (err: any) {
    console.error('Error activating session on main:', err);
    let msg = err?.message || 'Failed to verify session code in Firebase';
    if (msg.includes('offline')) {
      msg = 'Could not reach Firebase database. Verifying database connection...';
    }
    return { success: false, error: msg };
  }
}

/**
 * Deactivates session status to 'logged_out' and sends a logout message so main website automatically logs out too
 */
export async function deactivateSession(code: string): Promise<void> {
  if (!code) return;
  try {
    const formattedCode = code.trim().toUpperCase();
    const sessionRef = doc(db, SESSIONS_COLLECTION, formattedCode);
    await updateDoc(sessionRef, {
      status: 'logged_out',
      lastMessage: {
        id: `logout-${Date.now()}`,
        type: 'logout',
        sender: 'remote',
        payload: {
          timestamp: Date.now(),
        },
      },
      lastActive: Date.now(),
    });
  } catch (err) {
    console.error('Error deactivating session in Firebase:', err);
  }
}

/**
 * Push remote interaction message to Firestore under the session document
 */
export async function sendRemoteActionToFirebase(code: string, message: RemoteMessage): Promise<void> {
  if (!code) return;
  try {
    const formattedCode = code.trim().toUpperCase();
    const sessionRef = doc(db, SESSIONS_COLLECTION, formattedCode);
    // Sanitize message to strip any undefined values that Firestore rejects
    const sanitizedMessage = JSON.parse(JSON.stringify(message));
    await updateDoc(sessionRef, {
      lastMessage: sanitizedMessage,
      lastActive: Date.now(),
    });
  } catch (err) {
    console.error('Error sending remote action to Firebase:', err);
  }
}

/**
 * Listen to a session document in real time on the Main Display
 */
export function listenToSession(
  code: string,
  onUpdate: (session: RemoteSession | null) => void,
  onError?: (err: any) => void
): () => void {
  if (!code) return () => {};
  const formattedCode = code.trim().toUpperCase();
  const sessionRef = doc(db, SESSIONS_COLLECTION, formattedCode);

  return onSnapshot(
    sessionRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as RemoteSession);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Snapshot listener error on session:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Check if a code exists
 */
export async function getSession(code: string): Promise<RemoteSession | null> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, code.trim().toUpperCase());
  const snap = await getDoc(sessionRef);
  if (snap.exists()) {
    return snap.data() as RemoteSession;
  }
  return null;
}
