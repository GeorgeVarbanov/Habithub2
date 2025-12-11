import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Navbar from "./Navbar";
import { getLogsForRange } from "../backend/habitService";

type HabitLog = {
  id: string;
  habitId: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  completedCount?: number;
  isCompleted?: boolean;
};

const MonthlyStatsPage: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [bestDay, setBestDay] = useState<string | null>(null);
  const [bestDayTasks, setBestDayTasks] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // month label based on current date
  const now = new Date();
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
  const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  // for pie chart
  const completed = completedTasks;
  const incomplete = Math.max(totalTasks - completedTasks, 0);
  const completedPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  useEffect(() => {
    const loadMonthlyStats = async () => {
      try {
        setLoading(true);
        // start = first day of this month
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // end = last day of this month
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const logs = (await getLogsForRange(startDate, endDate)) as HabitLog[];

        if (!logs || logs.length === 0) {
          setCompletedTasks(0);
          setTotalTasks(0);
          setCompletionRate(0);
          setBestDay(null);
          setBestDayTasks(0);
          return;
        }

        // Count tasks:
        // - totalTasks: all logged actions (completed or not)
        // - completedTasks: logs where isCompleted === true
        let total = 0;
        let completedCount = 0;

        //for best-day calculation
        const completedPerDay: Record<string, number> = {};

        logs.forEach((log) => {
          const count =
            typeof log.completedCount === "number" && log.completedCount > 0
              ? log.completedCount
              : 1;

          total += count;

          if (log.isCompleted) {
            completedCount += count;

            if (!completedPerDay[log.date]) {
              completedPerDay[log.date] = 0;
            }
            completedPerDay[log.date] += count;
          }
        });

        setTotalTasks(total);
        setCompletedTasks(completedCount);
        setCompletionRate(
          total > 0 ? Math.round((completedCount / total) * 100) : 0
        );

        // find best day (max completed count)
        let bestDayDate: string | null = null;
        let bestDayCount = 0;

        Object.entries(completedPerDay).forEach(([date, count]) => {
          if (count > bestDayCount) {
            bestDayCount = count;
            bestDayDate = date;
          }
        });

        if (bestDayDate) {
          const [yearStr, monthStr, dayStr] = bestDayDate.split("-");
          const y = parseInt(yearStr, 10);
          const m = parseInt(monthStr, 10) - 1;
          const d = parseInt(dayStr, 10);

          const dateObj = new Date(y, m, d);
          const formatted = `${monthNames[dateObj.getMonth()]} ${d}`;
          setBestDay(formatted);
          setBestDayTasks(bestDayCount);
        } else {
          setBestDay(null);
          setBestDayTasks(0);
        }
      } catch (err) {
        console.error("Error loading monthly stats:", err);
        setCompletedTasks(0);
        setTotalTasks(0);
        setCompletionRate(0);
        setBestDay(null);
        setBestDayTasks(0);
      } finally {
        setLoading(false);
      }
    };

    loadMonthlyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>Monthly Stats</Text>
          <Text style={styles.monthLabel}>{monthLabel}</Text>

          {loading ? (
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#FF8719" />
              <Text style={{ marginTop: 8, color: "#606162" }}>
                Loading your stats...
              </Text>
            </View>
          ) : (
            <>
              {/* Completion Overview Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Habit Completion</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {completedTasks}/{totalTasks}
                    </Text>
                    <Text style={styles.statLabel}>Tasks Completed</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{completionRate}%</Text>
                    <Text style={styles.statLabel}>Completion Rate</Text>
                  </View>
                </View>
              </View>

              {/* Pie Chart Visualization */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Monthly Overview</Text>
                <View style={styles.chartContainer}>
                  {/* Simple Pie Chart using circles */}
                  <View style={styles.pieChart}>
                    {/* Completed portion (orange) */}
                    <View
                      style={[
                        styles.pieSlice,
                        styles.pieCompleted,
                        {
                          transform: [
                            { rotate: "0deg" },
                            {
                              scaleX:
                                completedPercentage > 50
                                  ? 1
                                  : completedPercentage / 50 || 0,
                            },
                          ],
                        },
                      ]}
                    />
                    {/* Incomplete portion (gray) */}
                    <View
                      style={[
                        styles.pieSlice,
                        styles.pieIncomplete,
                        {
                          transform: [
                            {
                              rotate: `${(completedPercentage / 100) * 360}deg`,
                            },
                          ],
                        },
                      ]}
                    />
                    {/* Center white circle to create donut effect */}
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterText}>
                        {completionRate}%
                      </Text>
                    </View>
                  </View>

                  {/* Legend */}
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, styles.legendCompleted]}
                      />
                      <Text style={styles.legendText}>
                        Completed ({completedTasks})
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, styles.legendIncomplete]}
                      />
                      <Text style={styles.legendText}>
                        Incomplete ({incomplete})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Best Day Card */}
              <View style={styles.card}>
                <View style={styles.bestDayHeader}>
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                  <Text style={styles.cardTitle}>Best Day This Month</Text>
                </View>
                <View style={styles.bestDayContent}>
                  {bestDay ? (
                    <>
                      <Text style={styles.bestDayDate}>{bestDay}</Text>
                      <Text style={styles.bestDayTasks}>
                        {bestDayTasks} tasks completed
                      </Text>
                      <View style={styles.perfectScore}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4CAF50"
                        />
                        <Text style={styles.perfectScoreText}>
                          Great job! 🎉
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.bestDayTasks}>
                      No completed tasks yet this month. Start a streak!
                    </Text>
                  )}
                </View>
              </View>

              {/* Additional */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  This Month&apos;s Highlights
                </Text>
                <View style={styles.highlightItem}>
                  <Ionicons name="flame" size={20} color="#FF8719" />
                  <Text style={styles.highlightText}>
                    Keep completing tasks to build your longest streak!
                  </Text>
                </View>
                <View style={styles.highlightItem}>
                  <Ionicons name="trending-up" size={20} color="#4CAF50" />
                  <Text style={styles.highlightText}>
                    Check back here to see how your consistency improves.
                  </Text>
                </View>
                <View style={styles.highlightItem}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.highlightText}>
                    Aim for more high-completion days this month.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <Navbar />
    </SafeAreaView>
  );
};

export default MonthlyStatsPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F4",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF8719",
    textAlign: "center",
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 16,
    color: "#606162",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: "#E0E0E0",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF8719",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#606162",
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
  },
  pieChart: {
    width: 160,
    height: 160,
    borderRadius: 80,
    position: "relative",
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
  },
  pieSlice: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 80,
  },
  pieCompleted: {
    backgroundColor: "#FF8719",
    transform: [{ rotate: "-90deg" }],
  },
  pieIncomplete: {
    backgroundColor: "#E0E0E0",
  },
  pieCenter: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    top: 30,
    left: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  pieCenterText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF8719",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendCompleted: {
    backgroundColor: "#FF8719",
  },
  legendIncomplete: {
    backgroundColor: "#E0E0E0",
  },
  legendText: {
    fontSize: 14,
    color: "#606162",
  },
  bestDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  bestDayContent: {
    alignItems: "center",
    paddingVertical: 12,
  },
  bestDayDate: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF8719",
    marginBottom: 8,
  },
  bestDayTasks: {
    fontSize: 16,
    color: "#606162",
    marginBottom: 12,
    textAlign: "center",
  },
  perfectScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  perfectScoreText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  highlightText: {
    fontSize: 14,
    color: "#606162",
    flex: 1,
  },
});
