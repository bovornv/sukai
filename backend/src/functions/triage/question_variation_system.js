/**
 * Question Variation System (Medical-Grade UX)
 * 
 * Separates clinical question intent from display wording.
 * Ensures natural variation while preserving clinical accuracy.
 * 
 * Core Principles:
 * 1. Each question step has ONE clinical intent
 * 2. Each intent has 3-6 wording variations
 * 3. Selection is deterministic within a session (same sessionSeed = same wording)
 * 4. Different sessions get different wording (different sessionSeed)
 * 5. All variations preserve the same medical meaning
 */

import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Question Intent Definitions
 * Each intent represents a clinical information need
 */
export const QUESTION_INTENTS = {
  // Severity-related
  SEVERITY_IMPACT: 'Q_SEVERITY_IMPACT',
  SEVERITY_COMPARISON: 'Q_SEVERITY_COMPARISON',
  SEVERITY_FUNCTIONAL: 'Q_SEVERITY_FUNCTIONAL',
  
  // Time-course related
  DURATION_ONSET: 'Q_DURATION_ONSET',
  DURATION_LENGTH: 'Q_DURATION_LENGTH',
  TREND_CHANGE: 'Q_TREND_CHANGE',
  TREND_PROGRESSION: 'Q_TREND_PROGRESSION',
  
  // Frequency
  FREQUENCY_OCCURRENCE: 'Q_FREQUENCY_OCCURRENCE',
  FREQUENCY_PATTERN: 'Q_FREQUENCY_PATTERN',
  
  // Triggers and modifiers
  TRIGGER_AGGRAVATING: 'Q_TRIGGER_AGGRAVATING',
  TRIGGER_RELIEVING: 'Q_TRIGGER_RELIEVING',
  TRIGGER_CONTEXT: 'Q_TRIGGER_CONTEXT',
  
  // Associated symptoms
  ASSOCIATED_SYMPTOMS: 'Q_ASSOCIATED_SYMPTOMS',
  ASSOCIATED_CONTEXT: 'Q_ASSOCIATED_CONTEXT',
  
  // Impact on daily life
  IMPACT_DAILY_LIFE: 'Q_IMPACT_DAILY_LIFE',
  IMPACT_SLEEP: 'Q_IMPACT_SLEEP',
  IMPACT_WORK: 'Q_IMPACT_WORK',
  
  // Red flags (already handled by intent system, but included for completeness)
  RED_FLAG_SPECIFIC: 'Q_RED_FLAG_SPECIFIC',
};

/**
 * Symptom Group Definitions
 * Maps symptom groups to their characteristics for customized question variations
 */
const SYMPTOM_GROUPS = {
  headache_neuro: {
    name_th: 'ปวดหัว / ระบบประสาท',
    name_en: 'Headache / Neurological',
    tone: 'careful', // Careful, reassuring tone for neurological symptoms
  },
  respiratory: {
    name_th: 'ระบบหายใจ',
    name_en: 'Respiratory',
    tone: 'reassuring', // Reassuring, clear tone for respiratory symptoms
    keywords: ['ไอ', 'น้ำมูก', 'คัดจมูก', 'หายใจลำบาก', 'เจ็บคอ'],
  },
  gi: {
    name_th: 'ระบบทางเดินอาหาร',
    name_en: 'Gastrointestinal',
    tone: 'gentle', // Gentle, sensitive tone for GI symptoms
    keywords: ['ปวดท้อง', 'ท้องเสีย', 'คลื่นไส้', 'อาเจียน', 'กรดไหลย้อน'],
  },
  urinary: {
    name_th: 'ระบบปัสสาวะ',
    name_en: 'Urinary',
    tone: 'professional', // Professional, sensitive tone
  },
  musculoskeletal: {
    name_th: 'กล้ามเนื้อและกระดูก',
    name_en: 'Musculoskeletal',
    tone: 'practical', // Practical, functional tone
    keywords: ['ปวด', 'เจ็บ', 'ปวดหลัง', 'ปวดคอ', 'ปวดไหล่'],
  },
  skin: {
    name_th: 'ผิวหนัง',
    name_en: 'Skin',
    tone: 'observant', // Observant, detail-focused tone
  },
  fever_infection: {
    name_th: 'ไข้ / การติดเชื้อ',
    name_en: 'Fever / Infection',
    tone: 'urgent', // More urgent, attentive tone for infections
    keywords: ['ไข้', 'หนาวสั่น', 'อ่อนเพลีย'],
  },
  chest_cardio: {
    name_th: 'หน้าอก / หัวใจ',
    name_en: 'Chest / Cardiac',
    tone: 'careful', // Very careful, urgent tone for cardiac symptoms
    keywords: ['เจ็บหน้าอก', 'ใจสั่น', 'หายใจลำบาก'],
  },
  ent: {
    name_th: 'หู คอ จมูก',
    name_en: 'ENT',
    tone: 'detailed', // Detailed, specific tone
  },
  general_symptoms: {
    name_th: 'อาการทั่วไป',
    name_en: 'General Symptoms',
    tone: 'standard', // Standard doctor tone
  },
  womens_health: {
    name_th: 'สุขภาพสตรี',
    name_en: "Women's Health",
    tone: 'sensitive', // Sensitive, respectful tone
  },
  mens_health: {
    name_th: 'สุขภาพบุรุษ',
    name_en: "Men's Health",
    tone: 'professional', // Professional tone
  },
  pediatric_common: {
    name_th: 'อาการเด็กทั่วไป',
    name_en: 'Pediatric Common',
    tone: 'gentle', // Gentle, child-friendly tone
  },
  allergy_immune: {
    name_th: 'ภูมิแพ้ / ระบบภูมิคุ้มกัน',
    name_en: 'Allergy / Immune',
    tone: 'careful', // Careful tone for allergies
  },
  eye: {
    name_th: 'ตา',
    name_en: 'Eye',
    tone: 'precise', // Precise, detail-focused tone
  },
  mental_sleep: {
    name_th: 'จิตใจ / การนอน',
    name_en: 'Mental / Sleep',
    tone: 'supportive', // Supportive, understanding tone
  },
};

/**
 * Question Intent Database
 * Maps intent_id to clinical meaning and wording variations
 * Base variations (used when symptom group doesn't have specific variations)
 */
const QUESTION_INTENT_DB = {
  [QUESTION_INTENTS.SEVERITY_IMPACT]: {
    clinical_meaning: 'Ask how much symptom interferes with daily life',
    variants_th: [
      'อาการนี้รบกวนชีวิตประจำวันแค่ไหน?',
      'อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
      'อาการนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
      'อาการนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
      'อาการนี้ทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
      'อาการนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
    ],
    variants_en: [
      'How much does this symptom interfere with your daily life?',
      'How difficult is it to do normal activities because of this symptom?',
      'How does this symptom affect your daily activities?',
      'To what extent does this symptom disrupt your daily routine?',
      'How much does this symptom limit your ability to do things?',
      'How does this symptom interfere with your work or daily activities?',
    ],
    answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
    answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
  },
  
  [QUESTION_INTENTS.SEVERITY_COMPARISON]: {
    clinical_meaning: 'Ask severity compared to normal baseline',
    variants_th: [
      'อาการนี้รุนแรงแค่ไหนเมื่อเทียบกับปกติ?',
      'เมื่อเทียบกับปกติ อาการนี้เป็นอย่างไร?',
      'อาการนี้รุนแรงกว่าปกติแค่ไหน?',
      'คุณรู้สึกว่าอาการนี้แตกต่างจากปกติมากแค่ไหน?',
      'อาการนี้เมื่อเทียบกับตอนปกติเป็นอย่างไร?',
      'อาการนี้รุนแรงผิดปกติหรือไม่เมื่อเทียบกับปกติ?',
    ],
    variants_en: [
      'How severe is this symptom compared to normal?',
      'Compared to normal, how is this symptom?',
      'How much more severe is this symptom than usual?',
      'How different does this symptom feel compared to normal?',
      'How does this symptom compare to your normal state?',
      'Is this symptom abnormally severe compared to normal?',
    ],
    answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
    answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
  },
  
  [QUESTION_INTENTS.SEVERITY_FUNCTIONAL]: {
    clinical_meaning: 'Ask functional impact assessment',
    variants_th: [
      'คุณรู้สึกว่าอาการนี้รบกวนมากแค่ไหน?',
      'อาการนี้ทำให้คุณรู้สึกไม่สบายมากแค่ไหน?',
      'คุณประเมินความรุนแรงของอาการนี้อย่างไร?',
      'อาการนี้ทำให้คุณรู้สึกแย่แค่ไหน?',
      'คุณรู้สึกว่าอาการนี้เป็นปัญหามากแค่ไหน?',
      'อาการนี้ทำให้คุณรู้สึกทรมานมากแค่ไหน?',
    ],
    variants_en: [
      'How much does this symptom bother you?',
      'How uncomfortable does this symptom make you feel?',
      'How would you rate the severity of this symptom?',
      'How bad does this symptom make you feel?',
      'How much of a problem is this symptom for you?',
      'How much distress does this symptom cause?',
    ],
    answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
    answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
  },
  
  [QUESTION_INTENTS.DURATION_ONSET]: {
    clinical_meaning: 'Ask when symptom started',
    variants_th: [
      'อาการนี้เริ่มเมื่อไหร่?',
      'อาการนี้เกิดขึ้นเมื่อไหร่?',
      'คุณสังเกตเห็นอาการนี้เมื่อไหร่?',
      'อาการนี้เริ่มเป็นเมื่อไหร่?',
      'อาการนี้เริ่มมีเมื่อไหร่?',
      'คุณเริ่มรู้สึกว่ามีอาการนี้เมื่อไหร่?',
    ],
    variants_en: [
      'When did this symptom start?',
      'When did this symptom begin?',
      'When did you first notice this symptom?',
      'When did this symptom first appear?',
      'When did this symptom first occur?',
      'When did you first feel this symptom?',
    ],
    answer_options_th: ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'มากกว่า 1 สัปดาห์', 'ไม่แน่ใจ'],
    answer_options_en: ['Today', 'Yesterday', '2-3 days', '1 week', 'More than 1 week', 'Not sure'],
  },
  
  [QUESTION_INTENTS.DURATION_LENGTH]: {
    clinical_meaning: 'Ask how long symptom has been present',
    variants_th: [
      'อาการนี้เป็นมานานเท่าไหร่แล้ว?',
      'อาการนี้เป็นมานานแค่ไหน?',
      'อาการนี้เกิดขึ้นมากี่วันแล้ว?',
      'อาการนี้เป็นมานานกี่วันแล้ว?',
      'อาการนี้เกิดขึ้นมานานเท่าไหร่แล้ว?',
      'อาการนี้เป็นมานานแค่ไหนแล้ว?',
    ],
    variants_en: [
      'How long have you had this symptom?',
      'How long has this symptom been present?',
      'How many days has this been going on?',
      'How long has this symptom lasted?',
      'How long has this symptom been occurring?',
      'For how long have you experienced this symptom?',
    ],
    answer_options_th: ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'มากกว่า 1 สัปดาห์', 'ไม่แน่ใจ'],
    answer_options_en: ['Today', 'Yesterday', '2-3 days', '1 week', 'More than 1 week', 'Not sure'],
  },
  
  [QUESTION_INTENTS.TREND_CHANGE]: {
    clinical_meaning: 'Ask how symptom has changed over time',
    variants_th: [
      'อาการนี้เปลี่ยนแปลงอย่างไร?',
      'อาการนี้ดีขึ้นหรือแย่ลง?',
      'อาการนี้เปลี่ยนแปลงไปอย่างไรบ้าง?',
      'อาการนี้เป็นอย่างไรเมื่อเทียบกับเมื่อเริ่มเป็น?',
      'อาการนี้เปลี่ยนแปลงไปจากเดิมอย่างไร?',
      'อาการนี้มีแนวโน้มเป็นอย่างไร?',
    ],
    variants_en: [
      'How has this symptom changed?',
      'Is this symptom getting better or worse?',
      'How has this symptom been changing?',
      'How is this symptom compared to when it started?',
      'How has this symptom changed from the beginning?',
      'What is the trend of this symptom?',
    ],
    answer_options_th: ['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ขึ้นๆ ลงๆ', 'ไม่แน่ใจ'],
    answer_options_en: ['Getting better', 'Same', 'Getting worse', 'Up and down', 'Not sure'],
  },
  
  [QUESTION_INTENTS.TREND_PROGRESSION]: {
    clinical_meaning: 'Ask symptom progression pattern',
    variants_th: [
      'อาการนี้เป็นอย่างไร?',
      'อาการนี้มีแนวโน้มเป็นอย่างไร?',
      'อาการนี้เปลี่ยนแปลงไปอย่างไร?',
      'อาการนี้เป็นแบบไหน?',
      'อาการนี้เป็นอย่างไรเมื่อเทียบกับเมื่อก่อน?',
      'อาการนี้มีทิศทางเป็นอย่างไร?',
    ],
    variants_en: [
      'How is this symptom progressing?',
      'What is the progression of this symptom?',
      'How is this symptom developing?',
      'What pattern is this symptom following?',
      'How is this symptom compared to before?',
      'What direction is this symptom heading?',
    ],
    answer_options_th: ['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ขึ้นๆ ลงๆ', 'ไม่แน่ใจ'],
    answer_options_en: ['Getting better', 'Same', 'Getting worse', 'Up and down', 'Not sure'],
  },
  
  [QUESTION_INTENTS.FREQUENCY_OCCURRENCE]: {
    clinical_meaning: 'Ask how often symptom occurs',
    variants_th: [
      'อาการนี้เกิดขึ้นบ่อยแค่ไหน?',
      'อาการนี้เป็นบ่อยแค่ไหน?',
      'อาการนี้เกิดขึ้นกี่ครั้ง?',
      'อาการนี้เป็นบ่อยเท่าไหร่?',
      'อาการนี้เกิดขึ้นถี่แค่ไหน?',
      'อาการนี้เป็นบ่อยแค่ไหนในแต่ละวัน?',
    ],
    variants_en: [
      'How often does this symptom occur?',
      'How frequently does this symptom happen?',
      'How many times does this symptom occur?',
      'How often do you experience this symptom?',
      'How frequently does this symptom appear?',
      'How many times per day does this symptom occur?',
    ],
    answer_options_th: ['เป็นตลอดเวลา', 'บ่อยมาก', 'เป็นครั้งคราว', 'นานๆ ครั้ง', 'ไม่แน่ใจ'],
    answer_options_en: ['Constant', 'Very frequent', 'Occasional', 'Rare', 'Not sure'],
  },
  
  [QUESTION_INTENTS.FREQUENCY_PATTERN]: {
    clinical_meaning: 'Ask symptom frequency pattern',
    variants_th: [
      'อาการนี้เป็นแบบไหน?',
      'อาการนี้เป็นเป็นๆ หายๆ หรือไม่?',
      'อาการนี้เกิดขึ้นเป็นช่วงๆ หรือไม่?',
      'อาการนี้เป็นแบบต่อเนื่องหรือเป็นๆ หายๆ?',
      'อาการนี้เป็นแบบไหน? เป็นตลอดหรือเป็นๆ หายๆ?',
      'อาการนี้มีรูปแบบการเกิดเป็นอย่างไร?',
    ],
    variants_en: [
      'What pattern does this symptom follow?',
      'Does this symptom come and go?',
      'Does this symptom occur in episodes?',
      'Is this symptom continuous or intermittent?',
      'What is the pattern? Constant or intermittent?',
      'What is the pattern of occurrence for this symptom?',
    ],
    answer_options_th: ['เป็นตลอดเวลา', 'เป็นๆ หายๆ', 'เป็นช่วงๆ', 'นานๆ ครั้ง', 'ไม่แน่ใจ'],
    answer_options_en: ['Constant', 'Comes and goes', 'Episodic', 'Rare', 'Not sure'],
  },
  
  [QUESTION_INTENTS.TRIGGER_AGGRAVATING]: {
    clinical_meaning: 'Ask what makes symptom worse',
    variants_th: [
      'มีอะไรที่ทำให้อาการแย่ลงไหม?',
      'มีอะไรที่ทำให้อาการรุนแรงขึ้นไหม?',
      'มีอะไรที่ทำให้อาการแย่ลงบ้าง?',
      'มีปัจจัยอะไรที่ทำให้อาการแย่ลงไหม?',
      'มีอะไรที่ทำให้อาการนี้แย่ลงหรือไม่?',
      'มีสิ่งใดที่ทำให้อาการแย่ลงบ้าง?',
    ],
    variants_en: [
      'Is there anything that makes the symptom worse?',
      'Is there anything that aggravates the symptom?',
      'What makes the symptom worse?',
      'Are there any factors that worsen the symptom?',
      'Does anything make this symptom worse?',
      'What triggers or worsens this symptom?',
    ],
    answer_options_th: ['มี', 'ไม่มี', 'ไม่แน่ใจ'],
    answer_options_en: ['Yes', 'No', 'Not sure'],
  },
  
  [QUESTION_INTENTS.TRIGGER_RELIEVING]: {
    clinical_meaning: 'Ask what makes symptom better',
    variants_th: [
      'มีอะไรที่ทำให้อาการดีขึ้นไหม?',
      'มีอะไรที่ทำให้อาการบรรเทาลงไหม?',
      'มีอะไรที่ทำให้อาการดีขึ้นบ้าง?',
      'มีปัจจัยอะไรที่ทำให้อาการดีขึ้นไหม?',
      'มีอะไรที่ทำให้อาการนี้ดีขึ้นหรือไม่?',
      'มีสิ่งใดที่ทำให้อาการดีขึ้นบ้าง?',
    ],
    variants_en: [
      'Is there anything that makes the symptom better?',
      'Is there anything that relieves the symptom?',
      'What makes the symptom better?',
      'Are there any factors that improve the symptom?',
      'Does anything make this symptom better?',
      'What helps relieve this symptom?',
    ],
    answer_options_th: ['มี', 'ไม่มี', 'ไม่แน่ใจ'],
    answer_options_en: ['Yes', 'No', 'Not sure'],
  },
  
  [QUESTION_INTENTS.TRIGGER_CONTEXT]: {
    clinical_meaning: 'Ask symptom context or triggers',
    variants_th: [
      'อาการนี้เกิดขึ้นเมื่อไหร่หรือในสถานการณ์ไหน?',
      'อาการนี้มักเกิดขึ้นเมื่อไหร่?',
      'มีสถานการณ์อะไรที่ทำให้เกิดอาการนี้?',
      'อาการนี้เกิดขึ้นในสถานการณ์ใดบ้าง?',
      'อาการนี้มักเกิดเมื่อไหร่หรือในสถานการณ์ไหน?',
      'มีปัจจัยอะไรที่ทำให้เกิดอาการนี้?',
    ],
    variants_en: [
      'When or in what situation does this symptom occur?',
      'When does this symptom usually happen?',
      'What situations trigger this symptom?',
      'In what situations does this symptom occur?',
      'When or in what context does this symptom usually appear?',
      'What factors cause this symptom to occur?',
    ],
    answer_options_th: ['มี', 'ไม่มี', 'ไม่แน่ใจ'],
    answer_options_en: ['Yes', 'No', 'Not sure'],
  },
  
  [QUESTION_INTENTS.ASSOCIATED_SYMPTOMS]: {
    clinical_meaning: 'Ask about associated symptoms',
    variants_th: [
      'มีอาการอื่นๆ ร่วมด้วยไหม?',
      'มีอาการอื่นๆ ที่เกิดขึ้นพร้อมกันไหม?',
      'มีอาการอื่นๆ ที่เกี่ยวข้องไหม?',
      'มีอาการอื่นๆ ที่เกิดขึ้นร่วมกับอาการนี้ไหม?',
      'มีอาการอื่นๆ ที่คุณสังเกตเห็นพร้อมกับอาการนี้ไหม?',
      'มีอาการอื่นๆ ที่เกิดขึ้นพร้อมกันบ้าง?',
    ],
    variants_en: [
      'Are there any other symptoms?',
      'Are there any other symptoms occurring at the same time?',
      'Are there any related symptoms?',
      'Are there any other symptoms associated with this?',
      'Have you noticed any other symptoms along with this?',
      'What other symptoms are occurring?',
    ],
    answer_options_th: ['มี', 'ไม่มี', 'ไม่แน่ใจ'],
    answer_options_en: ['Yes', 'No', 'Not sure'],
  },
  
  [QUESTION_INTENTS.ASSOCIATED_CONTEXT]: {
    clinical_meaning: 'Ask about associated symptom context',
    variants_th: [
      'มีอาการอื่นๆ ที่เกี่ยวข้องกับอาการนี้ไหม?',
      'มีอาการอื่นๆ ที่เกิดขึ้นพร้อมกันบ้าง?',
      'มีอาการอื่นๆ ที่คุณสังเกตเห็นไหม?',
      'มีอาการอื่นๆ ที่เกิดขึ้นร่วมกันไหม?',
      'มีอาการอื่นๆ ที่เกี่ยวข้องกันไหม?',
      'มีอาการอื่นๆ ที่เกิดขึ้นพร้อมกับอาการนี้บ้าง?',
    ],
    variants_en: [
      'Are there any other symptoms related to this?',
      'What other symptoms are occurring together?',
      'Have you noticed any other symptoms?',
      'Are there any other symptoms occurring together?',
      'Are there any related symptoms?',
      'What other symptoms occur along with this?',
    ],
    answer_options_th: ['มี', 'ไม่มี', 'ไม่แน่ใจ'],
    answer_options_en: ['Yes', 'No', 'Not sure'],
  },
  
  [QUESTION_INTENTS.IMPACT_DAILY_LIFE]: {
    clinical_meaning: 'Ask impact on daily life activities',
    variants_th: [
      'อาการนี้ส่งผลต่อการใช้ชีวิตประจำวันของคุณอย่างไร?',
      'อาการนี้รบกวนการทำกิจกรรมประจำวันของคุณไหม?',
      'อาการนี้ทำให้คุณทำอะไรได้ยากขึ้นบ้าง?',
      'อาการนี้ส่งผลต่อชีวิตประจำวันของคุณแค่ไหน?',
      'อาการนี้รบกวนการทำกิจกรรมต่างๆ ของคุณอย่างไร?',
      'อาการนี้ทำให้คุณทำอะไรได้น้อยลงบ้าง?',
    ],
    variants_en: [
      'How does this symptom affect your daily life?',
      'Does this symptom interfere with your daily activities?',
      'What activities has this symptom made difficult?',
      'How much does this symptom affect your daily life?',
      'How does this symptom interfere with your activities?',
      'What activities has this symptom limited?',
    ],
    answer_options_th: ['ไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รบกวนมากจนทำอะไรไม่ได้', 'ไม่แน่ใจ'],
    answer_options_en: ['No interference', 'Some interference', 'Much interference', 'Severe interference', 'Not sure'],
  },
  
  [QUESTION_INTENTS.IMPACT_SLEEP]: {
    clinical_meaning: 'Ask impact on sleep',
    variants_th: [
      'อาการนี้รบกวนการนอนของคุณไหม?',
      'อาการนี้ทำให้คุณนอนไม่หลับไหม?',
      'อาการนี้ส่งผลต่อการนอนของคุณอย่างไร?',
      'อาการนี้รบกวนการพักผ่อนของคุณไหม?',
      'อาการนี้ทำให้คุณนอนหลับได้ยากไหม?',
      'อาการนี้ส่งผลต่อการนอนหลับของคุณแค่ไหน?',
    ],
    variants_en: [
      'Does this symptom interfere with your sleep?',
      'Does this symptom keep you awake?',
      'How does this symptom affect your sleep?',
      'Does this symptom disturb your rest?',
      'Does this symptom make it hard to sleep?',
      'How much does this symptom affect your sleep?',
    ],
    answer_options_th: ['ไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รบกวนมากจนนอนไม่หลับ', 'ไม่แน่ใจ'],
    answer_options_en: ['No interference', 'Some interference', 'Much interference', 'Severe interference', 'Not sure'],
  },
  
  [QUESTION_INTENTS.IMPACT_WORK]: {
    clinical_meaning: 'Ask impact on work or activities',
    variants_th: [
      'อาการนี้รบกวนการทำงานของคุณไหม?',
      'อาการนี้ทำให้คุณทำงานได้ยากขึ้นไหม?',
      'อาการนี้ส่งผลต่อการทำงานของคุณอย่างไร?',
      'อาการนี้รบกวนการทำกิจกรรมต่างๆ ของคุณไหม?',
      'อาการนี้ทำให้คุณทำอะไรได้น้อยลงไหม?',
      'อาการนี้ส่งผลต่อการทำงานหรือกิจกรรมของคุณแค่ไหน?',
    ],
    variants_en: [
      'Does this symptom interfere with your work?',
      'Does this symptom make it hard to work?',
      'How does this symptom affect your work?',
      'Does this symptom interfere with your activities?',
      'Has this symptom limited what you can do?',
      'How much does this symptom affect your work or activities?',
    ],
    answer_options_th: ['ไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รบกวนมากจนทำงานไม่ได้', 'ไม่แน่ใจ'],
    answer_options_en: ['No interference', 'Some interference', 'Much interference', 'Severe interference', 'Not sure'],
  },
};

/**
 * Generate deterministic seed from sessionSeed and intent
 * Ensures same session + same intent = same wording selection
 */
function generateVariationSeed(sessionSeed, intentId, questionCount = 0) {
  if (!sessionSeed) {
    // Fallback: generate from intent + time + random (ensures variation)
    const intentHash = intentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timeComponent = Date.now() % 100000;
    const randomComponent = Math.floor(Math.random() * 10000);
    return Math.floor((intentHash * 7 + timeComponent * 11 + randomComponent * 13) % 100000);
  }
  
  // Deterministic within session: sessionSeed + intentId + questionCount
  // But sessionSeed itself varies per assessment, so different assessments get different questions
  const intentHash = intentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const combinedSeed = (sessionSeed + intentHash * 7 + questionCount * 11) % 100000;
  return Math.floor(combinedSeed);
}

/**
 * Group-Specific Question Variations
 * Customized variations for each symptom group to make questions more contextually appropriate
 */
const GROUP_SPECIFIC_VARIANTS = {
  // Headache / Neurological - Careful, detailed tone
  headache_neuro: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      clinical_meaning: 'Ask how much headache interferes with daily life',
      variants_th: [
        'อาการปวดหัวนี้รบกวนการทำงานหรือการใช้ชีวิตประจำวันของคุณแค่ไหน?',
        'อาการปวดหัวทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการปวดหัวนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
        'อาการปวดหัวนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
        'อาการปวดหัวทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
        'อาการปวดหัวนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
      ],
      variants_en: [
        'How much does this headache interfere with your work or daily life?',
        'How difficult is it to do normal activities because of this headache?',
        'How does this headache affect your daily activities?',
        'To what extent does this headache disrupt your daily routine?',
        'How much does this headache limit your ability to do things?',
        'How does this headache interfere with your work or daily activities?',
      ],
      answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
      answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
    },
    [QUESTION_INTENTS.DURATION_ONSET]: {
      clinical_meaning: 'Ask when headache started',
      variants_th: [
        'อาการปวดหัวนี้เริ่มเมื่อไหร่?',
        'อาการปวดหัวนี้เกิดขึ้นเมื่อไหร่?',
        'คุณสังเกตเห็นอาการปวดหัวนี้เมื่อไหร่?',
        'อาการปวดหัวนี้เริ่มเป็นเมื่อไหร่?',
        'อาการปวดหัวนี้เริ่มมีเมื่อไหร่?',
        'คุณเริ่มรู้สึกปวดหัวเมื่อไหร่?',
      ],
      variants_en: [
        'When did this headache start?',
        'When did this headache begin?',
        'When did you first notice this headache?',
        'When did this headache first appear?',
        'When did this headache first occur?',
        'When did you first feel this headache?',
      ],
      answer_options_th: ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'มากกว่า 1 สัปดาห์', 'ไม่แน่ใจ'],
      answer_options_en: ['Today', 'Yesterday', '2-3 days', '1 week', 'More than 1 week', 'Not sure'],
    },
  },
  
  // Respiratory - Reassuring, clear tone
  respiratory: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      clinical_meaning: 'Ask how much respiratory symptom interferes with daily life',
      variants_th: [
        'อาการไอ/หายใจลำบากนี้รบกวนการใช้ชีวิตประจำวันของคุณแค่ไหน?',
        'อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการไอหรือหายใจลำบากนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
        'อาการนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
        'อาการนี้ทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
        'อาการนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
      ],
      variants_en: [
        'How much does this cough/breathing difficulty interfere with your daily life?',
        'How difficult is it to do normal activities because of this symptom?',
        'How does this cough or breathing difficulty affect your daily activities?',
        'To what extent does this symptom disrupt your daily routine?',
        'How much does this symptom limit your ability to do things?',
        'How does this symptom interfere with your work or daily activities?',
      ],
      answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
      answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
    },
    [QUESTION_INTENTS.FREQUENCY_OCCURRENCE]: {
      clinical_meaning: 'Ask how often respiratory symptom occurs',
      variants_th: [
        'อาการไอ/หายใจลำบากนี้เกิดขึ้นบ่อยแค่ไหน?',
        'อาการนี้เป็นบ่อยแค่ไหน?',
        'อาการไอหรือหายใจลำบากนี้เกิดขึ้นกี่ครั้ง?',
        'อาการนี้เป็นบ่อยเท่าไหร่?',
        'อาการนี้เกิดขึ้นถี่แค่ไหน?',
        'อาการนี้เป็นบ่อยแค่ไหนในแต่ละวัน?',
      ],
      variants_en: [
        'How often does this cough/breathing difficulty occur?',
        'How frequently does this symptom happen?',
        'How many times does this cough or breathing difficulty occur?',
        'How often do you experience this symptom?',
        'How frequently does this symptom appear?',
        'How many times per day does this symptom occur?',
      ],
      answer_options_th: ['เป็นตลอดเวลา', 'บ่อยมาก', 'เป็นครั้งคราว', 'นานๆ ครั้ง', 'ไม่แน่ใจ'],
      answer_options_en: ['Constant', 'Very frequent', 'Occasional', 'Rare', 'Not sure'],
    },
  },
  
  // GI (Gastrointestinal) - Gentle, sensitive tone
  gi: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      clinical_meaning: 'Ask how much GI symptom interferes with daily life',
      variants_th: [
        'อาการปวดท้อง/ท้องเสียนี้รบกวนการใช้ชีวิตประจำวันของคุณแค่ไหน?',
        'อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการปวดท้องหรือท้องเสียนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
        'อาการนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
        'อาการนี้ทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
        'อาการนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
      ],
      variants_en: [
        'How much does this abdominal pain/diarrhea interfere with your daily life?',
        'How difficult is it to do normal activities because of this symptom?',
        'How does this abdominal pain or diarrhea affect your daily activities?',
        'To what extent does this symptom disrupt your daily routine?',
        'How much does this symptom limit your ability to do things?',
        'How does this symptom interfere with your work or daily activities?',
      ],
      answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
      answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
    },
    [QUESTION_INTENTS.DURATION_ONSET]: {
      clinical_meaning: 'Ask when GI symptom started',
      variants_th: [
        'อาการปวดท้อง/ท้องเสียนี้เริ่มเมื่อไหร่?',
        'อาการนี้เกิดขึ้นเมื่อไหร่?',
        'คุณสังเกตเห็นอาการนี้เมื่อไหร่?',
        'อาการนี้เริ่มเป็นเมื่อไหร่?',
        'อาการนี้เริ่มมีเมื่อไหร่?',
        'คุณเริ่มรู้สึกว่ามีอาการนี้เมื่อไหร่?',
      ],
      variants_en: [
        'When did this abdominal pain/diarrhea start?',
        'When did this symptom begin?',
        'When did you first notice this symptom?',
        'When did this symptom first appear?',
        'When did this symptom first occur?',
        'When did you first feel this symptom?',
      ],
      answer_options_th: ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'มากกว่า 1 สัปดาห์', 'ไม่แน่ใจ'],
      answer_options_en: ['Today', 'Yesterday', '2-3 days', '1 week', 'More than 1 week', 'Not sure'],
    },
  },
  
  // Chest / Cardiac - Very careful, urgent tone
  chest_cardio: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      clinical_meaning: 'Ask how much chest/cardiac symptom interferes with daily life',
      variants_th: [
        'อาการเจ็บหน้าอก/ใจสั่นนี้รบกวนการใช้ชีวิตประจำวันของคุณแค่ไหน?',
        'อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการเจ็บหน้าอกหรือใจสั่นนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
        'อาการนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
        'อาการนี้ทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
        'อาการนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
      ],
      variants_en: [
        'How much does this chest pain/palpitation interfere with your daily life?',
        'How difficult is it to do normal activities because of this symptom?',
        'How does this chest pain or palpitation affect your daily activities?',
        'To what extent does this symptom disrupt your daily routine?',
        'How much does this symptom limit your ability to do things?',
        'How does this symptom interfere with your work or daily activities?',
      ],
      answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
      answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
    },
  },
  
  // Musculoskeletal - Practical, functional tone
  musculoskeletal: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      clinical_meaning: 'Ask how much pain/musculoskeletal symptom interferes with daily life',
      variants_th: [
        'อาการปวดนี้รบกวนการเคลื่อนไหวหรือการใช้ชีวิตประจำวันของคุณแค่ไหน?',
        'อาการปวดนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการปวดนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
        'อาการปวดนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
        'อาการปวดนี้ทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
        'อาการปวดนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
      ],
      variants_en: [
        'How much does this pain interfere with your movement or daily life?',
        'How difficult is it to do normal activities because of this pain?',
        'How does this pain affect your daily activities?',
        'To what extent does this pain disrupt your daily routine?',
        'How much does this pain limit your ability to do things?',
        'How does this pain interfere with your work or daily activities?',
      ],
      answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
      answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
    },
    [QUESTION_INTENTS.TRIGGER_AGGRAVATING]: {
      clinical_meaning: 'Ask what makes musculoskeletal pain worse',
      variants_th: [
        'มีอะไรที่ทำให้อาการปวดแย่ลงไหม?',
        'มีอะไรที่ทำให้อาการปวดรุนแรงขึ้นไหม?',
        'มีอะไรที่ทำให้อาการปวดแย่ลงบ้าง?',
        'มีปัจจัยอะไรที่ทำให้อาการปวดแย่ลงไหม?',
        'มีอะไรที่ทำให้อาการปวดนี้แย่ลงหรือไม่?',
        'มีสิ่งใดที่ทำให้อาการปวดแย่ลงบ้าง?',
      ],
      variants_en: [
        'Is there anything that makes the pain worse?',
        'Is there anything that aggravates the pain?',
        'What makes the pain worse?',
        'Are there any factors that worsen the pain?',
        'Does anything make this pain worse?',
        'What triggers or worsens this pain?',
      ],
      answer_options_th: ['มี', 'ไม่มี', 'ไม่แน่ใจ'],
      answer_options_en: ['Yes', 'No', 'Not sure'],
    },
  },
  
  // Fever / Infection - More urgent tone
  fever_infection: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      clinical_meaning: 'Ask how much fever/infection symptom interferes with daily life',
      variants_th: [
        'อาการไข้/หนาวสั่นนี้รบกวนการใช้ชีวิตประจำวันของคุณแค่ไหน?',
        'อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการไข้หรือหนาวสั่นนี้ส่งผลต่อการทำกิจกรรมประจำวันของคุณอย่างไร?',
        'อาการนี้รบกวนการใช้ชีวิตประจำวันของคุณมากแค่ไหน?',
        'อาการนี้ทำให้คุณทำอะไรได้ยากขึ้นแค่ไหน?',
        'อาการนี้รบกวนการทำงานหรือกิจกรรมประจำวันของคุณอย่างไร?',
      ],
      variants_en: [
        'How much does this fever/chills interfere with your daily life?',
        'How difficult is it to do normal activities because of this symptom?',
        'How does this fever or chills affect your daily activities?',
        'To what extent does this symptom disrupt your daily routine?',
        'How much does this symptom limit your ability to do things?',
        'How does this symptom interfere with your work or daily activities?',
      ],
      answer_options_th: ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ'],
      answer_options_en: ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'],
    },
    [QUESTION_INTENTS.DURATION_ONSET]: {
      clinical_meaning: 'Ask when fever/infection symptom started',
      variants_th: [
        'อาการไข้/หนาวสั่นนี้เริ่มเมื่อไหร่?',
        'อาการนี้เกิดขึ้นเมื่อไหร่?',
        'คุณสังเกตเห็นอาการนี้เมื่อไหร่?',
        'อาการนี้เริ่มเป็นเมื่อไหร่?',
        'อาการนี้เริ่มมีเมื่อไหร่?',
        'คุณเริ่มรู้สึกว่ามีอาการนี้เมื่อไหร่?',
      ],
      variants_en: [
        'When did this fever/chills start?',
        'When did this symptom begin?',
        'When did you first notice this symptom?',
        'When did this symptom first appear?',
        'When did this symptom first occur?',
        'When did you first feel this symptom?',
      ],
      answer_options_th: ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'มากกว่า 1 สัปดาห์', 'ไม่แน่ใจ'],
      answer_options_en: ['Today', 'Yesterday', '2-3 days', '1 week', 'More than 1 week', 'Not sure'],
    },
  },
};

/**
 * Get symptom-group-specific variations for an intent
 * Returns group-specific variations if available, otherwise returns base variations
 */
function getVariantsForGroup(intentId, symptomGroup = null) {
  const baseIntent = QUESTION_INTENT_DB[intentId];
  if (!baseIntent) return null;
  
  // If no symptom group specified, return base variations
  if (!symptomGroup || !SYMPTOM_GROUPS[symptomGroup]) {
    return baseIntent;
  }
  
  // Check if this symptom group has specific variations for this intent
  const groupVariants = GROUP_SPECIFIC_VARIANTS[symptomGroup];
  if (groupVariants && groupVariants[intentId]) {
    const groupInfo = SYMPTOM_GROUPS[symptomGroup];
    console.log(`[QUESTION-VARIATION] ✅ Using GROUP-SPECIFIC variations for ${symptomGroup} (${groupInfo.name_th}) / ${intentId}`);
    return groupVariants[intentId];
  }
  
  // Return base intent (fallback to base variations)
  return baseIntent;
}

/**
 * Select a wording variant for a given intent
 * 
 * @param {string} intentId - Question intent ID (e.g., QUESTION_INTENTS.SEVERITY_IMPACT)
 * @param {string} language - Language code ('th' or 'en')
 * @param {number} sessionSeed - Session seed for deterministic variation
 * @param {number} questionCount - Current question count (for additional variation)
 * @param {Array} questionsAsked - Previously asked questions (to avoid duplicates)
 * @param {string} symptomGroup - Symptom group (e.g., 'headache_neuro', 'respiratory') for group-specific variations
 * @returns {Object|null} Selected question variant or null if intent not found
 */
export function selectQuestionVariant(intentId, language = 'th', sessionSeed = null, questionCount = 0, questionsAsked = [], symptomGroup = null) {
  // Get intent with group-specific variations if available
  const intent = getVariantsForGroup(intentId, symptomGroup);
  
  if (!intent) {
    console.warn(`[QUESTION-VARIATION] Intent not found: ${intentId}`);
    return null;
  }
  
  // Get variants for the requested language
  const variants = language === 'th' ? intent.variants_th : intent.variants_en;
  const answerOptions = language === 'th' ? intent.answer_options_th : intent.answer_options_en;
  
  // Log if using group-specific variations
  if (symptomGroup && SYMPTOM_GROUPS[symptomGroup]) {
    const groupInfo = SYMPTOM_GROUPS[symptomGroup];
    const isGroupSpecific = GROUP_SPECIFIC_VARIANTS[symptomGroup]?.[intentId];
    if (isGroupSpecific) {
      console.log(`[QUESTION-VARIATION] ✅ Using GROUP-SPECIFIC variations for ${symptomGroup} (${groupInfo.name_th}) / ${intentId}`);
    } else {
      console.log(`[QUESTION-VARIATION] Using base variations for symptom group: ${symptomGroup} (${groupInfo.name_th})`);
    }
  }
  
  if (!variants || variants.length === 0) {
    console.warn(`[QUESTION-VARIATION] No variants found for intent: ${intentId}, language: ${language}`);
    return null;
  }
  
  // Check which variants have been asked (semantic similarity check)
  const wasAsked = (text) => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      const normalizedText = normalizeThaiText(text.toLowerCase().trim());
      
      // Exact match
      if (normalizedQ === normalizedText) return true;
      
      // Substring match (one contains the other) - only if substantial
      if (normalizedQ.length > 10 && normalizedText.length > 10) {
        if (normalizedQ.includes(normalizedText) || normalizedText.includes(normalizedQ)) {
          return true;
        }
      }
      
      return false;
    });
  };
  
  // Filter out already-asked variants
  const unaskedVariants = variants.filter(v => !wasAsked(v));
  
  // Select variant deterministically
  const availableVariants = unaskedVariants.length > 0 ? unaskedVariants : variants;
  const variationSeed = generateVariationSeed(sessionSeed, intentId, questionCount);
  const selectedIndex = variationSeed % availableVariants.length;
  const selectedQuestion = availableVariants[selectedIndex];
  
  // Debug logging to verify variation is working
  if (!sessionSeed) {
    console.log(`[QUESTION-VARIATION] Selected variant ${selectedIndex + 1}/${availableVariants.length} for ${intentId} (no sessionSeed)`);
  } else {
    console.log(`[QUESTION-VARIATION] Selected variant ${selectedIndex + 1}/${availableVariants.length} for ${intentId} (sessionSeed: ${sessionSeed}, questionCount: ${questionCount})`);
  }
  
  return {
    intent_id: intentId,
    clinical_meaning: intent.clinical_meaning,
    question: selectedQuestion,
    choices: answerOptions || [],
    language: language,
  };
}

/**
 * Get all available intents for a given category
 * Useful for debugging or admin tools
 */
export function getIntentsByCategory(category) {
  // Map categories to intent groups
  const categoryMap = {
    severity: [
      QUESTION_INTENTS.SEVERITY_IMPACT,
      QUESTION_INTENTS.SEVERITY_COMPARISON,
      QUESTION_INTENTS.SEVERITY_FUNCTIONAL,
    ],
    time_course: [
      QUESTION_INTENTS.DURATION_ONSET,
      QUESTION_INTENTS.DURATION_LENGTH,
      QUESTION_INTENTS.TREND_CHANGE,
      QUESTION_INTENTS.TREND_PROGRESSION,
    ],
    frequency: [
      QUESTION_INTENTS.FREQUENCY_OCCURRENCE,
      QUESTION_INTENTS.FREQUENCY_PATTERN,
    ],
    triggers: [
      QUESTION_INTENTS.TRIGGER_AGGRAVATING,
      QUESTION_INTENTS.TRIGGER_RELIEVING,
      QUESTION_INTENTS.TRIGGER_CONTEXT,
    ],
    associated: [
      QUESTION_INTENTS.ASSOCIATED_SYMPTOMS,
      QUESTION_INTENTS.ASSOCIATED_CONTEXT,
    ],
    impact: [
      QUESTION_INTENTS.IMPACT_DAILY_LIFE,
      QUESTION_INTENTS.IMPACT_SLEEP,
      QUESTION_INTENTS.IMPACT_WORK,
    ],
  };
  
  return categoryMap[category] || [];
}

/**
 * Get intent metadata (for debugging/admin)
 */
export function getIntentMetadata(intentId) {
  const intent = QUESTION_INTENT_DB[intentId];
  if (!intent) return null;
  
  return {
    intent_id: intentId,
    clinical_meaning: intent.clinical_meaning,
    variant_count_th: intent.variants_th?.length || 0,
    variant_count_en: intent.variants_en?.length || 0,
    answer_options_count: intent.answer_options_th?.length || 0,
  };
}

