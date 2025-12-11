import { auth } from "./firebase";
import {
  addHabit as addHabitToDb,
  getHabitsForUser as getHabitsForUserFromDb,
  updateHabit as updateHabitInDb,
  archiveHabit as archiveHabitInDb,
  logHabitCompletion as logHabitCompletionInDb,
  getLogsForUserOnDate as getLogsForUserOnDateFromDb,
  getLogsForUserInRange as getLogsForUserInRangeFromDb,
} from "./firestoreService";

const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No logged-in user. Make sure user is authenticated.");
  }
  return user.uid;
};

// get all active habits for the logged-in user
export const getHabits = async () => {
  const userId = getCurrentUserId();
  const habits = await getHabitsForUserFromDb(userId);
  return habits;
};

// create a new habit for the logged-in user
// data: { title, description?, frequencyType?, goalPerDay?, scheduleType?, dayOfWeek?, customDate?, remindersEnabled?, time?, steps? }
export const createHabit = async (data) => {
  const userId = getCurrentUserId();

  const habit = {
    userId,
    title: data.title,
    description: data.description || "",
    frequencyType: data.frequencyType || "daily",
    goalPerDay: data.goalPerDay || 1,
    scheduleType: data.scheduleType || "daily",
    dayOfWeek: data.dayOfWeek || null,
    customDate: data.customDate || null,
    remindersEnabled:
      typeof data.remindersEnabled === "boolean" ? data.remindersEnabled : true,
    time: data.time || "Any time",
    steps: Array.isArray(data.steps) ? data.steps : [],
  };

  const id = await addHabitToDb(habit);
  return id;
};

// update existing habit
export const updateHabit = async (habitId, updates) => {
  await updateHabitInDb(habitId, updates);
};

// archive habit (soft delete)
export const archiveHabit = async (habitId) => {
  await archiveHabitInDb(habitId);
};

// log completion for today for a habit
export const completeHabitToday = async (habitId, options = {}) => {
  const { completedCount = 1, isCompleted = true, notes = "" } = options;

  const userId = getCurrentUserId();
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  await logHabitCompletionInDb({
    habitId,
    userId,
    date: today,
    completedCount,
    isCompleted,
    notes,
  });
};

// get all logs for the current user on a given date (e.g. today's view)
export const getLogsForDate = async (date) => {
  const userId = getCurrentUserId();
  return await getLogsForUserOnDateFromDb(userId, date);
};

// get all logs for the current user in a date range (weekly/monthly stats)
export const getLogsForRange = async (start, end) => {
  const userId = getCurrentUserId();

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return await getLogsForUserInRangeFromDb(userId, startStr, endStr);
};
