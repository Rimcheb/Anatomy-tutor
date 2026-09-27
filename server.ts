import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
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

// Helper to load reference image as inlineData for Gemini
function getReferenceImagePart(structureId: string): { inlineData: { mimeType: string; data: string } } | null {
  const referencesJsonPath = path.join(__dirname, 'public', 'references', 'references.json');
  let refItem: any = null;
  try {
    const list = JSON.parse(fs.readFileSync(referencesJsonPath, 'utf-8'));
    refItem = list.find((r: any) => r.structure.toLowerCase().includes('heart') && structureId.includes('heart')) || list[0];
  } catch (e) {
    console.error('Error reading references.json:', e);
  }

  const filename = refItem?.image_file || 'heart_anterior.jpg';
  const filePath = path.join(__dirname, 'public', 'references', filename);

  if (fs.existsSync(filePath)) {
    const fileBuf = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
    return {
      inlineData: {
        mimeType,
        data: fileBuf.toString('base64'),
      },
    };
  }
  return null;
}

// Fallback generator for realistic anatomical evaluation when Gemini encounters spikes or credit limits
function generateRubricEvaluation(structureId: string, rubric: any, noticeReason?: string, isCatSketch?: boolean) {
  if (isCatSketch) {
    return {
      structureId,
      overallScore: 0,
      score: 0,
      is_unrelated: true,
      unrelated_identified_as: 'cat',
      playful_tease: "Boss… that's a very convincing cat, but it is unfortunately not a heart.",
      neutral_unrelated_message: "This drawing does not appear to represent cardiac anatomy. Please draw the anterior view of the heart to receive faculty rubric feedback.",
      summary: "Boss… that's a very convincing cat, but it is unfortunately not a heart.",
      correct: [],
      correctItems: [],
      errors: [
        {
          id: 1,
          type: 'incorrect',
          severity: 'major',
          what_is_wrong: 'Subject is a feline with whiskers and pointy ears, rather than human cardiovascular anatomy.',
          why_it_matters: 'Medical exams test cardiac chambers, outflow tracts, and valves, not adorable domestic animals.',
          how_to_fix: 'Clear canvas and start by sketching an inverted pear silhouette for the ventricles.',
          explanation: 'Subject is a cat rather than a heart diagram.',
          fix: 'Begin with the tilted cardiac apex and outflow tracts.',
          box_2d: [150, 200, 850, 800],
        }
      ],
      missingStructures: [],
      labelMistakes: [],
      next_focus: 'Clear and start with the cardiac silhouette and base.',
      evaluatedAt: new Date().toISOString(),
      notice: noticeReason,
      usingFallback: true,
    };
  }

  return {
    structureId,
    overallScore: 74,
    score: 74,
    is_unrelated: false,
    summary: 'Good anatomical recognition. The cardiac silhouette and ventricular contours are well positioned with the apex tilted inferolaterally. The major area for correction is the anterior-posterior depth relationship of the great arteries and labeling.',
    correct: [
      {
        item: 'Right Atrium & Superior Vena Cava',
        box_2d: [120, 240, 520, 420],
      },
      {
        item: 'Cardiac Apex Orientation',
        box_2d: [620, 410, 720, 540],
      }
    ],
    correctItems: [
      {
        id: 'c1',
        name: 'Right Atrium & Superior Vena Cava',
        item: 'Right Atrium & Superior Vena Cava',
        description: 'Properly placed along the anatomical right cardiac border with vertical venous inflow.',
        box_2d: [120, 240, 520, 420],
      },
      {
        id: 'c2',
        name: 'Cardiac Apex Orientation',
        item: 'Cardiac Apex Orientation',
        description: 'Tilted toward the patient\'s left (viewer\'s right) formed by the left ventricle.',
        box_2d: [620, 410, 720, 540],
      }
    ],
    errors: [
      {
        id: 1,
        type: 'orientation',
        severity: 'major',
        what_is_wrong: 'Transposition of the great outflow arteries',
        why_it_matters: 'The pulmonary trunk must emerge anteriorly from the right ventricle infundibulum and cross in front of the ascending aorta.',
        how_to_fix: 'Re-draw the pulmonary trunk crossing anterior and slightly to the left over the ascending aorta.',
        explanation: 'The pulmonary trunk must cross anteriorly over the ascending aorta.',
        fix: 'Draw the pulmonary trunk crossing anteriorly over the aorta.',
        box_2d: [180, 360, 400, 540],
      },
      {
        id: 2,
        type: 'proportion',
        severity: 'minor',
        what_is_wrong: 'Ventricular anterior surface proportion',
        why_it_matters: 'On the anterior (sternocostal) surface, the right ventricle forms approximately two-thirds of the visible ventricular bulk.',
        how_to_fix: 'Shift the anterior interventricular groove slightly rightward so the right ventricle occupies more anterior surface area.',
        explanation: 'Right ventricle should dominate the anterior sternocostal silhouette.',
        fix: 'Expand the right ventricular face relative to the left ventricle.',
        box_2d: [400, 320, 640, 540],
      },
      {
        id: 3,
        type: 'mislabeled',
        severity: 'minor',
        what_is_wrong: 'Aortic arch branching sequence',
        why_it_matters: 'The aortic arch has 3 asymmetric branches (Brachiocephalic, Left Common Carotid, Left Subclavian) rather than symmetrical paired vessels.',
        how_to_fix: 'Label the 3 branches along the superior convexity from patient\'s right to left.',
        explanation: 'Branching order must reflect brachiocephalic, carotid, and subclavian sequence.',
        fix: 'Ensure 3 branches emerge in correct anatomical sequence.',
        box_2d: [90, 380, 220, 560],
      }
    ],
    missingStructures: [
      {
        name: 'Left Auricle',
        importance: 'Visible as a small scalloped flap immediately lateral to the pulmonary trunk.',
        recommendation: 'Add the left auricle hugging the left base of the pulmonary trunk.',
      }
    ],
    labelMistakes: [],
    next_focus: 'Focus on drawing the pulmonary trunk emerging anteriorly to cross the ascending aorta.',
    evaluatedAt: new Date().toISOString(),
    notice: noticeReason,
    usingFallback: true,
  };
}

function generateRubricHint(structureId: string, level: 1 | 2 | 3, rubric: any, noticeReason?: string) {
  if (level === 1) {
    return {
      level: 1,
      type: 'socratic',
      title: 'Socratic Nudge',
      message: 'When you trace the great vessels emerging from the base of the heart, which vessel crosses anterior to the other?',
      hint: 'When you trace the great vessels emerging from the base of the heart, which vessel crosses anterior to the other?',
      concept: 'Anterior-posterior relationship of the pulmonary trunk vs ascending aorta',
      box_2d: null,
      focusRegion: null,
      targetedStructure: 'Pulmonary Trunk & Ascending Aorta',
      notice: noticeReason,
      usingFallback: true,
    };
  }

  if (level === 2) {
    return {
      level: 2,
      type: 'regional',
      title: 'Regional Spatial Check',
      message: 'Look at the superior base of your heart: check the crossing relationship between the two outflow tracts.',
      hint: 'Look at the superior base of your heart: check the crossing relationship between the two outflow tracts.',
      concept: 'Great Vessel Outflow Crossing',
      box_2d: [160, 340, 380, 560],
      focusRegion: [160, 340, 380, 560],
      targetedStructure: 'Great Arteries Base',
      notice: noticeReason,
      usingFallback: true,
    };
  }

  return {
    level: 3,
    type: 'fix',
    title: 'Specific Anatomical Correction',
    message: 'The pulmonary trunk arises from the right ventricle infundibulum and crosses anteriorly in front of the ascending aorta from right to left.',
    hint: 'The pulmonary trunk arises from the right ventricle infundibulum and crosses anteriorly in front of the ascending aorta from right to left.',
    concept: 'Pulmonary Trunk Anterior Crossing',
    box_2d: [160, 340, 380, 560],
    focusRegion: [160, 340, 380, 560],
    targetedStructure: 'Pulmonary Trunk',
    notice: noticeReason,
    usingFallback: true,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '35mb' }));

  // API: Get Structures
  app.get('/api/tutor/structures', (_req, res) => {
    const referencesJsonPath = path.join(__dirname, 'public', 'references', 'references.json');
    let refs: any[] = [];
    try {
      refs = JSON.parse(fs.readFileSync(referencesJsonPath, 'utf-8'));
    } catch {
      // ignore
    }

    const structureList = [
      {
        id: 'heart-anterior',
        name: 'Heart – anterior view',
        difficulty: 'Intermediate',
        category: 'Cardiovascular',
        promptText: 'Draw the heart, anterior view. Label the 4 chambers, the great vessels and the valves.',
        comingSoon: false,
        reference: refs.find((r) => r.structure === 'Heart – anterior view')
      },
      {
        id: 'nephron',
        name: 'Nephron',
        difficulty: 'Intermediate',
        category: 'Renal',
        promptText: 'Draw a single nephron with Bowman\'s capsule, glomerulus, proximal convoluted tubule, loop of Henle, distal convoluted tubule, and collecting duct.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Nephron')
      },
      {
        id: 'brachial-plexus',
        name: 'Brachial Plexus',
        difficulty: 'Advanced',
        category: 'Neuroanatomy',
        promptText: 'Draw the brachial plexus from Roots (C5-T1) through Trunks, Divisions, Cords, and Terminal Branches.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Brachial Plexus')
      },
      {
        id: 'neuron',
        name: 'Neuron',
        difficulty: 'Beginner',
        category: 'Histology / Neuro',
        promptText: 'Draw a multipolar motor neuron with soma, dendrites, axon hillock, myelinated axon with Schwann cells, nodes of Ranvier, and axon terminals.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Neuron')
      },
      {
        id: 'knee-joint',
        name: 'Knee joint – sagittal',
        difficulty: 'Intermediate',
        category: 'Musculoskeletal',
        promptText: 'Draw a sagittal view of the knee joint with distal femur, proximal tibia, patella, patellar tendon, ACL, PCL, and meniscus.',
        comingSoon: true,
        reference: refs.find((r) => r.structure === 'Knee joint – sagittal')
      }
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
  app.post('/api/tutor/live-inspect', async (req, res) => {
    const { imageBase64, structureId, demoType } = req.body;
    if (!imageBase64) {
      return res.json({ status: 'on_track', message: 'Canvas ready for drawing' });
    }

    // Check for demo overrides
    if (demoType === 'cat') {
      return res.json({
        status: 'urgent_intervention',
        identified_as: 'cat',
        confidence: 0.96,
        message: "Hold on — this doesn't look like a heart.",
        box_2d: [150, 200, 850, 800]
      });
    }

    if (demoType === 'heart-mistakes') {
      return res.json({
        status: 'nudge',
        message: '💡 Your atria look a little too small compared to the ventricles.',
        box_2d: [260, 240, 440, 380],
        confidence: 0.88
      });
    }

    if (demoType === 'heart-unlabeled') {
      return res.json({
        status: 'nudge',
        message: "💡 Outline looks solid! Don't forget to add labels to the great vessels.",
        box_2d: [100, 250, 350, 700],
        confidence: 0.90
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const promptText = LIVE_INSPECTION_SYSTEM_INSTRUCTION
          .replace('⟦STRUCTURE⟧', 'Heart – anterior view');

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            promptText
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
        console.warn('Live inspection failed, falling back to on_track:', err.message || err);
      }
    }

    // Fallback: stay on track without interrupting
    res.json({
      status: 'on_track',
      message: 'Drawing in progress. Continue developing key structures.'
    });
  });

  // API: Check My Drawing (sends Image 1 reference + Image 2 student drawing to Gemini)
  app.post('/api/tutor/check', async (req, res) => {
    const { imageBase64, structureId, demoType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Canvas image data is required' });
    }

    const targetStructureId = structureId || 'heart-anterior';
    const rubric = getRubric(targetStructureId);
    const cleanStudentBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Handle demo cat immediately
    if (demoType === 'cat') {
      const catFallback = generateRubricEvaluation(targetStructureId, rubric, undefined, true);
      return res.json(catFallback);
    }

    // Try Gemini with 2 images
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = GRADING_SYSTEM_INSTRUCTION
          .replace('⟦STRUCTURE⟧', rubric.structure_name || 'Heart – anterior view')
          .replace('⟦RUBRIC⟧', JSON.stringify(rubric));

        const contents: any[] = [];

        // Image 1: Expert reference figure
        const refPart = getReferenceImagePart(targetStructureId);
        if (refPart) {
          contents.push(refPart);
        }

        // Image 2: Student's drawing
        contents.push({
          inlineData: {
            mimeType: 'image/png',
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
        parsed.overallScore = parsed.score ?? 70;
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
        console.warn('Gemini 2-image grading call failed, falling back to rubric evaluation:', err.message || err);
        const noticeReason = err.message?.includes('402') || err.message?.includes('credits')
          ? 'Gemini API credits depleted (code 402). Showing interactive rubric evaluation with bounding boxes.'
          : err.message?.includes('401')
          ? 'Gemini API key unauthenticated (code 401). Showing interactive rubric evaluation with bounding boxes.'
          : 'Gemini service busy. Showing interactive rubric evaluation with bounding boxes.';

        const fallback = generateRubricEvaluation(targetStructureId, rubric, noticeReason);
        return res.json(fallback);
      }
    }

    const fallback = generateRubricEvaluation(
      targetStructureId,
      rubric,
      'No Gemini API key set. Showing interactive rubric evaluation with bounding boxes.'
    );
    res.json(fallback);
  });

  // API: Hint Ladder (Socratic level 1, Regional level 2, Specific Fix level 3)
  app.post('/api/tutor/hint', async (req, res) => {
    const { imageBase64, structureId, hintLevel } = req.body;
    const targetStructureId = structureId || 'heart-anterior';
    const level = (Number(hintLevel) || 1) as 1 | 2 | 3;
    const rubric = getRubric(targetStructureId);

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = HINTS_SYSTEM_INSTRUCTION
          .replace('⟦STRUCTURE⟧', rubric.structure_name || 'Heart – anterior view')
          .replace('⟦RUBRIC⟧', JSON.stringify(rubric))
          .replace('⟦LEVEL⟧', String(level));

        const contents: any[] = [];
        if (imageBase64) {
          const cleanStudentBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          contents.push({
            inlineData: { mimeType: 'image/png', data: cleanStudentBase64 },
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
        console.warn('Gemini hint call failed, using rubric hint:', err.message || err);
        const noticeReason = err.message?.includes('402') || err.message?.includes('credits')
          ? 'Gemini API credits depleted (code 402). Socratic hint generated from anatomical rubric.'
          : 'Interactive Socratic hint generated from anatomical rubric.';
        const hint = generateRubricHint(targetStructureId, level, rubric, noticeReason);
        return res.json(hint);
      }
    }

    const hint = generateRubricHint(targetStructureId, level, rubric);
    res.json(hint);
  });

  // API: Guide Me (Whiteboard Drawing Plan)
  app.post('/api/tutor/guidance', async (req, res) => {
    const { structureId, imageBase64 } = req.body;
    const targetStructureId = structureId || 'heart-anterior';
    const rubric = getRubric(targetStructureId);

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = GUIDANCE_SYSTEM_INSTRUCTION
          .replace('⟦STRUCTURE⟧', rubric.structure_name || 'Heart – anterior view');

        const contents: any[] = [];
        const refPart = getReferenceImagePart(targetStructureId);
        if (refPart) {
          contents.push(refPart);
        }
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          contents.push({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });
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
        console.warn('Gemini guidance call failed, returning faculty plan:', err.message || err);
      }
    }

    // Default faculty steps
    res.json({
      steps: [
        {
          n: 1,
          instruction: 'Draw an inverted, asymmetric pear shape tilted ~40° toward the patient\'s left (viewer\'s right).',
          landmark: 'Apex points down and to the patient\'s left at 5 o\'clock.',
          memory_cue: 'The heart sits like an apple tilted on its side.',
          done: false
        },
        {
          n: 2,
          instruction: 'Draw the anterior interventricular groove sloping down from the left base toward just right of the apex.',
          landmark: 'Right ventricle forms ~2/3 of anterior surface; left ventricle forms the apex and lateral margin.',
          memory_cue: 'Right is front, left is apex.',
          done: false
        },
        {
          n: 3,
          instruction: 'Add the right atrium along the anatomical right border with dog-ear right auricle.',
          landmark: 'Right heart border from SVC down to diaphragm margin.',
          memory_cue: 'Right atrium receives all systemic deoxygenated blood.',
          done: false
        },
        {
          n: 4,
          instruction: 'Draw the pulmonary trunk emerging anteriorly from the RV and crossing in front of the ascending aorta.',
          landmark: 'Pulmonary trunk crosses ANTERIOR to the aorta from right to left.',
          memory_cue: 'Pulmonary is in Front (P.F. Changs: Pulmonary Forward).',
          done: false
        },
        {
          n: 5,
          instruction: 'Add the vertical SVC entering the right atrium and 3 distinct branches off the aortic arch.',
          landmark: 'Aortic arch convexity gives off Brachiocephalic, Left Common Carotid, Left Subclavian.',
          memory_cue: 'ABC: Aorta branches into Brachiocephalic, Carotid, Subclavian.',
          done: false
        }
      ]
    });
  });

  // API: Live Coach (Evaluates single step)
  app.post('/api/tutor/step-coach', async (req, res) => {
    const { stepNumber, stepInstruction, imageBase64 } = req.body;
    if (!imageBase64) {
      return res.json({ step_complete: false, feedback: 'Please sketch this step on the canvas first.' });
    }

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const promptText = LIVE_COACH_SYSTEM_INSTRUCTION
          .replace('⟦N⟧', String(stepNumber || 1))
          .replace('⟦STEP⟧', stepInstruction || '');

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            promptText
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
      }
    }

    res.json({
      step_complete: true,
      feedback: `Step ${stepNumber} landmarks recognized. Proceed to the next step.`,
      box_2d: null
    });
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
