/**
 * Question Formatter
 * Converts plain text questions to structured format with appropriate answer choices
 * Ensures all questions have matching answer choices
 */

import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Generate appropriate answer choices for a question based on question text and type
 */
export function generateChoicesForQuestion(questionText, questionKey = null, language = 'th') {
  if (!questionText || typeof questionText !== 'string') {
    return language === 'th' 
      ? ['ใช่', 'ไม่', 'ไม่แน่ใจ']
      : ['Yes', 'No', 'Not sure'];
  }

  const normalizedQuestion = normalizeThaiText(questionText.toLowerCase());

  // Multi-select symptom questions
  // CRITICAL: Check for main_symptom question FIRST - it has specific format
  if (questionKey === 'main_symptom' || 
      normalizedQuestion.includes('อาการหลัก') || 
      normalizedQuestion.includes('main symptom') ||
      (normalizedQuestion.includes('เลือก') && normalizedQuestion.includes('อาการ'))) {
    // Extract symptoms from question text (format: "อาการหลักคืออะไรคะ? (เลือก): น้ำมูก/คัดจมูก/ไอ/...")
    // Try multiple patterns to extract symptoms - order matters!
    const patterns = [
      /\(เลือก\):\s*(.+)/,  // Match after "(เลือก):" - MOST SPECIFIC
      /:\s*(.+)/,  // Match after ":" (but not after "?")
      /[:\/](.+)/,  // Match after : or / - FALLBACK
    ];
    
    let symptoms = null;
    for (const pattern of patterns) {
      const symptomMatch = questionText.match(pattern);
      if (symptomMatch && symptomMatch[1]) {
        symptoms = symptomMatch[1]
          .split('/')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.includes('เลือก') && !s.includes('(เลือก)') && !s.includes('?'));
        
        if (symptoms.length > 0) {
          console.log(`[QUESTION-FORMATTER] Extracted ${symptoms.length} symptoms from question: ${symptoms.join(', ')}`);
          break;
        }
      }
    }
    
    if (symptoms && symptoms.length > 0) {
      // Return symptoms as choices (multi-select) + "ไม่มีอาการอื่น"
      return language === 'th'
        ? [...symptoms, 'ไม่มีอาการอื่น']
        : [...symptoms, 'No other symptoms'];
    }
    
    // Fallback: Common symptoms (if extraction failed)
    console.log(`[QUESTION-FORMATTER] Failed to extract symptoms, using fallback list`);
    return language === 'th'
      ? ['น้ำมูก', 'คัดจมูก', 'ไอ', 'เจ็บคอ', 'ปวดหัว', 'ปวดเมื่อย', 'ท้องเสีย', 'คลื่นไส้', 'ผื่นคัน', 'ไม่มีอาการอื่น']
      : ['Runny nose', 'Stuffy nose', 'Cough', 'Sore throat', 'Headache', 'Body aches', 'Diarrhea', 'Nausea', 'Rash', 'No other symptoms'];
  }

  // Yes/No questions
  if (normalizedQuestion.includes('ไหม') || normalizedQuestion.includes('หรือไม่') ||
      normalizedQuestion.includes('มี') || normalizedQuestion.includes('เคย') ||
      normalizedQuestion.includes('ใช่') || normalizedQuestion.includes('is there') ||
      normalizedQuestion.includes('do you have') || normalizedQuestion.includes('have you')) {
    return language === 'th'
      ? ['ใช่', 'ไม่', 'ไม่แน่ใจ']
      : ['Yes', 'No', 'Not sure'];
  }

  // Severity questions
  if (normalizedQuestion.includes('รุนแรง') || normalizedQuestion.includes('รบกวน') ||
      normalizedQuestion.includes('severe') || normalizedQuestion.includes('interfere')) {
    return language === 'th'
      ? ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ']
      : ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'];
  }

  // Time-course questions
  if (normalizedQuestion.includes('เมื่อไหร่') || normalizedQuestion.includes('เริ่ม') ||
      normalizedQuestion.includes('when') || normalizedQuestion.includes('start')) {
    return language === 'th'
      ? ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'เป็นๆ หายๆ', 'ไม่แน่ใจ']
      : ['Today', 'Yesterday', '2-3 days', '1 week', 'Comes and goes', 'Not sure'];
  }

  // Trend questions
  if (normalizedQuestion.includes('เปลี่ยนแปลง') || normalizedQuestion.includes('ดีขึ้น') ||
      normalizedQuestion.includes('แย่ลง') || normalizedQuestion.includes('changed')) {
    return language === 'th'
      ? ['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ขึ้นๆ ลงๆ', 'ไม่แน่ใจ']
      : ['Getting better', 'Same', 'Getting worse', 'Up and down', 'Not sure'];
  }

  // Duration questions
  if (normalizedQuestion.includes('นาน') || normalizedQuestion.includes('duration') ||
      normalizedQuestion.includes('how long')) {
    return language === 'th'
      ? ['น้อยกว่า 1 วัน', '1-3 วัน', '4-7 วัน', 'มากกว่า 1 สัปดาห์', 'ไม่แน่ใจ']
      : ['Less than 1 day', '1-3 days', '4-7 days', 'More than 1 week', 'Not sure'];
  }

  // Temperature questions
  if (normalizedQuestion.includes('อุณหภูมิ') || normalizedQuestion.includes('ไข้') ||
      normalizedQuestion.includes('temperature') || normalizedQuestion.includes('fever')) {
    return language === 'th'
      ? ['ต่ำกว่า 38°C', '38-39°C', '39-40°C', 'สูงกว่า 40°C', 'ไม่แน่ใจ']
      : ['Below 38°C', '38-39°C', '39-40°C', 'Above 40°C', 'Not sure'];
  }

  // Cough type questions
  if (questionKey === 'cough_type' || normalizedQuestion.includes('เสมหะ') || normalizedQuestion.includes('phlegm') ||
      normalizedQuestion.includes('cough type')) {
    // Extract colors from question text if available
    const colorMatch = questionText.match(/\((.+)\)/);
    if (colorMatch) {
      const colors = colorMatch[1]
        .split('/')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (colors.length > 0) {
        return language === 'th'
          ? ['ไม่มีเสมหะ', ...colors.map(c => `เสมหะ${c}`), 'ไม่แน่ใจ']
          : ['No phlegm', ...colors.map(c => `${c} phlegm`), 'Not sure'];
      }
    }
    return language === 'th'
      ? ['ไม่มีเสมหะ', 'เสมหะใส', 'เสมหะขาว', 'เสมหะเขียว', 'เสมหะเหลือง', 'ไม่แน่ใจ']
      : ['No phlegm', 'Clear phlegm', 'White phlegm', 'Green phlegm', 'Yellow phlegm', 'Not sure'];
  }

  // Age/Weight questions
  if (normalizedQuestion.includes('อายุ') || normalizedQuestion.includes('น้ำหนัก') ||
      normalizedQuestion.includes('age') || normalizedQuestion.includes('weight')) {
    // These are usually free text, but provide options
    return language === 'th'
      ? ['กรอกข้อมูล', 'ไม่แน่ใจ']
      : ['Enter information', 'Not sure'];
  }

  // Associated symptoms questions
  if (normalizedQuestion.includes('อาการอื่น') || normalizedQuestion.includes('associated') ||
      normalizedQuestion.includes('ร่วมด้วย')) {
    return language === 'th'
      ? ['มี', 'ไม่มี', 'ไม่แน่ใจ']
      : ['Yes', 'No', 'Not sure'];
  }

  // Default: Yes/No/Not sure
  return language === 'th'
    ? ['ใช่', 'ไม่', 'ไม่แน่ใจ']
    : ['Yes', 'No', 'Not sure'];
}

/**
 * Convert plain text question to structured format
 */
export function formatQuestionAsStructured(questionText, questionKey = null, language = 'th', step = null, stepName = null, allowMultiSelect = false) {
  if (!questionText || typeof questionText !== 'string') {
    return null;
  }

  const choices = generateChoicesForQuestion(questionText, questionKey, language);
  
  // Determine if multi-select based on question type
  const normalizedQuestion = normalizeThaiText(questionText.toLowerCase());
  const isMultiSelect = allowMultiSelect || 
    normalizedQuestion.includes('เลือก') || 
    normalizedQuestion.includes('select') ||
    normalizedQuestion.includes('อาการหลัก') ||
    questionKey === 'main_symptom' ||
    questionKey === 'associated_symptoms';

  return {
    question: questionText,
    choices: choices,
    step: step || 5, // Default to step 5 if not specified
    stepName: stepName || 'adaptive',
    allowMultiSelect: isMultiSelect,
  };
}

