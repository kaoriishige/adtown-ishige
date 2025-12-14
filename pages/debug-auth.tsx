import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, app } from "@/lib/firebase-client";

export default function DebugAuth() {
  useEffect(() => {
    console.log("🔥 App:", app);
    console.log("🔥 Auth:", auth);

    onAuthStateChanged(auth, async (user) => {
      console.log("🔥 AuthState:", user);
      if (user) {
        const t = await user.getIdToken();
        console.log("🔥 Token:", t);
      }
    });
  }, []);

  return <div>Auth Debug Page</div>;
}
