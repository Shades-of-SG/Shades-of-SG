import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const GUEST_SESSION_KEY = "shadesOfSgGuestSession";

// Read the stored session up front (not in an effect) so the very first render
// already knows who is signed in. Anything that derives state from `user` on
// mount — the guest session, the prefilled settings fields — depends on this.
function readStoredAuth() {
  try {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      return { token: storedToken, user: JSON.parse(storedUser) };
    }
  } catch {
    // Corrupted payload — drop it so we start from a clean slate.
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  function signIn(nextUser, nextToken) {
    // ✅ Always include bio + interestTags
    const mergedUser = {
      ...nextUser,
      bio: nextUser.bio,
      interestTags: nextUser.interestTags,
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));
    localStorage.setItem("token", nextToken);

    // ✅ Clear guest session once logged in
    localStorage.removeItem(GUEST_SESSION_KEY);

    setAuth({ token: nextToken, user: mergedUser });
  }

  function signOut() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setAuth({ token: null, user: null });
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, token: auth.token, user: auth.user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
