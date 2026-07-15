// import { GoogleGenAI } from '@google/genai';
import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import { createAiResponseFormatError } from '../utils/apiErrors.js'

dotenv.config();

// const gemini = process.env.GEMINI_API_KEY
//   ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
//   : null;

// const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b';
const DEFAULT_JSON_MAX_TOKENS = 6000;
const MAX_JSON_RETRY_TOKENS = 36000;
const FLASH_CARD_OUTPUT_TOKENS_PER_CARD = 440;

const FLASH_CARD_RESPONSE_FORMAT = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['definition', 'concept', 'formula', 'true_false', 'fill_blank', 'process', 'diagram', 'qa'],
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
          },
          front: { type: 'string' },
          back: { type: 'string' },
          explanation: { type: 'string' },
          example: { type: 'string' },
          mnemonic: { type: 'string' },
          imageDescription: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
          },
          sourcePages: {
            type: 'array',
            items: { type: ['string', 'number'] },
          },
          confidence: { type: 'number' },
          createdBy: { type: 'string' },
        },
        required: ['type', 'difficulty', 'front', 'back'],
      },
    },
  },
  required: ['cards'],
};

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'https://ollama.com',
  headers: process.env.OLLAMA_API_KEY
    ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
    : undefined,
});

const TYPE_LABELS = {
  definition: 'Definition',
  concept: 'Concept',
  formula: 'Formula',
  true_false: 'True/False',
  fill_blank: 'Fill in the Blank',
  process: 'Process',
  diagram: 'Diagram-based',
  qa: 'Q&A',
};

const extractJsonPayload = (text) => {
  const trimmed = String(text || '').trim();
  const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedJson) return fencedJson[1].trim();

  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return trimmed;
};

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(extractJsonPayload(text))
  } catch (error) {
    throw createAiResponseFormatError(error)
  }
};

const getOllamaErrorMessage = (error) => {
  const message = String(error?.message || error || '');
  if (/model .* not found/i.test(message)) {
    return `Ollama model "${OLLAMA_MODEL}" was not found. Update OLLAMA_MODEL in backend/.env to an available model, then restart the backend.`;
  }
  return message;
};

const createTextResponse = async (input, options = {}) => {
  // if (gemini) {
  //   const response = await gemini.models.generateContent({
  //     model: GEMINI_MODEL,
  //     contents: input,
  //     config: {
  //       temperature: options.temperature ?? 0.65,
  //       topP: options.top_p ?? 0.9,
  //       maxOutputTokens: options.max_tokens ?? 5000,
  //       responseMimeType: options.json ? 'application/json' : undefined,
  //     },
  //   });

  //   const text = response.text
  //     || response.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  //     || '';

  //   if (!text.trim()) throw new Error('Gemini did not return any text output.');
  //   return text;
  // }

  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: input }],
      stream: true,
      format: options.jsonSchema || (options.json ? 'json' : undefined),
      think: options.think ?? ((options.json || options.jsonSchema) ? false : undefined),
      options: {
        temperature: options.temperature ?? 0.4,
        top_p: options.top_p ?? 0.9,
        num_predict: options.max_tokens ?? DEFAULT_JSON_MAX_TOKENS,
      },
    });

    let text = '';
    let doneReason = '';

    for await (const part of response) {
      text += part.message?.content || '';
      if (part.done) doneReason = part.done_reason || '';
    }

    if ((options.json || options.jsonSchema) && /length/i.test(doneReason)) {
      throw createAiResponseFormatError(new Error(`Ollama stopped before completing the JSON response (${doneReason}).`));
    }

    return text;
  } catch (error) {
    if (error?.code === 'AI_RESPONSE_FORMAT') throw error;
    throw new Error(getOllamaErrorMessage(error));
  }
};

const createJsonResponse = async (input, options = {}) => {
  const requestOptions = {
    temperature: options.temperature ?? 0.35,
    top_p: options.top_p ?? 0.85,
    max_tokens: options.max_tokens ?? DEFAULT_JSON_MAX_TOKENS,
    json: true,
    jsonSchema: options.jsonSchema,
  };

  try {
    return parseJsonResponse(await createTextResponse(input, requestOptions));
  } catch (error) {
    if (options.retry === false || error?.code !== 'AI_RESPONSE_FORMAT') throw error;

    const retryOptions = {
      ...requestOptions,
      temperature: Math.min(requestOptions.temperature, 0.2),
      top_p: Math.min(requestOptions.top_p, 0.8),
      max_tokens: Math.min(Math.max(requestOptions.max_tokens * 2, DEFAULT_JSON_MAX_TOKENS), MAX_JSON_RETRY_TOKENS),
    };

    return parseJsonResponse(await createTextResponse(input, retryOptions));
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getFlashCardMaxTokens = (requestedCount) => {
  const budget = 2000 + requestedCount * FLASH_CARD_OUTPUT_TOKENS_PER_CARD;
  return Math.min(MAX_JSON_RETRY_TOKENS, Math.max(DEFAULT_JSON_MAX_TOKENS, budget));
};

const normalizeType = (type) => {
  const normalized = String(type || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized === 'definition') return 'definition';
  if (normalized === 'concept') return 'concept';
  if (['formula', 'simple_formula'].includes(normalized)) return 'formula';
  if (['true_false', 'truefalse'].includes(normalized)) return 'true_false';
  if (['fill_in_the_blank', 'fill_blank', 'blank'].includes(normalized)) return 'fill_blank';
  if (['process', 'algorithm'].includes(normalized)) return 'process';
  if (['diagram_based', 'diagram'].includes(normalized)) return 'diagram';
  if (['q_a', 'qa', 'question_answer'].includes(normalized)) return 'qa';
  return 'qa';
};

const normalizeDifficulty = (difficulty) => {
  const normalized = String(difficulty || 'medium').toLowerCase();
  return ['easy', 'medium', 'hard'].includes(normalized) ? normalized : 'medium';
};

const uniqueStrings = (items = []) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const normalizeCards = (payload, requestedCount) => {
  const cards = Array.isArray(payload?.cards)
    ? payload.cards
    : Array.isArray(payload?.flashCards)
      ? payload.flashCards
      : Array.isArray(payload)
        ? payload
        : [];

  const seen = new Set();
  return cards
    .map((card, index) => {
      const front = String(card.front || card.question || '').trim();
      const back = String(card.back || card.answer || '').trim();
      const key = `${front.toLowerCase()}|${back.toLowerCase()}`;
      if (!front || !back || seen.has(key)) return null;
      seen.add(key);

      return {
        id: card.id || `generated-${index + 1}`,
        type: normalizeType(card.type),
        difficulty: normalizeDifficulty(card.difficulty),
        front,
        back,
        explanation: String(card.explanation || '').trim(),
        example: String(card.example || '').trim(),
        mnemonic: String(card.mnemonic || '').trim(),
        imageDescription: String(card.imageDescription || '').trim(),
        tags: uniqueStrings(card.tags || []),
        keywords: uniqueStrings(card.keywords || []),
        sourcePages: Array.isArray(card.sourcePages) ? card.sourcePages : [],
        confidence: clamp(Number(card.confidence || 0.85), 0, 1),
        createdBy: 'AI',
      };
    })
    .filter(Boolean)
    .slice(0, requestedCount);
};

const buildPrompt = ({ sources, preferences }) => {
  const cardCount = clamp(Number(preferences.cardCount || 35), 1, 100);
  const difficulty = String(preferences.difficulty || 'mixed').toLowerCase();
  const cardTypes = [...new Set((preferences.cardTypes || ['definition', 'concept', 'qa'])
    .map((type) => TYPE_LABELS[normalizeType(type)])
    .filter(Boolean))];

  return `
You are Academent's expert flash-card generation engine.

Create high-quality academic flash cards from the supplied study material.

Pipeline:
1. Knowledge extraction: use only educationally meaningful definitions, concepts, formulas, algorithms, processes, terminology, syntax, important facts, relationships, comparisons, applications, and best practices.
2. Concept ranking: cluster similar concepts, merge duplicates, remove repeated or low-value information, and prioritize importance, frequency, educational value, and likely learning objectives.
3. Flash-card generation: generate cards that cover as many unique concepts as possible.

Ignore headers, footers, page numbers, references, copyright notices, tables of contents, decorative text, duplicate paragraphs, and non-academic material.

Preferences:
- Number of cards: ${cardCount}
- Difficulty: ${difficulty}
- Allowed card types: ${cardTypes.join(', ') || 'Definition, Concept, Q&A'}
- Include examples: ${Boolean(preferences.includeExamples)}
- Include mnemonics: ${Boolean(preferences.includeMnemonics)}
- Include images: ${Boolean(preferences.includeImages)}
- Avoid duplicates: ${preferences.avoidDuplicates !== false}
- Adaptive difficulty: ${Boolean(preferences.adaptiveDifficulty)}

Difficulty rules:
- Easy: definition, concept, Q&A, or simple formula cards with concise answers.
- Medium: definition, concept, formula, fill in the blank, true/false, process, and Q&A requiring deeper understanding.
- Hard: scenario cards, complex formulas, multi-step reasoning, diagram cards, application questions, and analytical questions.
- Mixed: balance easy, medium, and hard according to concept complexity.

Type rules:
- Definition: front asks "What is ..."; back includes definition, explanation, optional example, optional mnemonic.
- Concept: front asks what a concept allows/means/affects; back includes explanation, application, related concepts.
- Formula: front asks for the formula; back includes formula, variable explanation, example calculation when examples are enabled.
- True/False: front is a clear claim; back starts with True or False and explains why.
- Fill in the Blank: front includes a visible blank; back gives the missing term and concise explanation.
- Process: front asks to explain a process; back is ordered steps.
- Diagram-based: do not create an image; include a useful imageDescription string.
- Q&A: front is a clear question; back is the answer with a direct explanation.

Return ONLY valid JSON in this exact shape:
Do not include markdown code fences, comments, or extra text.
Keep front, back, explanation, example, mnemonic, and imageDescription concise so the JSON can complete.
{
  "cards": [
    {
      "id": "",
      "type": "definition | concept | formula | true_false | fill_blank | process | diagram | qa",
      "difficulty": "easy | medium | hard",
      "front": "",
      "back": "",
      "explanation": "",
      "example": "",
      "mnemonic": "",
      "imageDescription": "",
      "tags": [],
      "keywords": [],
      "sourcePages": [],
      "confidence": 0.98,
      "createdBy": "AI"
    }
  ]
}

Study material:
${JSON.stringify(sources).slice(0, 55000)}
  `.trim();
};

export const generateFlashCards = async ({ sources = [], preferences = {} }) => {
  if (!Array.isArray(sources) || !sources.length) {
    throw new Error('At least one study source is required to generate flash cards.');
  }

  const requestedCount = clamp(Number(preferences.cardCount || 35), 1, 100);
  const result = await createJsonResponse(buildPrompt({ sources, preferences }), {
    max_tokens: getFlashCardMaxTokens(requestedCount),
    jsonSchema: FLASH_CARD_RESPONSE_FORMAT,
  });
  const cards = normalizeCards(result, requestedCount);

  if (!cards.length) throw new Error('The AI did not return any valid flash cards.');

  return {
    cards,
    requestedCount,
    generatedCount: cards.length,
  };
};

