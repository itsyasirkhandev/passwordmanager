'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // During a server-side build (like `next build`), Firebase App Hosting auto-initialization
  // isn't available. We must rely on the explicit configuration from environment variables.
  // We check for `window` to differentiate between server-side and client-side execution.
  if (typeof window === 'undefined') {
    const app = initializeApp(firebaseConfig);
    return getSdks(app);
  }

  // On the client, we first try the automatic initialization provided by Firebase App Hosting.
  let firebaseApp;
  try {
    firebaseApp = initializeApp();
  } catch (e) {
    // If auto-init fails (common in local dev), we fall back to the explicit config.
    if (process.env.NODE_ENV === "production") {
      console.warn('Automatic Firebase initialization failed. Falling back to firebase config object.', e);
    }
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}


export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';