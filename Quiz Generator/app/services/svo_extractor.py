import spacy

nlp = spacy.load("en_core_web_sm")


class SVOExtractor:

    @staticmethod
    def extract(sentence):

        doc = nlp(sentence)

        # STEP 1: find VERB (robust)
        verb = None
        for token in doc:
            if token.pos_ == "VERB":
                verb = token
                break

        if not verb:
            return None

        # STEP 2: subject (dependency OR fallback subtree)
        subject = None

        for token in doc:
            if token.dep_ in ["nsubj", "nsubjpass"]:
                subject = SVOExtractor._expand(token)
                break

        if not subject:
            for token in doc:
                if token.i < verb.i and token.pos_ in ["NOUN", "PROPN"]:
                    subject = SVOExtractor._expand(token)
                    break

        # STEP 3: object (IMPORTANT FIX → FULL PHRASE CAPTURE)
        obj = None

        # direct object
        for token in doc:
            if token.dep_ in ["dobj", "attr"]:
                obj = SVOExtractor._expand(token)
                break

        # prepositional object fallback
        if not obj:
            for token in doc:
                if token.dep_ == "pobj":
                    obj = SVOExtractor._expand(token)

        if not subject or not obj:
            return None

        return {
            "subject": subject,
            "verb": verb.lemma_,
            "object": obj
        }

    @staticmethod
    def _expand(token):
        # THIS IS THE KEY FIX
        return " ".join([t.text for t in token.subtree])