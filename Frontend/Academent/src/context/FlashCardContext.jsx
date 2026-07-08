/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  createGeneratedFlashCardCollection,
  deleteFlashCardCollection,
  duplicateFlashCardCollection,
  loadFlashCardsForCollection,
  recordFlashCardReview,
  subscribeToFlashCardCollections,
} from "../Services/flashCardService";

const FlashCardContext = createContext(null);

const ensureUser = (uid) => {
  if (!uid) throw new Error("You must be signed in to use flash cards.");
};

export function FlashCardProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const [collections, setCollections] = useState([]);
  const [cardsByCollection, setCardsByCollection] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      const handle = window.setTimeout(() => {
        setCollections([]);
        setCardsByCollection({});
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(handle);
    }

    const loadingHandle = window.setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    const unsubscribe = subscribeToFlashCardCollections(
      uid,
      (nextCollections) => {
        setCollections(nextCollections);
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

  const loadCards = useCallback((collectionId, { force = false, maxCards = 80 } = {}) => {
    if (!collectionId) return Promise.resolve([]);
    if (!force && cardsByCollection[collectionId]) return Promise.resolve(cardsByCollection[collectionId]);

    return runAction(async (userId) => {
      const cards = await loadFlashCardsForCollection(userId, collectionId, maxCards);
      setCardsByCollection((current) => ({ ...current, [collectionId]: cards }));
      return cards;
    });
  }, [cardsByCollection, runAction]);

  const generateCollection = useCallback((payload) => runAction((userId) => (
    createGeneratedFlashCardCollection(userId, payload)
  )), [runAction]);

  const removeCollection = useCallback((collectionId) => runAction(async (userId) => {
    await deleteFlashCardCollection(userId, collectionId);
    setCardsByCollection((current) => {
      const next = { ...current };
      delete next[collectionId];
      return next;
    });
  }), [runAction]);

  const duplicateCollection = useCallback((collection) => runAction((userId) => (
    duplicateFlashCardCollection(userId, collection)
  )), [runAction]);

  const reviewCard = useCallback((collectionId, card, rating, durationMs) => runAction(async (userId) => {
    const result = await recordFlashCardReview(userId, collectionId, card, rating, durationMs);
    setCardsByCollection((current) => ({
      ...current,
      [collectionId]: (current[collectionId] || []).map((item) => (
        (item.cardId || item.id) === (card.cardId || card.id)
          ? { ...item, ...result.schedule, reviewHistory: [...(item.reviewHistory || []), result.reviewEvent].slice(-50) }
          : item
      )),
    }));
    return result;
  }), [runAction]);

  const value = useMemo(() => ({
    uid,
    collections,
    cardsByCollection,
    loading,
    working,
    error,
    loadCards,
    generateCollection,
    removeCollection,
    duplicateCollection,
    reviewCard,
  }), [
    uid,
    collections,
    cardsByCollection,
    loading,
    working,
    error,
    loadCards,
    generateCollection,
    removeCollection,
    duplicateCollection,
    reviewCard,
  ]);

  return <FlashCardContext.Provider value={value}>{children}</FlashCardContext.Provider>;
}

export const useFlashCards = () => {
  const context = useContext(FlashCardContext);
  if (!context) throw new Error("useFlashCards must be used inside FlashCardProvider.");
  return context;
};

export default FlashCardContext;

