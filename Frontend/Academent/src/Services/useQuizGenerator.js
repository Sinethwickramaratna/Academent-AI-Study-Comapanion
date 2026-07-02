import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  completeQuizAttempt,
  createGeneratedQuiz,
  createQuizAttempt,
  deleteQuiz,
  getLatestInProgressAttempt,
  subscribeToQuizzes,
  updateQuizAttemptProgress,
} from "./quizService";

const ensureUser = (uid) => {
  if (!uid) throw new Error("You must be signed in to use quizzes.");
};

export const useQuizGenerator = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      const handle = window.setTimeout(() => {
        setQuizzes([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(handle);
    }

    const loadingHandle = window.setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);
    const unsubscribe = subscribeToQuizzes(
      uid,
      (nextQuizzes) => {
        setQuizzes(nextQuizzes);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      },
    );

    return () => {
      window.clearTimeout(loadingHandle);
      unsubscribe();
    };
  }, [uid]);

  const runAction = useCallback(async (action) => {
    ensureUser(uid);
    setWorking(true);
    setError(null);

    try {
      return await action(uid);
    } catch (actionError) {
      setError(actionError);
      throw actionError;
    } finally {
      setWorking(false);
    }
  }, [uid]);

  const generateQuiz = useCallback((payload) => (
    runAction((userId) => createGeneratedQuiz(userId, payload))
  ), [runAction]);

  const startOrContinueQuiz = useCallback((quiz) => (
    runAction(async (userId) => {
      if (quiz.status === "partially_attempted") {
        const existingAttempt = await getLatestInProgressAttempt(userId, quiz.quizId);
        if (existingAttempt) return existingAttempt;
      }

      return createQuizAttempt(userId, quiz.quizId);
    })
  ), [runAction]);

  const retakeQuiz = useCallback((quiz) => (
    runAction((userId) => createQuizAttempt(userId, quiz.quizId))
  ), [runAction]);

  const removeQuiz = useCallback((quiz) => (
    runAction((userId) => deleteQuiz(userId, quiz.quizId))
  ), [runAction]);

  const saveAttemptProgress = useCallback((attemptId, patch) => {
    ensureUser(uid);
    return updateQuizAttemptProgress(uid, attemptId, patch);
  }, [uid]);

  const submitAttempt = useCallback((quiz, attempt, userAnswers) => (
    runAction((userId) => completeQuizAttempt(userId, quiz, attempt, userAnswers))
  ), [runAction]);

  return useMemo(() => ({
    uid,
    quizzes,
    loading,
    working,
    error,
    generateQuiz,
    startOrContinueQuiz,
    retakeQuiz,
    removeQuiz,
    saveAttemptProgress,
    submitAttempt,
  }), [
    uid,
    quizzes,
    loading,
    working,
    error,
    generateQuiz,
    startOrContinueQuiz,
    retakeQuiz,
    removeQuiz,
    saveAttemptProgress,
    submitAttempt,
  ]);
};

export default useQuizGenerator;



