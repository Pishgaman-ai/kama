"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const routeByRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.replace("/signin");
          return;
        }
        const data = await response.json();
        const role = (data?.user?.role || "").toLowerCase();
        if (role === "teacher") {
          router.replace("/dashboard/teacher");
        } else if (role === "student") {
          router.replace("/dashboard/student");
        } else if (role === "parent") {
          router.replace("/dashboard/parent");
        } else if (role === "principal") {
          router.replace("/dashboard/principal");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/signin");
      }
    };
    routeByRole();
  }, [router]);

  return null;
}
