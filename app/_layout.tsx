// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* "/" → app/index.tsx */}
        <Stack.Screen name="index" />

        {/* "/login" → app/login.tsx */}
        <Stack.Screen name="login" />

        {/* "/register" → app/register.tsx */}
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
