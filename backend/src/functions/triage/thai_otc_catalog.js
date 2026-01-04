/**
 * Medical-Grade OTC Recommendation Engine (Thailand)
 * Production-ready system that behaves like Thai ER physician + senior pharmacist discussion
 * 
 * 🎯 PRIMARY CLINICAL REASONING REFERENCE: severity_timecourse_matrix.js
 * 
 * GOAL:
 * Build a production-ready OTC medication recommendation logic for Thailand that:
 * 1) adapts to symptom + severity + time-course,
 * 2) uses Thailand-specific OTC formulary,
 * 3) ranks and selects medications using clinical confidence scoring.
 * 
 * CORE REQUIREMENTS:
 * 
 * 1) Drug–Symptom–Severity–Time Decision Tree (MANDATORY)
 *    - Every symptom must branch by Severity (mild/moderate/severe) × Time-course (acute/subacute/progressive/recurrent)
 *    - Medication choice MUST change based on these factors
 *    - Example: Headache ≠ always paracetamol → tension vs migraine vs red-flag headache must diverge
 *    - Emergency red flags must override everything and stop OTC suggestions immediately
 * 
 * 2) Thailand OTC Medical-Grade Formulary
 *    - Use only medications available and commonly used in Thailand
 *    - Include at least 2–4 suitable OTC options per non-emergency conclusion
 *    - Each medication entry must include:
 *      • Indication
 *      • Dose ranges by age AND weight (Thai clinical practice)
 *      • Contraindications (โรคประจำตัว, pregnancy, G6PD, CKD, liver disease, etc.)
 *      • Key safety warnings (short, clinical)
 *    - Avoid foreign-only drugs not realistic in Thai pharmacies
 * 
 * 3) Drug Confidence Scoring (Clinical Reasoning Layer)
 *    For every candidate medication, assign a confidence score based on:
 *    - Symptom match strength
 *    - Severity appropriateness
 *    - Time-course appropriateness
 *    - Patient profile fit (age, weight, chronic disease, drug allergy)
 *    - Safety margin
 *    Rank medications by confidence. Only recommend medications above confidence threshold.
 * 
 * QUESTIONING BEHAVIOR:
 * - The system must NEVER ask the same fixed question sequence
 * - Questions must be dynamically selected based on:
 *   • unresolved hypotheses
 *   • severity trajectory (ดีขึ้น / แย่ลง)
 *   • time-course uncertainty
 * - Before ANY non-emergency conclusion, the system MUST ask:
 *   "ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ"
 * - If confidence is still insufficient → ask more targeted questions
 * 
 * SAFETY RULES:
 * - If emergency red flags detected → STOP OTC → Emergency flow only
 * - Never give dosage without age/weight consideration
 * - Never repeat identical recommendation flows for the same user input
 * - Think like: ER doctor + senior pharmacist consensus
 * 
 * This engine must feel: "เหมือนคุยกับแพทย์จริง ไม่ใช่ chatbot"
 */

/**
 * OTC Medication Entry Structure (Medical-Grade)
 * Each medication must include:
 * - Indications: mapped to symptoms + severity + time-course
 * - Dose ranges: by weight (kg) and age group
 * - Contraindications: by chronic diseases, pregnancy/breastfeeding, drug allergy
 * - When NOT appropriate: severity escalation rule
 * - Red-flag exclusions: never recommend if X present
 */
export const OTC_CATALOG = {
  // 🤒 ไข้/ปวด (Fever/Pain)
  fever_pain: [
    {
      generic: 'พาราเซตามอล',
      brandExamples: ['Tylenol', 'Paracetamol', 'Calpol'],
      indication: 'ไข้, ปวด',
      category: 'fever_pain',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for headache/pain
      lineRationale: 'ปลอดภัยที่สุด อ่อนโยนต่อกระเพาะและไต',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line
          subacute: true,   // Mild + Subacute → First-line
          chronic: false,   // Mild + Chronic → Avoid repeated use
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Can use
          subacute: true,  // Moderate + Subacute → Can use with monitoring
          chronic: false,  // Moderate + Chronic → Need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false, // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      // Symptoms this medication is appropriate for
      appropriateSymptoms: ['ไข้', 'ปวดหัว', 'ปวดกล้ามเนื้อ', 'ปวดฟัน', 'ปวดประจำเดือน'],
      // Red-flag exclusions: Never recommend if these are present
      redFlagExclusions: ['ไข้สูงมาก (>39°C) ต่อเนื่อง', 'ปวดรุนแรงมาก', 'มีอาการทางระบบประสาท', 'ซึม', 'ชัก'],
      adultDose: {
        standard: '500-1000 มก.',
        frequency: 'ทุก 6 ชม.',
        maxDaily: '4000 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '10-15 มก./กก./ครั้ง',
        frequency: 'ทุก 6 ชม.',
        maxDaily: '60-75 มก./กก./วัน',
        instructions: 'หลังอาหาร',
        minAge: 0,
        maxAge: 12,
      },
      contraindications: ['แพ้พาราเซตามอล', 'โรคตับรุนแรง'],
      contraindicationsByDisease: {
        'โรคตับ': 'หลีกเลี่ยงหรือจำกัดขนาดยา (ไม่เกิน 2,000 มก./วัน)',
        'โรคไต': 'ใช้ได้ แต่ระวังในโรคไตรุนแรง',
        'ตั้งครรภ์': 'ใช้ได้ (ปลอดภัยในทุกไตรมาส)',
        'ให้นมบุตร': 'ใช้ได้ (ปลอดภัย)',
        'G6PD': 'ใช้ได้ (ปลอดภัย)',
      },
      cautions: ['โรคตับ', 'ดื่มแอลกอฮอล์', 'ใช้ยาอื่นที่มีพาราเซตามอล'],
      interactions: ['warfarin (เพิ่มความเสี่ยงเลือดออก)'],
      whenNotToSelfMedicate: ['ไข้สูงมาก (>39°C) ต่อเนื่อง', 'ปวดรุนแรงมาก', 'มีอาการทางระบบประสาท'],
      safetyNotes: 'ปลอดภัยที่สุดสำหรับเด็กและผู้ใหญ่',
      weightRanges: {
        child: {
          '<10kg': '10-15 มก./กก./ครั้ง (100-150 มก./ครั้ง)',
          '10-20kg': '10-15 มก./กก./ครั้ง (150-300 มก./ครั้ง)',
          '20-30kg': '10-15 มก./กก./ครั้ง (300-450 มก./ครั้ง)',
          '>30kg': '10-15 มก./กก./ครั้ง (450-600 มก./ครั้ง)',
        },
      },
    },
    {
      generic: 'ไอบูโพรเฟน',
      brandExamples: ['Brufen', 'Nurofen', 'Ibuprofen'],
      indication: 'ปวด, อักเสบ, ไข้',
      category: 'fever_pain',
      medicalLine: 'second_line', // MEDICAL HIERARCHY: Second-line for inflammation
      lineRationale: 'ลดการอักเสบได้ดีกว่า เหมาะสำหรับอาการอักเสบ',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: false,     // Mild + Acute → Prefer paracetamol first
          subacute: true,   // Mild + Subacute → Can use if paracetamol not effective
          chronic: false,   // Mild + Chronic → Avoid NSAID long-term
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Good for inflammation
          subacute: true,  // Moderate + Subacute → Good for inflammation
          chronic: false,  // Moderate + Chronic → Need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false, // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      // Symptoms this medication is appropriate for
      appropriateSymptoms: ['ปวดกล้ามเนื้อ', 'ปวดข้อ', 'ปวดหลัง', 'ปวดประจำเดือน', 'ไข้', 'ปวดฟัน'],
      // Red-flag exclusions: Never recommend if these are present
      redFlagExclusions: ['ปวดท้อง', 'มีเลือดออก', 'อาการไม่ดีขึ้นใน 3 วัน', 'แผลในกระเพาะ', 'โรคไตรุนแรง'],
      adultDose: {
        standard: '200-400 มก.',
        frequency: 'ทุก 6-8 ชม.',
        maxDaily: '1200 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '5-10 มก./กก./ครั้ง',
        frequency: 'ทุก 6-8 ชม.',
        maxDaily: '30-40 มก./กก./วัน',
        instructions: 'หลังอาหาร',
        minAge: 6, // เดือน
        maxAge: 12,
      },
      contraindications: ['แพ้ NSAID', 'แผลในกระเพาะ', 'โรคไตรุนแรง', 'ตั้งครรภ์ 3 เดือนสุดท้าย'],
      contraindicationsByDisease: {
        'โรคตับ': 'หลีกเลี่ยง (อาจทำให้ตับอักเสบ)',
        'โรคไต': 'ห้ามใช้ (อาจทำให้ไตเสื่อม)',
        'โรคหัวใจ': 'ระวัง (อาจทำให้บวมน้ำ)',
        'ความดันโลหิตสูง': 'ระวัง (อาจทำให้ความดันสูงขึ้น)',
        'หอบหืด': 'ห้ามใช้ (อาจทำให้หอบหืดกำเริบ)',
        'เบาหวาน': 'ใช้ได้ แต่ระวัง',
        'ตั้งครรภ์': 'ห้ามใช้ใน 3 เดือนสุดท้าย',
        'ให้นมบุตร': 'หลีกเลี่ยง (ผ่านน้ำนม)',
        'G6PD': 'ใช้ได้ (ปลอดภัย)',
      },
      cautions: ['โรคไต', 'โรคหัวใจ', 'ความดันโลหิตสูง', 'หอบหืด', 'ตั้งครรภ์'],
      interactions: ['warfarin', 'aspirin', 'ACE inhibitors', 'diuretics'],
      whenNotToSelfMedicate: ['ปวดท้อง', 'มีเลือดออก', 'อาการไม่ดีขึ้นใน 3 วัน'],
      safetyNotes: 'ห้ามใช้ในผู้แพ้ NSAID หรือมีแผลในกระเพาะ',
      weightRanges: {
        child: {
          '<10kg': '5-10 มก./กก./ครั้ง (50-100 มก./ครั้ง)',
          '10-20kg': '5-10 มก./กก./ครั้ง (100-200 มก./ครั้ง)',
          '20-30kg': '5-10 มก./กก./ครั้ง (200-300 มก./ครั้ง)',
          '>30kg': '5-10 มก./กก./ครั้ง (300-400 มก./ครั้ง)',
        },
      },
    },
    {
      generic: 'นาโพรเซน',
      brandExamples: ['Naproxen', 'Naprosyn', 'Aleve'],
      indication: 'ปวด, อักเสบ, ปวดประจำเดือน',
      category: 'fever_pain',
      medicalLine: 'second_line', // MEDICAL HIERARCHY: Second-line alternative NSAID
      lineRationale: 'ลดการอักเสบ เหมาะสำหรับปวดประจำเดือนและปวดกล้ามเนื้อ',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: false,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ปวดกล้ามเนื้อ', 'ปวดข้อ', 'ปวดหลัง', 'ปวดประจำเดือน', 'ปวดฟัน'],
      redFlagExclusions: ['ปวดท้อง', 'มีเลือดออก', 'แผลในกระเพาะ', 'โรคไตรุนแรง'],
      adultDose: {
        standard: '250-500 มก.',
        frequency: 'ทุก 8-12 ชม.',
        maxDaily: '1000 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '5-7 มก./กก./ครั้ง',
        frequency: 'ทุก 12 ชม.',
        maxDaily: '15 มก./กก./วัน',
        instructions: 'หลังอาหาร',
        minAge: 2, // ปี
        maxAge: 12,
      },
      contraindications: ['แพ้ NSAID', 'แผลในกระเพาะ', 'โรคไตรุนแรง', 'ตั้งครรภ์ 3 เดือนสุดท้าย'],
      contraindicationsByDisease: {
        'โรคตับ': 'หลีกเลี่ยง',
        'โรคไต': 'ห้ามใช้',
        'โรคหัวใจ': 'ระวัง',
        'ความดันโลหิตสูง': 'ระวัง',
        'หอบหืด': 'ห้ามใช้',
        'เบาหวาน': 'ใช้ได้ แต่ระวัง',
        'ตั้งครรภ์': 'ห้ามใช้ใน 3 เดือนสุดท้าย',
        'ให้นมบุตร': 'หลีกเลี่ยง',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['โรคไต', 'โรคหัวใจ', 'ความดันโลหิตสูง', 'หอบหืด'],
      interactions: ['warfarin', 'aspirin', 'ACE inhibitors', 'diuretics'],
      whenNotToSelfMedicate: ['ปวดท้อง', 'มีเลือดออก', 'อาการไม่ดีขึ้นใน 3 วัน'],
      safetyNotes: 'เหมาะสำหรับปวดประจำเดือนและปวดกล้ามเนื้อ',
    },
    {
      generic: 'ไดโคลฟีแนคเจล (ทาภายนอก)',
      brandExamples: ['Voltaren Gel', 'Diclofenac Gel'],
      indication: 'ปวดกล้ามเนื้อ, ปวดข้อ, บาดเจ็บ',
      category: 'fever_pain',
      medicalLine: 'alternative', // MEDICAL HIERARCHY: Alternative for muscle/joint pain
      lineRationale: 'ปลอดภัยกว่ายารับประทาน เหมาะสำหรับปวดกล้ามเนื้อและข้อ',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ปวดกล้ามเนื้อ', 'ปวดข้อ', 'ปวดหลัง', 'บาดเจ็บ', 'เคล็ด'],
      redFlagExclusions: ['แผลเปิด', 'ผิวหนังอักเสบ', 'แพ้ NSAID'],
      adultDose: {
        standard: 'ทาบริเวณที่ปวด',
        frequency: '3-4 ครั้ง/วัน',
        maxDaily: 'ไม่เกิน 4 ครั้ง/วัน',
        instructions: 'ทาให้ซึมซาบ ไม่ควรทาบริเวณที่มีแผล',
      },
      childDose: {
        byWeight: false,
        standard: 'ทาบริเวณที่ปวด',
        frequency: '2-3 ครั้ง/วัน',
        instructions: 'ใช้กับเด็กอายุ > 12 ปี',
        minAge: 12,
        maxAge: null,
      },
      contraindications: ['แพ้ NSAID', 'แผลเปิด', 'ผิวหนังอักเสบ'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ (ทาภายนอก)',
        'โรคไต': 'ใช้ได้ (ทาภายนอก)',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ใช้ได้ (ทาภายนอก)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ไม่ควรทาบริเวณที่มีแผล', 'ล้างมือหลังทา'],
      interactions: [],
      whenNotToSelfMedicate: ['แผลเปิด', 'ผิวหนังอักเสบ'],
      safetyNotes: 'ปลอดภัยกว่ายารับประทาน (ทาภายนอก)',
    },
    {
      generic: 'แอสไพริน',
      brandExamples: ['Aspirin', 'Bayer Aspirin'],
      indication: 'ปวด, ไข้ (ผู้ใหญ่เท่านั้น)',
      category: 'fever_pain',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: false,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ปวดหัว', 'ไข้', 'ปวดกล้ามเนื้อ'],
      redFlagExclusions: ['เด็กอายุ < 18 ปี', 'มีเลือดออก', 'แผลในกระเพาะ', 'แพ้แอสไพริน'],
      adultDose: {
        standard: '325-650 มก.',
        frequency: 'ทุก 4-6 ชม.',
        maxDaily: '4000 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: false,
        standard: 'ห้ามใช้ในเด็กอายุ < 18 ปี',
        instructions: 'ห้ามใช้ในเด็ก (เสี่ยงต่อ Reye syndrome)',
        minAge: 18,
        maxAge: null,
      },
      contraindications: ['เด็กอายุ < 18 ปี', 'แพ้แอสไพริน', 'แผลในกระเพาะ', 'มีเลือดออก', 'ตั้งครรภ์'],
      contraindicationsByDisease: {
        'โรคตับ': 'หลีกเลี่ยง',
        'โรคไต': 'ห้ามใช้',
        'โรคหัวใจ': 'ระวัง (อาจมีปฏิกิริยากับยาละลายลิ่มเลือด)',
        'ความดันโลหิตสูง': 'ระวัง',
        'หอบหืด': 'ห้ามใช้ (อาจทำให้หอบหืดกำเริบ)',
        'เบาหวาน': 'ระวัง',
        'ตั้งครรภ์': 'ห้ามใช้',
        'ให้นมบุตร': 'หลีกเลี่ยง',
        'G6PD': 'ห้ามใช้',
      },
      cautions: ['ห้ามใช้ในเด็ก', 'ระวังเลือดออก', 'ไม่ควรใช้ร่วมกับยาละลายลิ่มเลือด'],
      interactions: ['warfarin', 'clopidogrel', 'ACE inhibitors', 'diuretics', 'methotrexate'],
      whenNotToSelfMedicate: ['เด็กอายุ < 18 ปี', 'มีเลือดออก', 'แผลในกระเพาะ'],
      safetyNotes: 'ห้ามใช้ในเด็กอายุ < 18 ปี (เสี่ยงต่อ Reye syndrome)',
    },
    {
      generic: 'พาราเซตามอล + คาเฟอีน',
      brandExamples: ['Paracetamol + Caffeine', 'Tylenol Extra'],
      indication: 'ปวดหัว, ปวดเมื่อย (เหมาะสำหรับปวดหัวที่เกิดจากความเครียด)',
      category: 'fever_pain',
      medicalLine: 'alternative', // MEDICAL HIERARCHY: Alternative for tension-type headache
      lineRationale: 'คาเฟอีนช่วยเพิ่มประสิทธิภาพ เหมาะสำหรับปวดหัวจากความเครียด',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ปวดหัว', 'ปวดหัวจากความเครียด', 'ปวดเมื่อย'],
      redFlagExclusions: ['ปวดหัวรุนแรงมาก', 'มีไข้สูง', 'มีอาการทางระบบประสาท'],
      adultDose: {
        standard: '500-1000 มก. พาราเซตามอล + 65-130 มก. คาเฟอีน',
        frequency: 'ทุก 6 ชม.',
        maxDaily: '4000 มก. พาราเซตามอล/วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: false,
        standard: 'ไม่แนะนำสำหรับเด็ก (คาเฟอีนอาจทำให้ใจสั่น)',
        instructions: 'ใช้กับผู้ใหญ่อายุ > 18 ปีเท่านั้น',
        minAge: 18,
        maxAge: null,
      },
      contraindications: ['เด็กอายุ < 18 ปี', 'แพ้พาราเซตามอล', 'แพ้คาเฟอีน', 'โรคหัวใจ', 'ความดันโลหิตสูง', 'นอนไม่หลับ'],
      contraindicationsByDisease: {
        'โรคตับ': 'หลีกเลี่ยงหรือจำกัดขนาดยา',
        'โรคไต': 'ใช้ได้ แต่ระวัง',
        'โรคหัวใจ': 'ห้ามใช้ (คาเฟอีนทำให้ใจสั่น)',
        'ความดันโลหิตสูง': 'ห้ามใช้ (คาเฟอีนทำให้ความดันสูงขึ้น)',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ระวัง (คาเฟอีนผ่านน้ำนม)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['คาเฟอีนอาจทำให้ใจสั่น นอนไม่หลับ', 'ไม่ควรใช้ก่อนนอน', 'ไม่ควรใช้ร่วมกับเครื่องดื่มที่มีคาเฟอีน'],
      interactions: ['warfarin', 'ยานอนหลับ'],
      whenNotToSelfMedicate: ['ปวดหัวรุนแรงมาก', 'มีไข้สูง', 'มีอาการทางระบบประสาท'],
      safetyNotes: 'เหมาะสำหรับปวดหัวจากความเครียด คาเฟอีนช่วยเพิ่มประสิทธิภาพของพาราเซตามอล',
    },
  ],

  // 🤧 คัดจมูก/น้ำมูก/จาม (Nasal Congestion/Runny Nose/Sneezing)
  nasal_congestion: [
    {
      generic: 'คลอร์เฟนิรามีน',
      brandExamples: ['Chlorpheniramine', 'Teldrin'],
      indication: 'น้ำมูก, จาม, คัน',
      category: 'nasal_congestion',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line for allergy
          subacute: true,   // Mild + Subacute → Can use
          chronic: false,  // Mild + Chronic → Need doctor evaluation
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Can use
          subacute: true,  // Moderate + Subacute → Can use with monitoring
          chronic: false,  // Moderate + Chronic → Need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false,  // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      appropriateSymptoms: ['น้ำมูก', 'จาม', 'คัน', 'คัดจมูก', 'แพ้'],
      redFlagExclusions: ['หายใจลำบาก', 'มีไข้สูง', 'น้ำมูกสีเขียว/เหลืองมาก', 'ซึม'],
      adultDose: {
        standard: '4 มก.',
        frequency: 'ทุก 6-8 ชม.',
        maxDaily: '24 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '0.1-0.2 มก./กก./ครั้ง',
        frequency: 'ทุก 6-8 ชม.',
        maxDaily: '0.5-1 มก./กก./วัน',
        instructions: 'หลังอาหาร',
        minAge: 2, // ปี
        maxAge: 12,
      },
      contraindications: ['แพ้ antihistamine', 'โรคต้อหิน', 'ต่อมลูกหมากโต'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้ แต่ระวัง',
        'โรคหัวใจ': 'ระวัง (อาจทำให้ใจสั่น)',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ระวัง (ผ่านน้ำนม)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ง่วงนอน', 'ขับรถ', 'ทำงานกับเครื่องจักร', 'ตั้งครรภ์', 'ให้นม'],
      interactions: ['ยานอนหลับ', 'แอลกอฮอล์', 'ยาระงับประสาท'],
      whenNotToSelfMedicate: ['หายใจลำบาก', 'มีไข้สูง', 'น้ำมูกสีเขียว/เหลืองมาก'],
      safetyNotes: 'อาจทำให้ง่วงนอน หลีกเลี่ยงการขับรถ',
      weightRanges: {
        child: {
          '<10kg': '0.1-0.2 มก./กก./ครั้ง (1-2 มก./ครั้ง)',
          '10-20kg': '0.1-0.2 มก./กก./ครั้ง (2-4 มก./ครั้ง)',
          '20-30kg': '0.1-0.2 มก./กก./ครั้ง (4-6 มก./ครั้ง)',
          '>30kg': '0.1-0.2 มก./กก./ครั้ง (6-8 มก./ครั้ง)',
        },
      },
    },
    {
      generic: 'น้ำเกลือล้างจมูก',
      brandExamples: ['Normal Saline', 'Sea Water Spray'],
      indication: 'คัดจมูก, น้ำมูก',
      category: 'nasal_congestion',
      medicalLine: 'alternative', // MEDICAL HIERARCHY: Alternative non-drug option
      lineRationale: 'ปลอดภัยที่สุด ไม่มีผลข้างเคียง',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line, safest
          subacute: true,  // Mild + Subacute → Safe to use
          chronic: true,   // Mild + Chronic → Safe for long-term
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Can use
          subacute: true,  // Moderate + Subacute → Can use
          chronic: true,   // Moderate + Chronic → Safe, but need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false, // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      appropriateSymptoms: ['น้ำมูก', 'คัดจมูก', 'จาม', 'แพ้'],
      redFlagExclusions: ['หายใจลำบาก', 'มีไข้สูง', 'ซึม'],
      adultDose: {
        standard: '1-2 ครั้งต่อรูจมูก',
        frequency: '2-4 ครั้ง/วัน',
        maxDaily: 'ไม่จำกัด',
        instructions: 'ล้างจมูกก่อนใช้ยาอื่น',
      },
      childDose: {
        byWeight: false,
        standard: '1 ครั้งต่อรูจมูก',
        frequency: '2-3 ครั้ง/วัน',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: null,
      },
      contraindications: [],
      cautions: ['ใช้อย่างระมัดระวังในเด็กเล็ก'],
      interactions: [],
      whenNotToSelfMedicate: [],
      safetyNotes: 'ปลอดภัยที่สุด ไม่มีผลข้างเคียง',
    },
    {
      generic: 'ลอราทาดีน',
      brandExamples: ['Claritin', 'Loratadine'],
      indication: 'น้ำมูก, จาม, คัน, แพ้ (ไม่ทำให้ง่วง)',
      category: 'nasal_congestion',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line non-sedating antihistamine
      lineRationale: 'ไม่ทำให้ง่วงนอน เหมาะสำหรับผู้ที่ต้องขับรถหรือทำงาน',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['น้ำมูก', 'จาม', 'คัน', 'คัดจมูก', 'แพ้', 'ผื่น'],
      redFlagExclusions: ['หายใจลำบาก', 'มีไข้สูง', 'ซึม'],
      adultDose: {
        standard: '10 มก.',
        frequency: 'วันละ 1 ครั้ง',
        maxDaily: '10 มก./วัน',
        instructions: 'ก่อนหรือหลังอาหาร',
      },
      childDose: {
        byWeight: false,
        standard: '5 มก.',
        frequency: 'วันละ 1 ครั้ง',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: 12,
      },
      contraindications: ['แพ้ loratadine'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ระวัง (ผ่านน้ำนม)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ขับรถได้ (ไม่ทำให้ง่วง)'],
      interactions: [],
      whenNotToSelfMedicate: ['หายใจลำบาก', 'มีไข้สูง'],
      safetyNotes: 'ไม่ทำให้ง่วงนอน เหมาะสำหรับผู้ที่ต้องขับรถหรือทำงาน',
    },
    {
      generic: 'เซทิริซีน',
      brandExamples: ['Zyrtec', 'Cetirizine'],
      indication: 'น้ำมูก, จาม, คัน, แพ้ (อาจทำให้ง่วงเล็กน้อย)',
      category: 'nasal_congestion',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line alternative antihistamine
      lineRationale: 'อาจทำให้ง่วงนอนเล็กน้อย เหมาะสำหรับใช้ก่อนนอน',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['น้ำมูก', 'จาม', 'คัน', 'คัดจมูก', 'แพ้', 'ผื่น'],
      redFlagExclusions: ['หายใจลำบาก', 'มีไข้สูง', 'ซึม'],
      adultDose: {
        standard: '10 มก.',
        frequency: 'วันละ 1 ครั้ง',
        maxDaily: '10 มก./วัน',
        instructions: 'ก่อนนอน (อาจทำให้ง่วง)',
      },
      childDose: {
        byWeight: false,
        standard: '5 มก.',
        frequency: 'วันละ 1 ครั้ง',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: 12,
      },
      contraindications: ['แพ้ cetirizine'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้ แต่ระวัง',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ระวัง (ผ่านน้ำนม)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['อาจทำให้ง่วงนอน', 'หลีกเลี่ยงการขับรถ'],
      interactions: [],
      whenNotToSelfMedicate: ['หายใจลำบาก', 'มีไข้สูง'],
      safetyNotes: 'อาจทำให้ง่วงนอนเล็กน้อย เหมาะสำหรับใช้ก่อนนอน',
    },
    {
      generic: 'ซูโดเอฟีดรีน',
      brandExamples: ['Sudafed', 'Pseudoephedrine'],
      indication: 'คัดจมูก, น้ำมูก (ไม่ทำให้ง่วง)',
      category: 'nasal_congestion',
      medicalLine: 'second_line', // MEDICAL HIERARCHY: Second-line for nasal congestion
      lineRationale: 'ลดคัดจมูกได้ดี แต่ห้ามใช้ในผู้ที่มีความดันโลหิตสูงหรือโรคหัวใจ',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['คัดจมูก', 'น้ำมูก', 'ไซนัสอักเสบ'],
      redFlagExclusions: ['ความดันโลหิตสูง', 'โรคหัวใจ', 'หอบหืด', 'ต่อมลูกหมากโต', 'ตั้งครรภ์'],
      adultDose: {
        standard: '30-60 มก.',
        frequency: 'ทุก 4-6 ชม.',
        maxDaily: '240 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '4 มก./กก./วัน แบ่ง 3-4 ครั้ง',
        frequency: 'ทุก 4-6 ชม.',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: 12,
      },
      contraindications: ['ความดันโลหิตสูง', 'โรคหัวใจ', 'หอบหืด', 'ต่อมลูกหมากโต', 'ตั้งครรภ์', 'ให้นมบุตร'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้ แต่ระวัง',
        'โรคหัวใจ': 'ห้ามใช้ (ทำให้ใจสั่น)',
        'ความดันโลหิตสูง': 'ห้ามใช้ (ทำให้ความดันสูงขึ้น)',
        'หอบหืด': 'ห้ามใช้ (อาจทำให้หอบหืดกำเริบ)',
        'เบาหวาน': 'ใช้ได้ แต่ระวัง',
        'ตั้งครรภ์': 'ห้ามใช้',
        'ให้นมบุตร': 'ห้ามใช้',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ทำให้ใจสั่น', 'ไม่ควรใช้ก่อนนอน', 'ไม่ควรใช้ร่วมกับยาลดความดัน'],
      interactions: ['MAO inhibitors', 'ยาลดความดัน', 'ยารักษาโรคหัวใจ'],
      whenNotToSelfMedicate: ['ความดันโลหิตสูง', 'โรคหัวใจ', 'หอบหืด'],
      safetyNotes: 'ไม่ทำให้ง่วงนอน แต่ห้ามใช้ในผู้ที่มีความดันโลหิตสูงหรือโรคหัวใจ',
    },
  ],

  // 😷 เจ็บคอ/ไอ (Sore Throat/Cough)
  sore_throat_cough: [
    {
      generic: 'ยาอมบรรเทาอาการเจ็บคอ',
      brandExamples: ['Strepsils', "Fisherman's Friend", 'Halls'],
      indication: 'เจ็บคอ, แสบคอ',
      category: 'sore_throat_cough',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line
          subacute: true,  // Mild + Subacute → Can use
          chronic: false,  // Mild + Chronic → Need doctor evaluation
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Can use
          subacute: true,  // Moderate + Subacute → Can use with monitoring
          chronic: false,  // Moderate + Chronic → Need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false, // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      appropriateSymptoms: ['เจ็บคอ', 'แสบคอ', 'ไอ', 'คอแห้ง'],
      redFlagExclusions: ['เจ็บคอรุนแรงมาก', 'กลืนลำบาก', 'มีไข้สูง', 'หายใจลำบาก'],
      adultDose: {
        standard: '1-2 เม็ด',
        frequency: 'ทุก 2-3 ชม.',
        maxDaily: '8-12 เม็ด/วัน',
        instructions: 'อมให้ละลายในปาก',
      },
      childDose: {
        byWeight: false,
        standard: '1 เม็ด',
        frequency: 'ทุก 3-4 ชม.',
        maxDaily: '6-8 เม็ด/วัน',
        instructions: 'ใช้กับเด็กอายุ > 4 ปี',
        minAge: 4,
        maxAge: 12,
      },
      contraindications: ['แพ้ส่วนประกอบ'],
      cautions: ['ไม่ควรใช้ติดต่อกันเกิน 3 วัน', 'เด็กเล็กอาจสำลัก'],
      interactions: [],
      whenNotToSelfMedicate: ['เจ็บคอรุนแรงมาก', 'กลืนลำบาก', 'มีไข้สูง'],
      safetyNotes: 'ช่วยบรรเทาอาการชั่วคราว',
    },
    {
      generic: 'น้ำผึ้งผสมมะนาว',
      brandExamples: ['Home Remedy'],
      indication: 'เจ็บคอ, ไอ',
      category: 'sore_throat_cough',
      medicalLine: 'alternative', // MEDICAL HIERARCHY: Alternative non-drug option
      lineRationale: 'ปลอดภัย ธรรมชาติ',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line, safest
          subacute: true,  // Mild + Subacute → Safe to use
          chronic: true,   // Mild + Chronic → Safe for long-term
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Can use
          subacute: true,  // Moderate + Subacute → Can use
          chronic: true,   // Moderate + Chronic → Safe, but need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false, // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      appropriateSymptoms: ['เจ็บคอ', 'ไอ', 'คอแห้ง'],
      redFlagExclusions: ['เด็กอายุ < 1 ปี (น้ำผึ้ง)', 'เจ็บคอรุนแรงมาก', 'กลืนลำบาก', 'หายใจลำบาก'],
      adultDose: {
        standard: '1-2 ช้อนชา',
        frequency: 'ทุก 2-3 ชม.',
        maxDaily: 'ไม่จำกัด',
        instructions: 'ผสมน้ำอุ่นดื่ม',
      },
      childDose: {
        byWeight: false,
        standard: '1 ช้อนชา',
        frequency: 'ทุก 3-4 ชม.',
        instructions: 'ใช้กับเด็กอายุ > 1 ปี (ห้ามน้ำผึ้งในเด็ก < 1 ปี)',
        minAge: 1,
        maxAge: null,
      },
      contraindications: ['เด็กอายุ < 1 ปี (น้ำผึ้ง)'],
      cautions: ['เบาหวาน (ระวังน้ำตาล)'],
      interactions: [],
      whenNotToSelfMedicate: [],
      safetyNotes: 'ปลอดภัย ธรรมชาติ',
    },
    {
      generic: 'เดกซ์โทรเมทอร์แฟน',
      brandExamples: ['Robitussin DM', 'Dextromethorphan'],
      indication: 'ไอแห้ง, ไอไม่มีเสมหะ',
      category: 'sore_throat_cough',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for dry cough
      lineRationale: 'เหมาะสำหรับไอแห้งเท่านั้น ห้ามใช้ในไอมีเสมหะ',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ไอแห้ง', 'ไอไม่มีเสมหะ', 'ไอตอนกลางคืน'],
      redFlagExclusions: ['ไอมีเสมหะเขียว/เหลือง', 'หายใจลำบาก', 'มีไข้สูง', 'ซึม'],
      adultDose: {
        standard: '15-30 มก.',
        frequency: 'ทุก 4-6 ชม.',
        maxDaily: '120 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '1 มก./กก./ครั้ง',
        frequency: 'ทุก 4-6 ชม.',
        maxDaily: '4 มก./กก./วัน',
        instructions: 'ใช้กับเด็กอายุ > 4 ปี',
        minAge: 4,
        maxAge: 12,
      },
      contraindications: ['เด็กอายุ < 4 ปี', 'ไอมีเสมหะ', 'แพ้ dextromethorphan'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ระวัง (ผ่านน้ำนม)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ห้ามใช้ในไอมีเสมหะ', 'อาจทำให้ง่วงนอน'],
      interactions: ['MAO inhibitors', 'ยานอนหลับ'],
      whenNotToSelfMedicate: ['ไอมีเสมหะเขียว/เหลือง', 'หายใจลำบาก', 'มีไข้สูง'],
      safetyNotes: 'เหมาะสำหรับไอแห้งเท่านั้น ห้ามใช้ในไอมีเสมหะ',
    },
    {
      generic: 'กวายเฟนีซิน',
      brandExamples: ['Mucinex', 'Guaifenesin'],
      indication: 'ไอมีเสมหะ, เสมหะเหนียว',
      category: 'sore_throat_cough',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for productive cough
      lineRationale: 'ช่วยละลายเสมหะ ปลอดภัย',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ไอมีเสมหะ', 'เสมหะเหนียว', 'ไอมีเสมหะข้น'],
      redFlagExclusions: ['ไอมีเสมหะเขียว/เหลืองมาก', 'หายใจลำบาก', 'มีไข้สูง', 'ซึม'],
      adultDose: {
        standard: '200-400 มก.',
        frequency: 'ทุก 4 ชม.',
        maxDaily: '2400 มก./วัน',
        instructions: 'ดื่มน้ำมากๆ',
      },
      childDose: {
        byWeight: true,
        formula: '5-10 มก./กก./ครั้ง',
        frequency: 'ทุก 4 ชม.',
        maxDaily: '40 มก./กก./วัน',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี ดื่มน้ำมากๆ',
        minAge: 2,
        maxAge: 12,
      },
      contraindications: ['แพ้ guaifenesin'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้',
        'โรคไต': 'ใช้ได้',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ใช้ได้ (ปลอดภัย)',
        'ให้นมบุตร': 'ใช้ได้ (ปลอดภัย)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ดื่มน้ำมากๆ เพื่อช่วยละลายเสมหะ'],
      interactions: [],
      whenNotToSelfMedicate: ['ไอมีเสมหะเขียว/เหลืองมาก', 'หายใจลำบาก'],
      safetyNotes: 'ปลอดภัย ช่วยละลายเสมหะ',
    },
  ],

  // 🤢 คลื่นไส้/ท้องเสีย/กรดไหลย้อน (Nausea/Diarrhea/Reflux)
  gi_symptoms: [
    {
      generic: 'ORS (น้ำเกลือแร่)',
      brandExamples: ['ORS', 'Pedialyte'],
      indication: 'ท้องเสีย, อาเจียน',
      category: 'gi_symptoms',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for diarrhea (critical)
      lineRationale: 'สำคัญที่สุดสำหรับท้องเสีย ป้องกันการขาดน้ำ',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line, critical
          subacute: true,   // Mild + Subacute → Important
          chronic: true,    // Mild + Chronic → Can use
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Critical, use immediately
          subacute: true,  // Moderate + Subacute → Important
          chronic: true,   // Moderate + Chronic → Can use, but need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, need IV fluids
          subacute: false, // Severe + Subacute → Need doctor/hospital
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      appropriateSymptoms: ['ท้องเสีย', 'อาเจียน', 'ถ่ายเหลว', 'ขาดน้ำ'],
      redFlagExclusions: ['ถ่ายเป็นเลือด', 'อาเจียนมาก', 'ซึม', 'ไม่ปัสสาวะ', 'ขาดน้ำรุนแรง'],
      adultDose: {
        standard: '1 ซองผสมน้ำ 200-250 มล.',
        frequency: 'ดื่มบ่อยๆ หลังถ่าย/อาเจียน',
        maxDaily: 'ไม่จำกัด',
        instructions: 'ดื่มแทนน้ำ',
      },
      childDose: {
        byWeight: true,
        formula: '50-100 มล./กก./วัน',
        frequency: 'ดื่มบ่อยๆ',
        instructions: 'ดื่มแทนน้ำ',
        minAge: 0,
        maxAge: null,
      },
      contraindications: [],
      cautions: [],
      interactions: [],
      whenNotToSelfMedicate: ['ถ่ายเป็นเลือด', 'อาเจียนมาก', 'ซึม', 'ไม่ปัสสาวะ'],
      safetyNotes: 'สำคัญที่สุดสำหรับท้องเสีย',
    },
    {
      generic: 'Simethicone',
      brandExamples: ['Gas-X', 'Mylicon'],
      indication: 'ท้องอืด, แน่นท้อง',
      category: 'gi_symptoms',
      medicalLine: 'alternative', // MEDICAL HIERARCHY: Alternative for bloating
      lineRationale: 'ปลอดภัย ไม่ดูดซึม',
      // MEDICAL-GRADE: Indications mapped to Severity × Time-course
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,      // Mild + Acute → First-line
          subacute: true,   // Mild + Subacute → Can use
          chronic: false,  // Mild + Chronic → Need doctor evaluation
          progressive: false, // Mild + Progressive → May mask symptoms
        },
        moderate: {
          acute: true,      // Moderate + Acute → Can use
          subacute: true,  // Moderate + Subacute → Can use with monitoring
          chronic: false,  // Moderate + Chronic → Need doctor evaluation
          progressive: false, // Moderate + Progressive → Avoid masking
        },
        severe: {
          acute: false,     // Severe + Acute → Emergency, no OTC
          subacute: false, // Severe + Subacute → Need doctor
          chronic: false,  // Severe + Chronic → Need specialist
          progressive: false, // Severe + Progressive → Emergency
        },
      },
      appropriateSymptoms: ['ท้องอืด', 'แน่นท้อง', 'มีลมในท้อง'],
      redFlagExclusions: ['ปวดท้องรุนแรง', 'มีไข้', 'มีเลือดออก', 'ซึม'],
      adultDose: {
        standard: '40-80 มก.',
        frequency: 'หลังอาหาร',
        maxDaily: '240 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: false,
        standard: '20-40 มก.',
        frequency: 'หลังอาหาร',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: 12,
      },
      contraindications: ['แพ้ simethicone'],
      cautions: [],
      interactions: [],
      whenNotToSelfMedicate: ['ปวดท้องรุนแรง', 'มีไข้'],
      safetyNotes: 'ปลอดภัย ไม่ดูดซึม',
    },
    {
      generic: 'โลเพอราไมด์',
      brandExamples: ['Imodium', 'Loperamide'],
      indication: 'ท้องเสีย (ไม่ติดเชื้อ)',
      category: 'gi_symptoms',
      medicalLine: 'second_line', // MEDICAL HIERARCHY: Second-line for non-infectious diarrhea
      lineRationale: 'ห้ามใช้ในท้องเสียติดเชื้อ ควรใช้ร่วมกับ ORS',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: false,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: false,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ท้องเสีย', 'ถ่ายเหลว', 'ท้องเสียไม่ติดเชื้อ'],
      redFlagExclusions: ['ถ่ายเป็นเลือด', 'มีไข้', 'ซึม', 'ท้องเสียติดเชื้อ', 'เด็กอายุ < 2 ปี'],
      adultDose: {
        standard: '2-4 มก.',
        frequency: 'ครั้งแรก 4 มก. หลังจากนั้น 2 มก. ทุกครั้งที่ถ่าย',
        maxDaily: '16 มก./วัน',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: true,
        formula: '0.1-0.2 มก./กก./ครั้ง',
        frequency: 'ทุกครั้งที่ถ่าย',
        maxDaily: '0.8 มก./กก./วัน',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: 12,
      },
      contraindications: ['เด็กอายุ < 2 ปี', 'ถ่ายเป็นเลือด', 'มีไข้', 'ท้องเสียติดเชื้อ'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ระวัง (ควรปรึกษาแพทย์)',
        'ให้นมบุตร': 'ระวัง (ผ่านน้ำนม)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ห้ามใช้ในท้องเสียติดเชื้อ', 'ใช้ร่วมกับ ORS'],
      interactions: [],
      whenNotToSelfMedicate: ['ถ่ายเป็นเลือด', 'มีไข้', 'ท้องเสียติดเชื้อ'],
      safetyNotes: 'ห้ามใช้ในท้องเสียติดเชื้อ ควรใช้ร่วมกับ ORS',
    },
    {
      generic: 'ยาลดกรด (แอนตาซิด)',
      brandExamples: ['Tums', 'Rolaids', 'Gaviscon'],
      indication: 'กรดไหลย้อน, แสบร้อนกลางอก, ท้องอืด',
      category: 'gi_symptoms',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for acid reflux
      lineRationale: 'บรรเทาอาการได้เร็ว ปลอดภัย',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['กรดไหลย้อน', 'แสบร้อนกลางอก', 'ท้องอืด', 'แน่นท้อง'],
      redFlagExclusions: ['ปวดท้องรุนแรง', 'อาเจียนเป็นเลือด', 'ถ่ายเป็นเลือด'],
      adultDose: {
        standard: '1-2 เม็ด',
        frequency: 'หลังอาหารหรือเมื่อมีอาการ',
        maxDaily: '6-8 เม็ด/วัน',
        instructions: 'เคี้ยวหรือละลายในปาก',
      },
      childDose: {
        byWeight: false,
        standard: '1 เม็ด',
        frequency: 'หลังอาหารหรือเมื่อมีอาการ',
        instructions: 'ใช้กับเด็กอายุ > 6 ปี',
        minAge: 6,
        maxAge: 12,
      },
      contraindications: ['แพ้ส่วนประกอบ'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้',
        'โรคไต': 'ใช้ได้ แต่ระวัง',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้ (เลือกแบบไม่มีน้ำตาล)',
        'ตั้งครรภ์': 'ใช้ได้ (ปลอดภัย)',
        'ให้นมบุตร': 'ใช้ได้ (ปลอดภัย)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ไม่ควรใช้ติดต่อกันเกิน 2 สัปดาห์'],
      interactions: ['ยาอื่น (ควรเว้นระยะ 2 ชม.)'],
      whenNotToSelfMedicate: ['ปวดท้องรุนแรง', 'อาเจียนเป็นเลือด'],
      safetyNotes: 'ปลอดภัย ใช้บรรเทาอาการชั่วคราว',
    },
    {
      generic: 'โพรไบโอติก',
      brandExamples: ['Lactobacillus', 'Probiotics'],
      indication: 'ท้องเสีย, ท้องอืด, ระบบย่อยอาหาร',
      category: 'gi_symptoms',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ท้องเสีย', 'ท้องอืด', 'ระบบย่อยอาหาร', 'หลังใช้ยาปฏิชีวนะ'],
      redFlagExclusions: ['ถ่ายเป็นเลือด', 'มีไข้สูง', 'ซึม'],
      adultDose: {
        standard: '1-2 แคปซูล',
        frequency: 'วันละ 1-2 ครั้ง',
        maxDaily: 'ไม่จำกัด',
        instructions: 'หลังอาหาร',
      },
      childDose: {
        byWeight: false,
        standard: '1 แคปซูล',
        frequency: 'วันละ 1 ครั้ง',
        instructions: 'ใช้กับเด็กอายุ > 1 ปี',
        minAge: 1,
        maxAge: null,
      },
      contraindications: ['แพ้ส่วนประกอบ'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้',
        'โรคไต': 'ใช้ได้',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ใช้ได้ (ปลอดภัย)',
        'ให้นมบุตร': 'ใช้ได้ (ปลอดภัย)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['เก็บในตู้เย็น'],
      interactions: [],
      whenNotToSelfMedicate: [],
      safetyNotes: 'ปลอดภัยมาก ช่วยปรับสมดุลแบคทีเรียในลำไส้',
    },
    {
      generic: 'ฟาโมทิดีน',
      brandExamples: ['Pepcid', 'Famotidine'],
      indication: 'กรดไหลย้อน, แสบร้อนกลางอก, แผลในกระเพาะ',
      category: 'gi_symptoms',
      medicalLine: 'second_line', // MEDICAL HIERARCHY: Second-line for GERD
      lineRationale: 'ปลอดภัยกว่า antacids สำหรับใช้ต่อเนื่อง',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['กรดไหลย้อน', 'แสบร้อนกลางอก', 'แผลในกระเพาะ', 'ท้องอืด'],
      redFlagExclusions: ['อาเจียนเป็นเลือด', 'ถ่ายเป็นเลือด', 'ปวดท้องรุนแรง'],
      adultDose: {
        standard: '20 มก.',
        frequency: 'วันละ 1-2 ครั้ง',
        maxDaily: '40 มก./วัน',
        instructions: 'ก่อนอาหารหรือก่อนนอน',
      },
      childDose: {
        byWeight: true,
        formula: '0.5-1 มก./กก./วัน แบ่ง 2 ครั้ง',
        frequency: 'วันละ 2 ครั้ง',
        instructions: 'ใช้กับเด็กอายุ > 1 ปี',
        minAge: 1,
        maxAge: 12,
      },
      contraindications: ['แพ้ famotidine', 'โรคไตรุนแรง'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ แต่ระวัง',
        'โรคไต': 'ใช้ได้ แต่ระวัง (ลดขนาดยา)',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ใช้ได้ (ปลอดภัย)',
        'ให้นมบุตร': 'ใช้ได้ (ปลอดภัย)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ไม่ควรใช้ติดต่อกันเกิน 2 สัปดาห์', 'ควรปรึกษาแพทย์หากอาการไม่ดีขึ้น'],
      interactions: ['ยาอื่น (ลดการดูดซึม)'],
      whenNotToSelfMedicate: ['อาเจียนเป็นเลือด', 'ถ่ายเป็นเลือด', 'ปวดท้องรุนแรง'],
      safetyNotes: 'ปลอดภัยกว่า antacids สำหรับใช้ต่อเนื่อง',
    },
  ],

  // 🧴 ผิวหนัง/แพ้ (Skin/Allergy Topicals)
  skin_allergy: [
    {
      generic: 'ไฮโดรคอร์ติโซน 1% (ทาภายนอก)',
      brandExamples: ['Hydrocortisone 1%', 'Cortaid'],
      indication: 'ผื่นคัน, ผื่นแพ้, ผิวหนังอักเสบ',
      category: 'skin_allergy',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for skin allergy/itch
      lineRationale: 'ไม่ควรใช้ติดต่อกันเกิน 1 สัปดาห์',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ผื่นคัน', 'ผื่นแพ้', 'ผิวหนังอักเสบ', 'คัน'],
      redFlagExclusions: ['แผลติดเชื้อ', 'มีหนอง', 'มีไข้', 'ผื่นลาม'],
      adultDose: {
        standard: 'ทาบริเวณที่คัน',
        frequency: 'วันละ 2-3 ครั้ง',
        maxDaily: 'ไม่เกิน 3 ครั้ง/วัน',
        instructions: 'ทาให้บางๆ ไม่ควรทาบริเวณที่มีแผลเปิด',
      },
      childDose: {
        byWeight: false,
        standard: 'ทาบริเวณที่คัน',
        frequency: 'วันละ 1-2 ครั้ง',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: null,
      },
      contraindications: ['แผลติดเชื้อ', 'มีหนอง', 'แพ้ hydrocortisone'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ (ทาภายนอก)',
        'โรคไต': 'ใช้ได้ (ทาภายนอก)',
        'โรคหัวใจ': 'ใช้ได้ (ทาภายนอก)',
        'ความดันโลหิตสูง': 'ใช้ได้ (ทาภายนอก)',
        'หอบหืด': 'ใช้ได้ (ทาภายนอก)',
        'เบาหวาน': 'ใช้ได้ (ทาภายนอก)',
        'ตั้งครรภ์': 'ใช้ได้ (ทาภายนอก)',
        'ให้นมบุตร': 'ใช้ได้ (ทาภายนอก)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ไม่ควรใช้ติดต่อกันเกิน 1 สัปดาห์', 'ไม่ควรทาบริเวณที่มีแผลเปิด', 'ไม่ควรทาบริเวณกว้าง'],
      interactions: [],
      whenNotToSelfMedicate: ['แผลติดเชื้อ', 'มีหนอง', 'ผื่นลาม'],
      safetyNotes: 'ปลอดภัยสำหรับใช้ทาภายนอก (ความเข้มข้น 1%)',
    },
    {
      generic: 'คาลาไมน์ (ทาภายนอก)',
      brandExamples: ['Calamine Lotion'],
      indication: 'ผื่นคัน, ผื่นแพ้, แมลงกัดต่อย',
      category: 'skin_allergy',
      medicalLine: 'alternative', // MEDICAL HIERARCHY: Alternative for skin allergy
      lineRationale: 'ปลอดภัยมาก เหมาะสำหรับเด็กและผู้ใหญ่',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: false,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['ผื่นคัน', 'ผื่นแพ้', 'แมลงกัดต่อย', 'คัน'],
      redFlagExclusions: ['แผลติดเชื้อ', 'มีหนอง'],
      adultDose: {
        standard: 'ทาบริเวณที่คัน',
        frequency: 'เมื่อมีอาการ',
        maxDaily: 'ไม่จำกัด',
        instructions: 'เขย่าขวดก่อนใช้ ทาให้บางๆ',
      },
      childDose: {
        byWeight: false,
        standard: 'ทาบริเวณที่คัน',
        frequency: 'เมื่อมีอาการ',
        instructions: 'ใช้ได้ทุกวัย',
        minAge: 0,
        maxAge: null,
      },
      contraindications: ['แพ้ calamine'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้',
        'โรคไต': 'ใช้ได้',
        'โรคหัวใจ': 'ใช้ได้',
        'ความดันโลหิตสูง': 'ใช้ได้',
        'หอบหืด': 'ใช้ได้',
        'เบาหวาน': 'ใช้ได้',
        'ตั้งครรภ์': 'ใช้ได้ (ปลอดภัย)',
        'ให้นมบุตร': 'ใช้ได้ (ปลอดภัย)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ไม่ควรทาบริเวณที่มีแผลเปิด'],
      interactions: [],
      whenNotToSelfMedicate: [],
      safetyNotes: 'ปลอดภัยมาก เหมาะสำหรับเด็กและผู้ใหญ่',
    },
    {
      generic: 'คลอไตรมาโซล (ทาภายนอก)',
      brandExamples: ['Clotrimazole', 'Canesten'],
      indication: 'เชื้อรา, กลาก, เกลื้อน',
      category: 'skin_allergy',
      medicalLine: 'first_line', // MEDICAL HIERARCHY: First-line for fungal infections
      lineRationale: 'ควรใช้ต่อเนื่อง 2-4 สัปดาห์',
      indicationsBySeverityTimecourse: {
        mild: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        moderate: {
          acute: true,
          subacute: true,
          chronic: true,
          progressive: false,
        },
        severe: {
          acute: false,
          subacute: false,
          chronic: false,
          progressive: false,
        },
      },
      appropriateSymptoms: ['เชื้อรา', 'กลาก', 'เกลื้อน', 'คันจากเชื้อรา'],
      redFlagExclusions: ['แผลติดเชื้อ', 'มีหนอง', 'ผื่นลาม'],
      adultDose: {
        standard: 'ทาบริเวณที่ติดเชื้อ',
        frequency: 'วันละ 2-3 ครั้ง',
        maxDaily: 'ไม่เกิน 3 ครั้ง/วัน',
        instructions: 'ทาให้บางๆ ครอบคลุมบริเวณที่ติดเชื้อและรอบๆ',
      },
      childDose: {
        byWeight: false,
        standard: 'ทาบริเวณที่ติดเชื้อ',
        frequency: 'วันละ 2 ครั้ง',
        instructions: 'ใช้กับเด็กอายุ > 2 ปี',
        minAge: 2,
        maxAge: null,
      },
      contraindications: ['แพ้ clotrimazole'],
      contraindicationsByDisease: {
        'โรคตับ': 'ใช้ได้ (ทาภายนอก)',
        'โรคไต': 'ใช้ได้ (ทาภายนอก)',
        'โรคหัวใจ': 'ใช้ได้ (ทาภายนอก)',
        'ความดันโลหิตสูง': 'ใช้ได้ (ทาภายนอก)',
        'หอบหืด': 'ใช้ได้ (ทาภายนอก)',
        'เบาหวาน': 'ใช้ได้ (ทาภายนอก)',
        'ตั้งครรภ์': 'ใช้ได้ (ทาภายนอก)',
        'ให้นมบุตร': 'ใช้ได้ (ทาภายนอก)',
        'G6PD': 'ใช้ได้',
      },
      cautions: ['ควรใช้ต่อเนื่อง 2-4 สัปดาห์', 'ไม่ควรหยุดใช้ทันทีเมื่ออาการดีขึ้น'],
      interactions: [],
      whenNotToSelfMedicate: ['แผลติดเชื้อ', 'มีหนอง', 'ผื่นลาม'],
      safetyNotes: 'ปลอดภัยสำหรับใช้ทาภายนอก',
    },
  ],
};

/**
 * Get OTC medications by symptom category
 */
export function getOTCMedsByCategory(category) {
  return OTC_CATALOG[category] || [];
}

/**
 * Get default adult dose for CSV medicines (Phase 2: Data Enrichment)
 */
function getDefaultAdultDose(genericName, form) {
  const normalized = genericName.toLowerCase();
  
  // Default dosing based on form and common medications
  if (form === 'topical') {
    return {
      standard: 'ทาบริเวณที่ปวด/อักเสบ',
      frequency: 'วันละ 2-3 ครั้ง',
      maxDaily: 'ไม่เกิน 3 ครั้ง/วัน',
      instructions: 'ทาให้บางๆ ครอบคลุมบริเวณที่ปวด'
    };
  }
  
  if (form === 'nasal' || form === 'eye' || form === 'ear') {
    return {
      standard: 'พ่น/หยอด ตามความเหมาะสม',
      frequency: 'วันละ 2-3 ครั้ง',
      maxDaily: 'ไม่เกิน 4 ครั้ง/วัน',
      instructions: 'ใช้ตามอาการ'
    };
  }
  
  // Oral medications - common defaults
  if (normalized.includes('พาราเซตามอล')) {
    return {
      standard: '500-1000 มก.',
      frequency: 'ทุก 6 ชม.',
      maxDaily: '4000 มก./วัน',
      instructions: 'หลังอาหาร'
    };
  }
  
  if (normalized.includes('ไอบูโพรเฟน')) {
    return {
      standard: '200-400 มก.',
      frequency: 'ทุก 6-8 ชม.',
      maxDaily: '1200 มก./วัน',
      instructions: 'หลังอาหาร'
    };
  }
  
  if (normalized.includes('ลอราทาดีน') || normalized.includes('เซทิริซีน') || normalized.includes('เฟกโซเฟนาดีน')) {
    return {
      standard: '10 มก.',
      frequency: 'วันละ 1 ครั้ง',
      maxDaily: '10 มก./วัน',
      instructions: 'ก่อนนอนหรือตอนเช้า'
    };
  }
  
  // Default for other oral medications
  return {
    standard: 'ตามฉลากยา',
    frequency: 'ตามอาการ',
    maxDaily: 'ตามฉลากยา',
    instructions: 'อ่านฉลากยาอย่างละเอียด'
  };
}

/**
 * Get default child dose for CSV medicines (Phase 2: Data Enrichment)
 */
function getDefaultChildDose(genericName, form, adultOnly) {
  if (adultOnly) {
    return {
      byWeight: false,
      standard: 'ห้ามใช้ในเด็กอายุ < 18 ปี',
      frequency: '—',
      instructions: 'ห้ามใช้ในเด็ก',
      minAge: 18,
      maxAge: null
    };
  }
  
  const normalized = genericName.toLowerCase();
  
  if (form === 'topical' || form === 'nasal' || form === 'eye' || form === 'ear') {
    return {
      byWeight: false,
      standard: 'ใช้ได้ทุกวัย (ตามคำแนะนำของแพทย์)',
      frequency: 'วันละ 2-3 ครั้ง',
      instructions: 'ใช้ตามอาการ',
      minAge: 0,
      maxAge: null
    };
  }
  
  // Oral medications - weight-based defaults
  if (normalized.includes('พาราเซตามอล')) {
    return {
      byWeight: true,
      formula: '10-15 มก./กก./ครั้ง',
      frequency: 'ทุก 6 ชม.',
      maxDaily: '60-75 มก./กก./วัน',
      instructions: 'หลังอาหาร',
      minAge: 0,
      maxAge: 12
    };
  }
  
  if (normalized.includes('ไอบูโพรเฟน')) {
    return {
      byWeight: true,
      formula: '5-10 มก./กก./ครั้ง',
      frequency: 'ทุก 6-8 ชม.',
      maxDaily: '30-40 มก./กก./วัน',
      instructions: 'หลังอาหาร',
      minAge: 6, // months
      maxAge: 12
    };
  }
  
  // Default for other oral medications
  return {
    byWeight: false,
    standard: 'ตามคำแนะนำของแพทย์',
    frequency: 'ตามอาการ',
    instructions: 'ควรปรึกษาแพทย์ก่อนใช้',
    minAge: 0,
    maxAge: 12
  };
}

/**
 * Get default severity × time-course matrix (Phase 2: Data Enrichment)
 */
function getDefaultSeverityTimecourseMatrix() {
  return {
    mild: {
      acute: true,
      subacute: true,
      chronic: false,
      progressive: false
    },
    moderate: {
      acute: true,
      subacute: true,
      chronic: false,
      progressive: false
    },
    severe: {
      acute: false,
      subacute: false,
      chronic: false,
      progressive: false
    }
  };
}

/**
 * Check if medication is safe for user profile
 * Medical-grade safety check with detailed contraindications by disease
 */
export function isMedicationSafe(medication, healthProfile, answers = {}) {
  // MEDICAL-GRADE: Check ALL allergies (drug, food, other) - absolute exclusion
  // CRITICAL: Collect allergies from multiple sources to ensure we catch them all
  const drugAllergiesFromProfile = Array.isArray(healthProfile?.drugAllergies) 
    ? healthProfile.drugAllergies 
    : (healthProfile?.drugAllergies ? [healthProfile.drugAllergies] : []);
  const drugAllergiesFromAnswers = Array.isArray(answers.drug_allergies)
    ? answers.drug_allergies
    : (answers.drug_allergies ? [answers.drug_allergies] : []);
  const allAllergiesFromAnswers = Array.isArray(answers.all_allergies)
    ? answers.all_allergies
    : (answers.all_allergies ? [answers.all_allergies] : []);
  
  const allAllergies = [
    ...drugAllergiesFromProfile,
    ...drugAllergiesFromAnswers,
    ...(healthProfile?.foodAllergies || []),
    ...(healthProfile?.otherAllergies || []),
    ...allAllergiesFromAnswers,
  ];
  
  // Remove duplicates
  const uniqueAllergies = [...new Set(allAllergies)];
  
  // DEBUG: Log health profile and allergies
  console.log(`[SAFETY-CHECK] 🔍 Checking medication: ${medication.generic}`);
  console.log(`[SAFETY-CHECK] Health profile:`, healthProfile ? 'present' : 'missing');
  console.log(`[SAFETY-CHECK] Drug allergies from healthProfile.drugAllergies:`, drugAllergiesFromProfile);
  console.log(`[SAFETY-CHECK] Drug allergies from answers.drug_allergies:`, drugAllergiesFromAnswers);
  console.log(`[SAFETY-CHECK] All allergies from answers.all_allergies:`, allAllergiesFromAnswers);
  console.log(`[SAFETY-CHECK] Unique allergies combined:`, uniqueAllergies);
  
  if (uniqueAllergies.length > 0) {
    const allergies = uniqueAllergies.map(a => {
      // Handle both string and array elements
      const allergyStr = typeof a === 'string' ? a : String(a);
      return allergyStr.toLowerCase().trim();
    }).filter(a => a.length > 0); // Remove empty strings
    
    const medName = medication.generic.toLowerCase().trim();
    const brandNames = (medication.brandNames || medication.brandExamples || []).map(b => b.toLowerCase().trim());
    const contraindications = medication.contraindications?.map(c => c.toLowerCase().trim()) || [];
    
    console.log(`[SAFETY-CHECK] Medication name (normalized): "${medName}"`);
    console.log(`[SAFETY-CHECK] Allergies (normalized):`, allergies);
    
    // CRITICAL SAFETY FIX: Extract drug name from allergy text
    // Handle cases like "แพ้ยา พาราเซตามอล" → extract "พาราเซตามอล"
    // Also handles plain "พาราเซตามอล" (no prefix)
    const extractDrugNameFromAllergy = (allergyText) => {
      // Remove common prefixes: "แพ้ยา", "แพ้", "allergic to", etc.
      const prefixes = ['แพ้ยา', 'แพ้', 'allergic to', 'allergy to'];
      let cleaned = allergyText;
      for (const prefix of prefixes) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.substring(prefix.length).trim();
        }
      }
      return cleaned;
    };
    
    // Check if user is allergic to this medication (generic name, brand name, or contraindication)
    // Use exact match or substring match for better detection
    const isAllergic = allergies.some(allergy => {
      // Extract drug name from allergy text (handles "แพ้ยา พาราเซตามอล" → "พาราเซตามอล")
      // If no prefix, allergyDrugName === allergy
      const allergyDrugName = extractDrugNameFromAllergy(allergy);
      
      console.log(`[SAFETY-CHECK] Comparing: medName="${medName}" vs allergy="${allergy}" vs allergyDrugName="${allergyDrugName}"`);
      
      // Exact match (most reliable) - handles "พาราเซตามอล" === "พาราเซตามอล"
      if (medName === allergy || allergy === medName || medName === allergyDrugName || allergyDrugName === medName) {
        console.log(`[SAFETY-CHECK] ✅ EXACT MATCH: ${medName} === ${allergy} or ${allergyDrugName}`);
        return true;
      }
      // Substring match (e.g., "พาราเซตามอล" matches "แพ้พาราเซตามอล" or "แพ้ยา พาราเซตามอล")
      if (medName.includes(allergy) || allergy.includes(medName) || 
          medName.includes(allergyDrugName) || allergyDrugName.includes(medName)) {
        console.log(`[SAFETY-CHECK] ✅ SUBSTRING MATCH: ${medName} includes ${allergy} or ${allergyDrugName}`);
        return true;
      }
      // Check brand names
      if (brandNames.some(brand => 
          brand === allergy || allergy === brand ||
          brand === allergyDrugName || allergyDrugName === brand ||
          brand.includes(allergy) || allergy.includes(brand) ||
          brand.includes(allergyDrugName) || allergyDrugName.includes(brand))) {
        console.log(`[SAFETY-CHECK] ✅ BRAND NAME MATCH`);
        return true;
      }
      // Check contraindications
      if (contraindications.some(ct => 
          ct.includes(allergy) || allergy.includes(ct) ||
          ct.includes(allergyDrugName) || allergyDrugName.includes(ct))) {
        console.log(`[SAFETY-CHECK] ✅ CONTRAINDICATION MATCH`);
        return true;
      }
      return false;
    });
    
    if (isAllergic) {
      console.log(`[SAFETY-CHECK] 🚨 Medication ${medication.generic} EXCLUDED: แพ้ยานี้`);
      console.log(`[SAFETY-CHECK] Allergies checked: ${allAllergies.join(', ')}`);
      console.log(`[SAFETY-CHECK] Medication name: ${medName}`);
      console.log(`[SAFETY-CHECK] Matched allergy: ${allergies.find(allergy => {
        const allergyDrugName = extractDrugNameFromAllergy(allergy);
        return medName === allergy || allergy === medName || medName === allergyDrugName || allergyDrugName === medName ||
               medName.includes(allergy) || allergy.includes(medName) || 
               medName.includes(allergyDrugName) || allergyDrugName.includes(medName);
      })}`);
      return { safe: false, reason: 'แพ้ยานี้' };
    }
  }
  
  // MEDICAL-GRADE: Check drug interactions with current medications
  if (healthProfile?.currentMedications && healthProfile.currentMedications.length > 0) {
    const currentMeds = healthProfile.currentMedications.map(m => m.toLowerCase());
    const medName = medication.generic.toLowerCase();
    
    // Known drug interactions (basic check - can be expanded)
    const interactionKeywords = ['warfarin', 'วาร์ฟาริน', 'aspirin', 'แอสไพริน', 'clopidogrel', 'คลอพิโดเกรล', 'metformin', 'เมทฟอร์มิน', 'insulin', 'อินซูลิน'];
    const hasInteractingMed = currentMeds.some(med => 
      interactionKeywords.some(keyword => med.includes(keyword))
    );
    
    // Check if recommended medication interacts with current medications
    if (hasInteractingMed && medication.interactions) {
      const interactions = medication.interactions.map(i => i.toLowerCase());
      const hasInteraction = currentMeds.some(med => 
        interactions.some(interaction => interaction.includes(med) || med.includes(interaction))
      );
      if (hasInteraction) {
        console.log(`[SAFETY-CHECK] Medication ${medication.generic} excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่ (Current meds: ${healthProfile.currentMedications.join(', ')})`);
        return { safe: false, reason: 'อาจมีปฏิกิริยากับยาที่ใช้อยู่ - ควรปรึกษาแพทย์' };
      }
    }
  }

  // Check chronic diseases with detailed contraindications
  if (healthProfile?.chronicDiseases && healthProfile.chronicDiseases.length > 0) {
    const diseases = healthProfile.chronicDiseases.map(d => d.toLowerCase());
    
    // Check general contraindications
    if (medication.contraindications) {
      const contraindications = medication.contraindications.map(c => c.toLowerCase());
      for (const disease of diseases) {
        if (contraindications.some(ct => ct.includes(disease) || disease.includes(ct))) {
          return { safe: false, reason: `มี${disease} - ห้ามใช้ยานี้` };
        }
      }
    }
    
    // Check detailed contraindications by disease
    if (medication.contraindicationsByDisease) {
      for (const disease of diseases) {
        const diseaseKey = Object.keys(medication.contraindicationsByDisease).find(
          key => key.toLowerCase().includes(disease) || disease.includes(key.toLowerCase())
        );
        if (diseaseKey) {
          const contraindication = medication.contraindicationsByDisease[diseaseKey];
          // Check if it's an absolute contraindication (ห้าม, หลีกเลี่ยง)
          if (contraindication.includes('ห้าม') || contraindication.includes('หลีกเลี่ยง')) {
            return { safe: false, reason: `มี${diseaseKey} - ${contraindication}` };
          }
        }
      }
    }
  }

  // MEDICAL-GRADE: Check pregnancy (from health profile first, then answers)
  const isPregnant = healthProfile?.isPregnant === true || 
    answers.pregnancy === true || 
    answers.pregnant === true || 
    (answers.health_context && (answers.health_context.includes('ตั้งครรภ์') || answers.health_context.includes('ท้อง')));
  
  if (isPregnant) {
    if (medication.contraindications) {
      const contraindications = medication.contraindications.map(c => c.toLowerCase());
      if (contraindications.some(ct => ct.includes('ตั้งครรภ์') && ct.includes('ห้าม'))) {
        console.log(`[SAFETY-CHECK] Medication ${medication.generic} excluded: ตั้งครรภ์ - ห้ามใช้ยานี้`);
        return { safe: false, reason: 'ตั้งครรภ์ - ห้ามใช้ยานี้' };
      }
    }
    if (medication.contraindicationsByDisease?.['ตั้งครรภ์']) {
      const contraindication = medication.contraindicationsByDisease['ตั้งครรภ์'];
      if (contraindication.includes('ห้าม') || contraindication.includes('หลีกเลี่ยง')) {
        console.log(`[SAFETY-CHECK] Medication ${medication.generic} excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้`);
        return { safe: false, reason: 'ตั้งครรภ์ - หลีกเลี่ยงยานี้' };
      }
    }
  }

  // MEDICAL-GRADE: Check breastfeeding (from health profile first, then answers)
  const isBreastfeeding = healthProfile?.isBreastfeeding === true ||
    answers.breastfeeding === true || 
    answers.breastfeeding === 'yes' ||
    (answers.health_context && answers.health_context.includes('ให้นม'));
  
  if (isBreastfeeding && medication.contraindicationsByDisease?.['ให้นมบุตร']) {
    const contraindication = medication.contraindicationsByDisease['ให้นมบุตร'];
    if (contraindication.includes('ห้าม') || contraindication.includes('หลีกเลี่ยง')) {
      console.log(`[SAFETY-CHECK] Medication ${medication.generic} excluded: ให้นมบุตร - หลีกเลี่ยงยานี้`);
      return { safe: false, reason: 'ให้นมบุตร - หลีกเลี่ยงยานี้' };
    }
  }
  
  // MEDICAL-GRADE: Check surgery history for contraindications
  if (healthProfile?.surgeryHistory && healthProfile.surgeryHistory.length > 0) {
    const surgeries = healthProfile.surgeryHistory.map(s => s.toLowerCase());
    // Check for recent surgeries that might contraindicate certain medications
    const recentSurgeryKeywords = ['ผ่าตัด', 'surgery', 'operation'];
    const hasRecentSurgery = surgeries.some(surgery => 
      recentSurgeryKeywords.some(keyword => surgery.includes(keyword))
    );
    if (hasRecentSurgery && medication.contraindications) {
      const contraindications = medication.contraindications.map(c => c.toLowerCase());
      if (contraindications.some(ct => ct.includes('ผ่าตัด') || ct.includes('surgery'))) {
        console.log(`[SAFETY-CHECK] Medication ${medication.generic} excluded: มีประวัติผ่าตัด (Surgery history: ${healthProfile.surgeryHistory.join(', ')})`);
        return { safe: false, reason: 'มีประวัติผ่าตัด - ควรปรึกษาแพทย์ก่อนใช้ยา' };
      }
    }
  }

  // Check age restrictions
  const age = healthProfile?.age || answers.age;
  if (age !== null && age !== undefined) {
    if (age < 6 && medication.childDose?.minAge && medication.childDose.minAge > 6) {
      return { safe: false, reason: 'อายุน้อยเกินไป - ห้ามใช้ยานี้' };
    }
    if (age > 65 && medication.contraindicationsByDisease?.['ผู้สูงอายุ']) {
      const contraindication = medication.contraindicationsByDisease['ผู้สูงอายุ'];
      if (contraindication.includes('ห้าม') || contraindication.includes('หลีกเลี่ยง')) {
        return { safe: false, reason: 'ผู้สูงอายุ - ระวังการใช้ยานี้' };
      }
    }
  }

  return { safe: true };
}

/**
 * Calculate dose based on age and weight with weight ranges
 * Medical-grade dosing with ranges for different weight groups
 */
export function calculateDose(medication, age, weightKg) {
  const isChild = age !== null && age !== undefined && age < 15;
  
  if (isChild && medication.childDose) {
    if (medication.childDose.byWeight && weightKg) {
      // Use weight ranges if available
      if (medication.weightRanges?.child) {
        let weightRange = null;
        if (weightKg < 10) {
          weightRange = medication.weightRanges.child['<10kg'];
        } else if (weightKg >= 10 && weightKg < 20) {
          weightRange = medication.weightRanges.child['10-20kg'];
        } else if (weightKg >= 20 && weightKg < 30) {
          weightRange = medication.weightRanges.child['20-30kg'];
        } else {
          weightRange = medication.weightRanges.child['>30kg'];
        }
        
        if (weightRange) {
          // Extract dose from range string
          const match = weightRange.match(/\((\d+)-(\d+)\s*มก\./);
          if (match) {
            return {
              dose: `${match[1]}-${match[2]} มก.`,
              range: weightRange,
              frequency: medication.childDose.frequency,
              instructions: medication.childDose.instructions,
              maxDaily: medication.childDose.maxDaily,
              weightBased: true,
            };
          }
        }
      }
      
      // Fallback: Calculate by weight formula
      const formula = medication.childDose.formula; // e.g., "10-15 มก./กก./ครั้ง"
      const match = formula.match(/(\d+)-(\d+)\s*มก\.\/กก\./);
      if (match) {
        const minDose = parseFloat(match[1]) * weightKg;
        const maxDose = parseFloat(match[2]) * weightKg;
        return {
          dose: `${minDose.toFixed(0)}-${maxDose.toFixed(0)} มก.`,
          range: `${minDose.toFixed(0)}-${maxDose.toFixed(0)} มก. (${formula})`,
          frequency: medication.childDose.frequency,
          instructions: medication.childDose.instructions,
          maxDaily: medication.childDose.maxDaily,
          weightBased: true,
        };
      }
    }
    // Use standard child dose
    return {
      dose: medication.childDose.standard,
      frequency: medication.childDose.frequency,
      instructions: medication.childDose.instructions,
      maxDaily: medication.childDose.maxDaily,
    };
  }
  
  // Adult dose (with elderly adjustment if >65)
  let adultDose = medication.adultDose.standard;
  if (age > 65 && medication.contraindicationsByDisease?.['ผู้สูงอายุ']) {
    // May need dose adjustment for elderly
    // For now, use standard but note caution
  }
  
  return {
    dose: adultDose,
    frequency: medication.adultDose.frequency,
    instructions: medication.adultDose.instructions,
    maxDaily: medication.adultDose.maxDaily,
  };
}

/**
 * Select OTC options (≥2 suitable alternatives)
 * 
 * 🔵 STEP 5: OTC Medication Mapping (Severity × Time-course)
 * 
 * OTC recommendations follow clinical discussion logic between:
 * - Senior medical specialist (clinical appropriateness, severity/time-course matching)
 * - Senior pharmacist (safety, dosing, interactions, contraindications)
 * 
 * 🎯 PRIMARY CLINICAL REASONING REFERENCE: severity_timecourse_matrix.js
 * 
 * Rules:
 * - Never recommend only one drug
 * - Recommend ≥ 2 suitable OTC options when appropriate
 * - Selection must consider:
 *   • Severity (mild/moderate/severe)
 *   • Time-course (acute/subacute/progressive/recurrent)
 *   • Age, Weight
 *   • Contraindications (chronic diseases, pregnancy, allergies)
 *   • Thai OTC availability
 * 
 * Dose logic:
 * - Weight-based dose ranges
 * - Age-adjusted dosing
 * - Max daily dose limits
 * - Dosing interval considerations
 * 
 * CRITICAL RULES:
 * 1) Do NOT allow single-drug recommendation - Always return ≥2 options
 * 2) Medications must match Severity × Time-course matrix
 * 3) NEVER defaults to paracetamol-only unless clinically unavoidable
 * 4) Different drugs for different severity/time-course combinations
 * 5) If confidence insufficient → Ask more questions before recommending meds
 */
export async function selectTwoOTCOptions(symptomCategory, healthProfile, age, weightKg, answers = {}) {
  // MEDICAL-GRADE: Extract severity and time-course from answers
  // These come from severity_timecourse_matrix.js evaluation
  const severity = answers.severity_level || answers.severity || 'moderate'; // Default moderate
  const timeCourse = answers.time_course || 'subacute'; // Default subacute
  const symptomText = answers.symptom || answers.original_symptom || '';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔵 STEP 1: Query Master Clinical Mapping Table (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  // Try to get mapping from Master Clinical Mapping Table first
  // This provides medical-grade OTC recommendations for 300-500 symptoms
  try {
    const { queryMappingTable, getOTCOptionsForMapping } = await import('./otc_clinical_mapping_loader.js');
    
    const mapping = queryMappingTable(symptomText, severity, timeCourse, symptomCategory);
    if (mapping) {
      console.log('[OTC-SELECTION] Using Master Clinical Mapping Table:', {
        symptom: symptomText,
        symptomGroup: symptomCategory,
        severity,
        timeCourse,
        mappingId: mapping.symptom_id
      });
      
      // Get patient context
      const patientContext = {
        age: age || 18,
        weight: weightKg || null,
        chronicDiseases: healthProfile?.chronicDiseases || [],
        drugAllergies: healthProfile?.drugAllergies || []
      };
      
      // Get filtered OTC options
      const otcOptions = getOTCOptionsForMapping(mapping, patientContext);
      
      // If we have OTC options from mapping table, use them
      if (otcOptions.first_line.length > 0 || otcOptions.second_line.length > 0 || otcOptions.alternative.length > 0) {
        // Convert mapping table OTC names to medication objects
        // This will be handled by the existing logic below
        // For now, we'll continue with existing logic but mark that we found a mapping
        answers._mappingTableFound = true;
        answers._mappingTableRationale = otcOptions.clinical_rationale;
        answers._mappingTableSelfCare = otcOptions.self_care_guidance;
        answers._mappingTableWhenToSeeDoctor = otcOptions.when_to_see_doctor;
      }
    }
  } catch (error) {
    console.warn('[OTC-SELECTION] Master Clinical Mapping Table not available, using fallback:', error.message);
  }
  
  // MEDICAL TEXTBOOK-GRADE: Use OTC Severity × Time-course Mapper
  // This ensures OTC recommendations follow medical hierarchy for 300+ symptoms
  const { 
    getOTCMappingForSeverityTimecourse,
    getAllowedOTCsForSeverityTimecourse,
    getDisallowedOTCsForSeverityTimecourse,
    getOTCMappingRationale,
  } = await import('./otc_severity_timecourse_mapper.js');
  
  // Get symptom subtype for more specific mapping (e.g., dry cough vs productive cough)
  const symptomSubtype = analyzeSymptomSubtype(answers, symptomCategory, symptomText);
  
  // Get OTC mapping for this severity × time-course combination
  const otcMapping = getOTCMappingForSeverityTimecourse(symptomCategory, severity, timeCourse, symptomSubtype);
  const allowedOTCs = getAllowedOTCsForSeverityTimecourse(symptomCategory, severity, timeCourse, symptomSubtype);
  const disallowedOTCs = getDisallowedOTCsForSeverityTimecourse(symptomCategory, severity, timeCourse);
  const mappingRationale = getOTCMappingRationale(symptomCategory, severity, timeCourse, symptomSubtype);
  
  console.log('[OTC-SELECTION] Medical Textbook-Grade Mapping:', {
    symptomCategory,
    severity,
    timeCourse,
    allowedOTCs,
    disallowedOTCs,
    mappingRationale: mappingRationale?.rationale,
  });
  
  // PHASE 1 & 2: Load CSV dataset and merge with existing catalog
  let medications = getOTCMedsByCategory(symptomCategory);
  
  // Load CSV dataset
  try {
    const { loadOTCMedicinesDataset, getMedicinesBySymptomGroup } = await import('./otc_medicines_loader.js');
    const csvIndex = await loadOTCMedicinesDataset();
    const csvMedicines = getMedicinesBySymptomGroup(symptomCategory);
    
    if (csvMedicines && csvMedicines.length > 0) {
      console.log(`[OTC-SELECTION] ✅ Found ${csvMedicines.length} medicines from CSV dataset for category: ${symptomCategory}`);
      
      // Enrich CSV medicines with dosing from existing catalog
      const enrichedCsvMedicines = csvMedicines.map(csvMed => {
        // Try to match with existing catalog for dosing information
        const existingMed = medications.find(m => 
          m.generic === csvMed.generic || 
          m.generic.toLowerCase() === csvMed.generic.toLowerCase() ||
          (csvMed.englishGeneric && m.brandExamples?.some(b => b.toLowerCase() === csvMed.englishGeneric.toLowerCase()))
        );
        
        // Convert CSV medicine to catalog format
        const enrichedMed = {
          generic: csvMed.generic,
          brandExamples: csvMed.englishGeneric ? [csvMed.englishGeneric] : [],
          indication: csvMed.lineRationale || 'บรรเทาอาการ',
          category: csvMed.category,
          medicalLine: csvMed.medicalLine,
          lineRationale: csvMed.lineRationale,
          form: csvMed.form,
          adultOnly: csvMed.adultOnly,
          contraindications: csvMed.contraindications,
          // Copy dosing from existing catalog if match found
          adultDose: existingMed?.adultDose || getDefaultAdultDose(csvMed.generic, csvMed.form),
          childDose: existingMed?.childDose || getDefaultChildDose(csvMed.generic, csvMed.form, csvMed.adultOnly),
          // Use default severity × time-course matrix (can be enhanced later)
          indicationsBySeverityTimecourse: existingMed?.indicationsBySeverityTimecourse || getDefaultSeverityTimecourseMatrix(),
          appropriateSymptoms: existingMed?.appropriateSymptoms || [],
          contraindicationsByDisease: existingMed?.contraindicationsByDisease || {},
          cautions: existingMed?.cautions || [],
          interactions: existingMed?.interactions || [],
          whenNotToSelfMedicate: existingMed?.whenNotToSelfMedicate || [],
          safetyNotes: existingMed?.safetyNotes || '',
          // Mark as from CSV
          _fromCSV: true,
        };
        
        return enrichedMed;
      });
      
      // Merge CSV medicines with existing catalog (CSV takes priority for duplicates)
      const existingGenericNames = new Set(medications.map(m => m.generic.toLowerCase()));
      const newCsvMeds = enrichedCsvMedicines.filter(m => !existingGenericNames.has(m.generic.toLowerCase()));
      
      medications = [...enrichedCsvMedicines, ...medications.filter(m => 
        !enrichedCsvMedicines.some(csv => csv.generic.toLowerCase() === m.generic.toLowerCase())
      )];
      
      console.log(`[OTC-SELECTION] ✅ Merged ${newCsvMeds.length} new CSV medicines with ${medications.length - newCsvMeds.length} existing medicines`);
    } else {
      console.log(`[OTC-SELECTION] ⚠️ No CSV medicines found for category: ${symptomCategory}, using existing catalog`);
    }
  } catch (error) {
    console.warn(`[OTC-SELECTION] ⚠️ Failed to load CSV dataset, using existing catalog: ${error.message}`);
  }
  
  // Filter out disallowed medications
  const filteredMedications = medications.filter(med => 
    !disallowedOTCs.includes(med.generic)
  );
  
  // DEBUG: Log category and available medications
  console.log('[OTC-SELECTION] Medical-grade selection:', {
    symptomCategory: symptomCategory,
    symptomText: symptomText,
    severity: severity,
    timeCourse: timeCourse,
    availableMedications: medications.map(m => m.generic),
    medicationCount: medications?.length || 0,
    csvMedicines: medications.filter(m => m._fromCSV).length
  });
  
  if (!medications || medications.length === 0) {
    console.log('[OTC-SELECTION] WARNING: No medications found for category:', symptomCategory);
    return null;
  }

  // PHARMACIST PERSPECTIVE: Filter safe medications with detailed safety check
  const safeMeds = [];
  const excludedMeds = [];
  
  // DEBUG: Log health profile before filtering
  console.log(`[OTC-SELECTION] 🔍 Starting safety check for ${filteredMedications.length} medications`);
  console.log(`[OTC-SELECTION] Health profile present:`, healthProfile ? 'YES' : 'NO');
  if (healthProfile) {
    console.log(`[OTC-SELECTION] Drug allergies:`, healthProfile.drugAllergies);
    console.log(`[OTC-SELECTION] Food allergies:`, healthProfile.foodAllergies);
    console.log(`[OTC-SELECTION] Other allergies:`, healthProfile.otherAllergies);
  }
  console.log(`[OTC-SELECTION] Answers.all_allergies:`, answers.all_allergies);
  
  for (const med of filteredMedications) {
    const safetyCheck = isMedicationSafe(med, healthProfile, answers);
    if (safetyCheck.safe) {
      safeMeds.push(med);
    } else {
      excludedMeds.push({ medication: med.generic, reason: safetyCheck.reason });
      console.log(`[OTC-SELECTION] ❌ EXCLUDED: ${med.generic} - ${safetyCheck.reason}`);
    }
  }
  
  if (excludedMeds.length > 0) {
    console.log(`[OTC-SELECTION] 🚨 Excluded ${excludedMeds.length} medications due to allergies/contraindications:`, excludedMeds);
  } else {
    console.log(`[OTC-SELECTION] ✅ No medications excluded by allergies`);
  }
  
  if (safeMeds.length === 0) {
    console.log('[OTC-SELECTION] WARNING: No safe medications after safety check');
    return null;
  }
  
  console.log(`[OTC-SELECTION] Safety check passed: ${safeMeds.length} safe medications available`);

  // MEDICAL-GRADE: Filter medications by Severity × Time-course Matrix
  // Only include medications appropriate for current severity/time-course combination
  const severityTimecourseMeds = safeMeds.filter(med => {
    // Check if medication has severity/time-course mapping
    if (med.indicationsBySeverityTimecourse) {
      const severityMap = med.indicationsBySeverityTimecourse[severity];
      if (severityMap && severityMap[timeCourse] === true) {
        return true; // Medication is appropriate for this severity/time-course
      }
      return false; // Not appropriate
    }
    // If no mapping, include it (backward compatibility)
    return true;
  });
  
  // If no medications match severity/time-course, use safe meds (but log warning)
  const medsToScore = severityTimecourseMeds.length > 0 ? severityTimecourseMeds : safeMeds;
  if (severityTimecourseMeds.length === 0 && safeMeds.length > 0) {
    console.log('[OTC-SELECTION] WARNING: No medications match severity/time-course, using safe meds');
  }
  
  console.log('[OTC-SELECTION] Filtered by Severity × Time-course:', {
    severity: severity,
    timeCourse: timeCourse,
    matchedMedications: medsToScore.map(m => m.generic),
    count: medsToScore.length
  });

  // DOCTOR PERSPECTIVE: Clinical appropriateness based on symptom subtype
  // Note: symptomSubtype already defined above for OTC mapping
  
  // CRITICAL: Pass symptom category, severity, and time-course to answers for clinical scoring
  const answersWithCategory = {
    ...answers,
    symptomCategory: symptomCategory,
    symptom: symptomText,
    original_symptom: symptomText,
    severity_level: severity,
    time_course: timeCourse,
  };
  
  // MULTI-DISCIPLINARY SELECTION:
  // Option A: Best clinical match (doctor's choice) + safest (pharmacist's choice)
  // Option B: Alternative mechanism/class (pharmacist's alternative) + clinically appropriate
  
  // Score medications by clinical appropriateness + safety + severity/time-course match
  const scoredMeds = medsToScore.map(med => {
    const clinicalScore = calculateClinicalScore(med, symptomSubtype, answersWithCategory);
    const safetyScore = calculateSafetyScore(med, healthProfile, age, weightKg);
    
    // MEDICAL-GRADE: Bonus score for severity/time-course match
    let severityTimecourseScore = 0;
    if (med.indicationsBySeverityTimecourse && 
        med.indicationsBySeverityTimecourse[severity] &&
        med.indicationsBySeverityTimecourse[severity][timeCourse] === true) {
      severityTimecourseScore = 20; // Bonus for matching severity/time-course
    }
    
    // Also check if medication is appropriate for symptom
    let symptomMatchScore = 0;
    if (med.appropriateSymptoms && symptomText) {
      const normalizedSymptom = symptomText.toLowerCase();
      const matchesSymptom = med.appropriateSymptoms.some(symptom => 
        normalizedSymptom.includes(symptom.toLowerCase())
      );
      if (matchesSymptom) {
        symptomMatchScore = 15; // Bonus for symptom match
      }
    }
    
    // MEDICAL-GRADE: Drug Confidence Scoring (Clinical Reasoning Layer)
    // Score based on 5 axes:
    // 1) Symptom match strength (symptomMatchScore) - 20%
    // 2) Severity appropriateness (severityTimecourseScore) - 25%
    // 3) Time-course appropriateness (severityTimecourseScore) - 25%
    // 4) Patient profile fit (safetyScore) - 20%
    // 5) Safety margin (safetyScore) - 10%
    
    // Normalize scores to 0-100 scale
    const normalizedClinicalScore = Math.min(clinicalScore, 100);
    const normalizedSafetyScore = Math.min(safetyScore, 100);
    const normalizedSeverityTimecourse = Math.min(severityTimecourseScore, 100);
    const normalizedSymptomMatch = Math.min(symptomMatchScore, 100);
    
    // Calculate weighted total score (0-100)
    const totalScore = (normalizedSymptomMatch * 0.20) +      // Symptom match strength
                      (normalizedSeverityTimecourse * 0.25) +  // Severity appropriateness
                      (normalizedSeverityTimecourse * 0.25) +  // Time-course appropriateness (same score)
                      (normalizedSafetyScore * 0.20) +         // Patient profile fit
                      (normalizedSafetyScore * 0.10);         // Safety margin
    
    return {
      medication: med,
      clinicalScore: normalizedClinicalScore,
      safetyScore: normalizedSafetyScore,
      severityTimecourseScore: normalizedSeverityTimecourse,
      symptomMatchScore: normalizedSymptomMatch,
      totalScore: Math.min(totalScore, 100), // Cap at 100
    };
  });
  
  // MEDICAL-GRADE HIERARCHY: Rank by medical line first, then by score
  // Medical hierarchy: first_line > second_line > alternative
  const linePriority = {
    'first_line': 3,
    'second_line': 2,
    'alternative': 1,
  };
  
  // Add line priority to scored medications
  scoredMeds.forEach(item => {
    const med = item.medication;
    item.linePriority = linePriority[med.medicalLine] || 0;
  });
  
  // Sort by: 1) Medical line (first_line > second_line > alternative), 2) Total score
  scoredMeds.sort((a, b) => {
    if (b.linePriority !== a.linePriority) {
      return b.linePriority - a.linePriority; // Higher line priority first
    }
    return b.totalScore - a.totalScore; // Then by score
  });
  
  // DEBUG: Log scores with medical hierarchy
  console.log('[OTC-SELECTION] Scored medications (Medical Hierarchy):', {
    severity: severity,
    timeCourse: timeCourse,
    scores: scoredMeds.map(m => ({
      generic: m.medication.generic,
      line: m.medication.medicalLine,
      linePriority: m.linePriority,
      clinical: m.clinicalScore.toFixed(1),
      safety: m.safetyScore.toFixed(1),
      total: m.totalScore.toFixed(1)
    }))
  });
  
  // MEDICAL-GRADE: Filter medications by confidence threshold
  // Only recommend medications with confidence ≥ threshold (default 60%)
  const confidenceThreshold = 60; // Minimum confidence to recommend
  const highConfidenceMeds = scoredMeds.filter(item => item.totalScore >= confidenceThreshold);
  
  if (highConfidenceMeds.length === 0) {
    console.log('[OTC-SELECTION] WARNING: No medications meet confidence threshold - need more information');
    return null; // Cannot confidently recommend - need more questions
  }
  
  console.log('[OTC-SELECTION] High-confidence medications (Medical Hierarchy):', {
    threshold: confidenceThreshold,
    count: highConfidenceMeds.length,
    medications: highConfidenceMeds.map(m => ({
      generic: m.medication.generic,
      line: m.medication.medicalLine,
      confidence: m.totalScore.toFixed(1)
    }))
  });
  
  // MEDICAL TEXTBOOK-GRADE HIERARCHY: Use OTC mapping rules for severity × time-course
  // Priority: Use mapping rules first, then fall back to medical line hierarchy
  
  let optionA = null;
  let optionB = null;
  let optionC = null;
  
  // If OTC mapping exists, use it to prioritize medications
  if (otcMapping && allowedOTCs.length > 0) {
    // Map allowed OTC names to actual medication objects from high-confidence meds
    const firstLineMedObjects = highConfidenceMeds
      .filter(item => otcMapping.first_line && otcMapping.first_line.includes(item.medication.generic))
      .map(item => item.medication);
    
    const secondLineMedObjects = highConfidenceMeds
      .filter(item => otcMapping.second_line && otcMapping.second_line.includes(item.medication.generic))
      .map(item => item.medication);
    
    const alternativeMedObjects = highConfidenceMeds
      .filter(item => otcMapping.alternative && otcMapping.alternative.includes(item.medication.generic))
      .map(item => item.medication);
    
    // Select Option A: First-line from mapping (if available)
    if (firstLineMedObjects.length > 0) {
      optionA = firstLineMedObjects[0];
    } else if (secondLineMedObjects.length > 0) {
      optionA = secondLineMedObjects[0];
    } else if (alternativeMedObjects.length > 0) {
      optionA = alternativeMedObjects[0];
    }
    
    // Select Option B: Second-line or alternative from mapping
    if (optionA) {
      if (firstLineMedObjects.includes(optionA)) {
        // Option A is first-line, Option B should be second-line or alternative
        if (secondLineMedObjects.length > 0 && secondLineMedObjects[0].generic !== optionA.generic) {
          optionB = secondLineMedObjects[0];
        } else if (alternativeMedObjects.length > 0 && alternativeMedObjects[0].generic !== optionA.generic) {
          optionB = alternativeMedObjects[0];
        } else if (firstLineMedObjects.length > 1 && firstLineMedObjects[1].generic !== optionA.generic) {
          optionB = firstLineMedObjects[1];
        }
      } else if (secondLineMedObjects.includes(optionA)) {
        // Option A is second-line, Option B should be first-line or alternative
        if (firstLineMedObjects.length > 0 && firstLineMedObjects[0].generic !== optionA.generic) {
          optionB = firstLineMedObjects[0];
        } else if (alternativeMedObjects.length > 0 && alternativeMedObjects[0].generic !== optionA.generic) {
          optionB = alternativeMedObjects[0];
        } else if (secondLineMedObjects.length > 1 && secondLineMedObjects[1].generic !== optionA.generic) {
          optionB = secondLineMedObjects[1];
      }
    } else {
        // Option A is alternative, Option B should be first-line or second-line
        if (firstLineMedObjects.length > 0 && firstLineMedObjects[0].generic !== optionA.generic) {
          optionB = firstLineMedObjects[0];
        } else if (secondLineMedObjects.length > 0 && secondLineMedObjects[0].generic !== optionA.generic) {
          optionB = secondLineMedObjects[0];
        } else if (alternativeMedObjects.length > 1 && alternativeMedObjects[1].generic !== optionA.generic) {
          optionB = alternativeMedObjects[1];
        }
      }
    }
    
    // Select Option C: Third option from remaining
    if (optionB) {
      const remaining = [...firstLineMedObjects, ...secondLineMedObjects, ...alternativeMedObjects]
        .filter(med => med.generic !== optionA.generic && med.generic !== optionB.generic);
      if (remaining.length > 0) {
        optionC = remaining[0];
      }
    }
  }
  
  // Fallback: Use medical line hierarchy if mapping didn't provide options
  if (!optionA) {
    const firstLineMeds = highConfidenceMeds.filter(item => item.medication.medicalLine === 'first_line');
    const secondLineMeds = highConfidenceMeds.filter(item => item.medication.medicalLine === 'second_line');
    const alternativeMeds = highConfidenceMeds.filter(item => item.medication.medicalLine === 'alternative');
    
    if (firstLineMeds.length > 0) {
      optionA = firstLineMeds[0].medication;
    } else if (secondLineMeds.length > 0) {
      optionA = secondLineMeds[0].medication;
    } else if (alternativeMeds.length > 0) {
      optionA = alternativeMeds[0].medication;
    } else {
      optionA = highConfidenceMeds[0].medication;
    }
    
    // Select Option B using medical line hierarchy
    if (optionA.medicalLine === 'first_line') {
      if (secondLineMeds.length > 0 && secondLineMeds[0].medication.generic !== optionA.generic) {
        optionB = secondLineMeds[0].medication;
      } else if (alternativeMeds.length > 0 && alternativeMeds[0].medication.generic !== optionA.generic) {
        optionB = alternativeMeds[0].medication;
      } else if (firstLineMeds.length > 1 && firstLineMeds[1].medication.generic !== optionA.generic) {
        optionB = firstLineMeds[1].medication;
      }
    } else if (optionA.medicalLine === 'second_line') {
      if (firstLineMeds.length > 0 && firstLineMeds[0].medication.generic !== optionA.generic) {
        optionB = firstLineMeds[0].medication;
      } else if (alternativeMeds.length > 0 && alternativeMeds[0].medication.generic !== optionA.generic) {
        optionB = alternativeMeds[0].medication;
      } else if (secondLineMeds.length > 1 && secondLineMeds[1].medication.generic !== optionA.generic) {
        optionB = secondLineMeds[1].medication;
      }
    } else {
      if (firstLineMeds.length > 0 && firstLineMeds[0].medication.generic !== optionA.generic) {
        optionB = firstLineMeds[0].medication;
      } else if (secondLineMeds.length > 0 && secondLineMeds[0].medication.generic !== optionA.generic) {
        optionB = secondLineMeds[0].medication;
      } else if (alternativeMeds.length > 1 && alternativeMeds[1].medication.generic !== optionA.generic) {
        optionB = alternativeMeds[1].medication;
      }
    }
    
    // Select Option C
    if (optionB) {
      const remainingMeds = highConfidenceMeds.filter(item => 
        item.medication.generic !== optionA.generic && 
        item.medication.generic !== optionB.generic
      );
      if (remainingMeds.length > 0) {
        optionC = remainingMeds[0].medication;
      }
    }
  }
  
  // CRITICAL: Must have at least 2 options (medical-grade requirement)
  // If we don't have optionB, try to find one from lower confidence meds
  if (!optionB) {
    // Try to find a second medicine from scoredMeds (even if below threshold)
    const remainingMeds = scoredMeds
      .filter(item => item.medication.generic !== optionA.generic)
      .sort((a, b) => b.totalScore - a.totalScore);
    
    if (remainingMeds.length > 0) {
      // Select the best remaining medicine, even if below threshold
      optionB = remainingMeds[0].medication;
      console.log('[OTC-SELECTION] Selected optionB from lower confidence meds to meet ≥2 requirement:', {
        generic: optionB.generic,
        score: remainingMeds[0].totalScore.toFixed(1),
        threshold: confidenceThreshold
      });
    } else {
      console.log('[OTC-SELECTION] WARNING: Only 1 medication available - violates medical-grade requirement');
    }
  }
  
  const doseA = calculateDose(optionA, age, weightKg);
  const doseB = optionB ? calculateDose(optionB, age, weightKg) : null;
  const doseC = optionC ? calculateDose(optionC, age, weightKg) : null;

  // Get line labels and rationale
  const getLineLabel = (line) => {
    const labels = {
      'first_line': 'First-line',
      'second_line': 'Second-line',
      'alternative': 'Alternative',
    };
    return labels[line] || 'Alternative';
  };

  // Determine line label and rationale from mapping or medication
  let optionALine = optionA.medicalLine || 'alternative';
  let optionALineLabel = getLineLabel(optionALine);
  let optionALineRationale = optionA.lineRationale || '';
  
  // Override with mapping rationale if available
  if (otcMapping) {
    if (otcMapping.first_line && otcMapping.first_line.includes(optionA.generic)) {
      optionALine = 'first_line';
      optionALineLabel = 'First-line';
    } else if (otcMapping.second_line && otcMapping.second_line.includes(optionA.generic)) {
      optionALine = 'second_line';
      optionALineLabel = 'Second-line';
    } else if (otcMapping.alternative && otcMapping.alternative.includes(optionA.generic)) {
      optionALine = 'alternative';
      optionALineLabel = 'Alternative';
    }
    if (mappingRationale?.rationale) {
      optionALineRationale = mappingRationale.rationale;
    }
  }

  return {
    optionA: {
      medication: optionA,
      dose: doseA,
      confidence: highConfidenceMeds.find(m => m.medication.generic === optionA.generic)?.totalScore || 0,
      medicalLine: optionALine,
      lineLabel: optionALineLabel,
      lineRationale: optionALineRationale,
      mappingWarning: mappingRationale?.warning || null,
      reasoning: generatePharmacistReasoning(optionA, healthProfile, age, weightKg),
      clinicalReasoning: generateDoctorReasoning(optionA, symptomSubtype, answers, severity, timeCourse),
    },
    optionB: optionB ? {
      medication: optionB,
      dose: doseB,
      confidence: highConfidenceMeds.find(m => m.medication.generic === optionB.generic)?.totalScore || 0,
      medicalLine: (() => {
        if (otcMapping) {
          if (otcMapping.first_line && otcMapping.first_line.includes(optionB.generic)) return 'first_line';
          if (otcMapping.second_line && otcMapping.second_line.includes(optionB.generic)) return 'second_line';
          if (otcMapping.alternative && otcMapping.alternative.includes(optionB.generic)) return 'alternative';
        }
        return optionB.medicalLine || 'alternative';
      })(),
      lineLabel: (() => {
        const line = (() => {
          if (otcMapping) {
            if (otcMapping.first_line && otcMapping.first_line.includes(optionB.generic)) return 'first_line';
            if (otcMapping.second_line && otcMapping.second_line.includes(optionB.generic)) return 'second_line';
            if (otcMapping.alternative && otcMapping.alternative.includes(optionB.generic)) return 'alternative';
          }
          return optionB.medicalLine || 'alternative';
        })();
        return getLineLabel(line);
      })(),
      lineRationale: optionB.lineRationale || '',
      reasoning: generatePharmacistReasoning(optionB, healthProfile, age, weightKg),
      clinicalReasoning: generateDoctorReasoning(optionB, symptomSubtype, answers, severity, timeCourse),
    } : null,
    optionC: optionC ? {
      medication: optionC,
      dose: doseC,
      confidence: highConfidenceMeds.find(m => m.medication.generic === optionC.generic)?.totalScore || 0,
      medicalLine: (() => {
        if (otcMapping) {
          if (otcMapping.first_line && otcMapping.first_line.includes(optionC.generic)) return 'first_line';
          if (otcMapping.second_line && otcMapping.second_line.includes(optionC.generic)) return 'second_line';
          if (otcMapping.alternative && otcMapping.alternative.includes(optionC.generic)) return 'alternative';
        }
        return optionC.medicalLine || 'alternative';
      })(),
      lineLabel: (() => {
        const line = (() => {
          if (otcMapping) {
            if (otcMapping.first_line && otcMapping.first_line.includes(optionC.generic)) return 'first_line';
            if (otcMapping.second_line && otcMapping.second_line.includes(optionC.generic)) return 'second_line';
            if (otcMapping.alternative && otcMapping.alternative.includes(optionC.generic)) return 'alternative';
          }
          return optionC.medicalLine || 'alternative';
        })();
        return getLineLabel(line);
      })(),
      lineRationale: optionC.lineRationale || '',
      reasoning: generatePharmacistReasoning(optionC, healthProfile, age, weightKg),
      clinicalReasoning: generateDoctorReasoning(optionC, symptomSubtype, answers, severity, timeCourse),
    } : null,
  };
}

/**
 * Analyze symptom subtype for clinical appropriateness
 * DOCTOR PERSPECTIVE: Different symptoms need different medications
 * CRITICAL: Also analyze from symptom text itself, not just answers
 * ENHANCED: Uses body_part_location to refine subtype analysis
 */
function analyzeSymptomSubtype(answers, symptomCategory, symptomText = '') {
  const subtype = {
    inflammation: false,
    tension: false,
    allergy: false,
    infection: false,
    acute: false,
    chronic: false,
    // Body-part specific subtypes
    chest_pain: false,
    abdominal_pain: false,
    musculoskeletal: false,
    dermatologic: false,
  };
  
  const normalizedSymptom = symptomText.toLowerCase();
  
  // CRITICAL: Use body_part_location to refine subtype analysis
  // Body-part clarification enhances clinical reasoning precision
  const bodyPartLocation = answers.body_part_location || answers.body_part || answers.location;
  if (bodyPartLocation) {
    const normalizedLocation = bodyPartLocation.toLowerCase();
    
    // Chest pain subtypes
    if (normalizedLocation.includes('chest') || normalizedLocation.includes('หน้าอก') || 
        normalizedLocation.includes('หัวใจ') || normalizedLocation.includes('ปอด')) {
      subtype.chest_pain = true;
      // Chest pain often needs different approach than musculoskeletal pain
      if (normalizedLocation.includes('หัวใจ') || normalizedLocation.includes('heart')) {
        subtype.inflammation = false; // Cardiac pain ≠ inflammatory pain
      }
    }
    
    // Abdominal pain subtypes
    if (normalizedLocation.includes('abdomen') || normalizedLocation.includes('ท้อง') ||
        normalizedLocation.includes('กระเพาะ') || normalizedLocation.includes('stomach')) {
      subtype.abdominal_pain = true;
      // GI symptoms need different OTCs (antacids, ORS, etc.)
    }
    
    // Musculoskeletal pain (limbs, back, joints)
    if (normalizedLocation.includes('leg') || normalizedLocation.includes('arm') ||
        normalizedLocation.includes('back') || normalizedLocation.includes('joint') ||
        normalizedLocation.includes('ขา') || normalizedLocation.includes('แขน') ||
        normalizedLocation.includes('หลัง') || normalizedLocation.includes('เข่า') ||
        normalizedLocation.includes('ข้อ')) {
      subtype.musculoskeletal = true;
      subtype.tension = true; // Often tension/muscle-related
    }
    
    // Dermatologic (skin, rash locations)
    if (normalizedLocation.includes('skin') || normalizedLocation.includes('ผิว') ||
        normalizedLocation.includes('ทั่วตัว') || normalizedLocation.includes('whole_body')) {
      subtype.dermatologic = true;
      subtype.allergy = true; // Often allergic in nature
    }
  }
  
  // Analyze from symptom text FIRST (before answers)
  if (normalizedSymptom.includes('เจ็บคอ') || normalizedSymptom.includes('ไอ') || normalizedSymptom.includes('น้ำมูก')) {
    // These are NOT inflammation/tension - they're specific symptoms
    // Don't default to paracetamol
  }
  
  if (normalizedSymptom.includes('ท้องเสีย') || normalizedSymptom.includes('คลื่นไส้')) {
    // GI symptoms - definitely NOT paracetamol-first
    subtype.acute = true;
  }
  
  // Analyze from answers
  if (answers.quality) {
    if (answers.quality.includes('อักเสบ') || answers.quality.includes('บวม')) {
      subtype.inflammation = true;
    }
    if (answers.quality.includes('ตึง') || answers.quality.includes('ตื้อ')) {
      subtype.tension = true;
    }
  }
  
  if (answers.duration) {
    if (answers.duration.includes('มากกว่า 7 วัน') || answers.duration.includes('สัปดาห์')) {
      subtype.chronic = true;
    } else {
      subtype.acute = true;
    }
  }
  
  if (answers.associated_symptoms || answers.main_symptom) {
    const associated = (answers.associated_symptoms || answers.main_symptom || '').toLowerCase();
    if (associated.includes('ผื่น') || associated.includes('คัน') || associated.includes('จาม')) {
      subtype.allergy = true;
    }
    if (associated.includes('เสมหะ') || associated.includes('เขียว') || associated.includes('เหลือง')) {
      subtype.infection = true;
    }
  }
  
  // CRITICAL: If symptom category is NOT fever_pain, don't treat as tension/inflammation
  if (symptomCategory !== 'fever_pain') {
    subtype.tension = false; // Reset - not applicable
    subtype.inflammation = false; // Reset - not applicable
  }
  
  return subtype;
}

/**
 * Calculate clinical appropriateness score
 * DOCTOR PERSPECTIVE: How well does this medication match the symptom?
 * CRITICAL: Must favor symptom-appropriate medications, not default to paracetamol
 */
function calculateClinicalScore(medication, symptomSubtype, answers) {
  let score = 20; // Even lower base score to reduce paracetamol bias
  
  // CRITICAL: Symptom category matching (most important)
  // Different symptoms need different medications
  // Check symptom text directly AND symptom category from answers
  
  const symptomText = (answers.symptom || answers.original_symptom || '').toLowerCase();
  const symptomCategory = answers.symptomCategory || 'fever_pain'; // Get category from answers
  
  // CRITICAL: Category mismatch = HEAVY penalty (check FIRST before other logic)
  // If medication category doesn't match symptom category, penalize heavily
  if (medication.category !== symptomCategory) {
    // Exception: fever_pain meds can be used for other symptoms IF symptom includes fever/pain
    if (medication.category === 'fever_pain' && 
        (symptomText.includes('ไข้') || symptomText.includes('ปวด'))) {
      // Allow fever_pain meds for fever/pain symptoms even if category is different
    } else {
      score -= 60; // HEAVY penalty for category mismatch
    }
  }
  
  // ENHANCEMENT: Body-part location influences OTC selection
  // Body-part clarification improves medication appropriateness
  const bodyPartLocation = answers.body_part_location || answers.body_part || answers.location;
  if (bodyPartLocation) {
    const normalizedLocation = bodyPartLocation.toLowerCase();
    
    // Chest pain: Prefer medications appropriate for cardiac/respiratory symptoms
    if (normalizedLocation.includes('chest') || normalizedLocation.includes('หน้าอก') ||
        normalizedLocation.includes('หัวใจ') || normalizedLocation.includes('heart')) {
      // Chest pain may need different approach than musculoskeletal pain
      if (medication.category === 'fever_pain' && medication.generic === 'paracetamol') {
        score += 10; // Paracetamol is safe for chest pain
      }
      // Avoid NSAIDs for cardiac concerns unless specifically indicated
      if ((medication.generic === 'ibuprofen' || medication.generic === 'naproxen') &&
          (normalizedLocation.includes('หัวใจ') || normalizedLocation.includes('heart'))) {
        score -= 15; // Caution with NSAIDs for cardiac pain
      }
    }
    
    // Abdominal pain: Prefer GI-specific medications
    if (normalizedLocation.includes('abdomen') || normalizedLocation.includes('ท้อง') ||
        normalizedLocation.includes('stomach')) {
      if (medication.category === 'gi_symptoms') {
        score += 20; // Strong preference for GI medications
      }
      // Antacids, ORS, simethicone are more appropriate than systemic pain meds
      if (medication.generic === 'antacid' || medication.generic === 'ors' || 
          medication.generic === 'simethicone') {
        score += 15;
      }
    }
    
    // Musculoskeletal pain (limbs, back, joints): Prefer NSAIDs/topical
    if (normalizedLocation.includes('leg') || normalizedLocation.includes('arm') ||
        normalizedLocation.includes('back') || normalizedLocation.includes('joint') ||
        normalizedLocation.includes('ขา') || normalizedLocation.includes('แขน') ||
        normalizedLocation.includes('หลัง') || normalizedLocation.includes('เข่า') ||
        normalizedLocation.includes('ข้อ')) {
      // NSAIDs are often more appropriate for musculoskeletal pain
      if (medication.generic === 'ibuprofen' || medication.generic === 'naproxen') {
        score += 15; // NSAIDs preferred for musculoskeletal pain
      }
      // Topical medications may be appropriate
      if (medication.category === 'skin_allergy' && 
          (medication.generic.includes('topical') || medication.generic.includes('gel'))) {
        score += 10;
      }
    }
    
    // Skin/dermatologic: Prefer topical medications
    if (normalizedLocation.includes('skin') || normalizedLocation.includes('ผิว') ||
        normalizedLocation.includes('ทั่วตัว') || normalizedLocation.includes('whole_body')) {
      if (medication.category === 'skin_allergy') {
        score += 25; // Strong preference for topical/skin medications
      }
      // Oral antihistamines also appropriate
      if (medication.generic === 'loratadine' || medication.generic === 'cetirizine') {
        score += 15;
      }
    }
  }
  
  // Sore throat/cough → prefer lozenges, honey, NOT paracetamol
  if (medication.category === 'sore_throat_cough') {
    if (symptomCategory === 'sore_throat_cough' ||
        symptomText.includes('เจ็บคอ') || symptomText.includes('ไอ') || 
        symptomSubtype.allergy || answers.main_symptom?.includes('เจ็บคอ') || answers.main_symptom?.includes('ไอ')) {
      score += 60; // VERY STRONG preference for appropriate category
    }
  }
  
  // Nasal congestion → prefer antihistamines, saline, NOT paracetamol
  if (medication.category === 'nasal_congestion') {
    if (symptomCategory === 'nasal_congestion' ||
        symptomText.includes('น้ำมูก') || symptomText.includes('คัดจมูก') || symptomText.includes('จาม') ||
        symptomSubtype.allergy || answers.main_symptom?.includes('น้ำมูก') || answers.main_symptom?.includes('คัดจมูก')) {
      score += 60; // VERY STRONG preference for appropriate category
    }
  }
  
  // GI symptoms → prefer ORS, simethicone, NOT paracetamol
  if (medication.category === 'gi_symptoms') {
    if (symptomCategory === 'gi_symptoms' ||
        symptomText.includes('ท้องเสีย') || symptomText.includes('คลื่นไส้') || symptomText.includes('ท้องอืด') ||
        answers.main_symptom?.includes('ท้องเสีย') || answers.main_symptom?.includes('คลื่นไส้') || answers.main_symptom?.includes('ท้องอืด')) {
      score += 60; // VERY STRONG preference for appropriate category
    }
  }
  
  // Fever/pain category
  if (medication.category === 'fever_pain') {
    // Inflammation → prefer NSAIDs
    if (symptomSubtype.inflammation && medication.generic.includes('ไอบูโพรเฟน')) {
      score += 35; // Strong preference for NSAIDs in inflammation
    }
    
    // Tension → paracetamol is fine, but not always best
    if (symptomSubtype.tension && medication.generic === 'พาราเซตามอล') {
      score += 25; // Good for tension, but not exclusive
    }
    
    // CRITICAL: Penalize paracetamol if inflammation present
    if (symptomSubtype.inflammation && medication.generic === 'พาราเซตามอล') {
      score -= 20; // Less appropriate for inflammation
    }
    
    // CRITICAL: Penalize paracetamol if symptom category is NOT fever_pain
    // This is the strongest check - if category doesn't match, paracetamol is wrong
    if (medication.generic === 'พาราเซตามอล' && symptomCategory !== 'fever_pain') {
      score -= 70; // VERY HEAVY penalty - paracetamol wrong for non-fever/pain symptoms
    }
    
    // Additional check: If symptom text indicates non-fever/pain, penalize paracetamol
    if (medication.generic === 'พาราเซตามอล') {
      // If symptom is NOT fever/pain related, heavily penalize paracetamol
      if ((symptomText.includes('เจ็บคอ') || symptomText.includes('ไอ') || 
           symptomText.includes('น้ำมูก') || symptomText.includes('คัดจมูก') ||
           symptomText.includes('ท้องเสีย') || symptomText.includes('คลื่นไส้')) &&
          !symptomText.includes('ไข้') && !symptomText.includes('ปวด')) {
        score -= 60; // HEAVY penalty - not appropriate for these symptoms
      }
      // Also check if main_symptom indicates non-fever/pain
      if (answers.main_symptom && 
          (answers.main_symptom.includes('เจ็บคอ') || answers.main_symptom.includes('ไอ') ||
           answers.main_symptom.includes('น้ำมูก') || answers.main_symptom.includes('คัดจมูก') ||
           answers.main_symptom.includes('ท้องเสีย') || answers.main_symptom.includes('คลื่นไส้')) &&
          !answers.main_symptom.includes('ไข้') && !answers.main_symptom.includes('ปวด')) {
        score -= 60; // HEAVY penalty
      }
    }
  }
  
  // Allergy → prefer antihistamines
  if (symptomSubtype.allergy && medication.category === 'nasal_congestion') {
    score += 30;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate safety score
 * PHARMACIST PERSPECTIVE: How safe is this medication for this patient?
 * CRITICAL: Don't over-weight paracetamol safety - other meds can be safe too
 */
function calculateSafetyScore(medication, healthProfile, age, weightKg) {
  let score = 40; // Lower base score to reduce paracetamol bias
  
  // Paracetamol is safest, but not exclusive
  if (medication.generic === 'พาราเซตามอล') {
    score += 25; // Still safest, but not overwhelming advantage
  }
  
  // Other safe medications also get good scores
  if (medication.generic === 'น้ำเกลือล้างจมูก' || medication.generic === 'น้ำผึ้งผสมมะนาว' || medication.generic === 'ORS (น้ำเกลือแร่)') {
    score += 30; // Natural/safe options are very safe
  }
  
  // NSAIDs are less safe but still acceptable
  if (medication.generic.includes('ไอบูโพรเฟน')) {
    score += 15; // Safe if no contraindications
  }
  
  // Antihistamines are safe
  if (medication.generic.includes('คลอร์เฟนิรามีน')) {
    score += 20; // Safe, just causes drowsiness
  }
  
  // Age considerations
  if (age !== null && age !== undefined) {
    if (age < 6 && medication.childDose?.minAge && medication.childDose.minAge > 6) {
      score -= 50; // Not safe for young children
    }
    if (age > 65 && medication.contraindicationsByDisease?.['ผู้สูงอายุ']) {
      score -= 20; // Less safe for elderly
    }
  }
  
  // Disease considerations
  if (healthProfile?.chronicDiseases && medication.contraindicationsByDisease) {
    for (const disease of healthProfile.chronicDiseases) {
      const contraindication = medication.contraindicationsByDisease[disease];
      if (contraindication && (contraindication.includes('ห้าม') || contraindication.includes('หลีกเลี่ยง'))) {
        score -= 50; // Not safe
      }
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate pharmacist reasoning
 * PHARMACIST PERSPECTIVE: Safety, dosing, interactions
 */
function generatePharmacistReasoning(medication, healthProfile, age, weightKg) {
  const reasons = [];
  
  // Safety
  if (medication.generic === 'พาราเซตามอล') {
    reasons.push('ปลอดภัยที่สุดสำหรับทุกวัย');
  }
  
  // Dosing
  if (age !== null && age < 15 && medication.childDose) {
    reasons.push('ขนาดยาคำนวณตามน้ำหนักและอายุ');
  }
  
  // Contraindications
  if (healthProfile?.chronicDiseases && medication.contraindicationsByDisease) {
    const warnings = [];
    for (const disease of healthProfile.chronicDiseases) {
      const contraindication = medication.contraindicationsByDisease[disease];
      if (contraindication) {
        warnings.push(contraindication);
      }
    }
    if (warnings.length > 0) {
      reasons.push(`ระวัง: ${warnings.join(', ')}`);
    }
  }
  
  return reasons.join('; ') || 'ปลอดภัยสำหรับอาการนี้';
}

/**
 * Generate clinical reasoning (Medical-Grade)
 * DOCTOR PERSPECTIVE: Clinical appropriateness, severity/time-course matching, differential diagnosis
 * Enhanced to provide clear, clinical reasoning like senior physician consultation
 * 
 * 🎯 PRIMARY CLINICAL REASONING REFERENCE: severity_timecourse_matrix.js
 */
function generateDoctorReasoning(medication, symptomSubtype, answers, severity = null, timeCourse = null) {
  const reasons = [];
  
  // MEDICAL-GRADE: Severity-based reasoning
  if (severity) {
    if (severity === 'mild') {
      reasons.push('✅ เหมาะสำหรับอาการระดับเบา');
    } else if (severity === 'moderate') {
      reasons.push('✅ เหมาะสำหรับอาการระดับปานกลาง');
      if (medication.generic === 'พาราเซตามอล') {
        reasons.push('(ถ้าไม่ดีขึ้นใน 2-3 วัน ควรปรึกษาแพทย์)');
      }
    } else if (severity === 'severe') {
      reasons.push('⚠️ ใช้เพื่อบรรเทาอาการชั่วคราว (ควรพบแพทย์เพื่อหาสาเหตุ)');
    }
  }
  
  // MEDICAL-GRADE: Time-course based reasoning
  if (timeCourse) {
    if (timeCourse === 'acute') {
      reasons.push('✅ เหมาะสำหรับอาการเฉียบพลัน');
    } else if (timeCourse === 'subacute') {
      reasons.push('✅ เหมาะสำหรับอาการที่เป็นมา 2-7 วัน');
    } else if (timeCourse === 'chronic') {
      reasons.push('⚠️ ไม่แนะนำใช้ต่อเนื่อง (ควรปรึกษาแพทย์เพื่อหาสาเหตุ)');
    } else if (timeCourse === 'progressive') {
      reasons.push('⚠️ อาการแย่ลงต่อเนื่อง - ควรพบแพทย์ (ยานี้ใช้เพื่อบรรเทาชั่วคราวเท่านั้น)');
    }
  }
  
  // Clinical match - why this medication is appropriate
  if (symptomSubtype.inflammation && medication.generic.includes('ไอบูโพรเฟน')) {
    reasons.push('✅ เหมาะสำหรับอาการอักเสบ (ลดการอักเสบได้ดีกว่าพาราเซตามอล)');
  } else if (symptomSubtype.inflammation && medication.generic.includes('นาโพรเซน')) {
    reasons.push('✅ เหมาะสำหรับอาการอักเสบและปวดประจำเดือน');
  } else if (symptomSubtype.tension && medication.generic === 'พาราเซตามอล') {
    reasons.push('✅ เหมาะสำหรับอาการปวดตึง');
  } else if (medication.generic.includes('คาเฟอีน')) {
    reasons.push('✅ คาเฟอีนช่วยเพิ่มประสิทธิภาพของพาราเซตามอล (เหมาะสำหรับปวดหัวจากความเครียด)');
  }
  
  // Category-specific reasoning (CRITICAL for non-fever_pain symptoms)
  if (medication.category === 'sore_throat_cough') {
    if (medication.generic.includes('เดกซ์โทรเมทอร์แฟน')) {
      reasons.push('✅ เหมาะสำหรับไอแห้ง (ไม่มีเสมหะ)');
    } else if (medication.generic.includes('กวายเฟนีซิน')) {
      reasons.push('✅ เหมาะสำหรับไอมีเสมหะ (ช่วยละลายเสมหะ)');
    } else {
      reasons.push('✅ เหมาะสำหรับอาการเจ็บคอและไอ');
    }
  } else if (medication.category === 'nasal_congestion') {
    if (medication.generic.includes('ลอราทาดีน') || medication.generic.includes('เซทิริซีน')) {
      reasons.push('✅ เหมาะสำหรับอาการแพ้และน้ำมูก (ไม่ทำให้ง่วงนอน)');
    } else if (medication.generic.includes('ซูโดเอฟีดรีน')) {
      reasons.push('✅ เหมาะสำหรับคัดจมูก (ไม่ทำให้ง่วงนอน แต่ห้ามใช้ในผู้ที่มีความดันโลหิตสูง)');
    } else {
      reasons.push('✅ เหมาะสำหรับอาการน้ำมูกและคัดจมูก');
    }
  } else if (medication.category === 'gi_symptoms') {
    if (medication.generic.includes('ORS')) {
      reasons.push('✅ สำคัญที่สุดสำหรับท้องเสีย (ป้องกันการขาดน้ำ)');
    } else if (medication.generic.includes('ฟาโมทิดีน')) {
      reasons.push('✅ เหมาะสำหรับกรดไหลย้อน (ปลอดภัยกว่า antacids สำหรับใช้ต่อเนื่อง)');
    } else if (medication.generic.includes('โลเพอราไมด์')) {
      reasons.push('✅ เหมาะสำหรับท้องเสียไม่ติดเชื้อ (ห้ามใช้ในท้องเสียติดเชื้อ)');
    } else {
      reasons.push('✅ เหมาะสำหรับอาการทางระบบทางเดินอาหาร');
    }
  } else if (medication.category === 'skin_allergy') {
    if (medication.generic.includes('ไฮโดรคอร์ติโซน')) {
      reasons.push('✅ เหมาะสำหรับผื่นคันและผิวหนังอักเสบ (ไม่ควรใช้ติดต่อกันเกิน 1 สัปดาห์)');
    } else if (medication.generic.includes('คลอไตรมาโซล')) {
      reasons.push('✅ เหมาะสำหรับเชื้อรา กลาก เกลื้อน (ควรใช้ต่อเนื่อง 2-4 สัปดาห์)');
    } else if (medication.generic.includes('คาลาไมน์')) {
      reasons.push('✅ เหมาะสำหรับผื่นคันและแมลงกัดต่อย (ปลอดภัยมาก)');
    }
  }
  
  // Symptom-specific indication
  if (medication.indication) {
    reasons.push(`💊 ใช้สำหรับ${medication.indication}`);
  }
  
  // MEDICAL-GRADE: When to see doctor (critical safety information)
  if (medication.whenNotToSelfMedicate && medication.whenNotToSelfMedicate.length > 0) {
    reasons.push(`⚠️ ห้ามใช้หาก: ${medication.whenNotToSelfMedicate.slice(0, 3).join(', ')}`);
  }
  
  return reasons.join(' | ') || 'เหมาะสมกับอาการ';
}

/**
 * Map symptom to OTC category
 * More comprehensive symptom matching
 */
export function mapSymptomToCategory(symptom) {
  if (!symptom || typeof symptom !== 'string') {
    return 'fever_pain'; // Default
  }
  
  const normalized = symptom.toLowerCase();
  
  // CRITICAL: Check for swelling symptoms FIRST (before nasal_congestion)
  // "หน้าบวม", "บวมหน้า" should NOT map to nasal_congestion
  if (normalized.includes('หน้าบวม') || normalized.includes('บวมหน้า') || 
      normalized.includes('บวมลิ้น') || normalized.includes('บวมปาก') || 
      normalized.includes('คอบวม') || normalized.includes('บวมคอ')) {
    // Facial/neck swelling is NOT nasal congestion - it's potentially serious
    // Don't map to any category - let system ask red flag questions first
    // Return null or 'unknown' to prevent wrong medication recommendations
    return null; // Will be handled by red flag screening first
  }
  
  // Check for specific symptom keywords (order matters - more specific first)
  if (normalized.includes('เจ็บคอ') || normalized.includes('คอ') || normalized.includes('sore throat')) {
    return 'sore_throat_cough';
  }
  if (normalized.includes('ไอ') || normalized.includes('cough')) {
    return 'sore_throat_cough';
  }
  if (normalized.includes('น้ำมูก') || normalized.includes('คัดจมูก') || normalized.includes('จาม') || 
      normalized.includes('runny nose') || normalized.includes('congestion')) {
    // CRITICAL: Only map to nasal_congestion if NOT facial swelling
    if (!normalized.includes('บวมหน้า') && !normalized.includes('หน้าบวม')) {
      return 'nasal_congestion';
    }
  }
  if (normalized.includes('ท้องเสีย') || normalized.includes('คลื่นไส้') || normalized.includes('อาเจียน') || 
      normalized.includes('ท้องอืด') || normalized.includes('diarrhea') || normalized.includes('nausea') ||
      normalized.includes('vomit')) {
    return 'gi_symptoms';
  }
  // CRITICAL: Symptoms that should NOT get systemic OTCs - need doctor evaluation or specific care
  
  // Eye symptoms - need eye-specific care, not systemic painkillers
  if (normalized.includes('ปวดตา') || normalized.includes('ตาแดง') || normalized.includes('ตาพร่า') || 
      normalized.includes('สายตาล้า') || normalized.includes('ปวดกระบอกตา') || normalized.includes('ตามัว') ||
      normalized.includes('eye pain') || normalized.includes('red eye') || normalized.includes('blurred vision')) {
    return null; // Needs doctor evaluation
  }
  
  // Ear symptoms - need ear-specific care, not systemic painkillers
  if (normalized.includes('ปวดหู') || normalized.includes('หูอื้อ') || normalized.includes('หูดับ') ||
      normalized.includes('ear pain') || normalized.includes('hearing loss')) {
    return null; // Needs doctor evaluation
  }
  
  // Urinary symptoms - need doctor evaluation
  if (normalized.includes('ปัสสาวะแสบ') || normalized.includes('ปัสสาวะเป็นเลือด') || 
      normalized.includes('ปัสสาวะไม่ออก') || normalized.includes('ปัสสาวะขัด') ||
      normalized.includes('urinary pain') || normalized.includes('blood in urine')) {
    return null; // Needs doctor evaluation
  }
  
  // Reproductive symptoms - need doctor evaluation
  if (normalized.includes('ปวดอัณฑะ') || normalized.includes('อัณฑะบวม') || normalized.includes('อัณฑะแดง') ||
      normalized.includes('เลือดออกช่องคลอด') || normalized.includes('ประจำเดือนผิดปกติ') ||
      normalized.includes('testicular pain') || normalized.includes('vaginal bleeding')) {
    return null; // Needs doctor evaluation
  }
  
  // Dental symptoms - need dental-specific care (can use painkillers temporarily but should see dentist)
  // Note: Dental pain can use systemic painkillers temporarily, but we'll handle this in generateOTCMeds
  
  // Skin symptoms with infection - need doctor evaluation
  if (normalized.includes('แผลติดเชื้อ') || normalized.includes('แผลมีหนอง') || normalized.includes('แผลมีกลิ่น') ||
      normalized.includes('infected wound') || normalized.includes('pus')) {
    return null; // Needs doctor evaluation
  }
  
  // Neurological symptoms - should be emergencies (handled by red flag screening)
  // Cardiac/respiratory symptoms - should be emergencies (handled by red flag screening)
  // GI symptoms with red flags - should be emergencies (handled by red flag screening)
  
  if (normalized.includes('ไข้') || normalized.includes('fever')) {
    return 'fever_pain';
  }
  if (normalized.includes('ปวด') || normalized.includes('pain') || normalized.includes('ache')) {
    return 'fever_pain';
  }
  
  // Default to fever_pain (most common)
  return 'fever_pain';
}

