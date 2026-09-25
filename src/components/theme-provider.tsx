"use client";

import * as React from "react";

/**
 * Phase 1 theme provider. Light/dark support via next-themes.
 * Government dashboards default to light, but dark mode is supported.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
