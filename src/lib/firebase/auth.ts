import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

export async function registerWithEmail(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDocument(cred.user, name);
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  await createUserDocument(cred.user, cred.user.displayName ?? "");
  return cred.user;
}

async function createUserDocument(user: User, name: string) {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name,
      email: user.email,
      createdAt: serverTimestamp(),
      totalSessions: 0,
    });
  }
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
