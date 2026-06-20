import spacy
nlp = spacy.load("en_core_web_sm")

class SentenceRanker:
  
  @staticmethod
  
  def _definition_score(doc):
    """
    Detects definition-style sentences by looking for copular verbs and specific patterns.
    Examples include "X is Y", "X are Y", "X was Y", etc.
    """
    score = 0
    for token in doc:
      if token.dep_ == "ROOT" and token.pos_ in ["VERB", "AUX"] and token.lemma_ in ["be", "define", "describe", "mean", "refer", "represent"]:
        score += 2
    
    if len(doc) < 8:
      score -=2
    
    return score
  
  @staticmethod
  def _entity_score(doc):
    """
    Scores sentences based on the presence of named entities.
    Sentences with more entities are likely to be more informative.
    """
    return len(doc.ents) * 3
  
  @staticmethod
  def _noun_score(doc):
    """
    Nouns + proper nouns often indicate key concepts.
    """
    score = 0
    for token in doc:
      if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop:
        score += 1
      elif token.text.lower() in ["it", "they", "this", "these", "that", "those", "he", "she", "we", "you", "i", "who", "which", "what"]:
        score -= 1
    return score
  
  @staticmethod
  def _causal_score(doc):
    """
    Detects sentences that indicate cause-effect relationships, which are often important for understanding concepts.
    """
    return sum(2 for token in doc if token.text.lower() in ["because", "since", "therefore", "thus", "hence", "as a result", "due to"])
  
  @staticmethod
  def _structure_score(doc):
      score = 0

      # subject-verb-object structure = high value
      has_subject = any(tok.dep_ == "nsubj" for tok in doc)
      has_object = any(tok.dep_ in ["dobj", "pobj"] for tok in doc)

      if has_subject:
          score += 2
      if has_object:
          score += 2

      return score
  
  @staticmethod
  def _generic_penalty(doc):

    generic_words = {"thing", "things", "good", "important", "useful"}

    return -sum(
        2 for token in doc
        if token.text.lower() in generic_words
    )
  
  @staticmethod
  def _length_score(doc):
    """
    Scores sentences based on their length. Sentences that are too short may lack context, while very long sentences may be too complex.
    """
    if 6 <= len(doc) <= 20:
      return 2
    elif len(doc) < 6:
      return 1
    else:
      return 0

  @staticmethod
  def score(sentence):
    doc = nlp(sentence)
    total_score = 0
    total_score += SentenceRanker._definition_score(doc)
    total_score += SentenceRanker._entity_score(doc)
    total_score += SentenceRanker._noun_score(doc)
    total_score += SentenceRanker._causal_score(doc)
    total_score += SentenceRanker._structure_score(doc)
    total_score += SentenceRanker._length_score(doc)
    total_score += SentenceRanker._generic_penalty(doc)
    return total_score
  
  @staticmethod
  def rank_sentences(sentences):
    ranked = []
    
    for sentence in sentences:
      ranked.append({
        "sentence": sentence,
        "score": SentenceRanker.score(sentence)
      })
    
    return sorted(ranked, key=lambda x: x["score"], reverse=True)
  