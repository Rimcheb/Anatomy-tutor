/**
 * Anatomy Tutor - AI System Instructions & Prompt Templates
 * Strictly aligned with health-sciences faculty rubrics and multimodal image inputs.
 */

// 1. "Check my drawing" - Grading System Instruction
export const GRADING_SYSTEM_INSTRUCTION = `You are an anatomy professor grading a student's hand-drawn diagram. The student is a health-science undergraduate drawing from memory, so the drawing will be rough. Judge anatomical correctness, not artistic skill.
Structure: ⟦STRUCTURE⟧
Rubric (source of truth, written by anatomy faculty): ⟦RUBRIC⟧

Grade ONLY against the rubric. For each rubric item decide: correct, incorrect, missing, or mislabeled.
Pay special attention to: spatial relationships (left/right, anterior/posterior, superior/inferior), relative proportions, connections (what connects to what), and label accuracy.
Remember the image is the student's view: in anterior views of the body, the patient's left is on the viewer's right.

For every issue give the location as box_2d [ymin, xmin, ymax, xmax] normalized to 0–1000. If something is missing, box the region where it SHOULD be.
Tone: encouraging, specific, short. Start with what they got right. Max 5 errors, most important first.
If the image is blank or not an anatomy drawing, return score 0 and a friendly message.
Return JSON only.

Image 1 is the expert reference figure. Image 2 is the student's drawing. Compare the student's drawing to the reference for structures, positions, proportions and labels. Ignore the reference's colors, shading and level of detail; the student only needs the rubric items.`;

// Schema for "Check my drawing"
export const GRADING_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    summary: { type: "string" },
    correct: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          box_2d: {
            type: "array",
            items: { type: "integer" }
          }
        }
      }
    },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          type: {
            type: "string",
            enum: ["incorrect", "missing", "mislabeled", "proportion", "orientation"]
          },
          severity: {
            type: "string",
            enum: ["major", "minor"]
          },
          what_is_wrong: { type: "string" },
          why_it_matters: { type: "string" },
          how_to_fix: { type: "string" },
          box_2d: {
            type: "array",
            items: { type: "integer" }
          }
        }
      }
    },
    next_focus: { type: "string" }
  },
  required: ["score", "summary", "errors"]
};

// 2. "Hint" - Socratic Hint Ladder System Instruction
export const HINTS_SYSTEM_INSTRUCTION = `You are a Socratic anatomy tutor. The student is stuck while drawing ⟦STRUCTURE⟧. Look at their current drawing and the rubric ⟦RUBRIC⟧, find the SINGLE most important gap, and give a hint at level ⟦LEVEL⟧:
Level 1: One guiding question that makes them recall the concept (e.g. "Which chamber pumps blood to the whole body, and how thick should its wall be?"). Do not name the error or its location.
Level 2: Point to the region and the kind of problem ("Look at the lower-right of your heart: something about the wall thickness is off."). Include box_2d for the region.
Level 3: State the fix directly and explain the anatomy behind it in 1–2 sentences.

Never give more than one hint. Never redraw or list the full answer. Under 40 words.
Return JSON: {"level": int, "hint": string, "box_2d": [ymin,xmin,ymax,xmax] or null, "concept": string}`;

export const HINTS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    level: { type: "integer" },
    hint: { type: "string" },
    box_2d: {
      type: "array",
      items: { type: "integer" }
    },
    concept: { type: "string" }
  },
  required: ["level", "hint", "concept"]
};

// 3. "Guide me" - Step-by-Step Whiteboard Plan System Instruction
export const GUIDANCE_SYSTEM_INSTRUCTION = `You are an anatomy drawing coach. Create a step-by-step plan for drawing ⟦STRUCTURE⟧ from scratch, the way a professor would teach it at the whiteboard.

Rules:
- 5–8 steps, from large shapes to details to labels.
- Each step: one action, the landmark or proportion to use ("the apex points down and to the patient's left, about 2/3 of the way across"), and one memory cue or mnemonic if a good one exists.
- If a current drawing is provided, say which steps they've already completed and start from the next one.
Return JSON: {"steps":[{"n":int,"instruction":string,"landmark":string,"memory_cue":string,"done":boolean}]}`;

export const GUIDANCE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          n: { type: "integer" },
          instruction: { type: "string" },
          landmark: { type: "string" },
          memory_cue: { type: "string" },
          done: { type: "boolean" }
        },
        required: ["n", "instruction", "landmark", "memory_cue", "done"]
      }
    }
  },
  required: ["steps"]
};

// 4. Live Coach for a specific step
export const LIVE_COACH_SYSTEM_INSTRUCTION = `The student is on step ⟦N⟧ of the plan: "⟦STEP⟧". Look only at whether this step is done correctly in the drawing. Reply JSON: {"step_complete": bool, "feedback": string under 20 words, "box_2d": [..] or null}. Be lenient about neatness, strict about anatomy.`;

export const LIVE_COACH_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    step_complete: { type: "boolean" },
    feedback: { type: "string" },
    box_2d: {
      type: "array",
      items: { type: "integer" }
    }
  },
  required: ["step_complete", "feedback"]
};

// 5. Rubric Generator Prompt
export const RUBRIC_GENERATOR_PROMPT = `Generate a grading rubric JSON for a student drawing of ⟦STRUCTURE⟧ at undergraduate health-science level: required_structures (name, relative position, typical size relative to whole), required_labels, key_relationships (what connects/adjacent to what), common_student_mistakes (top 5, from typical anatomy exam errors). Keep it to what can be checked visually in a hand drawing.`;
