import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// register
export const registerUser = async (email, password) => {
  console.log("registerUser called with:", email);

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // create user doc in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    createdAt: Date.now(),
  });

  console.log("Firestore user doc created:", user.uid);
  return user;
};

//login
export const loginUser = async (email, password) => {
  console.log("loginUser called with:", email);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// logout
export const logoutUser = async () => {
  console.log("Logging out current user");
  await signOut(auth);
};
