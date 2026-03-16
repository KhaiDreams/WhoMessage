"use client";
import { useAuthSession } from "@/contexts/AuthSessionContext";

export default function useAuth() {
  return useAuthSession();
}
