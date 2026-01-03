/**
 * Symptom-Specific Self-Care Recommendations (Medical-grade)
 * 
 * 🔵 STEP 5A: Self-Care at Home (Mandatory)
 * 
 * For each symptom, Suk AI must recommend the best evidence-based home care
 * to help recovery as fast and as safely as possible.
 * 
 * Rules:
 * - Must be symptom-specific (not generic)
 * - Based on medical textbooks + hospital OPD practice
 * - Adapted to: Severity, Time-course, Age, Weight, Chronic conditions
 * - Written in simple Thai, short bullet points
 * - 3–5 items only
 * - Emoji allowed for clarity
 * 
 * Self-care domains:
 * - Rest / activity modification
 * - Hydration
 * - Nutrition / foods to avoid
 * - Positioning / posture
 * - Temperature control (warm / cold)
 * - Sleep guidance
 * - Environmental advice (screen, dust, smoke, noise)
 * 
 * CRITICAL: Self-care must be shown even if OTC meds are recommended.
 * Self-care ≠ medication - Both must coexist, not replace each other.
 */

import { normalizeThaiText } from './thai_normalizer.js';

// ============================================================================
// 1) Severity × Time-course Matrix (Global Rules ที่ใช้กับทุกอาการ)
// ============================================================================

/**
 * Global Self-care Plan Matrix
 * ใช้เป็น "กฎกลาง" เพื่อปรับความเข้มของการดูแลตัวเองที่บ้านก่อน
 * แล้วค่อยเติม "คำแนะนำเฉพาะอาการ" จาก Protocol Library
 */
const SEVERITY_TIMECOURSE_MATRIX = {
  'mild': {
    'acute': [
      '🧊/🔥 ประคบตามชนิดอาการ',
      '💧 น้ำ+เกลือแร่พอ',
      '😴 พัก/ลดกิจกรรมหนัก',
      '🍲 อาหารอ่อน/ย่อยง่าย',
      '⏰ ติดตาม 24–48 ชม.',
    ],
    'subacute': [
      '💤 พักเพิ่ม+จัดตารางนอน',
      '💧 ดื่มน้ำสม่ำเสมอ',
      '🧼 ดูแลสุขอนามัย/หลีกเลี่ยงสิ่งกระตุ้น',
      '📝 จดอาการ/ตัวกระตุ้น',
      '📅 ถ้ายังไม่ดีขึ้นใน 3–5 วัน → พบแพทย์',
    ],
    'progressive': [
      '🚫 หยุดสิ่งกระตุ้นทันที',
      '📝 วัดไข้/อาการวันละ 2–3 ครั้ง',
      '🧪 ถามเพิ่ม "อาการอันตรายซ่อนอยู่ไหม"',
      '🧭 วางแผนพบแพทย์ภายใน 24–72 ชม.',
      '⚠️ ถ้าเกิดสัญญาณอันตราย → Emergency',
    ],
    'recurrent': [
      '🧾 ทำ "Trigger diary"',
      '💤 นอน/กินเป็นเวลา',
      '🧘 ลดเครียด',
      '🧪 ทบทวนยา/อาหาร/คาเฟอีน',
      '📅 นัดประเมินสาเหตุ (OPD) ถ้าเป็นซ้ำถี่',
    ],
    'chronic': [
      '🧾 ทำ "Trigger diary"',
      '💤 นอน/กินเป็นเวลา',
      '🧘 ลดเครียด',
      '🧪 ทบทวนยา/อาหาร/คาเฟอีน',
      '📅 นัดประเมินสาเหตุ (OPD) ถ้าเป็นซ้ำถี่',
    ],
  },
  'moderate': {
    'acute': [
      '🛌 พักจริงจัง/หยุดงานหนัก',
      '💧 น้ำ/เกลือแร่เพิ่ม',
      '🍲 อาหารอ่อน',
      '🧊/🔥 ประคบ+ท่าทางที่ลดปวด',
      '📞 ถ้าไม่ดีขึ้นใน 24–48 ชม. → พบแพทย์',
    ],
    'subacute': [
      '🛌 พัก+จำกัดกิจกรรม',
      '💧 คุมขาดน้ำ',
      '🧼 เลี่ยงสิ่งกระตุ้น/ควัน/แอลกอฮอล์',
      '📝 จดแนวโน้มดีขึ้นหรือแย่ลง',
      '📅 ควรพบแพทย์ภายใน 1–2 วัน',
    ],
    'progressive': [
      '🧭 อย่ารอให้แย่ลง',
      '📝 สังเกต red flags ถี่ขึ้น',
      '🧪 ถามเพิ่มแบบเจาะ hypothesis',
      '📅 พบแพทย์ภายใน 24 ชม.',
      '⚠️ ถ้ารุนแรงขึ้นเร็ว → Emergency',
    ],
    'recurrent': [
      '🧾 ทบทวน pattern/trigger',
      '💤 จัดการการนอน+ความเครียด',
      '🧪 คัดกรองภาวะเรื้อรัง',
      '📅 พบแพทย์เพื่อวางแผนป้องกัน',
      '🧴/🧊 ใช้ self-care เฉพาะอาการเวลาเริ่มเป็น',
    ],
    'chronic': [
      '🧾 ทบทวน pattern/trigger',
      '💤 จัดการการนอน+ความเครียด',
      '🧪 คัดกรองภาวะเรื้อรัง',
      '📅 พบแพทย์เพื่อวางแผนป้องกัน',
      '🧴/🧊 ใช้ self-care เฉพาะอาการเวลาเริ่มเป็น',
    ],
  },
  'severe': {
    'acute': [
      '🛑 พักเต็มที่/มีคนดูแล',
      '💧 ป้องกันขาดน้ำ',
      '🧊/🔥 บรรเทาเฉียบพลัน',
      '🧭 หากไม่ดีขึ้นภายใน 6–12 ชม. → ไป รพ./พบแพทย์ด่วน',
      '⚠️ เฝ้าสัญญาณอันตราย',
    ],
    'subacute': [
      '🧭 ควรพบแพทย์ "วันนี้"',
      '📝 เตรียมข้อมูล/ประวัติยา',
      '💧/🍲 ประคองอาการ',
      '🚫 งดยาที่เสี่ยง/แอลกอฮอล์',
      '⚠️ ถ้าแย่ลง → Emergency',
    ],
    'progressive': [
      '🏥 พบแพทย์ด่วนภายในไม่กี่ชั่วโมง',
      '🧪 ห้ามสรุปเองเร็ว',
      '🧭 จัดลำดับความเสี่ยงสูงสุดก่อน',
      '⚠️ ถ้ามี red flag ใหม่ → Emergency ทันที',
    ],
    'recurrent': [
      '🧭 ต้องหาสาเหตุจริงจัง',
      '📝 บันทึก pattern/ความถี่',
      '🧪 ประเมินโรคประจำตัว/ยาเดิม',
      '📅 พบแพทย์เพื่อ "แผนป้องกัน"',
      '⚠️ มีครั้งไหนรุนแรงผิดปกติ → Emergency',
    ],
    'chronic': [
      '🧭 ต้องหาสาเหตุจริงจัง',
      '📝 บันทึก pattern/ความถี่',
      '🧪 ประเมินโรคประจำตัว/ยาเดิม',
      '📅 พบแพทย์เพื่อ "แผนป้องกัน"',
      '⚠️ มีครั้งไหนรุนแรงผิดปกติ → Emergency',
    ],
  },
};

// ============================================================================
// 2) Self-care Protocol Library (Base Self-care 3–5 items ต่อ Protocol)
// ============================================================================

/**
 * Base Self-care Protocols
 * ใช้เป็น "แกนกลาง" แล้วปรับความเข้มด้วย Matrix ข้างบน
 */
const SELF_CARE_PROTOCOLS = {
  'SC-RESP': [
    '💧 น้ำอุ่นบ่อย ๆ',
    '🌬️ เลี่ยงควัน/ฝุ่น',
    '🧼 ล้างมือ/ใส่หน้ากาก',
    '🛌 พัก',
    '🧂 กลั้วคอ/พ่นน้ำเกลือ',
  ],
  'SC-THROAT': [
    '🍯 น้ำอุ่นผสมน้ำผึ้ง (ถ้าไม่แพ้/อายุเหมาะสม)',
    '🧂 กลั้วคอน้ำเกลือ',
    '🚫 เลี่ยงเผ็ด/แอลกอฮอล์',
    '🛌 พักเสียง',
    '💧 น้ำอุ่น',
  ],
  'SC-FEVER': [
    '💧 น้ำ+เกลือแร่',
    '🧊 เช็ดตัว/เสื้อผ้าบาง',
    '🛌 พัก',
    '🌡️ วัดไข้เป็นช่วง',
    '🍲 อาหารอ่อน',
  ],
  'SC-HEAD': [
    '💧 ดื่มน้ำ',
    '💤 งีบ/พักตา',
    '🧊/🔥 ประคบ',
    '📵 พักจากจอ',
    '☕ ลดคาเฟอีนถ้ากระตุ้น',
  ],
  'SC-MIGRA': [
    '🌓 ห้องมืดเงียบ',
    '💧 น้ำ',
    '🧊 ประคบหน้าผาก/คอ',
    '🚫 เลี่ยงกลิ่น/แสง',
    '📝 จด trigger',
  ],
  'SC-DIZZY': [
    '🪑 นั่ง/นอนช้า ๆ',
    '💧 น้ำ',
    '🍬 ถ้าสงสัยน้ำตาลต่ำให้ของหวานเล็กน้อย',
    '🚫 งดขับรถ',
    '🧘 หายใจช้า',
  ],
  'SC-EYE': [
    '🚫 งดขยี้ตา',
    '🧼 ล้างมือ',
    '🧊 ประคบเย็น',
    '📵 พักจากจอ',
    '😷 เลี่ยงฝุ่น/ควัน',
  ],
  'SC-EAR': [
    '🚫 งดแคะหู',
    '🧊/🔥 ประคบ',
    '🛌 พัก',
    '🚫 หลีกเลี่ยงน้ำเข้าหู',
    '📝 สังเกตหูไหล/ปวดมากขึ้น',
  ],
  'SC-DENT': [
    '🧂 บ้วนปากน้ำเกลือ',
    '🧊 ประคบแก้ม',
    '🪥 แปรงนุ่ม',
    '🚫 เลี่ยงหวานเหนียว',
    '📅 นัดทันตแพทย์ถ้าไม่ดีขึ้น',
  ],
  'SC-GI-UP': [
    '🍲 กินมื้อเล็ก',
    '🚫 งดมัน/เผ็ด/แอลกอฮอล์',
    '🛌 ยกหัวเตียง',
    '💧 น้ำจิบ',
    '🕒 ไม่กินก่อนนอน 3 ชม.',
  ],
  'SC-GI-LOW': [
    '💧 เกลือแร่',
    '🍚 อาหารอ่อน (ข้าวต้ม/กล้วย)',
    '🚫 งดนม/มัน/เผ็ด',
    '🧼 ล้างมือ',
    '📝 ดูถ่ายเป็นเลือดไหม',
  ],
  'SC-CONST': [
    '💧 น้ำ',
    '🥬 ไฟเบอร์',
    '🚶 เดินเบา ๆ',
    '⏰ ขับถ่ายเป็นเวลา',
    '🚫 เลี่ยงกลั้น',
  ],
  'SC-UTI': [
    '💧 น้ำมากขึ้น',
    '🚽 ไม่กลั้นปัสสาวะ',
    '🚫 งดกาแฟ/แอลกอฮอล์',
    '🧼 สุขอนามัย',
    '📝 ดูไข้/ปวดเอวเพิ่มไหม',
  ],
  'SC-SKIN-AL': [
    '🧊 ประคบเย็น',
    '🚫 หยุดสิ่งสงสัยแพ้',
    '🧴 ทามอยส์เจอไรเซอร์อ่อน',
    '🚿 อาบน้ำอุณหภูมิห้อง',
    '📝 ถ่ายรูปผื่นไว้',
  ],
  'SC-SKIN-INF': [
    '🧼 ล้างสะอาด',
    '🩹 ปิดแผล',
    '🚫 บีบ/แกะ',
    '🧊 ลดบวม',
    '📝 ดูแดงลาม/มีหนอง',
  ],
  'SC-BITE': [
    '🧊 ประคบเย็น',
    '🚫 เกา',
    '🧼 ล้างบริเวณกัด',
    '🧴 ทาคาลาไมน์/มอยส์เจอร์',
    '📝 ดูบวมลาม/หายใจลำบาก',
  ],
  'SC-MSK-STRAIN': [
    '🧊 24–48 ชม.แรก',
    '🛌 พักกล้ามเนื้อ',
    '🧘 ยืดเบา ๆ หลังปวดลด',
    '🩹 ซัพพอร์ต/เทป',
    '🚫 ยกหนัก',
  ],
  'SC-BACK': [
    '🧍 ท่าทางถูก',
    '🛏️ หลีกเลี่ยงนอนติดเตียงนาน',
    '🧊/🔥 ประคบ',
    '🚶 เดินเบา ๆ',
    '🚫 ก้มยกของผิดท่า',
  ],
  'SC-JOINT': [
    '🧊 ประคบ',
    '🛌 พักข้อ',
    '🩹 พยุง/ผ้ายืด',
    '🚫 กิจกรรมกระแทก',
    '📝 สังเกตบวมร้อนแดง',
  ],
  'SC-MENSTR': [
    '🔥 ประคบอุ่นท้องน้อย',
    '🫖 น้ำอุ่น',
    '🧘 ยืดเบา ๆ',
    '💤 พัก',
    '📝 บันทึกรอบเดือน',
  ],
  'SC-SLEEP': [
    '⏰ นอน/ตื่นเวลาเดิม',
    '📵 งดจอ 1 ชม.ก่อนนอน',
    '☕ งดคาเฟอีนบ่าย',
    '🛁 อาบน้ำอุ่น',
    '🛌 ห้องมืดเย็น',
  ],
  'SC-ANX': [
    '🌬️ หายใจ 4-6',
    '🧊 น้ำเย็นจิบ/สัมผัสเย็น',
    '🧘 grounding 5-4-3-2-1',
    '📵 ลด doomscroll',
    '📞 คุยคนไว้ใจ',
  ],
  'SC-WOUND': [
    '🧼 ล้างน้ำสะอาด',
    '🧴 ทายาฆ่าเชื้อที่เหมาะสม',
    '🩹 ปิดแผล',
    '🚫 ไม่แกะสะเก็ด',
    '📝 ดูบวมแดง',
  ],
  'SC-BURN': [
    '🚿 น้ำไหลเย็น 10–20 นาที',
    '🚫 ไม่ทาน้ำมัน/ยาสีฟัน',
    '🩹 ปิดผ้าสะอาด',
    '💧 น้ำ',
    '📝 ดูพุพองใหญ่ไหม',
  ],
  'SC-HEM': [
    '🛁 แช่น้ำอุ่น (sitz bath)',
    '🥬 ไฟเบอร์+น้ำ',
    '🚫 เบ่งนาน',
    '🧻 เช็ดเบา ๆ',
    '🚶 เดินเบา ๆ',
  ],
};

// ============================================================================
// 3) Symptom Catalog 320 Keywords (Symptom → Protocol ID → Focus)
// ============================================================================

/**
 * Symptom Catalog: Maps symptom keywords to Protocol IDs and self-care focus
 * Format: { keyword: { protocol: 'SC-XXX', focus: 'emoji + short description' } }
 */
const SYMPTOM_CATALOG = {
  // A) Neuro / Head (1–45)
  'ปวดหัว': { protocol: 'SC-HEAD', focus: '💧 พักตา+ดื่มน้ำ' },
  'ปวดหัวตุบๆ': { protocol: 'SC-MIGRA', focus: '🌓 ห้องมืดเงียบ' },
  'ปวดหัวข้างเดียว': { protocol: 'SC-MIGRA', focus: '🧊 ประคบ+เลี่ยงแสง' },
  'ปวดหัวท้ายทอย': { protocol: 'SC-HEAD', focus: '🔥 คอไหล่คลายตึง' },
  'ปวดหัวจากจอ': { protocol: 'SC-HEAD', focus: '📵 พักสายตา 20-20-20' },
  'ปวดหัวตึงๆ': { protocol: 'SC-HEAD', focus: '🧘 ผ่อนคลาย+ยืดคอ' },
  'ปวดหัวตอนเช้า': { protocol: 'SC-HEAD', focus: '💧 น้ำ+ดูคุณภาพนอน' },
  'ปวดหัวหลังนอนน้อย': { protocol: 'SC-HEAD', focus: '💤 นอนชดเชย+น้ำ' },
  'ปวดหัวหลังเครียด': { protocol: 'SC-HEAD', focus: '🌬️ หายใจช้า+พัก' },
  'ปวดหัวหลังออกกำลัง': { protocol: 'SC-HEAD', focus: '💧 เกลือแร่+พัก' },
  'เวียนหัว': { protocol: 'SC-DIZZY', focus: '🪑 นั่งช้าๆ+งดขับ' },
  'บ้านหมุน': { protocol: 'SC-DIZZY', focus: '🚫 ขับรถ+พักศีรษะ' },
  'หน้ามืด': { protocol: 'SC-DIZZY', focus: '💧 น้ำ+ลุกช้าๆ' },
  'มึนหัว': { protocol: 'SC-DIZZY', focus: '💤 พัก+ประเมินขาดน้ำ' },
  'อ่อนเพลีย': { protocol: 'SC-FEVER', focus: '🛌 พัก+น้ำ+อาหารอ่อน' },
  'เพลียมาก': { protocol: 'SC-FEVER', focus: '🛌 พักจริงจัง+ติดตาม' },
  'ซึม': { protocol: 'SC-FEVER', focus: '📝 วัดไข้+ประคองน้ำ' },
  'ง่วงตลอด': { protocol: 'SC-SLEEP', focus: '⏰ ปรับสุขอนามัยการนอน' },
  'นอนไม่หลับ': { protocol: 'SC-SLEEP', focus: '📵 งดจอ+คุมคาเฟอีน' },
  'หลับยาก': { protocol: 'SC-SLEEP', focus: '🛁 น้ำอุ่น+ห้องมืด' },
  'ตื่นบ่อย': { protocol: 'SC-SLEEP', focus: '⏰ เวลาเดิม+ลดแสง' },
  'ฝันร้าย': { protocol: 'SC-SLEEP', focus: '🌙 รูทีนก่อนนอน' },
  'ใจสั่น': { protocol: 'SC-ANX', focus: '🌬️ หายใจช้า+ลดคาเฟอีน' },
  'หายใจไม่อิ่มจากเครียด': { protocol: 'SC-ANX', focus: '🧘 grounding' },
  'แพนิค': { protocol: 'SC-ANX', focus: '🌬️ 4-6 + น้ำเย็น' },
  'วิตกกังวล': { protocol: 'SC-ANX', focus: '🧘 ลดสิ่งกระตุ้น' },
  'เครียด': { protocol: 'SC-ANX', focus: '🧾 จัดการ stressors' },
  'สมาธิสั้น': { protocol: 'SC-ANX', focus: '📵 พักหน้าจอ+นอน' },
  'ชาแขน': { protocol: 'SC-MSK-STRAIN', focus: '🧊 พักท่าซ้ำๆ' },
  'ชาขา': { protocol: 'SC-MSK-STRAIN', focus: '🚶 ยืดเบาๆ' },
  'ตะคริว': { protocol: 'SC-MSK-STRAIN', focus: '💧 เกลือแร่+ยืด' },
  'กล้ามเนื้อกระตุก': { protocol: 'SC-MSK-STRAIN', focus: '💤 พัก+เกลือแร่' },
  'ปวดคอ': { protocol: 'SC-MSK-STRAIN', focus: '🔥 คลายคอไหล่' },
  'คอตึง': { protocol: 'SC-MSK-STRAIN', focus: '🧘 ยืด+พักจอ' },
  'ปวดไหล่': { protocol: 'SC-MSK-STRAIN', focus: '🧊 พัก+ประคบ' },
  'ปวดหลังคอ': { protocol: 'SC-MSK-STRAIN', focus: '🔥 ท่าทาง+ยืด' },
  'ปวดกราม': { protocol: 'SC-DENT', focus: '🧊 ประคบ+งดเคี้ยวแข็ง' },
  'ปวดฟัน': { protocol: 'SC-DENT', focus: '🧊 ประคบ+งดเคี้ยวแข็ง' },
  'นอนไม่พอ': { protocol: 'SC-SLEEP', focus: '💤 นอนชดเชย+ตาราง' },
  'ง่วงกลางวัน': { protocol: 'SC-SLEEP', focus: '☀️ รับแดดเช้า+ลดงีบยาว' },
  'สายตาล้า': { protocol: 'SC-EYE', focus: '📵 พักตา+ประคบ' },
  'ตาพร่า': { protocol: 'SC-EYE', focus: '📵 พัก+ประเมินระคาย' },
  'ปวดตา': { protocol: 'SC-EYE', focus: '🧊 ประคบ+งดขยี้' },
  'ปวดกระบอกตา': { protocol: 'SC-EYE', focus: '🧊 พัก+ลดจอ' },

  // B) ENT / Respiratory (46–120)
  'ไอ': { protocol: 'SC-RESP', focus: '💧 น้ำอุ่น+เลี่ยงควัน' },
  'ไอแห้ง': { protocol: 'SC-RESP', focus: '🍯 น้ำอุ่น+พัก' },
  'ไอมีเสมหะ': { protocol: 'SC-RESP', focus: '🌬️ ดื่มน้ำ+ไอน้ำอุ่น' },
  'ไอถี่': { protocol: 'SC-RESP', focus: '🚫 ควัน/ฝุ่น+พัก' },
  'ไอกลางคืน': { protocol: 'SC-RESP', focus: '🛌 ยกหัวเตียง' },
  'เจ็บคอ': { protocol: 'SC-THROAT', focus: '🧂 กลั้วคอ+พักเสียง' },
  'คอแห้ง': { protocol: 'SC-THROAT', focus: '💧 น้ำอุ่น+งดแอลกอฮอล์' },
  'เสียงแหบ': { protocol: 'SC-THROAT', focus: '🛌 พักเสียง+น้ำอุ่น' },
  'ระคายคอ': { protocol: 'SC-THROAT', focus: '🧂 กลั้วคอ+เลี่ยงเผ็ด' },
  'น้ำมูกไหล': { protocol: 'SC-RESP', focus: '🧂 พ่นน้ำเกลือ' },
  'คัดจมูก': { protocol: 'SC-RESP', focus: '🌬️ ไอน้ำอุ่น+พ่นน้ำเกลือ' },
  'จาม': { protocol: 'SC-RESP', focus: '😷 เลี่ยงฝุ่น+ล้างมือ' },
  'แพ้อากาศ': { protocol: 'SC-RESP', focus: '🏠 ลดฝุ่น+ล้างจมูก' },
  'ไข้': { protocol: 'SC-FEVER', focus: '🌡️ วัดไข้+เช็ดตัว' },
  'หนาวสั่น': { protocol: 'SC-FEVER', focus: '🧥 อุ่นพอดี+น้ำ' },
  'ไข้ต่ำ': { protocol: 'SC-FEVER', focus: '💧 น้ำ+พัก' },
  'ไข้สูง': { protocol: 'SC-FEVER', focus: '🌡️ ติดตามถี่+เช็ดตัว' },
  'คัดหน้าอก': { protocol: 'SC-RESP', focus: '🛌 พัก+เลี่ยงควัน' },
  'แน่นหน้าอกเล็กน้อย': { protocol: 'SC-RESP', focus: '🧘 หายใจช้า+พัก' },
  'หายใจลึกแล้วเจ็บคอ': { protocol: 'SC-THROAT', focus: '🧂 กลั้วคอ+น้ำอุ่น' },
  'เจ็บโพรงจมูก': { protocol: 'SC-RESP', focus: '🧂 พ่นน้ำเกลือ' },
  'ปวดไซนัส': { protocol: 'SC-RESP', focus: '🔥 ประคบอุ่นหน้า+ไอน้ำ' },
  'ปวดหน้า': { protocol: 'SC-RESP', focus: '🔥 ไอน้ำอุ่น+พัก' },
  'ปวดหู': { protocol: 'SC-EAR', focus: '🧊/🔥 ประคบ+งดน้ำเข้าหู' },
  'หูอื้อ': { protocol: 'SC-EAR', focus: '🚫 แคะหู+พัก' },
  'คันหู': { protocol: 'SC-EAR', focus: '🚫 แคะหู' },
  'หูมีน้ำ': { protocol: 'SC-EAR', focus: '📝 ติดตาม+พบแพทย์ถ้าไม่ดีขึ้น' },
  'น้ำมูกเขียว': { protocol: 'SC-RESP', focus: '💧 พัก+พ่นน้ำเกลือ' },
  'น้ำมูกเหลือง': { protocol: 'SC-RESP', focus: '🧂 ล้างจมูก' },
  'เสมหะข้น': { protocol: 'SC-RESP', focus: '💧 น้ำอุ่น+ไอน้ำ' },
  'เสมหะปนเลือดเล็กน้อย': { protocol: 'SC-RESP', focus: '🧭 ประเมินเพิ่ม+พบแพทย์ถ้าเป็นซ้ำ' },
  'หอบเหนื่อยเล็กน้อย': { protocol: 'SC-RESP', focus: '🛌 พัก+ติดตามถี่' },
  'หายใจมีเสียงหวีด': { protocol: 'SC-RESP', focus: '🚫 สิ่งกระตุ้น+พบแพทย์ถ้าเป็นซ้ำ' },
  'เจ็บคอข้างเดียว': { protocol: 'SC-THROAT', focus: '🧂 กลั้วคอ+ติดตาม' },
  'กลืนเจ็บ': { protocol: 'SC-THROAT', focus: '🍲 อาหารอ่อน+น้ำอุ่น' },
  'กลืนลำบากเล็กน้อย': { protocol: 'SC-THROAT', focus: '🍲 นิ่ม+พักเสียง' },
  'ปากแห้ง': { protocol: 'SC-FEVER', focus: '💧 จิบถี่+เกลือแร่' },
  'คอแสบจากกรด': { protocol: 'SC-GI-UP', focus: '🛌 ยกหัวเตียง+งดเผ็ด' },
  'ไอหลังอาหาร': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+ไม่เอนตัว' },
  'กลิ่นปาก': { protocol: 'SC-DENT', focus: '🪥 ทำความสะอาด+ดื่มน้ำ' },
  'แผลร้อนใน': { protocol: 'SC-THROAT', focus: '🍲 เลี่ยงเปรี้ยวเผ็ด+น้ำอุ่น' },
  'ปากเปื่อย': { protocol: 'SC-THROAT', focus: '🧼 ดูแลช่องปาก+อาหารอ่อน' },
  'ต่อมทอนซิลบวม': { protocol: 'SC-THROAT', focus: '🧂 กลั้วคอ+พักเสียง' },
  'เจ็บคอหลังตะโกน': { protocol: 'SC-THROAT', focus: '🛌 พักเสียง' },
  'ไอจากฝุ่น': { protocol: 'SC-RESP', focus: '😷 เลี่ยงฝุ่น+ล้างจมูก' },
  'ไอจากควัน': { protocol: 'SC-RESP', focus: '🚫 เลี่ยงควันทันที' },
  'แสบจมูก': { protocol: 'SC-RESP', focus: '🧂 พ่นน้ำเกลือ+เลี่ยงควัน' },

  // C) GI / Abdomen (121–195)
  'ปวดท้อง': { protocol: 'SC-GI-LOW', focus: '🍲 อาหารอ่อน+เกลือแร่' },
  'ปวดท้องบิด': { protocol: 'SC-GI-LOW', focus: '💧 เกลือแร่+พัก' },
  'ปวดท้องบน': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+งดเผ็ด' },
  'ปวดลิ้นปี่': { protocol: 'SC-GI-UP', focus: '🛌 ยกหัวเตียง' },
  'จุกแน่น': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+ช้า' },
  'แน่นท้อง': { protocol: 'SC-GI-LOW', focus: '🚶 เดินเบาๆ+อาหารอ่อน' },
  'ท้องอืด': { protocol: 'SC-GI-LOW', focus: '🚫 น้ำอัดลม+เดินเบา' },
  'เรอเปรี้ยว': { protocol: 'SC-GI-UP', focus: '🛌 ยกหัวเตียง+งดมัน' },
  'กรดไหลย้อน': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+ไม่กินดึก' },
  'คลื่นไส้': { protocol: 'SC-GI-UP', focus: '💧 จิบทีละน้อย+อาหารอ่อน' },
  'อาเจียน': { protocol: 'SC-GI-LOW', focus: '💧 เกลือแร่จิบถี่' },
  'อาเจียนหลังอาหาร': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+ช้า' },
  'เบื่ออาหาร': { protocol: 'SC-FEVER', focus: '🍲 อาหารอ่อน+พัก' },
  'ท้องเสีย': { protocol: 'SC-GI-LOW', focus: '💧 เกลือแร่+งดนม' },
  'ถ่ายเหลว': { protocol: 'SC-GI-LOW', focus: '🍚 ข้าวต้ม+เกลือแร่' },
  'ถ่ายบ่อย': { protocol: 'SC-GI-LOW', focus: '💧 กันขาดน้ำ' },
  'ปวดท้องถ่ายไม่สุด': { protocol: 'SC-GI-LOW', focus: '💧 เกลือแร่+ติดตาม' },
  'ถ่ายเป็นมูก': { protocol: 'SC-GI-LOW', focus: '🧭 ประเมินเพิ่ม+พบแพทย์ถ้าไม่ดีขึ้น' },
  'ท้องผูก': { protocol: 'SC-CONST', focus: '💧 +ไฟเบอร์+เดิน' },
  'ถ่ายแข็ง': { protocol: 'SC-CONST', focus: '🥬 ไฟเบอร์+น้ำ' },
  'ปวดท้องน้อย': { protocol: 'SC-GI-LOW', focus: '🍲 อุ่นท้อง+อาหารอ่อน' },
  'ปวดท้องประจำเดือน': { protocol: 'SC-MENSTR', focus: '🔥 ประคบอุ่น' },
  'ปวดท้องหลังนม': { protocol: 'SC-GI-LOW', focus: '🚫 งดนมชั่วคราว' },
  'ท้องร้อง': { protocol: 'SC-GI-LOW', focus: '🍲 กินมื้อเล็ก' },
  'แสบท้อง': { protocol: 'SC-GI-UP', focus: '🛌 ยกหัวเตียง+งดเผ็ด' },
  'ถ่ายดำ': { protocol: 'SC-GI-LOW', focus: '🧭 ต้องถาม red flags ก่อน' },
  'เลือดปน': { protocol: 'SC-GI-LOW', focus: '🧭 ถามเพิ่ม+พบแพทย์' },
  'ปวดท้องด้านขวาล่าง': { protocol: 'SC-GI-LOW', focus: '🧭 ต้องถาม red flags ก่อน' },
  'ปวดท้องหลังแอลกอฮอล์': { protocol: 'SC-GI-UP', focus: '🚫 งดแอลกอฮอล์+น้ำ' },
  'คลื่นไส้ตอนเช้า': { protocol: 'SC-GI-UP', focus: '🍪 ของแห้งเล็กน้อย' },
  'จุกคอ': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+ไม่เอนตัว' },
  'สะอึก': { protocol: 'SC-GI-UP', focus: '💧 จิบช้า+หายใจ' },
  'กินแล้วแน่น': { protocol: 'SC-GI-UP', focus: '🍲 มื้อเล็ก+ช้า' },
  'ปวดท้องหลังของมัน': { protocol: 'SC-GI-UP', focus: '🚫 งดมัน+มื้อเล็ก' },
  'ก๊าซเยอะ': { protocol: 'SC-GI-LOW', focus: '🚶 เดินเบา+งดน้ำอัดลม' },
  'ท้องเดิน': { protocol: 'SC-GI-LOW', focus: '💧 เกลือแร่' },

  // D) GU / UTI / Repro (196–240)
  'ปัสสาวะแสบ': { protocol: 'SC-UTI', focus: '💧 น้ำมากขึ้น+ไม่กลั้น' },
  'ปัสสาวะขัด': { protocol: 'SC-UTI', focus: '🚽 เข้าห้องน้ำบ่อย' },
  'ปัสสาวะบ่อย': { protocol: 'SC-UTI', focus: '💧 น้ำ+สังเกตไข้' },
  'ปัสสาวะน้อย': { protocol: 'SC-FEVER', focus: '💧 ประเมินขาดน้ำ' },
  'ปวดท้องน้อยเวลาปัสสาวะ': { protocol: 'SC-UTI', focus: '💧 น้ำ+เลี่ยงคาเฟอีน' },
  'ปวดเอวเล็กน้อย': { protocol: 'SC-UTI', focus: '📝 ติดตาม+พบแพทย์ถ้าเพิ่ม' },
  'ตกขาวคัน': { protocol: 'SC-SKIN-AL', focus: '🧼 หลีกเลี่ยงสารระคาย+ถามเพิ่ม' },
  'คันอวัยวะเพศ': { protocol: 'SC-SKIN-AL', focus: '🚿 ล้างอ่อนโยน+เลี่ยงสบู่แรง' },
  'ปวดประจำเดือน': { protocol: 'SC-MENSTR', focus: '🔥 ประคบอุ่น+พัก' },
  'ประจำเดือนมาไม่ปกติ': { protocol: 'SC-MENSTR', focus: '📝 บันทึกรอบ+ประเมินเพิ่ม' },
  'pms': { protocol: 'SC-MENSTR', focus: '💤 พัก+ลดเค็มหวาน' },
  'ปวดท้องน้อยหลังมีเพศสัมพันธ์': { protocol: 'SC-UTI', focus: '💧 น้ำ+ไม่กลั้น' },
  'ปัสสาวะมีกลิ่น': { protocol: 'SC-UTI', focus: '💧 น้ำ+เลี่ยงกาแฟ' },
  'ปัสสาวะขุ่น': { protocol: 'SC-UTI', focus: '📝 ติดตาม+พบแพทย์ถ้าไข้' },

  // E) Skin / Allergy / Wound (241–300)
  'ผื่น': { protocol: 'SC-SKIN-AL', focus: '🧊 ประคบเย็น+หยุดสิ่งสงสัยแพ้' },
  'ผื่นคัน': { protocol: 'SC-SKIN-AL', focus: '🚫 เกา+มอยส์เจอร์อ่อน' },
  'ลมพิษ': { protocol: 'SC-SKIN-AL', focus: '🧊 เย็น+หยุดสิ่งกระตุ้น' },
  'คันตามตัว': { protocol: 'SC-SKIN-AL', focus: '🚿 น้ำอุณหภูมิห้อง' },
  'ผื่นแดง': { protocol: 'SC-SKIN-AL', focus: '🧴 มอยส์เจอร์+เลี่ยงสบู่แรง' },
  'แพ้ยา': { protocol: 'SC-SKIN-AL', focus: '🧭 ถามอาการอันตรายก่อนเสมอ' },
  'แมลงกัด': { protocol: 'SC-BITE', focus: '🧊 ประคบ+งดเกา' },
  'ยุงกัด': { protocol: 'SC-BITE', focus: '🧴 คาลาไมน์+เย็น' },
  'ต่อแตนต่อย': { protocol: 'SC-BITE', focus: '🧊 เย็น+สังเกตบวมลาม' },
  'แผลถลอก': { protocol: 'SC-WOUND', focus: '🧼 ล้างสะอาด+ปิดแผล' },
  'แผลมีหนองเล็กน้อย': { protocol: 'SC-SKIN-INF', focus: '🚫 บีบ+ดูแดงลาม' },
  'ฝีเล็ก': { protocol: 'SC-SKIN-INF', focus: '🧼 สะอาด+ติดตาม' },
  'ผิวหนังอักเสบ': { protocol: 'SC-SKIN-AL', focus: '🧴 มอยส์เจอร์+หยุดสิ่งระคาย' },
  'แสบผิว': { protocol: 'SC-SKIN-AL', focus: '🚿 ล้างน้ำอุณหภูมิห้อง' },
  'ผดร้อน': { protocol: 'SC-SKIN-AL', focus: '🚿 อาบน้ำ+เสื้อผ้าระบาย' },
  'กลาก': { protocol: 'SC-SKIN-INF', focus: '🧼 แห้งสะอาด+อย่าใช้ของร่วม' },
  'สิวอักเสบ': { protocol: 'SC-SKIN-INF', focus: '🚫 บีบ+ล้างอ่อนโยน' },
  'แผลไหม้เล็กน้อย': { protocol: 'SC-BURN', focus: '🚿 น้ำเย็นไหล 10–20 นาที' },
  'น้ำร้อนลวก': { protocol: 'SC-BURN', focus: '🚿 เย็นทันที+ปิดผ้าสะอาด' },
  'คันหนังศีรษะ': { protocol: 'SC-SKIN-AL', focus: '🧴 ลดสารระคาย+สังเกตผื่น' },

  // F) MSK / Back / Joint (301–320)
  'ปวดกล้ามเนื้อ': { protocol: 'SC-MSK-STRAIN', focus: '🧊 พัก+ยืดเบา' },
  'ปวดเมื่อย': { protocol: 'SC-MSK-STRAIN', focus: '🛌 พัก+ดื่มน้ำ' },
  'เคล็ด': { protocol: 'SC-MSK-STRAIN', focus: '🧊 24–48 ชม.แรก' },
  'ข้อเท้าแพลง': { protocol: 'SC-MSK-STRAIN', focus: '🧊 ยกสูง+พัก' },
  'ปวดหลัง': { protocol: 'SC-BACK', focus: '🧍 ท่าทาง+ประคบ' },
  'ปวดเอว': { protocol: 'SC-BACK', focus: '🔥 คลายตึง+เดินเบา' },
  'หลังตึง': { protocol: 'SC-BACK', focus: '🧘 ยืดเบา+พักจอ' },
  'ปวดข้อ': { protocol: 'SC-JOINT', focus: '🧊 พักข้อ+พยุง' },
  'ข้อบวมเล็กน้อย': { protocol: 'SC-JOINT', focus: '🧊 ประคบ+เลี่ยงกระแทก' },
  'ปวดเข่า': { protocol: 'SC-JOINT', focus: '🧊 พัก+พยุง' },
  'ปวดข้อมือ': { protocol: 'SC-MSK-STRAIN', focus: '🧊 พักท่าซ้ำๆ' },
  'ปวดมือจากใช้เมาส์': { protocol: 'SC-MSK-STRAIN', focus: '🧘 ยืด+พัก' },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find matching symptom keyword in catalog
 * @param {string} symptom - User input symptom
 * @returns {object|null} - { protocol, focus } or null
 */
function findSymptomProtocol(symptom) {
  const normalizedSymptom = normalizeThaiText(symptom.toLowerCase());
  
  // Direct match first
  if (SYMPTOM_CATALOG[normalizedSymptom]) {
    return SYMPTOM_CATALOG[normalizedSymptom];
  }
  
  // Partial match (keyword contains symptom or vice versa)
  for (const [keyword, data] of Object.entries(SYMPTOM_CATALOG)) {
    if (normalizedSymptom.includes(keyword) || keyword.includes(normalizedSymptom)) {
      return data;
    }
  }
  
  return null;
}

/**
 * Merge base protocol recommendations with severity×timecourse matrix adjustments
 * @param {Array<string>} baseProtocol - Base self-care items from protocol
 * @param {Array<string>} matrixItems - Items from severity×timecourse matrix
 * @returns {Array<string>} - Merged recommendations (3-5 items)
 */
function mergeRecommendations(baseProtocol, matrixItems) {
  // CRITICAL: Prioritize symptom-specific protocol items over generic matrix items
  // Symptom-specific advice (e.g., eye care) is more relevant than generic advice (e.g., electrolytes)
  const combined = [...baseProtocol, ...matrixItems];
  
  // Remove duplicates (simple string comparison)
  const unique = [];
  const seen = new Set();
  
  for (const item of combined) {
    // Extract emoji + first few words as key for deduplication
    const key = item.substring(0, 30).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  
  // Return 3-5 items (prioritize symptom-specific protocol items first)
  return unique.slice(0, 5);
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate symptom-specific self-care recommendations
 * 
 * 🔵 STEP 5A: Self-Care at Home (Mandatory)
 * 
 * Flow:
 * 1. Map symptom keyword → Protocol ID
 * 2. Get base self-care from Protocol
 * 3. Adjust intensity based on Severity × Time-course Matrix
 * 4. Return 3–5 short bullets with emoji
 * 
 * @param {string} symptom - Symptom text
 * @param {string} severity - 'mild' | 'moderate' | 'severe'
 * @param {string} timeCourse - 'acute' | 'subacute' | 'chronic' | 'progressive' | 'recurrent'
 * @param {object} healthProfile - Health profile (age, weight, chronic diseases)
 * @param {object} answers - User answers
 * @returns {Array<string>} Array of 3-5 self-care recommendations
 */
export function generateSelfCareRecommendations(symptom, severity = 'mild', timeCourse = 'acute', healthProfile = null, answers = {}, intentSelfCareGroups = null) {
  const normalizedSymptom = normalizeThaiText(symptom.toLowerCase());
  
  // CRITICAL IMPROVEMENT: Use intent self-care groups if provided (from 700-intent dataset)
  // This ensures recommendations match the structured intent data
  const useIntentGroups = Array.isArray(intentSelfCareGroups) && intentSelfCareGroups.length > 0;
  
  if (useIntentGroups) {
    console.log(`[SELF-CARE-INTENT] Using intent self-care groups: ${intentSelfCareGroups.join(', ')}`);
  }
  
  // Step 1: Find Protocol ID from symptom catalog
  const symptomData = findSymptomProtocol(normalizedSymptom);
  
  // Step 2: Get base protocol recommendations
  // CRITICAL IMPROVEMENT: If intent has self-care groups, prefer those over protocol lookup
  let baseProtocol = [];
  if (useIntentGroups) {
    // Map intent self-care groups to protocol recommendations
    // This uses structured intent data instead of text-based matching
    for (const group of intentSelfCareGroups) {
      if (SELF_CARE_PROTOCOLS[group]) {
        baseProtocol.push(...SELF_CARE_PROTOCOLS[group]);
      }
    }
  }
  
  // Fallback to symptom-based protocol if intent groups not available or empty
  if (baseProtocol.length === 0 && symptomData && SELF_CARE_PROTOCOLS[symptomData.protocol]) {
    baseProtocol = [...SELF_CARE_PROTOCOLS[symptomData.protocol]];
  }
  
  // Step 3: Get severity×timecourse matrix recommendations
  let matrixItems = [];
  if (SEVERITY_TIMECOURSE_MATRIX[severity] && SEVERITY_TIMECOURSE_MATRIX[severity][timeCourse]) {
    matrixItems = [...SEVERITY_TIMECOURSE_MATRIX[severity][timeCourse]];
  } else {
    // Fallback to mild×acute if exact match not found
    matrixItems = SEVERITY_TIMECOURSE_MATRIX['mild']?.['acute'] || [];
  }
  
  // Step 4: Merge base protocol + matrix adjustments
  let recommendations = mergeRecommendations(baseProtocol, matrixItems);
  
  // Step 5: Age-specific adjustments
  if (healthProfile?.age !== null && healthProfile?.age !== undefined) {
    const age = healthProfile.age;
    
    // Children (< 12 years)
    if (age < 12) {
      if (normalizedSymptom.includes('ไข้') || normalizedSymptom.includes('fever')) {
        recommendations.push('👶 สำหรับเด็ก: ระวังไข้สูง ควรเช็ดตัวบ่อยๆ');
      }
    }
    
    // Elderly (> 65 years)
    if (age > 65) {
      if (normalizedSymptom.includes('ปวด') || normalizedSymptom.includes('dizzy') || normalizedSymptom.includes('เวียน')) {
        recommendations.push('👴 สำหรับผู้สูงอายุ: ระวังการหกล้ม ควรมีคนช่วยดูแล');
      }
    }
  }
  
  // Step 6: Chronic disease adjustments
  if (healthProfile?.chronicDiseases && healthProfile.chronicDiseases.length > 0) {
    const hasDiabetes = healthProfile.chronicDiseases.some(d => 
      normalizeThaiText(d.toLowerCase()).includes('เบาหวาน') || 
      d.toLowerCase().includes('diabetes')
    );
    const hasHypertension = healthProfile.chronicDiseases.some(d => 
      normalizeThaiText(d.toLowerCase()).includes('ความดัน') || 
      d.toLowerCase().includes('hypertension') ||
      d.toLowerCase().includes('pressure')
    );
    
    if (hasDiabetes && (normalizedSymptom.includes('ท้องเสีย') || normalizedSymptom.includes('diarrhea'))) {
      recommendations.push('⚠️ สำหรับผู้เป็นเบาหวาน: ระวังน้ำตาลต่ำ ควรวัดน้ำตาลบ่อยๆ');
    }
    
    if (hasHypertension && (normalizedSymptom.includes('ปวดหัว') || normalizedSymptom.includes('headache'))) {
      recommendations.push('⚠️ สำหรับผู้เป็นความดัน: วัดความดัน ถ้าสูงผิดปกติควรพบแพทย์');
    }
  }
  
  // Step 7: Limit to 5 items max
  recommendations = recommendations.slice(0, 5);
  
  // Step 8: Fallback if no recommendations found
  if (recommendations.length === 0) {
    recommendations = [
      '🛌 พักผ่อนให้เพียงพอ',
      '💧 ดื่มน้ำอุ่นบ่อยๆ',
      '🚫 หลีกเลี่ยงสิ่งกระตุ้น',
      '👀 สังเกตอาการอย่างใกล้ชิด',
      '⏰ ถ้าไม่ดีขึ้นใน 2–3 วัน ควรปรึกษาแพทย์',
    ];
  }
  
  return recommendations;
}
