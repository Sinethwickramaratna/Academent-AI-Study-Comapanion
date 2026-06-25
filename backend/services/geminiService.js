import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function extractKnowledge(content) {
  const prompt = `
  You are an expert teacher

  Extract:
  - key concepts
  - definitions
  - processes
  - formulas
  - applications
  - facts
  - algorithms
  - pseudocode
  - case studies
  - examples

  Return ONLY JSON.

  Content:
  ${content}
  `;

  const result = await gemini.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(result.text);
}

export function buildQuizPrompt(knowledge, numQuestions, difficulty) {
  const baseRules = `
  You are an expert teacher and assessment designer.

  Using the knowledge below, generate a quiz.

  Quiz requirements:
  - Number of questions: ${numQuestions}

  Return ONLY valid JSON.

  Knowledge:
  ${
    JSON.stringify(knowledge)
  }
  `

  if (difficulty === 'easy') {
  return `
    ${baseRules}

    DIFFICULTY: EASY

    Generate ONLY the following question types:
    - Multiple Choice Questions (MCQs)
    - True/False questions

    Rules:
    - Multiple Choice Questions must have 4 options with only 1 correct answer.
    - True/False questions must be clear and unambiguous.
    - Focus on basic recall and understanding of concepts.
    - Do NOT include fill_blank, cloze, scenario, or short answer questions.
    - Keep questions simple and direct

    Return format:
    {
      "quiz": [
        {
          "question_number": 1,
          "type": "MCQ",
          "question": "",
          "options":["", "", "", ""],
          "answer": ""
        },
        {
          "question_number": 2,
          "type": "True/False",
          "question": "",
          "answer": ""
        }
      ]
    }
    `;
  }

  if (difficulty === 'medium') {
    return `
      ${baseRules}

      DIFFICULTY: MEDIUM

      Generate:
      - MCQ
      - Fill in the Blank
      - True/False
      - Cloze (pharagraph with blanks)

      Rules:
      - MCQs must have 4 options with only 1 correct answer.
      - Fill in the Blank questions should have a clear blank and a single correct answer.
      - True/False questions must be clear and unambiguous.
      - Cloze questions should have 2-3 blanks with clear correct answers.
      - Focus on understanding and application of concepts.
      - Mix question types to create a balanced quiz.
      - No scenario or short answer questions.
      - Avoid repetition and ensure variety in question formats.

      Return format:
      {
        "quiz": [
          {
            "question_number": 1,
            "type": "MCQ"
            "question": "",
            "options": ["", "", "", ""],
            "answer": ""
          },
          {
            "question_number": 2,
            "type": "FILL_BLANK",
            "question": "",
            "options": ["","","",""],
            "answer": "",
          },
          {
            "question_number": 3,
            "type": "True/False",
            "question": "",
            "answer": ""
          },
          {
            "question_number": 4,
            "type": "CLOZE",
            "question": "",
            "answers": []
          }
        ]
      }
    `
  }

  if (difficulty === 'hard') {
    return `
      ${baseRules}

      DIFFICULTY: HARD

      Generate ALL Question Types:
      - MCQ
      - Fill in the Blank
      - True/False
      - Cloze (pharagraph with blanks)
      - Scenario-based questions
      - Short answer questions

      Rules:
      - Focus on application and analysis of concepts.
      - Include real-world scenarios
      - Cloze questions should have 3-10 blanks with clear correct answers.
      - Avoid repetition

      Return format:
      {
        "quiz": [
          {
            "question_number": 1,
            "type": "MCQ",
            "question": "",
            "options": ["", "", "", ""],  
            "answer": ""     
          },
          {
            "question_number": 2,
            "type": "FILL_BLANK",
            "question": "",
            "options": ["","","",""],
            "answer": ""
          },
          {
            "question_number": 3,
            "type": "True/False",
            "question": "",
            "answer": ""
          },
          {
            "question_number": 4,
            "type": "CLOZE",
            "question": "",
            "answers": []
          },
          {
            "question_number": 5,
            "type": "SCENARIO",
            "question": "",
            "options": ["","","",""],
            "answer": ""
          },
          {
            "question_number": 6,
            "type": "SHORT_ANSWER",
            "question": "",
            "answer": ""
          }
        ]
      }
    `
  }


    
}

export async function generateQuiz(knowledge, numQuestions = 10, difficulty = 'easy') {
  const prompt = buildQuizPrompt(knowledge, numQuestions, difficulty);

  const result = await gemini.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(result.text);
}

export const generateResponse = async (message) => {
  const response = await gemini.models.generateContent({
    model: "gemini-3.5-flash",
    contents: message,
  });

  return response.text;
}