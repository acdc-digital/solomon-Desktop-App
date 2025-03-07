// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/hooks/useUser.ts
import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { jwtDecode } from "jwt-decode";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react"; // Import useEffect

interface DecodedToken {
  sub: string;
}

export function useUser() {
  const token = useAuthToken();
  let userId: string | null = null;

  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      userId = decoded.sub;
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  // When no user is signed in, skip the query.
  const user = useQuery(api.users.getUser, userId ? { id: userId } : "skip");

  return {
    user,
    isSignedIn: Boolean(userId),
    isLoaded: token !== undefined, // More accurate, handles loading state
  };
}

// Separate hook for upserting the user
export function useUpsertUser(name?: string, email?: string, image?: string) {
    const token = useAuthToken();
    const upsert = useMutation(api.users.upsertUser);
    let userId: string | null = null;

    if (token) {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            userId = decoded.sub;
        } catch (error) {
            console.error("Failed to decode token:", error);
        }
    }

  useEffect(() => {
    if (userId) {
      upsert({ authId: userId, name, email, image }).catch((err) =>
        console.error("Failed to upsert user:", err)
      );
    }
  }, [userId, name, email, image, upsert]); // Include upsert in the dependency array

  return {
  };
}