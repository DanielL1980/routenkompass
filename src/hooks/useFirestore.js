import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Speichert, laedt und loescht Routen des angemeldeten Users in Firestore
// users/{userId}/routen/{routeId}
export function useFirestore(userId) {
  const [routen, setRouten] = useState([]);
  const [ladeRouten, setLadeRouten] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRouten([]);
      setLadeRouten(false);
      return;
    }

    const routenRef = collection(db, 'users', userId, 'routen');
    const routenQuery = query(routenRef, orderBy('erstelltAm', 'desc'));

    const unsubscribe = onSnapshot(routenQuery, (snapshot) => {
      setRouten(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      setLadeRouten(false);
    });

    return unsubscribe;
  }, [userId]);

  async function routeSpeichern(userId, route) {
    const routenRef = collection(db, 'users', userId, 'routen');
    const neuesDoc = doc(routenRef);
    // Niemals merge: true - jede gespeicherte Route ist ein vollstaendiger, neuer Zustand
    await setDoc(neuesDoc, {
      ...route,
      erstelltAm: serverTimestamp(),
    });
    return neuesDoc.id;
  }

  async function routeLoeschen(userId, routeId) {
    await deleteDoc(doc(db, 'users', userId, 'routen', routeId));
  }

  return { routen, ladeRouten, routeSpeichern, routeLoeschen };
}
