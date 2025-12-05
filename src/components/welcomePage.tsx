// src/components/welcomePage.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Reference sizes for scaling (same idea as your other project)
const guidelineBaseWidth = 360;
const guidelineBaseHeight = 800;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// 🔧 made buttons a bit smaller
const BUTTON_RADIUS = 100;
const BUTTON_WIDTH = width * 0.85;
const BUTTON_HEIGHT = verticalScale(38);

const WelcomePage: React.FC = () => {
  const handleLogin = () => router.push("/login");
  const handleRegister = () => router.push("/register");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + subtitle */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome to Habit Hub!</Text>
          <Text style={styles.subtitle}>
            Build better habits, one day at a time. Stay organized, stay
            consistent, stay motivated. Use Habit Hub anywhere, for anything.
          </Text>
        </View>

        {/* 🔧 bigger illustration */}
        <Image
          source={require("../images/welcomePage/welcomeImage.png")}
          style={styles.illustration}
          resizeMode="contain"
        />

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          {/* LOGIN */}
          <View style={styles.buttonWrapper}>
            {/* gradient shadow behind */}
            <LinearGradient
              colors={["#fdcfa4", "#ffcbc5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginBehindPill}
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleLogin}
              style={styles.buttonTapArea}
            >
              <LinearGradient
                colors={["#FF8719", "#FF6A5B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }} // ~135°
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* REGISTER */}
          <View
            style={[styles.buttonWrapper, { marginTop: verticalScale(16) }]}
          >
            {/* soft shadow pill */}
            <View style={styles.registerBehindPill} />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleRegister}
              style={styles.buttonTapArea}
            >
              <View style={styles.registerButton}>
                <Text style={styles.registerText}>Register</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomePage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F4",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: verticalScale(85),
    paddingBottom: verticalScale(32),
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    color: "#FF8719",
    textAlign: "center",
    marginBottom: verticalScale(10),
    // fontFamily: "Raleway-Bold",
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: "#606162",
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginHorizontal: width * 0.04,
    // fontFamily: "Quicksand-Regular",
  },

  // 🔧 bigger image
  illustration: {
    width: width * 1,
    height: height * 0.65,
    marginBottom: verticalScale(-50),
    marginTop: verticalScale(-85)
  },

  buttonGroup: {
    width: "100%",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  buttonWrapper: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT + verticalScale(10),
    justifyContent: "center",
  },
  buttonTapArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loginBehindPill: {
    position: "absolute",
    left: width * 0.03,
    right: width * 0.01,
    top: verticalScale(10),
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
  },
  registerBehindPill: {
    position: "absolute",
    left: width * 0.03,
    right: width * 0.01,
    top: verticalScale(10),
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: "#f4f4f4",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  loginButton: {
    flex: 1,
    marginHorizontal: width * 0.02,
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    height: BUTTON_HEIGHT,
    paddingHorizontal: width * 0.08,
  },
  registerButton: {
    flex: 1,
    marginHorizontal: width * 0.02,
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    height: BUTTON_HEIGHT,
    paddingHorizontal: width * 0.08,
    backgroundColor: "#FFFFFF",
  },
  loginText: {
    fontSize: moderateScale(16), // 🔧 slightly smaller
    color: "#FFFFFF",
    fontWeight: "bold",
    // fontFamily: "Raleway",
  },
  registerText: {
    fontSize: moderateScale(16), // 🔧 slightly smaller
    color: "#606162",
    fontWeight: "bold",
    // fontFamily: "Raleway",
  },
});
