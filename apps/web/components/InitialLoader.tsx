"use client";
import { useEffect } from "react";

export function InitialLoader() {
  useEffect(() => {
    // Автозапуска нет — плеер появляется только после явного клика пользователя.
  }, []);
  return null;
}
