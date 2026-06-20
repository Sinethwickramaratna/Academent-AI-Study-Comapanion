import random
import spacy

nlp = spacy.load("en_core_web_sm")


class MCQGenerator:

    @staticmethod
    def generate(svo):

        subject = svo["subject"]
        verb = svo["verb"]
        obj = svo["object"]

        question = MCQGenerator._build_question(subject, verb)

        correct_answer = obj
        options = MCQGenerator._generate_options(obj)

        return {
            "question": question,
            "options": options,
            "answer": correct_answer
        }

    @staticmethod
    def _build_question(subject, verb):

        templates = [
            f"What does {subject} {verb}?",
            f"{subject} is involved in which process?",
            f"What is the result of {subject} {verb}ing?"
        ]

        return random.choice(templates)

    @staticmethod
    def _generate_options(correct_answer):

        options = set()
        options.add(correct_answer)

        # simple distractors (rule-based)
        distractors = [
            "carbon dioxide into oxygen",
            "water into glucose",
            "energy into sunlight",
            "oxygen into carbon dioxide",
            "glucose into energy",
            "heat into motion"
        ]

        random.shuffle(distractors)

        for d in distractors:
            if len(options) < 4:
                options.add(d)

        return random.sample(list(options), 4)