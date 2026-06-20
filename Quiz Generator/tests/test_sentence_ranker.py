import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
    
from app.services.sentence_ranker import SentenceRanker

def test_sentence_ranker():
    sentences = [

      # 🌿 Biology / Science
      "Photosynthesis is the process by which green plants convert sunlight into energy.",
      "Chlorophyll absorbs light energy during photosynthesis.",
      "Water is essential for plant survival.",
      "Plants need water to grow.",
      "The mitochondria is the powerhouse of the cell.",
      "Cells divide through the process of mitosis.",
      "Mitosis produces two identical daughter cells.",
      "Osmosis is the movement of water across a semipermeable membrane.",

      # ⚡ Physics
      "Force is equal to mass multiplied by acceleration.",
      "Newton’s second law explains the relationship between force and motion.",
      "Gravity pulls objects toward the Earth.",
      "Light travels in straight lines.",
      "Energy cannot be created or destroyed.",

      # 🧠 General Knowledge
      "Water boils at 100 degrees Celsius.",
      "The Earth revolves around the Sun.",
      "Sri Lanka is an island country.",
      "Colombo is the commercial capital of Sri Lanka.",
      "The human brain controls the body.",

      # ❌ Noise / Low-quality sentences
      "Water.",
      "It is important.",
      "This is good.",
      "Things happen.",
      "Plants.",
      "Very useful.",
      "Because it is true.",

      # 🔥 Edge cases / advanced sentences
      "The process of cellular respiration produces ATP in mitochondria.",
      "Photosynthesis converts sunlight into chemical energy using chlorophyll in chloroplasts.",
      "When heat is applied, water changes into steam due to evaporation.",
      "Albert Einstein developed the theory of relativity.",
      "DNA contains genetic information in living organisms."
  ]
    
    ranked = SentenceRanker.rank_sentences(sentences)
    for item in ranked:
        print(item)
        
if __name__ == "__main__":
    test_sentence_ranker()