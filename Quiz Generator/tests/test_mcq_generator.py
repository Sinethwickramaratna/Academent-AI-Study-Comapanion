import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.mcq_generator import MCQGenerator

def test_mcq_generator():
  svo = {
    "subject": "Photosynthesis",
    "verb": "convert",
    "object": "sunlight into energy"
  }

  mcq = MCQGenerator.generate(svo)

  print(mcq["question"])
  print()

  for i, opt in enumerate(mcq["options"], 1):
      print(f"{i}. {opt}")

  print("\nAnswer:", mcq["answer"])

if __name__ == "__main__":
  test_mcq_generator()