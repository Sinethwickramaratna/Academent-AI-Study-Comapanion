import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.text_processor import TextProcessor

def test_split_into_sentences():
    text = "Photosynthesis converts sunlight into energy. Chlorophyll absorbs light"
    sentences = TextProcessor.split_sentences(text)
    assert len(sentences) == 2
    print("Test passed: split_into_sentences correctly splits the text into sentences.")
    print("Sentences:", sentences)

if __name__ == "__main__":
    test_split_into_sentences()
