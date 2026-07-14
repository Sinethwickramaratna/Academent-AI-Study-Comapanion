// import { GoogleGenAI } from '@google/genai';
import { Ollama } from 'ollama';
// import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createAiResponseFormatError } from '../utils/apiErrors.js'

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
  try {
    return JSON.parse(fencedJson ? fencedJson[1] : trimmed)
  } catch (error) {
    throw createAiResponseFormatError(error)
  }
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

  try {
    return JSON.parse(fencedJson ? fencedJson[1] : trimmed)
  } catch (error) {
    throw createAiResponseFormatError(error)
  }
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

  Every question object MUST include an "explanation" field with a short, direct explanation using the supplied knowledge.
  Do not start explanations with phrases like "Why the correct answer is correct:" or similar lead-ins.
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
      - Each CLOZE blank must assess one independently inferable key concept, term, formula, value, or meaningful phrase.
      - Do NOT generate CLOZE blanks that require multiple related items joined by conjunctions such as "and", "or", or "as well as"; avoid patterns like "________ and ________" or a single blank whose answer contains joined items.
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
            "question": "A data quality check verifies that each record is ________ before it is used for analysis.",
            "answers": ["accurate"],
            "explanation": "Accuracy is a common dimension used to evaluate whether data correctly represents the real-world value."
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
      - Each CLOZE blank must assess one independently inferable key concept, term, formula, value, or meaningful phrase.
      - Do NOT generate CLOZE blanks that require multiple related items joined by conjunctions such as "and", "or", or "as well as"; avoid patterns like "________ and ________" or a single blank whose answer contains joined items.
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
            "question": "A data quality check verifies that each record is ________ before it is used for analysis.",
            "answers": ["accurate"],
            "explanation": "Accuracy is a common dimension used to evaluate whether data correctly represents the real-world value."
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

const MAX_CONTEXT_MATERIALS = 8;
const MAX_CONTEXT_CHARS = 18000;

function stringifyKnowledge(knowledge) {
  if (knowledge === null || knowledge === undefined) return "";
  if (typeof knowledge === "string") return knowledge;
  return JSON.stringify(knowledge, null, 2);
}

function truncateText(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n[Context truncated for length]`;
}

function normalizeTutorContext(contextMaterials = []) {
  let remaining = MAX_CONTEXT_CHARS;

  return (Array.isArray(contextMaterials) ? contextMaterials : [])
    .slice(0, MAX_CONTEXT_MATERIALS)
    .map((material, index) => {
      const knowledge = stringifyKnowledge(material?.knowledge);
      if (!knowledge.trim() || remaining <= 0) return null;

      const text = truncateText(knowledge, Math.min(remaining, 4000));
      remaining -= text.length;

      return {
        index: index + 1,
        id: material?.id || "",
        type: material?.type || "material",
        title: material?.title || `Study material ${index + 1}`,
        path: material?.path || "",
        knowledge: text,
      };
    })
    .filter(Boolean);
}

function buildTutorPrompt(message, { contextMaterials = [], history = [] } = {}) {
  const context = normalizeTutorContext(contextMaterials);
  const recentHistory = (Array.isArray(history) ? history : [])
    .slice(-8)
    .map((item) => `${item.sender === "ai" ? "AI Tutor" : "Student"}: ${String(item.text || "").slice(0, 1200)}`)
    .join("\n");

  const contextBlock = context.length
    ? context.map((item) => `Source ${item.index}: ${item.title}\nType: ${item.type}\nPath: ${item.path}\nExtracted knowledge:\n${item.knowledge}`).join("\n\n---\n\n")
    : "No selected study material context was provided.";

  return `
You are Academent AI Tutor, a warm, precise academic study assistant.

Response rules:
- Answer the student's latest message directly.
- If selected study material context is provided, use it as the primary source of truth.
- If the context does not contain enough information, say what is missing and then answer from general knowledge only if helpful.
- Mention relevant source titles naturally when using selected notes or PDFs.
- Be clear, structured, and student-friendly.
- Use Markdown for bullets, tables, formulas, and code where useful.
- Do not invent citations or claim a source says something not present in the context.

Recent conversation:
${recentHistory || "No previous messages."}

Selected study material context:
${contextBlock}

Student message:
${message}
  `.trim();
}

export const generateResponse = async (message, options = {}) => {
  /*const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message,
  });*/

  const prompt = buildTutorPrompt(message, options);
  return createTextResponse(prompt, {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2500,
  });
}

