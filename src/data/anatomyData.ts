import heartRubricsData from './rubrics.json';
import referencesData from '../../public/references/references.json';
import { AnatomyStructure, ReferenceItem } from '../types/tutor';

export const REFERENCES_LIST: ReferenceItem[] = referencesData as ReferenceItem[];

const heartRubric = (heartRubricsData as any)['heart-anterior'];

export const ANATOMY_STRUCTURES: AnatomyStructure[] = [
  {
    id: 'heart-anterior',
    name: 'Heart – anterior view',
    difficulty: 'Intermediate',
    category: 'Cardiovascular',
    promptText: heartRubric.prompt || 'Draw the heart, anterior view. Label the 4 chambers, the great vessels and the valves.',
    clinicalContext: heartRubric.clinical_context,
    comingSoon: false,
    requiredParts: heartRubric.required_structures.map((s: any) => `${s.name} (${s.relative_position})`),
    requiredLabels: heartRubric.required_labels,
    spatialRelationships: heartRubric.key_relationships.map((r: any) => `${r.structure_pair}: ${r.relationship_description}`),
    commonStudentMistakes: heartRubric.common_student_mistakes.map((m: any) => `${m.error_description}: ${m.visual_sign}`),
    drawingPlan: [
      {
        stepNumber: 1,
        title: 'Cardiac Silhouette & Tilt',
        instruction: 'Draw an inverted, asymmetric pear shape tilted ~40° toward the patient\'s left (viewer\'s right).',
        landmarks: 'Base aligns horizontally superiorly; apex points inferolaterally toward 5 o\'clock.',
        proportionsTip: 'Width is approximately 2/3 of the height; apex sits well to the left of the midline.',
        keyParts: ['Cardiac contour', 'Apex orientation']
      },
      {
        stepNumber: 2,
        title: 'Anterior Sulcus & Ventricular Partition',
        instruction: 'Draw the anterior interventricular groove sloping down from the left of the base toward just right of the apex.',
        landmarks: 'Separates the right ventricle (dominates ~2/3 of anterior face) from the left ventricle (lateral strip + apex).',
        proportionsTip: 'Do not divide vertically down the middle; RV must take majority of front surface.',
        keyParts: ['Right Ventricle', 'Left Ventricle', 'Anterior Interventricular Sulcus']
      },
      {
        stepNumber: 3,
        title: 'Right Atrium & Auricles',
        instruction: 'Add the smooth right atrium along the anatomical right border, with the dog-ear shaped right auricle projecting medially.',
        landmarks: 'Right heart border from superior vena cava down to diaphragm margin.',
        proportionsTip: 'The right atrium forms the entire right heart border on an anterior radiograph.',
        keyParts: ['Right Atrium', 'Right Auricle', 'Left Auricle']
      },
      {
        stepNumber: 4,
        title: 'Great Outflow Vessels (Cross Rule)',
        instruction: 'Draw the pulmonary trunk emerging anteriorly from the RV infundibulum and crossing diagonally over the ascending aorta.',
        landmarks: 'Pulmonary trunk is ANTERIOR and to the left of the ascending aorta at the base.',
        proportionsTip: 'Aorta arches up and over to the patient\'s left behind the pulmonary bifurcation.',
        keyParts: ['Pulmonary Trunk', 'Ascending Aorta', 'Aortic Arch']
      },
      {
        stepNumber: 5,
        title: 'Vena Cava & Arch Branches',
        instruction: 'Sketch the vertical Superior Vena Cava entering the right atrium, and 3 branches off the aortic arch in order.',
        landmarks: 'SVC on anatomical right lateral to aorta; arch gives off Brachiocephalic, Left Common Carotid, Left Subclavian.',
        proportionsTip: '3 distinct arch arteries from right to left; never draw symmetrical paired trunks off the arch.',
        keyParts: ['SVC', 'Brachiocephalic Trunk', 'Left Common Carotid', 'Left Subclavian']
      },
      {
        stepNumber: 6,
        title: 'Anatomical Labels',
        instruction: 'Label the 4 chambers, great vessels, sulcus, and apex using clear callout leader lines.',
        landmarks: 'Ensure patient\'s left is clearly labeled on the viewer\'s right.',
        proportionsTip: 'Keep leader lines straight and non-overlapping.',
        keyParts: ['Chamber labels', 'Vessel labels', 'Orientation note']
      }
    ],
    reference: REFERENCES_LIST.find((r) => r.structure === 'Heart – anterior view')
  },
  {
    id: 'nephron',
    name: 'Nephron',
    difficulty: 'Intermediate',
    category: 'Renal',
    promptText: 'Draw a single nephron with Bowman\'s capsule, glomerulus, proximal convoluted tubule, loop of Henle, distal convoluted tubule, and collecting duct. Indicate cortex vs. medulla.',
    clinicalContext: 'Essential for understanding countercurrent multiplication, GFR, and site of action of loop and thiazide diuretics.',
    comingSoon: true,
    requiredParts: ['Bowman\'s capsule', 'Glomerulus & Afferent/Efferent arterioles', 'Proximal Convoluted Tubule (PCT)', 'Loop of Henle (descending thin & ascending thick limbs)', 'Distal Convoluted Tubule (DCT)', 'Collecting Duct', 'Corticomedullary boundary line'],
    requiredLabels: ['Glomerulus', 'Bowman\'s Capsule', 'PCT', 'Descending Limb', 'Ascending Limb', 'DCT', 'Collecting Duct', 'Renal Cortex', 'Renal Medulla'],
    spatialRelationships: ['Glomerulus and capsule located exclusively in renal cortex', 'Loop of Henle dips into renal medulla and returns to touch afferent arteriole (macula densa)', 'Collecting duct descends through medulla toward renal papilla'],
    commonStudentMistakes: ['Placing the loop of Henle in the cortex', 'Forgetting the descending limb is thin and water permeable, while ascending limb is thick', 'Not showing DCT returning close to glomerulus to form JGA'],
    drawingPlan: [],
    reference: REFERENCES_LIST.find((r) => r.structure === 'Nephron')
  },
  {
    id: 'brachial-plexus',
    name: 'Brachial Plexus',
    difficulty: 'Advanced',
    category: 'Neuroanatomy',
    promptText: 'Draw the brachial plexus from Roots (C5-T1) through Trunks, Divisions, Cords, and Terminal Branches. Remember the mnemonic "Read That Damn Clean Book".',
    clinicalContext: 'High-yield for emergency medicine and orthopedics: Erb\'s palsy (C5-C6), Klumpke\'s palsy (C8-T1), and regional nerve blocks.',
    comingSoon: true,
    requiredParts: ['Roots C5, C6, C7, C8, T1', 'Trunks: Upper, Middle, Lower', 'Divisions: 3 Anterior, 3 Posterior', 'Cords: Lateral, Posterior, Medial', 'Terminal branches: Musculocutaneous, Axillary, Radial, Median, Ulnar'],
    requiredLabels: ['C5-T1 Roots', 'Upper/Middle/Lower Trunks', 'Anterior/Posterior Divisions', 'Lateral/Posterior/Medial Cords', 'MARMU Terminal Nerves'],
    spatialRelationships: ['Posterior cord formed by posterior divisions of ALL three trunks', 'Median nerve formed by branches from BOTH lateral and medial cords ("M" sign)', 'Ulnar nerve is direct continuation of medial cord'],
    commonStudentMistakes: ['Misrouting posterior divisions to cords', 'Drawing symmetrical 2-to-1 root unions', 'Mixing up median nerve vs ulnar nerve cord roots'],
    drawingPlan: [],
    reference: REFERENCES_LIST.find((r) => r.structure === 'Brachial Plexus')
  },
  {
    id: 'neuron',
    name: 'Neuron',
    difficulty: 'Beginner',
    category: 'Histology / Neuro',
    promptText: 'Draw a multipolar motor neuron. Include the soma/perikaryon, nucleus with prominent nucleolus, dendrites, axon hillock, myelinated axon with Schwann cells, nodes of Ranvier, and axon terminals.',
    clinicalContext: 'Fundamental unit of nervous signaling; key to understanding demyelinating conditions (Multiple Sclerosis, Guillain-Barré) and synaptic transmission.',
    comingSoon: true,
    requiredParts: ['Soma / Cell Body', 'Dendritic arbor', 'Nucleus & Nucleolus', 'Axon hillock', 'Axon shaft', 'Myelin sheath / Schwann cells', 'Nodes of Ranvier', 'Axon terminals / Synaptic boutons'],
    requiredLabels: ['Soma', 'Dendrites', 'Axon Hillock', 'Axon', 'Myelin Sheath', 'Node of Ranvier', 'Axon Terminals'],
    spatialRelationships: ['Axon hillock is the unmyelinated funnel-shaped trigger zone between soma and initial segment', 'Nodes of Ranvier are the gaps between adjacent myelin sheaths', 'Action potential propagates unidirectionally from hillock to terminals'],
    commonStudentMistakes: ['Drawing myelin directly over the axon hillock or soma', 'Forgetting the directional flow of electrical signal', 'Not showing gap intervals (nodes of Ranvier) along myelin segments'],
    drawingPlan: [],
    reference: REFERENCES_LIST.find((r) => r.structure === 'Neuron')
  },
  {
    id: 'knee-joint',
    name: 'Knee joint – sagittal',
    difficulty: 'Intermediate',
    category: 'Musculoskeletal',
    promptText: 'Draw a sagittal view of the knee joint. Show distal femur, proximal tibia, patella, patellar tendon/ligament, quadriceps tendon, ACL, PCL, and meniscus.',
    clinicalContext: 'Crucial for sports medicine, orthopedics, and PT: anterior drawer test (ACL tear), posterior sag (PCL), joint space narrowing in osteoarthritis.',
    comingSoon: true,
    requiredParts: ['Distal Femur', 'Proximal Tibia', 'Patella', 'Femoral & Tibial articular cartilage', 'Anterior Cruciate Ligament (ACL)', 'Posterior Cruciate Ligament (PCL)', 'Meniscus (anterior & posterior horns)', 'Quadriceps tendon', 'Patellar ligament', 'Suprapatellar bursa'],
    requiredLabels: ['Femur', 'Tibia', 'Patella', 'ACL', 'PCL', 'Meniscus', 'Patellar Ligament', 'Quadriceps Tendon', 'Joint Capsule'],
    spatialRelationships: ['ACL originates from anterior intercondylar tibia and extends posterolaterally to lateral femoral condyle', 'PCL runs from posterior tibial surface anteromedially to medial femoral condyle', 'Patella sits anterior to femur within quadriceps/patellar tendon mechanism'],
    commonStudentMistakes: ['Crossing ACL and PCL in the wrong direction', 'Placing patella inside the intra-articular cavity instead of embedded in tendon anteriorly', 'Drawing meniscus as a flat disc rather than wedge-shaped crescent on sagittal cut'],
    drawingPlan: [],
    reference: REFERENCES_LIST.find((r) => r.structure === 'Knee joint – sagittal')
  }
];

export function getStructureById(id: string): AnatomyStructure | undefined {
  return ANATOMY_STRUCTURES.find((s) => s.id === id);
}

export function getDefaultStructure(): AnatomyStructure {
  return ANATOMY_STRUCTURES[0];
}
