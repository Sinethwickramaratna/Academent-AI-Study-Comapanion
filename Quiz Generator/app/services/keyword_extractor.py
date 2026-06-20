import spacy

nlp = spacy.load("en_core_web_sm")


class KeywordExtractor:
  @staticmethod
  def extract_keywords(sentences):
    keywords = []
    for sentence in sentences:
      doc = nlp(sentence)
      
      if doc.ents:
        keywords.append(doc.ents[0].text)
        continue
      
      nouns = [
        token.text
        for token in doc
        if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop
      ]
      
      if nouns:
        keywords.append(nouns[0])
      else:
        keywords.append(None)
    return list(set(keywords))
  