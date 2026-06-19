import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Import Firebase Auth listener method
import { onAuthStateChanged } from "firebase/auth";
// Import initialized Firebase auth instance
import { auth } from "../firebase/firebase";
// Import user profile retrieval service
import { getUserProfileData } from "../Services/authService";

// Create a React context for authentication state
const AuthContext = createContext();

/**
 * Custom hook to allow any descendant component to access the AuthContext value.
 * @returns {object} { currentUser, userProfile, loading, refreshProfile, handleManualSignIn }
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * AuthProvider component that wraps the React application and handles subscription to
 * Firebase's authentication state changes and caches the Firestore profile details.
 */
export const AuthProvider = ({ children }) => {
  // Track the currently signed-in user object or null
  const [currentUser, setCurrentUser] = useState(null);
  // Cache the Firestore profile data of the user
  const [userProfile, setUserProfile] = useState(null);
  // Track whether we are still loading/fetching the initial authentication state from Firebase
  const [loading, setLoading] = useState(true);

  /**
   * Refreshes the user profile cached state by calling Firestore API.
   * @param {string} [uid] - Optional user UID override.
   * @returns {Promise<object|null>} The loaded user profile data.
   */
  const refreshProfile = async (uid = currentUser?.uid) => {
    if (!uid) {
      setUserProfile(null);
      return null;
    }
    try {
      const data = await getUserProfileData(uid);
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error("Error refreshing profile in AuthContext:", error);
      setUserProfile(null);
      return null;
    }
  };

  /**
   * Manually sets the authentication state and user profile.
   * This is useful to force the context to load after a transient bypass (e.g. Google signup).
   * @param {object} user - The Firebase user object.
   */
  const handleManualSignIn = async (user) => {
    if (user) {
      try {
        const data = await getUserProfileData(user.uid);
        setUserProfile(data);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error in handleManualSignIn inside AuthContext:", error);
        setUserProfile(null);
        setCurrentUser(user);
      }
    }
  };

  useEffect(() => {
    // Subscribe to authentication state changes (login, logout, token refresh, etc.)
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        // If this is a transient Google signup event, ignore it to prevent premature redirects
        if (user && sessionStorage.getItem("is_google_signup") === "true") {
          return;
        }

        if (user) {
          try {
            const data = await getUserProfileData(user.uid);
            // Set states together to trigger a single batched re-render
            setUserProfile(data);
            setCurrentUser(user);
          } catch (error) {
            console.error("Error fetching user profile in AuthContext onAuthStateChanged:", error);
            setUserProfile(null);
            setCurrentUser(user);
          }
        } else {
          setUserProfile(null);
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    // Unsubscribe from listener when provider component unmounts
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        refreshProfile,
        handleManualSignIn,
      }}
    >
      {/* Do not render children until the initial Firebase authentication status is loaded */}
      {!loading && children}
    </AuthContext.Provider>
  );
};