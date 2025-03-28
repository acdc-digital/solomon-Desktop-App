// Convex Provider
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/app/ConvexClientProvider.tsx

"use client";
 
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
 
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
 
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
    </ConvexProvider>
  );
}