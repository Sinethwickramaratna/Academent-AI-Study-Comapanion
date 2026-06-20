from nltk.tokenize.punkt import PunktSentenceTokenizer


class TextProcessor:
    _sentence_tokenizer = PunktSentenceTokenizer()

    @staticmethod
    def split_sentences(text):
        return TextProcessor._sentence_tokenizer.tokenize(text)
