// ================================
// AUTH CONTEXT
// This provides authentication state to the entire app.
// Any component can check if the user is logged in
// and what their role is.
//
// HOW IT WORKS:
// 1. When the app loads, we check localStorage for a token
// 2. If there's a token, we fetch the user data from the API
// 3. We provide user data + login/logout functions to all components
// ================================

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "./api";
import { User } from "@/types";

// Define what the context provides
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }) => Promise<void>;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({} as User),
  register: async () => {},
  logout: () => {},
});

// ================================
// AUTH PROVIDER
// Wraps the app and provides auth state to all children.
// ================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // When the app loads, check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if there's a valid token in localStorage
  async function checkAuth() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get user data using the stored token
      const data = await authApi.getMe();
      setUser(data.user);
    } catch (error) {
      // Token is invalid or expired, clean up
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Login function
  async function login(email: string, password: string): Promise<User> {
    const data = await authApi.login({ email, password });

    // Save the token to localStorage
    localStorage.setItem("token", data.token);

    // Set the user in state
    setUser(data.user);

    return data.user;
  }

  // Register function
  async function register(formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }) {
    const data = await authApi.register(formData);

    // Save the token to localStorage
    localStorage.setItem("token", data.token);

    // Set the user in state
    setUser(data.user);
  }

  // Logout function
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ================================
// CUSTOM HOOK
// Use this in any component to access auth state.
// Example: const { user, logout } = useAuth();
// ================================
export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
