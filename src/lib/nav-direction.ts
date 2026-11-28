"use client";

import { useLayoutEffect, useState } from "react";

const KEY = "nav-direction";

export function markBackNavigation() {
  sessionStorage.setItem(KEY, "back");
}

export function useEnterClass(backClass: string, forwardClass = "") {
  const [enterClass, setEnterClass] = useState(forwardClass);

  useLayoutEffect(() => {
    if (sessionStorage.getItem(KEY) === "back") setEnterClass(backClass);
    sessionStorage.removeItem(KEY);
  }, [backClass]);

  return enterClass;
}
