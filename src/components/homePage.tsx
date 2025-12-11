import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import Navbar from "./Navbar";
import {
  getHabits,
  createHabit,
  updateHabit as updateHabitService,
  archiveHabit as archiveHabitService,
  completeHabitToday,
  getLogsForDate,
} from "../backend/habitService";

type ScheduleType = "daily" | "weekly" | "monthly" | "once";

type Habit = {
  id: string;
  title: string;
  time: string;
  steps: string[];
  completed: boolean;
  scheduleType: ScheduleType;
  dayOfWeek?: string;
  customDate?: string;
  remindersEnabled: boolean;
};

const HomePage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddVisible, setIsAddVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // shared form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formSteps, setFormSteps] = useState("");

  const [formScheduleType, setFormScheduleType] =
    useState<ScheduleType>("daily");
  const [formDayOfWeek, setFormDayOfWeek] = useState("Monday");
  const [formOnceDate, setFormOnceDate] = useState("");
  const [formRemindersEnabled, setFormRemindersEnabled] = useState(true);

  // time picker modal state
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  // wheel picker states
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmpm, setSelectedAmpm] = useState<"AM" | "PM">("AM");

  // header date from phone
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const headerMonthText = `${
    monthNames[today.getMonth()]
  } ${today.getFullYear()}`;
  const headerDayText = `${dayNames[today.getDay()]} | ${today.getDate()}`;

  const loadHabits = async () => {
    try {
      setLoading(true);

      const [habitsFromDb, logsToday] = await Promise.all([
        getHabits(),
        getLogsForDate(todayStr),
      ]);

      const completedSet = new Set(
        logsToday
          .filter((log: any) => log.isCompleted)
          .map((log: any) => log.habitId)
      );

      const mapped: Habit[] = habitsFromDb.map((h: any) => {
        return {
          id: h.id,
          title: h.title || "Untitled habit",
          time: h.time || "Any time",
          steps: Array.isArray(h.steps) ? h.steps : [],
          completed: completedSet.has(h.id),
          scheduleType: (h.scheduleType as ScheduleType) || "daily",
          dayOfWeek: h.dayOfWeek || undefined,
          customDate: h.customDate || undefined,
          remindersEnabled:
            typeof h.remindersEnabled === "boolean" ? h.remindersEnabled : true,
        };
      });

      setHabits(mapped);
    } catch (err) {
      console.error("Error loading habits:", err);
      Alert.alert("Error", "Failed to load habits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFormToDefaults = () => {
    setFormTitle("");
    setFormTime("");
    setFormSteps("");
    setFormScheduleType("daily");
    setFormDayOfWeek("Monday");
    setFormOnceDate("");
    setFormRemindersEnabled(true);
    setSelectedHour("12");
    setSelectedMinute("00");
    setSelectedAmpm("AM");
  };

  const openAddHabit = () => {
    resetFormToDefaults();
    setIsAddVisible(true);
  };

  const closeAddHabit = () => setIsAddVisible(false);

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormTitle(habit.title);
    setFormTime(habit.time);
    setFormSteps(habit.steps.join("\n"));
    setFormScheduleType(habit.scheduleType);
    setFormDayOfWeek(habit.dayOfWeek || "Monday");
    setFormOnceDate(habit.customDate || "");
    setFormRemindersEnabled(habit.remindersEnabled);

    // best-effort to populate wheels from existing time string
    const match = habit.time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) {
      const [, h, m, ap] = match;
      setSelectedHour(h.padStart(2, "0"));
      setSelectedMinute(m);
      setSelectedAmpm(ap.toUpperCase() === "PM" ? "PM" : "AM");
    }
  };

  const closeEditHabit = () => setEditingHabit(null);

  const handleToggleComplete = async (
    id: string,
    currentlyCompleted: boolean
  ) => {
    try {
      // only write a log when marking as completed
      if (!currentlyCompleted) {
        await completeHabitToday(id, {
          completedCount: 1,
          isCompleted: true,
        });
      }
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
      );
    } catch (err) {
      console.error("Error completing habit:", err);
      Alert.alert("Error", "Failed to update completion. Please try again.");
    }
  };

  const handleSaveAdd = async () => {
    if (!formTitle.trim()) return;

    try {
      const stepsArray = formSteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const time = formTime.trim() || "Any time";

      const newHabitData = {
        title: formTitle.trim(),
        description: "",
        scheduleType: formScheduleType,
        dayOfWeek:
          formScheduleType === "weekly" || formScheduleType === "monthly"
            ? formDayOfWeek
            : null,
        customDate: formScheduleType === "once" ? formOnceDate.trim() : null,
        remindersEnabled: formRemindersEnabled,
        time,
        steps: stepsArray,
      };

      const newId = await createHabit(newHabitData);

      const newHabit: Habit = {
        id: newId,
        title: newHabitData.title,
        time: time,
        steps: stepsArray,
        completed: false,
        scheduleType: formScheduleType,
        dayOfWeek:
          formScheduleType === "weekly" || formScheduleType === "monthly"
            ? formDayOfWeek
            : undefined,
        customDate:
          formScheduleType === "once" ? formOnceDate.trim() : undefined,
        remindersEnabled: formRemindersEnabled,
      };

      setHabits((prev) => [...prev, newHabit]);
      closeAddHabit();
    } catch (err) {
      console.error("Error creating habit:", err);
      Alert.alert("Error", "Failed to save habit. Please try again.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingHabit || !formTitle.trim()) return;

    try {
      const stepsArray = formSteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const time = formTime.trim() || editingHabit.time;

      const updates: any = {
        title: formTitle.trim(),
        time,
        steps: stepsArray,
        scheduleType: formScheduleType,
        dayOfWeek:
          formScheduleType === "weekly" || formScheduleType === "monthly"
            ? formDayOfWeek
            : null,
        customDate: formScheduleType === "once" ? formOnceDate.trim() : null,
        remindersEnabled: formRemindersEnabled,
      };

      await updateHabitService(editingHabit.id, updates);

      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id
            ? {
                ...h,
                title: updates.title,
                time: updates.time,
                steps: stepsArray,
                scheduleType: formScheduleType,
                dayOfWeek:
                  formScheduleType === "weekly" ||
                  formScheduleType === "monthly"
                    ? formDayOfWeek
                    : undefined,
                customDate:
                  formScheduleType === "once" ? formOnceDate.trim() : undefined,
                remindersEnabled: formRemindersEnabled,
              }
            : h
        )
      );

      closeEditHabit();
    } catch (err) {
      console.error("Error updating habit:", err);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const handleDeleteHabit = async () => {
    if (!editingHabit) return;
    try {
      await archiveHabitService(editingHabit.id);
      setHabits((prev) => prev.filter((h) => h.id !== editingHabit.id));
      closeEditHabit();
    } catch (err) {
      console.error("Error archiving habit:", err);
      Alert.alert("Error", "Failed to remove habit. Please try again.");
    }
  };

  const openTimePicker = () => setIsTimePickerVisible(true);
  const closeTimePicker = () => setIsTimePickerVisible(false);

  const confirmTime = () => {
    const t = `${selectedHour}:${selectedMinute} ${selectedAmpm}`;
    setFormTime(t);
    closeTimePicker();
  };

  const renderSchedulePills = (habit: Habit) => {
    switch (habit.scheduleType) {
      case "daily":
        return (
          <View style={[styles.schedulePill, styles.dailyPill]}>
            <Text style={[styles.scheduleText, styles.dailyText]}>Daily</Text>
          </View>
        );
      case "weekly":
        return (
          <>
            {habit.dayOfWeek && (
              <View style={[styles.schedulePill, styles.dayPill]}>
                <Text style={[styles.scheduleText, styles.dayText]}>
                  {habit.dayOfWeek}
                </Text>
              </View>
            )}
            <View style={[styles.schedulePill, styles.weeklyPill]}>
              <Text style={[styles.scheduleText, styles.weeklyText]}>
                Weekly
              </Text>
            </View>
          </>
        );
      case "monthly":
        return (
          <>
            {habit.dayOfWeek && (
              <View style={[styles.schedulePill, styles.dayPill]}>
                <Text style={[styles.scheduleText, styles.dayText]}>
                  {habit.dayOfWeek}
                </Text>
              </View>
            )}
            <View style={[styles.schedulePill, styles.monthlyPill]}>
              <Text style={[styles.scheduleText, styles.monthlyText]}>
                Monthly
              </Text>
            </View>
          </>
        );
      case "once":
        return (
          <View style={[styles.schedulePill, styles.oncePill]}>
            <Text style={[styles.scheduleText, styles.onceText]}>
              {habit.customDate || "One-time"}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderScheduleControls = () => (
    <>
      <Text style={styles.sectionLabel}>Schedule</Text>

      {/* Schedule type picker */}
      <View style={styles.pickerRow}>
        <Picker
          selectedValue={formScheduleType}
          onValueChange={(val) => setFormScheduleType(val as ScheduleType)}
          style={styles.fullWidthPicker}
        >
          <Picker.Item label="Daily" value="daily" />
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Monthly" value="monthly" />
          <Picker.Item label="One-time (custom date)" value="once" />
        </Picker>
      </View>

      {/* Day of week for weekly / monthly */}
      {(formScheduleType === "weekly" || formScheduleType === "monthly") && (
        <View style={styles.pickerRow}>
          <Picker
            selectedValue={formDayOfWeek}
            onValueChange={setFormDayOfWeek}
            style={styles.fullWidthPicker}
          >
            {dayNames.map((d) => (
              <Picker.Item key={d} label={d} value={d} />
            ))}
          </Picker>
        </View>
      )}

      {/* Custom date for one-time */}
      {formScheduleType === "once" && (
        <TextInput
          placeholder="Date (e.g. 2025-12-07)"
          placeholderTextColor="#999"
          style={styles.modalInput}
          value={formOnceDate}
          onChangeText={setFormOnceDate}
        />
      )}

      {/* Reminders toggle */}
      <View style={styles.reminderRow}>
        <Text style={styles.reminderLabel}>Reminders enabled</Text>
        <Switch
          value={formRemindersEnabled}
          onValueChange={setFormRemindersEnabled}
          trackColor={{ false: "#ccc", true: "#FFCBC5" }}
          thumbColor={formRemindersEnabled ? "#FF8719" : "#f4f3f4"}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={styles.container}>
            {/* HEADER */}
            <LinearGradient
              colors={["#FF8719", "#FF6A5B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerCard}
            >
              <View>
                <Text style={styles.headerTitle}>Daily Habits</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.headerMonth}>{headerMonthText}</Text>
                <Text style={styles.headerDay}>{headerDayText}</Text>
              </View>
            </LinearGradient>

            {loading ? (
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#FF8719" />
                <Text style={{ marginTop: 8, color: "#606162" }}>
                  Loading your habits...
                </Text>
              </View>
            ) : habits.length === 0 ? (
              <View style={{ marginTop: 40 }}>
                <Text style={{ color: "#606162", textAlign: "center" }}>
                  No habits yet. Tap the + button to add your first habit!
                </Text>
              </View>
            ) : (
              habits.map((habit, index) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitHeaderRow}>
                    <Text style={styles.habitIndex}>#{index + 1}</Text>
                    <Text style={styles.habitTitle}>{habit.title}</Text>

                    <View style={styles.rightPillColumn}>
                      <View style={styles.timePill}>
                        <Text style={styles.timeText}>{habit.time}</Text>
                      </View>
                      {renderSchedulePills(habit)}
                    </View>
                  </View>

                  {habit.steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                      {habit.steps.map((step, i) => (
                        <Text key={i} style={styles.stepText}>
                          {step}
                        </Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardBottomRow}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        handleToggleComplete(habit.id, habit.completed)
                      }
                    >
                      {habit.completed ? (
                        <LinearGradient
                          colors={["#FDCFA4", "#FFCBC5"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.completedPill}
                        >
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color="#FFFFFF"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.completedText}>Completed!</Text>
                        </LinearGradient>
                      ) : (
                        <LinearGradient
                          colors={["#FF8719", "#FF6A5B"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.completePill}
                        >
                          <Text style={styles.completeText}>Complete</Text>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>

                    <View style={styles.cardRightControls}>
                      {habit.remindersEnabled && (
                        <Ionicons
                          name="notifications"
                          size={18}
                          color="#FF8719"
                          style={styles.reminderIcon}
                        />
                      )}
                      <TouchableOpacity
                        onPress={() => openEditHabit(habit)}
                        style={styles.gearButton}
                      >
                        <Ionicons
                          name="settings-outline"
                          size={20}
                          color="#606162"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* FLOATING BUTTON */}
        <TouchableOpacity
          style={styles.fabWrapper}
          activeOpacity={0.9}
          onPress={openAddHabit}
        >
          <LinearGradient
            colors={["#FF8719", "#FF6A5B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Text style={styles.fabPlus}>+</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Navbar />
      </View>

      {/* ADD HABIT MODAL */}
      <Modal
        visible={isAddVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddHabit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Habit</Text>
              <TouchableOpacity onPress={closeAddHabit}>
                <Ionicons name="close" size={24} color="#606162" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Habit title"
              placeholderTextColor="#999"
              style={styles.modalInput}
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {/* TIME SELECTOR */}
            <TouchableOpacity
              style={[styles.modalInput, styles.timeSelector]}
              onPress={openTimePicker}
            >
              <Text
                style={
                  formTime
                    ? styles.timeSelectorText
                    : styles.timeSelectorPlaceholder
                }
              >
                {formTime || "Select time"}
              </Text>
              <Ionicons name="time-outline" size={20} color="#606162" />
            </TouchableOpacity>

            {/* SCHEDULE + REMINDERS */}
            {renderScheduleControls()}

            <TextInput
              placeholder="Steps (one per line)"
              placeholderTextColor="#999"
              style={[styles.modalInput, styles.modalMultiline]}
              value={formSteps}
              onChangeText={setFormSteps}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handleSaveAdd}
            >
              <Text style={styles.modalPrimaryText}>Save Habit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={closeAddHabit}
            >
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT HABIT MODAL */}
      <Modal
        visible={!!editingHabit}
        animationType="slide"
        transparent
        onRequestClose={closeEditHabit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Habit</Text>
              <TouchableOpacity onPress={closeEditHabit}>
                <Ionicons name="close" size={24} color="#606162" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Habit title"
              placeholderTextColor="#999"
              style={styles.modalInput}
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {/* TIME SELECTOR */}
            <TouchableOpacity
              style={[styles.modalInput, styles.timeSelector]}
              onPress={openTimePicker}
            >
              <Text
                style={
                  formTime
                    ? styles.timeSelectorText
                    : styles.timeSelectorPlaceholder
                }
              >
                {formTime || "Select time"}
              </Text>
              <Ionicons name="time-outline" size={20} color="#606162" />
            </TouchableOpacity>

            {/* SCHEDULE + REMINDERS */}
            {renderScheduleControls()}

            <TextInput
              placeholder="Steps (one per line)"
              placeholderTextColor="#999"
              style={[styles.modalInput, styles.modalMultiline]}
              value={formSteps}
              onChangeText={setFormSteps}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.modalPrimaryText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={handleDeleteHabit}
            >
              <Text style={styles.modalDeleteText}>Delete Habit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={closeEditHabit}
            >
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER MODAL */}
      <Modal
        visible={isTimePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={closeTimePicker}
      >
        <View style={styles.timeModalOverlay}>
          <View style={styles.wheelTimeCard}>
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>Select Time</Text>
              <TouchableOpacity onPress={closeTimePicker}>
                <Ionicons name="close" size={24} color="#606162" />
              </TouchableOpacity>
            </View>

            <View style={styles.wheelRow}>
              {/* HOURS */}
              <Picker
                selectedValue={selectedHour}
                onValueChange={setSelectedHour}
                style={styles.wheelPicker}
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = (i + 1).toString().padStart(2, "0");
                  return <Picker.Item key={h} label={h} value={h} />;
                })}
              </Picker>

              {/* MINUTES */}
              <Picker
                selectedValue={selectedMinute}
                onValueChange={setSelectedMinute}
                style={styles.wheelPicker}
              >
                {Array.from({ length: 60 }).map((_, i) => {
                  const m = i.toString().padStart(2, "0");
                  return <Picker.Item key={m} label={m} value={m} />;
                })}
              </Picker>

              {/* AM/PM */}
              <Picker
                selectedValue={selectedAmpm}
                onValueChange={(v) => setSelectedAmpm(v === "PM" ? "PM" : "AM")}
                style={styles.wheelPicker}
              >
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={confirmTime}
            >
              <Text style={styles.modalPrimaryText}>Set Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={closeTimePicker}
            >
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F4",
  },
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerMonth: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerDay: {
    fontSize: 12,
    color: "#FFE9D9",
    marginTop: 2,
  },

  habitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  habitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  habitIndex: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF8719",
    marginRight: 8,
  },
  habitTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  rightPillColumn: {
    alignItems: "flex-end",
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FFE1CF",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF8719",
  },

  // schedule pills
  schedulePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
    alignItems: "center",
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dayPill: {
    backgroundColor: "#FFD4B8",
  },
  dayText: {
    color: "#FF7A1C",
  },
  weeklyPill: {
    backgroundColor: "#C8F8B8",
  },
  weeklyText: {
    color: "#34A853",
  },
  monthlyPill: {
    backgroundColor: "#BBD8FF",
  },
  monthlyText: {
    color: "#1A73E8",
  },
  dailyPill: {
    backgroundColor: "#FFE08A",
  },
  dailyText: {
    color: "#F79A10",
  },
  oncePill: {
    backgroundColor: "#FFB3B3",
  },
  onceText: {
    color: "#E53935",
  },

  stepsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    color: "#606162",
    marginBottom: 2,
  },

  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  completePill: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
  },
  completeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  completedPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  completedText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  cardRightControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderIcon: {
    marginRight: 8,
  },
  gearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  fabWrapper: {
    position: "absolute",
    right: 24,
    bottom: 110,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabPlus: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: -2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  modalMultiline: {
    height: 100,
  },
  modalPrimaryButton: {
    marginTop: 8,
    backgroundColor: "#FF8719",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  modalDeleteButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#FFE1DF",
  },
  modalDeleteText: {
    color: "#D32F2F",
    fontWeight: "700",
  },
  modalSecondaryButton: {
    marginTop: 8,
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalSecondaryText: {
    color: "#606162",
    fontWeight: "600",
  },

  /* time selector */
  timeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeSelectorText: {
    fontSize: 14,
    color: "#333333",
  },
  timeSelectorPlaceholder: {
    fontSize: 14,
    color: "#999",
  },

  /* schedule section */
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
    marginTop: 4,
  },
  pickerRow: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 10,
  },
  fullWidthPicker: {
    width: "100%",
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reminderLabel: {
    fontSize: 14,
    color: "#333333",
  },

  /* time picker modal */
  timeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  wheelTimeCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  timeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  wheelRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },
  wheelPicker: {
    width: 100,
    height: 150,
  },
});
