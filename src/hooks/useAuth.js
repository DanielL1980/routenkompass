import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Verwaltet den Auth-Status und stellt Login/Registrierung/Logout bereit
export function useAuth() {
  const [user, setUser] = useState(null);
  const [ladeAuth, setLadeAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (aktuellerUser) => {
      setUser(aktuellerUser);
      setLadeAuth(false);
    });
    return unsubscribe;
  }, []);

  async function anmelden(email, passwort) {
    await signInWithEmailAndPassword(auth, email, passwort);
  }

  async function registrieren(email, passwort) {
    await createUserWithEmailAndPassword(auth, email, passwort);
  }

  async function abmelden() {
    await signOut(auth);
  }

  return { user, ladeAuth, anmelden, registrieren, abmelden };
}
