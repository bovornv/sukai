/**
 * Language Helper
 * Provides bilingual support for questions and responses
 * Default: Thai (th), Secondary: English (en)
 */

/**
 * Translate question to target language
 * @param {string} question - Thai question text
 * @param {string} language - Target language ('th' or 'en')
 * @returns {string} Translated question
 */
export function translateQuestion(question, language = 'th') {
  if (language === 'th' || !question) {
    return question; // Return original Thai
  }

  // Simple translation map for common medical questions
  // In production, this would use a proper translation service
  const translations = {
    'ปวดรุนแรงฉับพลันที่สุดในชีวิตไหมคะ': 'Is this the most severe sudden pain you have ever experienced?',
    'เริ่มปวดทันทีภายในไม่กี่วินาทีไหมคะ': 'Did the pain start suddenly within seconds?',
    'มีหน้าเบี้ยว แขนขาอ่อนแรง หรือพูดไม่ชัดไหมคะ': 'Do you have facial drooping, arm/leg weakness, or slurred speech?',
    'มีคอแข็ง ซึม หรือสับสนไหมคะ': 'Do you have neck stiffness, drowsiness, or confusion?',
    'ปวดร่วมกับอาเจียนพุ่งหรือซึมไหมคะ': 'Is the pain accompanied by projectile vomiting or drowsiness?',
    'ศีรษะกระแทกแล้วหมดสติหรืออาเจียนไหมคะ': 'Did you lose consciousness or vomit after hitting your head?',
    'เด็กซึม ปลุกยาก หรืออาเจียนพุ่งไหมคะ': 'Is the child drowsy, hard to wake, or has projectile vomiting?',
    'เป็นอาการใหม่ร่วมกับสับสนไหมคะ': 'Is this a new symptom accompanied by confusion?',
    'เวียนร่วมกับพูดไม่ชัดหรือเดินเซไหมคะ': 'Is dizziness accompanied by slurred speech or unsteady walking?',
    'หมุนรุนแรงจนยืนไม่ได้ไหมคะ': 'Is the spinning so severe you cannot stand?',
    'หน้ามืดจนเกือบหรือหมดสติไหมคะ': 'Did you almost or actually lose consciousness?',
    'หมดสติจริงหรือยังซึมหลังฟื้นไหมคะ': 'Did you actually lose consciousness or are you still drowsy after recovery?',
    'สับสนเฉียบพลันหรือพฤติกรรมเปลี่ยนไหมคะ': 'Is the confusion sudden or has your behavior changed?',
    'ซึมผิดปกติหรือปลุกไม่ตื่นไหมคะ': 'Are you unusually drowsy or cannot be woken?',
    'จำเหตุการณ์ล่าสุดไม่ได้ทันทีไหมคะ': 'Can you not remember recent events immediately?',
    'อ่อนแรงเกิดทันทีหรือครึ่งซีกไหมคะ': 'Did weakness start suddenly or affect one side?',
    'ชาเกิดฉับพลันหรือชาครึ่งตัวไหมคะ': 'Did numbness start suddenly or affect half your body?',
    'เดินเซร่วมกับพูดไม่ชัดไหมคะ': 'Is unsteady walking accompanied by slurred speech?',
    'พูดไม่ชัดเกิดทันทีไหมคะ': 'Did slurred speech start suddenly?',
    'ชักเกิน 5 นาทีหรือไม่ฟื้นดีไหมคะ': 'Did the seizure last more than 5 minutes or did you not recover well?',
    'เป็นชักครั้งแรกในชีวิตไหมคะ': 'Is this your first seizure ever?',
    'หลังชักเด็กยังซึมหรือไม่ตอบสนองไหมคะ': 'After the seizure, is the child still drowsy or unresponsive?',
    'ตามัวเฉียบพลันหรือมองไม่เห็นบางส่วนไหมคะ': 'Is vision blurred suddenly or partially lost?',
    'เกิดทันทีร่วมกับปวดหัวหรืออ่อนแรงไหมคะ': 'Did it start suddenly with headache or weakness?',
    'ปวดตารุนแรงร่วมกับตามัวไหมคะ': 'Is there severe eye pain with blurred vision?',
    'ตาแดงร่วมกับปวดตาหรือแพ้แสงไหมคะ': 'Is the eye red with pain or light sensitivity?',
    'ก้มคอไม่ได้และมีไข้ไหมคะ': 'Can you not bend your neck and do you have a fever?',
    'เสียงเปลี่ยนร่วมกับกลืนลำบากไหมคะ': 'Has your voice changed with difficulty swallowing?',
    'สำลักน้ำลายหรือหายใจลำบากไหมคะ': 'Are you choking on saliva or having difficulty breathing?',
    'หน้าเบี้ยวหรือพูดไม่ชัดไหมคะ': 'Is your face drooping or speech slurred?',
    'ปวดรุนแรงหรือมีอาการทางสมองไหมคะ': 'Is there severe pain or neurological symptoms?',
    'ตามัวหรือความดันสูงไหมคะ': 'Is vision blurred or blood pressure high?',
    'มีหมดสติหรือจำเหตุการณ์ไม่ได้ไหมคะ': 'Did you lose consciousness or cannot remember the event?',
    'สั่นร่วมกับไข้สูงหรือสับสนไหมคะ': 'Is shaking accompanied by high fever or confusion?',
    'กระตุกไม่หยุดหรือหมดสติไหมคะ': 'Is twitching continuous or did you lose consciousness?',
    'หูอื้อร่วมกับเวียนหัวรุนแรงไหมคะ': 'Is ear ringing accompanied by severe dizziness?',
    'หูดับทันทีข้างเดียวไหมคะ': 'Did hearing loss occur suddenly in one ear?',
    'คอแข็งหรือมีไข้ไหมคะ': 'Is your neck stiff or do you have a fever?',
    'ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ': 'Is there any important health information or symptom you haven\'t shared yet?',
    'อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ': 'Are symptoms getting worse, better, or staying the same?',
    'อาการนี้เริ่มเมื่อไหร่คะ': 'When did this symptom start?',
    'อาการนี้เป็นมานานเท่าไหร่แล้วคะ': 'How long have you had this symptom?',
    'อาการนี้รุนแรงแค่ไหนคะ': 'How severe is this symptom?',
  };

  return translations[question] || question; // Return translation or original if not found
}

/**
 * Translate triage level label
 */
export function translateTriageLevel(triageLevel, language = 'th') {
  // CRITICAL: Map 'pharmacy' to 'gp' (Suk AI behaves as personal AI doctor)
  const normalizedLevel = triageLevel === 'pharmacy' ? 'gp' : triageLevel;
  
  if (language === 'th') {
    const thLabels = {
      'self_care': 'ดูแลที่บ้าน',
      'gp': 'พบแพทย์',
      'emergency': 'ฉุกเฉิน',
      'uncertain': 'ไม่แน่ใจ',
    };
    return thLabels[normalizedLevel] || normalizedLevel;
  }

  const enLabels = {
    'self_care': 'Self Care',
    'gp': 'See Doctor',
    'emergency': 'Emergency',
    'uncertain': 'Uncertain',
  };
  return enLabels[normalizedLevel] || normalizedLevel;
}

/**
 * Translate common medical terms (bilingual format: Thai (English))
 * Format: Thai term (English term) when needed for clarity
 */
export function translateMedicalTerm(thaiTerm, englishTerm, language = 'th') {
  if (language === 'th') {
    // Thai-first: Show Thai with English in parentheses for medical terms
    return `${thaiTerm} (${englishTerm})`;
  }
  // English: Show English term
  return englishTerm;
}

/**
 * Medical term mapping for common symptoms and conditions
 */
const MEDICAL_TERMS_MAP = {
  'ปวดหัว': 'Headache',
  'ปวดท้อง': 'Abdominal Pain',
  'ไข้': 'Fever',
  'ไอ': 'Cough',
  'เจ็บคอ': 'Sore Throat',
  'น้ำมูกไหล': 'Runny Nose',
  'หายใจลำบาก': 'Difficulty Breathing',
  'เวียนหัว': 'Dizziness',
  'คลื่นไส้': 'Nausea',
  'อาเจียน': 'Vomiting',
  'ท้องเสีย': 'Diarrhea',
  'ปวดหลัง': 'Back Pain',
  'ปวดฟัน': 'Toothache',
  'ผื่น': 'Rash',
  'คัน': 'Itching',
  'บวม': 'Swelling',
  'พาราเซตามอล': 'Paracetamol',
  'ไอบูโพรเฟน': 'Ibuprofen',
  'ยาลดน้ำมูก': 'Decongestant',
  'ยาลดไข้': 'Antipyretic',
  'ยาลดปวด': 'Analgesic',
};

/**
 * Format medical term with bilingual support
 * @param {string} thaiTerm - Thai medical term
 * @param {string} language - Language code ('th' or 'en')
 * @returns {string} Formatted medical term
 */
export function formatMedicalTerm(thaiTerm, language = 'th') {
  const englishTerm = MEDICAL_TERMS_MAP[thaiTerm] || '';
  if (!englishTerm) {
    return thaiTerm; // Return as-is if no translation
  }
  return translateMedicalTerm(thaiTerm, englishTerm, language);
}
