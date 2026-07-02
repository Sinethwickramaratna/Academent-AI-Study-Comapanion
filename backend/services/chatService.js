// import { GoogleGenAI } from '@google/genai';
import { Ollama } from 'ollama';
// import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/*const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});*/

/*const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_BASE_URL
});

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL;*/

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'https://ollama.com',
  headers: process.env.OLLAMA_API_KEY
    ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
    : undefined,
});

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b';

function getOllamaErrorMessage(error) {
  const message = String(error?.message || error || '');
  if (/model .* not found/i.test(message)) {
    return `Ollama model "${OLLAMA_MODEL}" was not found. Update OLLAMA_MODEL in backend/.env to an available model, then restart the backend.`;
  }
  return message;
}


function parseJsonResponse(text) {
  const trimmed = text.trim();
  const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fencedJson ? fencedJson[1] : trimmed);
}

async function createTextResponse(input, options = {}) {
  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: input }],
      stream: true,
      format: options.json ? 'json' : undefined,
      options: {
        temperature: options.temperature ?? 1,
        top_p: options.top_p ?? 0.95,
        num_predict: options.max_tokens ?? 3000,
      },
    });

    let text = '';

    for await (const part of response) {
      text += part.message?.content || '';
    }

    return text;
  } catch (error) {
    throw new Error(getOllamaErrorMessage(error));
  }
}

async function createJsonResponse(input) {
  const text = await createTextResponse(input, {
    temperature: 1,
    json: true,
  });

  return parseJsonResponse(text);
}

/*function getResponseText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap((item) => item.content || [])
    ?.find((content) => content.type === 'output_text' && content.text)
    ?.text;

  if (!text) {
    throw new Error('OpenAI response did not include any text output');
  }

  return text;
}

async function createTextResponse(input, options = {}) {
  const response = await openai.responses.create({
    model: DEEPSEEK_MODEL,
    input,
    temperature: options.temperature ?? 1,
    top_p: options.top_p ?? 0.95,
    max_tokens: options.max_tokens ?? 3000,
    text: options.text,
    speed: 100,
  });

  return getResponseText(response);
}

async function createJsonResponse(input) {
  const text = await createTextResponse(input, {
    temperature: 1,
    text: {
      format: {
        type: 'json_object',
      },
    },
  });

  return JSON.parse(text);
}

*/

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

  /*const result = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });*/

  return createJsonResponse(prompt);
}

export function buildQuizPrompt(knowledge, numQuestions, difficulty) {
  const baseRules = `
  You are an expert teacher and assessment designer.

  Using the knowledge below, generate a quiz.

  Quiz requirements:
  - Number of questions: ${numQuestions}

  Return ONLY valid JSON.

  Every question object MUST include an "explanation" field that explains why the correct answer is correct using the supplied knowledge.
  Knowledge:
  ${JSON.stringify(knowledge)
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
          "answer": "",
          "explanation": ""
        },
        {
          "question_number": 2,
          "type": "True/False",
          "question": "",
          "answer": "",
          "explanation": ""
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
      - Cloze (paragraph with visible blanks)

      Rules:
      - MCQs must have 4 options with only 1 correct answer.
      - Fill in the Blank questions should have a clear blank and a single correct answer.
      - Every FILL_BLANK question MUST include exactly 4 non-empty options.
      - FILL_BLANK options MUST include the correct answer and 3 plausible incorrect distractors.
      - Do not return empty strings in FILL_BLANK options.
      - True/False questions must be clear and unambiguous.
      - Cloze questions should have 2-3 blanks with clear correct answers.
      - CLOZE question text must show every blank visibly using exactly eight underscores: ________.
      - For CLOZE, replace each missing answer in the paragraph with ________; do not write the full answer in the question text.
      - The number of ________ blanks in a CLOZE question must exactly match the number of items in answers.
      - Focus on understanding and application of concepts.
      - Mix question types to create a balanced quiz.
      - No scenario or short answer questions.
      - Avoid repetition and ensure variety in question formats.

      Return format:
      {
        "quiz": [
          {
            "question_number": 1,
            "type": "MCQ",
            "question": "",
            "options": ["", "", "", ""],
            "answer": "",
            "explanation": ""
          },
          {
            "question_number": 2,
            "type": "FILL_BLANK",
            "question": "A database table column is also called a ________.",
            "options": ["field", "record", "tuple", "schema"],
            "answer": "field",
            "explanation": "A field is a column in a database table, while records or tuples are rows."
          },
          {
            "question_number": 3,
            "type": "True/False",
            "question": "",
            "answer": "",
            "explanation": ""
          },
          {
            "question_number": 4,
            "type": "CLOZE",
            "question": "Data quality includes ________, ________, and ________.",
            "answers": ["accuracy", "completeness", "timeliness"],
            "explanation": "Accuracy, completeness, and timeliness are common dimensions used to evaluate data quality."
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
      - Cloze (paragraph with visible blanks)
      - Scenario-based questions
      - Short answer questions

      Rules:
      - Focus on application and analysis of concepts.
      - Include real-world scenarios
      - Fill in the Blank questions should have a clear blank and a single correct answer.
      - Every FILL_BLANK question MUST include exactly 4 non-empty options.
      - FILL_BLANK options MUST include the correct answer and 3 plausible incorrect distractors.
      - Do not return empty strings in FILL_BLANK options.
      - Cloze questions should have 3-10 blanks with clear correct answers.
      - CLOZE question text must show every blank visibly using exactly eight underscores: ________.
      - For CLOZE, replace each missing answer in the paragraph with ________; do not write the full answer in the question text.
      - The number of ________ blanks in a CLOZE question must exactly match the number of items in answers.
      - Avoid repetition

      Return format:
      {
        "quiz": [
          {
            "question_number": 1,
            "type": "MCQ",
            "question": "",
            "options": ["", "", "", ""],
            "answer": "",
            "explanation": ""
          },
          {
            "question_number": 2,
            "type": "FILL_BLANK",
            "question": "A database table column is also called a ________.",
            "options": ["field", "record", "tuple", "schema"],
            "answer": "field",
            "explanation": "A field is a column in a database table, while records or tuples are rows."
          },
          {
            "question_number": 3,
            "type": "True/False",
            "question": "",
            "answer": "",
            "explanation": ""
          },
          {
            "question_number": 4,
            "type": "CLOZE",
            "question": "Data quality includes ________, ________, and ________.",
            "answers": ["accuracy", "completeness", "timeliness"],
            "explanation": "Accuracy, completeness, and timeliness are common dimensions used to evaluate data quality."
          },
          {
            "question_number": 5,
            "type": "SCENARIO",
            "question": "",
            "options": ["","","",""],
            "answer": "",
            "explanation": ""
          },
          {
            "question_number": 6,
            "type": "SHORT_ANSWER",
            "question": "",
            "answer": "",
            "explanation": ""
          }
        ]
      }
    `
  }



}

export async function generateQuiz(knowledge, numQuestions = 10, difficulty = 'easy') {
  const prompt = buildQuizPrompt(knowledge, numQuestions, difficulty);

  /*const result = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });*/

  return createJsonResponse(prompt);
}


export async function evaluateShortAnswer({ question, correctAnswer, userAnswer }) {
  const prompt = `
  You are an expert examiner. Evaluate the student's short answer.

  Return ONLY valid JSON with:
  {
    "marks": 0 to 1,
    "feedback": "brief helpful feedback",
    "status": "correct" | "partially_correct" | "incorrect"
  }

  Marking rules:
  - 1 means fully correct.
  - 0.5 means partially correct.
  - 0 means incorrect or missing.
  - Be fair to equivalent wording.

  Question: ${question}
  Correct answer / rubric: ${correctAnswer}
  Student answer: ${userAnswer || ''}
  `;

  const result = await createJsonResponse(prompt);

  /*const response = await openai.responses.create({
    model: DEEPSEEK_MODEL,
    input: prompt,
    temperature: 0.2,
    text: {
      format: {
        type: 'json_object',
      },
    },
  });

  const result = JSON.parse(getResponseText(response));*/
  const marks = Math.max(0, Math.min(1, Number(result.marks || 0)));

  return {
    marks,
    feedback: result.feedback || '',
    status: ['correct', 'partially_correct', 'incorrect'].includes(result.status)
      ? result.status
      : marks >= 1
        ? 'correct'
        : marks > 0
          ? 'partially_correct'
          : 'incorrect',
  };
}

export const generateResponse = async (message) => {
  /*const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message,
  });*/

  return createTextResponse(message);
}








