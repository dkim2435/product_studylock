"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityInit() {
  useEffect(() => {
    Clarity.init("w159onua3h");
  }, []);

  return null;
}
