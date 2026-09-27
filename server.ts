import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Load rubric JSON
const rubricsPath = path.join(__dirname, 'src', 'data', 'anatomyRubrics.json');
let rubricsData: { structures: any[] } = { structures: [] };

try {
  const fileContent = fs.readFileSync(rubricsPath, 'utf-8');
  rubricsData = JSON.parse(fileContent);
} catch (e) {
  console.error('Failed to read anatomy rubrics:', e);
}

function getRubric(structureId: string) {
  return rubricsData.structures.find((s) => s.id === structureId) || rubricsData.structures[0];
}

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  // API: Get Rubric and Drawing Plan
  app.get('/api/tutor/structures', (req, res) => {
    res.json(rubricsData.structures);
  });

  app.get('/api/tutor/rubric/:id', (req, res) => {
    const rubric = getRubric(req.params.id);
    if (!rubric) {
      return res.status(404).json({ error: 'Structure rubric not found' });
    }
    res.json(rubric);
  });

  // API: Check My Drawing
  app.post('/api/tutor/check', async (req, res) => {
    try {
      const { imageBase64, structureId } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Canvas image data is required' });
      }

      const rubric = getRubric(structureId);
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const systemInstruction = `You are a world-class anatomy professor and board-certified medical illustrator evaluating a health-science student's hand-drawn anatomical sketch from memory.
Your goal is to provide precise, rigorous, highly educational, and encouraging visual and structural critique.

Target Structure: "${rubric.name}" (${rubric.difficulty} level)
Student Prompt: "${rubric.promptText}"

RUBRIC CRITERIA:
- Required Components: ${JSON.stringify(rubric.requiredParts)}
- Required Labels: ${JSON.stringify(rubric.requiredLabels)}
- Spatial Relationships & Landmarks: ${JSON.stringify(rubric.spatialRelationships)}
- High-Yield Common Student Mistakes: ${JSON.stringify(rubric.commonStudentMistakes)}

EVALUATION RULES:
1. Examine the student's drawing carefully. Detect all strokes, shapes, labels, pointer arrows, and anatomical relationships.
2. Evaluate what is anatomically correct vs incorrect vs missing.
3. If the drawing is nearly blank or contains random scribbles unrelated to the structure, give an honest low score (0-20) and point out missing core anatomy.
4. If the student made recognizable efforts, award proportional points based on accurate topology, chamber/tubule/nerve orientations, and labeling.
5. For EVERY error identified:
   - Provide an exact bounding box in Gemini box_2d format [ymin, xmin, ymax, xmax] normalized to 0-1000 where the error exists on the canvas. If the error is an omission in a specific expected quadrant, highlight that canvas region where it belongs.
   - Assign severity: 'major' (clinically fatal or upside-down/inverted topology) or 'minor' (proportional discrepancy, minor branch missing, slightly off label).
   - Write a clear clinical explanation of why the drawing is incorrect and a concrete, actionable "fix" instruction for how the student should redraw or alter it.
6. For correct items:
   - Identify correctly drawn landmarks with their bounding box_2d [ymin, xmin, ymax, xmax] (0-1000) and praise their anatomical accuracy.
7. Missing structures:
   - List any mandatory parts from the rubric that were completely omitted.
8. Label mistakes:
   - Identify any misplaced, misspelled, or reversed labels with their approximate box_2d.
9. Overall score:
   - Calculate an integer 0-100 reflecting anatomical accuracy, completeness of required parts, spatial alignment, and labels.`;

      const checkSchema = {
        type: Type.OBJECT,
        properties: {
          overallScore: {
            type: Type.INTEGER,
            description: 'Evaluation score from 0 to 100 based on anatomical accuracy, completeness, labels, and spatial orientation.',
          },
          summary: {
            type: Type.STRING,
            description: 'Concise 2-3 sentence clinical critique summarizing the drawing status and primary learning priority.',
          },
          correctItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: '[ymin, xmin, ymax, xmax] coordinates normalized 0-1000 bounding the correctly drawn structure on canvas.',
                },
              },
              required: ['id', 'name', 'description'],
            },
          },
          errors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER, description: 'Sequential 1-based error number' },
                label: { type: Type.STRING, description: 'Short title of the error (e.g. Aorta & Pulmonary Inversion)' },
                severity: { type: Type.STRING, description: "'major' or 'minor'" },
                explanation: { type: Type.STRING, description: 'What anatomical mistake was made and why it matters clinically.' },
                fix: { type: Type.STRING, description: 'Exact visual corrective instruction on what to redraw.' },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: '[ymin, xmin, ymax, xmax] coordinates normalized 0-1000 bounding where the error occurred on canvas.',
                },
              },
              required: ['id', 'label', 'severity', 'explanation', 'fix', 'box_2d'],
            },
          },
          missingStructures: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                importance: { type: Type.STRING },
                recommendation: { type: Type.STRING },
              },
              required: ['name', 'importance', 'recommendation'],
            },
          },
          labelMistakes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                critique: { type: Type.STRING },
                correctLabel: { type: Type.STRING },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                },
              },
              required: ['text', 'critique', 'correctLabel'],
            },
          },
        },
        required: ['overallScore', 'summary', 'correctItems', 'errors', 'missingStructures', 'labelMistakes'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64,
              },
            },
            {
              text: `Evaluate this student sketch of the ${rubric.name}. Return the structured JSON evaluation strictly obeying the response schema with 0-1000 normalized bounding boxes for errors, correct structures, and label mistakes.`,
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: checkSchema,
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      parsed.structureId = structureId;
      parsed.evaluatedAt = new Date().toISOString();

      res.json(parsed);
    } catch (err: any) {
      console.error('Error evaluating drawing:', err);
      res.status(500).json({
        error: 'Failed to evaluate drawing',
        message: err.message || 'Unknown error occurred during AI evaluation',
      });
    }
  });

  // API: Hint Ladder (Level 1 Socratic, Level 2 Regional, Level 3 Fix)
  app.post('/api/tutor/hint', async (req, res) => {
    try {
      const { imageBase64, structureId, hintLevel } = req.body;
      const level = Number(hintLevel) || 1;
      const rubric = getRubric(structureId);

      const levelGuidelines = {
        1: `LEVEL 1: Socratic Nudge Question.
- Formulate an inquisitive, thought-provoking question that prompts the student to inspect their own drawing.
- DO NOT reveal what is wrong or where the mistake is.
- DO NOT reveal anatomical labels or answers.
- Example: "When you trace the pathway of the great vessels exiting the base, which vessel should visually cross anterior to the other?"`,
        2: `LEVEL 2: Regional Pointer.
- Point to the specific quadrant or anatomical zone that is inaccurate or missing, WITHOUT revealing the exact solution.
- Guide their gaze to the region that needs work.
- Provide a normalized bounding box [ymin, xmin, ymax, xmax] 0-1000 surrounding that region on the canvas.
- Example: "Look closely at the superior outflow tract and the base of the heart above the ventricular septum."`,
        3: `LEVEL 3: Direct Specific Fix.
- State the explicit anatomical correction clearly and unambiguously.
- Tell the student exactly what stroke, structure, or label to redraw or relocate.
- Provide the bounding box [ymin, xmin, ymax, xmax] 0-1000 where the correction should be placed.
- Example: "The pulmonary trunk must emerge from the right ventricle and cross anteriorly over the ascending aorta from right to left before bifurcating."`,
      }[level as 1 | 2 | 3];

      const systemInstruction = `You are a medical anatomy tutor administering a 3-level Hint Ladder for a student drawing "${rubric.name}".
Current requested Hint Level: ${level}.

STRICT HINT RULES:
${levelGuidelines}

Rubric reference:
- Parts: ${JSON.stringify(rubric.requiredParts)}
- Spatial relationships: ${JSON.stringify(rubric.spatialRelationships)}
- Common mistakes: ${JSON.stringify(rubric.commonStudentMistakes)}

CRITICAL: NEVER reveal the full answer or fix at Level 1 or Level 2!`;

      const hintSchema = {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.INTEGER },
          type: { type: Type.STRING, description: "'socratic' for lvl 1, 'regional' for lvl 2, 'fix' for lvl 3" },
          title: { type: Type.STRING, description: 'Short punchy heading' },
          message: { type: Type.STRING, description: 'The hint text following the strict level rules.' },
          focusRegion: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: '[ymin, xmin, ymax, xmax] 0-1000 region of interest on the canvas, especially for level 2 and 3.',
          },
          targetedStructure: { type: Type.STRING, description: 'Name of the anatomy structure being addressed.' },
        },
        required: ['level', 'type', 'title', 'message'],
      };

      const parts: any[] = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: cleanBase64,
          },
        });
      }
      parts.push({
        text: `The student is drawing ${rubric.name} and requested a Level ${level} hint. Inspect the drawing if provided and produce the exact Level ${level} hint.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: hintSchema,
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error generating hint:', err);
      res.status(500).json({
        error: 'Failed to generate hint',
        message: err.message,
      });
    }
  });

  // API: Guide Me (Step-by-step drawing plan)
  app.post('/api/tutor/guide', (req, res) => {
    const { structureId } = req.body;
    const rubric = getRubric(structureId);
    res.json({
      structureId: rubric.id,
      structureName: rubric.name,
      steps: rubric.drawingPlan,
    });
  });

  // Setup Vite middlewares in development or static serve in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Anatomy Tutor server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
