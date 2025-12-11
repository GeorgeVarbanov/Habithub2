import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

// add a new habit for a user
// habit: { userId, title, description?, frequencyType, scheduleType?, dayOfWeek?, customDate?, remindersEnabled?, goalPerDay? }
export const addHabit = async (habit) => {
  const colRef = collection(db, "habits");
  const docRef = await addDoc(colRef, {
    ...habit,
    createdAt: Date.now(),
    // in case habit.isArchived was passed, keep it; otherwise default false
    isArchived: habit.isArchived ?? false,
  });
  return docRef.id;
};

// get all active habits for a user
export const getHabitsForUser = async (userId) => {
  const colRef = collection(db, "habits");

  const q = query(colRef, where("userId", "==", userId));

  const snapshot = await getDocs(q);

  // filter archived on the client
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((habit) => habit.isArchived !== true);
};

// update an existing habit
export const updateHabit = async (habitId, updates) => {
  const docRef = doc(db, "habits", habitId);
  await updateDoc(docRef, { ...updates });
};

// archive habit instead of deleting
export const archiveHabit = async (habitId) => {
  const docRef = doc(db, "habits", habitId);
  await updateDoc(docRef, { isArchived: true });
};

// log a habit for a specific day
// log: { habitId, userId, date: "YYYY-MM-DD", completedCount, isCompleted, notes? }
export const logHabitCompletion = async (log) => {
  const colRef = collection(db, "habitLogs");
  const docRef = await addDoc(colRef, {
    ...log,
    updatedAt: Date.now(),
  });
  return docRef.id;
};

// get all logs for a user on a specific date
export const getLogsForUserOnDate = async (userId, date) => {
  const colRef = collection(db, "habitLogs");

  // only filter by userId in Firestore
  const q = query(colRef, where("userId", "==", userId));

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((log) => log.date === date);
};

// get logs for a user between two dates
export const getLogsForUserInRange = async (userId, startDate, endDate) => {
  const colRef = collection(db, "habitLogs");

  const q = query(colRef, where("userId", "==", userId));

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter(
      (log) =>
        typeof log.date === "string" &&
        log.date >= startDate &&
        log.date <= endDate
    );
};
