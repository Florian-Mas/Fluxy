"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./components/LoginForm";
import "./styles/global.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      let accessToken: string | null = null;
      let typeParam: string | null = null;


      const searchParams = new URLSearchParams(window.location.search);
      accessToken = searchParams.get("access_token");
      typeParam = searchParams.get("type");

      if (!accessToken && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get("access_token");
        typeParam = hashParams.get("type");
      }

      if (accessToken && typeParam === "recovery") {
        if (window.location.hash) {
          router.push(`/reset-password${window.location.hash}`);
        } else if (window.location.search) {
          router.push(`/reset-password${window.location.search}`);
        }
        return;
      }
    }
  }, [router]);

  return <LoginForm />;
}
