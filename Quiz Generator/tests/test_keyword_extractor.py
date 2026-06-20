import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.keyword_extractor import KeywordExtractor

def test_extract_keywords():
    sentences = [
      "Photosynthesis converts sunlight into energy.",
      "Chlorophyll absorbs light.",
      "The nucleus controls cell activities",
      "Albert Einstein developed relativity theory."
    ]
    keywords = KeywordExtractor.extract_keywords(sentences)
    assert len(keywords) == 4
    print("Test passed: extract_keywords correctly extracts keywords from sentences.")
    print("Keywords:", keywords)

if __name__ == "__main__":
    test_extract_keywords()
