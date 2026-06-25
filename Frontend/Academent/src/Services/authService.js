import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

/**
 * Registers a new user with email and password.
 * 1. Creates the user credentials in Firebase Auth.
 * 2. Updates the auth profile display name.
 * 3. Creates a corresponding document in the Firestore "users" collection.
 * 4. Sends a verification email.
 * If step 2 or 3 fails, the registered auth account is cleaned up (deleted) to prevent orphaned accounts.
 * 
 * @param {string} fullName - User's full name.
 * @param {string} email - User's email address.
 * @param {string} password - User's selected password.
 * @returns {Promise<object>} The created Firebase User object.
 */
export const registerUser = async (
  fullName,
  email,
  password
) => {
  // Create user in Firebase Auth
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  const { user } = userCredential;

  try {
    // Set the user's display name in Firebase Auth profile
    await updateProfile(
      user,
      {
        displayName: fullName.trim(),
      }
    );

    // Save initial user profile details into Firestore
    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        uid: user.uid,
        fullName: fullName.trim(),
        email: user.email,
        emailVerified: user.emailVerified,
        role: "student",
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    // Trigger sending verification email from Firebase
    await sendEmailVerification(user);
  } catch (error) {
    // Rollback: delete the Firebase Auth user if Firestore setup fails
    await deleteUser(user).catch(() => {});
    throw error;
  }

  return user;
};

/**
 * Signs in a user using Google OAuth via a popup window.
 * If the user is logging in for the first time, it initializes their Firestore profile.
 * 
 * @returns {Promise<object>} The UserCredential returned from Firebase.
 */
export const signInWithGoogle = async (isSignup = false) => {
  const provider = new GoogleAuthProvider();
  
  // Flag that Google authentication is active to ignore transient signup states in context
  sessionStorage.setItem("is_google_signup", "true");

  try {
    // Open the Google login popup
    const userCredential = await signInWithPopup(auth, provider);
    const { user } = userCredential;
    const additionalUserInfo = getAdditionalUserInfo(userCredential);
    const isNewUser = Boolean(additionalUserInfo?.isNewUser);

    // If this is a newly created user account, initialize their profile document in Firestore
    if (isNewUser) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            fullName: (user.displayName || "").trim(),
            email: user.email,
            emailVerified: user.emailVerified,
            role: "student",
            onboardingCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      } catch (error) {
        // Rollback: delete the Firebase Auth user if Firestore setup fails
        await deleteUser(user).catch(() => {});
        throw error;
      }
    }

    // Immediately sign out if this is a signup action to prevent auto-login redirection
    if (isSignup) {
      await signOut(auth);
    }

    return { user, isNewUser };
  } finally {
    // Always clear the flag so standard auth state listener functions normally
    sessionStorage.removeItem("is_google_signup");
  }
};

/**
 * Resends the verification link to the currently logged-in user's email address.
 */
export const resendEmailVerification = async () => {
  if (!auth.currentUser) {
    throw new Error("No signed-in user found.");
  }

  await sendEmailVerification(auth.currentUser);
};

/**
 * Reloads the current user's profile state from Firebase Auth to check for updated verification status.
 * If verified, it updates the `emailVerified` flag to true inside the Firestore document.
 * 
 * @returns {Promise<boolean>} Resolves to true if the email is verified, false otherwise.
 */
export const refreshEmailVerificationStatus = async () => {
  if (!auth.currentUser) {
    throw new Error("No signed-in user found.");
  }

  // Force-reload user object to fetch latest emailVerified flag
  await auth.currentUser.reload();
  const { currentUser } = auth;

  // If user has successfully verified, update their Firestore record
  if (currentUser?.emailVerified) {
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        emailVerified: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true } // Merge instead of overwriting the whole document
    );
  }

  return Boolean(currentUser?.emailVerified);
};

/**
 * Updates or merges arbitrary user profile fields in Firestore.
 * 
 * @param {object} data - Key-value pairs of fields to update.
 */
export const updateUserProfileData = async (data) => {
  if (!auth.currentUser) {
    throw new Error("No signed-in user found.");
  }

  await setDoc(
    doc(db, "users", auth.currentUser.uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Authenticates a user with email and password.
 * 
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} The signed-in user's UserCredential object.
 */
export const loginUser = async (
  email,
  password
) => {
  return await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
};

/**
 * Signs out the currently authenticated user from the application.
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Triggers a password reset instruction email to the specified address.
 * 
 * @param {string} email - The email to send instructions to.
 */
export const resetPassword = async (
  email
) => {
  await sendPasswordResetEmail(
    auth,
    email
  );
};

/**
 * Translates standard Firebase Auth error codes into human-readable user interface strings.
 * 
 * @param {object} error - The error object returned from Firebase client SDK.
 * @returns {string} User-friendly error message.
 */
export const getFriendlyAuthError = (error) => {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email address.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "permission-denied":
      return "Firestore is blocking profile saving. Update your Firestore security rules to allow users to create and update their own profile.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
};

/**
 * Fetches the user profile document from the Firestore "users" collection.
 * 
 * @param {string} uid - User's unique identification code.
 * @returns {Promise<object|null>} The user document data if exists, null otherwise.
 */
export const getUserProfileData = async (uid) => {
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data();
  }
  return null;
};

