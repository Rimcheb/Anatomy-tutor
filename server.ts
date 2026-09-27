import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import {
  GRADING_SYSTEM_INSTRUCTION,
  GRADING_RESPONSE_SCHEMA,
  LIVE_INSPECTION_SYSTEM_INSTRUCTION,
  LIVE_INSPECTION_RESPONSE_SCHEMA,
  HINTS_SYSTEM_INSTRUCTION,
  HINTS_RESPONSE_SCHEMA,
  GUIDANCE_SYSTEM_INSTRUCTION,
  GUIDANCE_RESPONSE_SCHEMA,
  LIVE_COACH_SYSTEM_INSTRUCTION,
  LIVE_COACH_RESPONSE_SCHEMA,
} from './src/prompts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Read injected Gemini API key
const apiKey = process.env.GEMINI_API_KEY?.trim() || '';

// Load rubrics JSON
const rubricsPath = path.join(__dirname, 'src', 'data', 'rubrics.json');
let rubricsData: Record<string, any> = {};

try {
  const fileContent = fs.readFileSync(rubricsPath, 'utf-8');
  rubricsData = JSON.parse(fileContent);
} catch (e) {
  console.error('Failed to read rubrics.json:', e);
}

function getRubric(structureId: string) {
  return rubricsData[structureId] || rubricsData['heart-anterior'] || {};
}

// In-memory cache for the compressed 1024px reference image (loaded ONCE at startup)
let cachedReferenceImagePart: { inlineData: { mimeType: string; data: string } } | null = null;

async function initReferenceImage() {
  const filePath = path.join(__dirname, 'public', 'references', 'heart_anterior.jpg');
  if (fs.existsSync(filePath)) {
    try {
      const buffer = await sharp(filePath)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      cachedReferenceImagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: buffer.toString('base64'),
        },
      };
      console.log(`Reference figure pre-compressed at startup: ${Math.round(buffer.length / 1024)} KB`);
    } catch (e) {
      console.error('Failed to compress reference image with sharp:', e);
    }
  }
}

async function startServer() {
  await initReferenceImage();

  const app = express();
  app.use(express.json({ limit: '35mb' }));

  // API: Get Structures
  app.get('/api/tutor/structures', (_req, res) => {
    const referencesJsonPath = path.join(__dirname, 'public', 'references', 'references.json');
    let refs: any[] = [];
    try {
      refs = JSON.parse(fs.readFileSync(referencesJsonPath, 'utf-8'));
    } catch {}

    const structureList = [
      {
        id: 'heart-anterior',
        name: 'Heart – anterior view',
        difficulty: 'Intermediate',
        category: 'Cardiovascular',
        promptText: 'Draw the heart, anterior view. Label the 4 chambers, the great vessels and the valves.',
        comingSoon: false,
        reference: refs.find((r) => r.structure === 'Heart – anterior view'),
      },
      {
        id: 'nephron',
        name: 'Nephron',
        difficulty: 'Intermediate',
        category: 'Renal',
        promptText: 'Draw a single nephron with Bowman\'s capsule, glomerulus, proximal convoluted tubule, loop of Henle, distal convoluted tubule, and collecting duct.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Nephron'),
      },
      {
        id: 'brachial-plexus',
        name: 'Brachial Plexus',
        difficulty: 'Advanced',
        category: 'Neuroanatomy',
        promptText: 'Draw the brachial plexus from Roots (C5-T1) through Trunks, Divisions, Cords, and Terminal Branches.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Brachial Plexus'),
      },
      {
        id: 'neuron',
        name: 'Neuron',
        difficulty: 'Beginner',
        category: 'Histology / Neuro',
        promptText: 'Draw a multipolar motor neuron with soma, dendrites, axon hillock, myelinated axon with Schwann cells, nodes of Ranvier, and axon terminals.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Neuron'),
      },
      {
        id: 'knee-joint',
        name: 'Knee joint – sagittal',
        difficulty: 'Intermediate',
        category: 'Musculoskeletal',
        promptText: 'Draw a sagittal view of the knee joint with distal femur, proximal tibia, patella, patellar tendon, ACL, PCL, and meniscus.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Knee joint – sagittal'),
      },
    ];

    res.json(structureList);
  });

  // API: Get References
  app.get('/api/tutor/references', (_req, res) => {
    const referencesJsonPath = path.join(__dirname, 'public', 'references', 'references.json');
    try {
      const data = JSON.parse(fs.readFileSync(referencesJsonPath, 'utf-8'));
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to read references.json' });
    }
  });

  // API: Live Inspection (Periodically inspects unfinished drawing while student sketches)
  // Real Gemini inference only — NO demo shortcuts, NO fake results
  app.post('/api/tutor/live-inspect', async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.json({ status: 'on_track', message: 'Canvas ready for drawing' });
    }

    if (!apiKey) {
      return res.status(502).json({
        error: 'API Key Missing',
        reason: 'Gemini API key is not configured in process.env.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

    try {
      const ai = new GoogleGenAI({ apiKey });
      const promptText = LIVE_INSPECTION_SYSTEM_INSTRUCTION
        .replace('⟦STRUCTURE⟧', 'Heart – anterior view');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { inlineData: { mimeType, data: cleanBase64 } },
          promptText,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: LIVE_INSPECTION_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini live inspection call failed:', err.message || err);
      return res.status(502).json({
        error: 'Live inspection unavailable',
        reason: err.message || 'Gemini service error',
      });
    }
  });

  // API: Check My Drawing (sends Image 1 reference + Image 2 student drawing to Gemini)
  // Real Gemini inference only — NO demo shortcuts, NO canned 74 evaluation
  app.post('/api/tutor/check', async (req, res) => {
    const { imageBase64, structureId } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Canvas image data is required' });
    }

    if (!apiKey) {
      return res.status(502).json({
        error: 'API Key Missing',
        reason: 'Gemini API key is not configured in process.env.',
      });
    }

    const targetStructureId = structureId || 'heart-anterior';
    const rubric = getRubric(targetStructureId);
    const cleanStudentBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const studentMimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptText = GRADING_SYSTEM_INSTRUCTION
        .replace('⟦STRUCTURE⟧', rubric.structure_name || 'Heart – anterior view')
        .replace('⟦RUBRIC⟧', JSON.stringify(rubric));

      const contents: any[] = [];

      // Image 1: Pre-compressed 1024px expert reference figure (loaded once at startup)
      if (cachedReferenceImagePart) {
        contents.push(cachedReferenceImagePart);
      }

      // Image 2: Student's drawing (downscaled to max 1024px before sending)
      contents.push({
        inlineData: {
          mimeType: studentMimeType,
          data: cleanStudentBase64,
        },
      });

      // Prompt
      contents.push(promptText);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: GRADING_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      parsed.structureId = targetStructureId;
      parsed.overallScore = parsed.score ?? 0;
      parsed.correctItems = (parsed.correct || []).map((c: any, i: number) => ({
        id: `c_${i + 1}`,
        name: c.item,
        item: c.item,
        description: 'Accurately depicted based on reference figure.',
        box_2d: c.box_2d,
      }));
      parsed.errors = (parsed.errors || []).map((e: any) => ({
        id: e.id,
        label: e.what_is_wrong,
        type: e.type,
        severity: e.severity,
        what_is_wrong: e.what_is_wrong,
        why_it_matters: e.why_it_matters,
        how_to_fix: e.how_to_fix,
        explanation: e.what_is_wrong,
        fix: e.how_to_fix,
        box_2d: e.box_2d,
      }));
      parsed.evaluatedAt = new Date().toISOString();
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini grading call failed:', err.message || err);
      return res.status(502).json({
        error: 'Faculty grading failed',
        reason: err.message || 'Gemini service unavailable',
      });
    }
  });

  // API: Hint Ladder (Socratic level 1, Regional level 2, Specific Fix level 3)
  // Real Gemini inference only — NO canned hints
  app.post('/api/tutor/hint', async (req, res) => {
    const { imageBase64, structureId, hintLevel } = req.body;
    const targetStructureId = structureId || 'heart-anterior';
    const level = (Number(hintLevel) || 1) as 1 | 2 | 3;
    const rubric = getRubric(targetStructureId);

    if (!apiKey) {
      return res.status(502).json({
        error: 'API Key Missing',
        reason: 'Gemini API key is not configured in process.env.',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptText = HINTS_SYSTEM_INSTRUCTION
        .replace('⟦STRUCTURE⟧', rubric.structure_name || 'Heart – anterior view')
        .replace('⟦RUBRIC⟧', JSON.stringify(rubric))
        .replace('⟦LEVEL⟧', String(level));

      const contents: any[] = [];
      if (imageBase64) {
        const cleanStudentBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const mime = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
        contents.push({
          inlineData: { mimeType: mime, data: cleanStudentBase64 },
        });
      }
      contents.push(promptText);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: HINTS_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      parsed.message = parsed.hint;
      parsed.focusRegion = parsed.box_2d;
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini hint call failed:', err.message || err);
      return res.status(502).json({
        error: 'Hint service unavailable',
        reason: err.message || 'Gemini service error',
      });
    }
  });

  // API: Guide Me (Whiteboard Drawing Plan)
  app.post('/api/tutor/guidance', async (req, res) => {
    const { structureId, imageBase64 } = req.body;
    const targetStructureId = structureId || 'heart-anterior';
    const rubric = getRubric(targetStructureId);

    if (!apiKey) {
      return res.status(502).json({
        error: 'API Key Missing',
        reason: 'Gemini API key is not configured in process.env.',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptText = GUIDANCE_SYSTEM_INSTRUCTION
        .replace('⟦STRUCTURE⟧', rubric.structure_name || 'Heart – anterior view');

      const contents: any[] = [];
      if (cachedReferenceImagePart) {
        contents.push(cachedReferenceImagePart);
      }
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const mime = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
        contents.push({ inlineData: { mimeType: mime, data: cleanBase64 } });
      }
      contents.push(promptText);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: GUIDANCE_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini guidance call failed:', err.message || err);
      return res.status(502).json({
        error: 'Guidance service unavailable',
        reason: err.message || 'Gemini service error',
      });
    }
  });

  // API: Live Coach (Evaluates single step)
  app.post('/api/tutor/step-coach', async (req, res) => {
    const { stepNumber, stepInstruction, imageBase64 } = req.body;
    if (!imageBase64) {
      return res.json({ step_complete: false, feedback: 'Please sketch this step on the canvas first.' });
    }

    if (!apiKey) {
      return res.status(502).json({
        error: 'API Key Missing',
        reason: 'Gemini API key is not configured in process.env.',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mime = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

      const promptText = LIVE_COACH_SYSTEM_INSTRUCTION
        .replace('⟦N⟧', String(stepNumber || 1))
        .replace('⟦STEP⟧', stepInstruction || '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { inlineData: { mimeType: mime, data: cleanBase64 } },
          promptText,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: LIVE_COACH_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Step coach failed:', err.message || err);
      return res.status(502).json({
        error: 'Step coach unavailable',
        reason: err.message || 'Gemini service error',
      });
    }
  });

  // Mount Vite middleware in development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Anatomy Tutor server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
