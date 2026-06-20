import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.svo_extractor import SVOExtractor

def test_svo_extractor():
    sentences = [
      "Photosynthesis converts sunlight into energy.",
      "Newton’s second law explains the relationship between force and motion.",
      "Chlorophyll absorbs light energy.",
      "Gravity pulls objects toward the Earth."
    ]

    for sentence in sentences:
        svo = SVOExtractor.extract(sentence)
        print(svo)

if __name__ == "__main__":
    test_svo_extractor()