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
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export const registerUser = async (
  fullName,
  email,
  password
) => {
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  const { user } = userCredential;

  try {
    await updateProfile(
      user,
      {
        displayName: fullName.trim(),
      }
    );

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

    await sendEmailVerification(user);
  } catch (error) {
    await deleteUser(user).catch(() => {});
    throw error;
  }

  return user;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const { user } = userCredential;
  const additionalUserInfo = getAdditionalUserInfo(userCredential);

  if (additionalUserInfo?.isNewUser) {
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
      await deleteUser(user).catch(() => {});
      throw error;
    }
  }

  return userCredential;
};

export const resendEmailVerification = async () => {
  if (!auth.currentUser) {
    throw new Error("No signed-in user found.");
  }

  await sendEmailVerification(auth.currentUser);
};

export const refreshEmailVerificationStatus = async () => {
  if (!auth.currentUser) {
    throw new Error("No signed-in user found.");
  }

  await auth.currentUser.reload();
  const { currentUser } = auth;

  if (currentUser?.emailVerified) {
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        emailVerified: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return Boolean(currentUser?.emailVerified);
};

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

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (
  email
) => {
  await sendPasswordResetEmail(
    auth,
    email
  );
};

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
