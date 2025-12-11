import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type RoutePath = "/home" | "/weekly" | "/monthly" | "/profile";

type NavItem = {
  name: string;
  route: RoutePath;
  icon: keyof typeof Ionicons.glyphMap;
};

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: "Home", route: "/home", icon: "home" },
    { name: "Weekly", route: "/weekly", icon: "calendar" },
    { name: "Monthly", route: "/monthly", icon: "stats-chart" },
    { name: "Profile", route: "/profile", icon: "person" },
  ];

  return (
    <View style={styles.navbar}>
      {navItems.map((item) => {
        const isActive = pathname === item.route;

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => router.push(item.route)}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={isActive ? "#FF8719" : "#606162"}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navText: {
    fontSize: 12,
    color: "#606162",
    marginTop: 4,
    fontWeight: "500",
  },
  navTextActive: {
    color: "#FF8719",
    fontWeight: "700",
  },
});
