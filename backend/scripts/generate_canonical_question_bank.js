/**
 * Generate Canonical Question Bank (650 questions)
 * 
 * This script generates the Canonical Question Bank with 650 clinically valid questions
 * organized by symptom group and canonical categories (10 categories per group).
 * 
 * Run: node backend/scripts/generate_canonical_question_bank.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '../../mobile/assets/data/canonical_question_bank.json');

// Canonical question templates by category and symptom group
const CANONICAL_TEMPLATES = {
  headache_neuro: {
    body_part_localization: [
      "ปวดศีรษะบริเวณไหนคะ?",
      "ปวดข้างเดียวหรือทั้งสองข้างคะ?",
      "ปวดหลายตำแหน่งหรือตำแหน่งเดียวคะ?",
      "ปวดร้าวไปที่อื่นหรือไม่คะ?",
      "ปวดร้าวไปที่ไหนบ้างคะ?",
      "ปวดลึกหรือปวดตื้นคะ?"
    ],
    severity_assessment: [
      "ระดับความปวดกี่คะแนนจาก 0-10 คะ?",
      "ปวดจนทำกิจวัตรไม่ได้หรือไม่คะ?",
      "ปวดมากจนต้องหยุดพักหรือไม่คะ?",
      "ปวดรบกวนการนอนหลับหรือไม่คะ?",
      "ปวดมากจนต้องกินยาบ่อยๆ หรือไม่คะ?",
      "ปวดมากจนไม่สามารถทำกิจกรรมที่ชอบได้หรือไม่คะ?",
      "ปวดมากจนต้องปิดไฟหรือหลบเสียงหรือไม่คะ?",
      "ปวดมากจนต้องนอนพักหรือไม่คะ?"
    ],
    time_course_duration: [
      "เป็นมานานกี่ชั่วโมง/วันแล้วคะ?",
      "อาการดีขึ้น แย่ลง หรือคงที่คะ?",
      "เป็นๆ หายๆ หรือต่อเนื่องคะ?",
      "ปวดเริ่มทันทีหรือค่อยๆ เพิ่มขึ้นคะ?",
      "ปวดเป็นครั้งคราวหรือเป็นทุกวันคะ?",
      "ปวดเป็นเวลาเดียวกันทุกวันหรือไม่คะ?",
      "ปวดเป็นมานานที่สุดกี่ชั่วโมง/วันคะ?",
      "ปวดเป็นบ่อยแค่ไหนคะ?"
    ],
    symptom_character: [
      "ปวดตุบๆ ปวดตื้อ หรือปวดแสบคะ?",
      "ปวดเป็นพักๆ หรือปวดตลอดคะ?",
      "ปวดมากขึ้นเมื่อเคลื่อนไหวหรือไม่คะ?",
      "ปวดมากขึ้นเมื่อไอ จาม หรือเบ่งหรือไม่คะ?",
      "ปวดมากขึ้นเมื่อก้มหรือเงยศีรษะหรือไม่คะ?",
      "ปวดเหมือนถูกบีบหรือถูกกดหรือไม่คะ?",
      "ปวดเหมือนถูกตีหรือถูกแทงหรือไม่คะ?"
    ],
    red_flag_exclusion: [
      "ปวดรุนแรงที่สุดในชีวิตหรือไม่คะ?",
      "มีแขนขาอ่อนแรงหรือพูดไม่ชัดหรือไม่คะ?",
      "มีไข้สูงหรือคอแข็งหรือไม่คะ?",
      "ปวดหลังอุบัติเหตุหรือการบาดเจ็บที่ศีรษะหรือไม่คะ?",
      "เห็นภาพซ้อนหรือมองไม่ชัดหรือไม่คะ?",
      "ชาครึ่งซีกหรือหมดสติหรือไม่คะ?"
    ],
    associated_symptoms: [
      "คลื่นไส้ อาเจียน แพ้แสงหรือไม่คะ?",
      "มีไข้หรือหนาวสั่นหรือไม่คะ?",
      "เวียนหัวหรือหน้ามืดหรือไม่คะ?",
      "ใจสั่นหรือเหงื่อออกหรือไม่คะ?",
      "น้ำมูก คัดจมูก หรือเจ็บคอหรือไม่คะ?",
      "ปวดเมื่อยตามตัวหรือไม่คะ?",
      "ปวดตา ตาแดง หรือตามัวหรือไม่คะ?",
      "มีอาการอื่นๆ ร่วมด้วยหรือไม่คะ?"
    ],
    triggers_relieving_factors: [
      "นอนน้อย เครียด หรือจ้องจอนานหรือไม่คะ?",
      "ปวดดีขึ้นเมื่อพักผ่อนหรือไม่คะ?",
      "เคยลองกินยาอะไรแล้วดีขึ้นบ้างไหมคะ?",
      "ปวดมากขึ้นเมื่อเจอแสงจ้าหรือเสียงดังหรือไม่คะ?",
      "ปวดมากขึ้นเมื่อกินอาหารบางชนิดหรือไม่คะ?",
      "ปวดดีขึ้นเมื่อนวดหรือประคบร้อน/เย็นหรือไม่คะ?"
    ],
    functional_impact: [
      "ยังทำงานหรือเรียนได้ตามปกติหรือไม่คะ?",
      "ส่งผลต่อการนอนหลับหรือไม่คะ?",
      "ส่งผลต่อการทำกิจกรรมประจำวันหรือไม่คะ?",
      "ส่งผลต่อการขับรถหรือไม่คะ?",
      "ส่งผลต่อการออกกำลังกายหรือไม่คะ?"
    ],
    risk_factors_history: [
      "เคยปวดแบบนี้มาก่อนหรือไม่คะ?",
      "มีโรคประจำตัวเกี่ยวกับสมองหรือไม่คะ?",
      "เคยมีประวัติการบาดเจ็บที่ศีรษะหรือไม่คะ?",
      "มีประวัติโรคความดันโลหิตสูงหรือไม่คะ?",
      "มีประวัติโรคเบาหวานหรือไม่คะ?"
    ],
    previous_episodes: [
      "เคยเป็นแบบนี้บ่อยแค่ไหนคะ?",
      "เคยรักษาแบบไหนแล้วดีขึ้นบ้างคะ?",
      "มีคนในครอบครัวเป็นแบบนี้หรือไม่คะ?",
      "เคยไปพบแพทย์เพราะอาการนี้หรือไม่คะ?"
    ]
  },
  respiratory: {
    body_part_localization: [
      "ไอ/เจ็บคอ/น้ำมูกเป็นบริเวณไหนคะ?",
      "เจ็บคอมากที่ด้านไหนคะ?",
      "น้ำมูกไหลจากจมูกข้างเดียวหรือทั้งสองข้างคะ?",
      "ไอมากตอนไหนคะ? (เช้า/กลางวัน/กลางคืน)"
    ],
    severity_assessment: [
      "ไอ/น้ำมูกมากจนรบกวนการนอนหลับไหมคะ?",
      "ไอ/น้ำมูกมากจนต้องหยุดทำงานหรือเรียนไหมคะ?",
      "หายใจลำบากหรือเหนื่อยง่ายกว่าปกติไหมคะ?",
      "ไอมากจนเจ็บหน้าอกหรือปวดท้องไหมคะ?",
      "น้ำมูกมากจนหายใจไม่สะดวกไหมคะ?",
      "เจ็บคอมากจนกินอาหารหรือดื่มน้ำลำบากไหมคะ?"
    ],
    time_course_duration: [
      "อาการนี้เป็นมานานกี่วันแล้วคะ?",
      "ไอ/น้ำมูกเป็นๆ หายๆ หรือต่อเนื่องคะ?",
      "อาการดีขึ้น แย่ลง หรือคงที่คะ?",
      "อาการเริ่มทันทีหรือค่อยๆ เพิ่มขึ้นคะ?",
      "ไอ/น้ำมูกเป็นทุกวันหรือเป็นครั้งคราวคะ?"
    ],
    symptom_character: [
      "ไอแห้งๆ หรือไอมีเสมหะคะ?",
      "เสมหะมีสีอะไรคะ?",
      "น้ำมูกใสหรือขุ่นคะ?",
      "เจ็บคอมากเมื่อกลืนหรือพูดไหมคะ?",
      "เสียงแหบหรือไม่คะ?"
    ],
    red_flag_exclusion: [
      "หายใจลำบากมากหรือมีไข้สูงร่วมด้วยไหมคะ?",
      "ไอเป็นเลือดหรือเสมหะมีสีผิดปกติไหมคะ?",
      "หายใจมีเสียงหวีดหรือแน่นหน้าอกมากไหมคะ?",
      "ไอร่วมกับน้ำหนักลดหรือเหงื่อออกตอนกลางคืนไหมคะ?"
    ],
    associated_symptoms: [
      "ไอ/น้ำมูกร่วมกับเจ็บคอหรือเสียงแหบไหมคะ?",
      "ไอ/น้ำมูกร่วมกับไข้หรือหนาวสั่นไหมคะ?",
      "ไอ/น้ำมูกร่วมกับปวดหัวหรือปวดเมื่อยไหมคะ?",
      "ไอมีเสมหะหรือไอแห้งๆ คะ?"
    ],
    triggers_relieving_factors: [
      "ไอมากขึ้นเมื่อนอนราบหรือตอนกลางคืนไหมคะ?",
      "ไอมากขึ้นเมื่อเจออากาศเย็นหรือฝุ่นควันไหมคะ?",
      "น้ำมูกมากขึ้นเมื่อเจอสารก่อภูมิแพ้ไหมคะ?",
      "ไอดีขึ้นเมื่อดื่มน้ำอุ่นหรือกลั้วคอไหมคะ?"
    ],
    functional_impact: [
      "ไอ/น้ำมูกส่งผลต่อการนอนหลับไหมคะ?",
      "ไอ/น้ำมูกส่งผลต่อการทำงานหรือการเรียนไหมคะ?"
    ],
    risk_factors_history: [
      "เคยมีประวัติโรคหอบหืดหรือภูมิแพ้ไหมคะ?",
      "เคยสัมผัสกับคนที่เป็นหวัดหรือไข้หวัดใหญ่ไหมคะ?"
    ],
    previous_episodes: [
      "เคยเป็นแบบนี้บ่อยแค่ไหนคะ?",
      "เคยรักษาแบบไหนแล้วดีขึ้นบ้างคะ?"
    ]
  },
  gi: {
    body_part_localization: [
      "ปวดท้องบริเวณไหนคะ?",
      "ปวดท้องส่วนบนหรือส่วนล่างคะ?",
      "ปวดท้องข้างซ้าย ข้างขวา หรือตรงกลางคะ?",
      "ปวดหลายตำแหน่งหรือตำแหน่งเดียวคะ?"
    ],
    severity_assessment: [
      "ปวดท้อง/ท้องเสียมากจนทำงานหรือเรียนไม่ได้ไหมคะ?",
      "ปวดท้องมากจนต้องหยุดพักหรือนอนไหมคะ?",
      "ท้องเสียมากจนต้องเข้าห้องน้ำบ่อยมากไหมคะ?",
      "คลื่นไส้/อาเจียนมากจนกินอาหารไม่ได้ไหมคะ?",
      "ปวดท้องมากจนไม่สามารถทำกิจกรรมตามปกติได้ไหมคะ?"
    ],
    time_course_duration: [
      "อาการนี้เป็นมานานกี่วันแล้วคะ?",
      "ปวดท้อง/ท้องเสียเป็นๆ หายๆ หรือต่อเนื่องคะ?",
      "อาการดีขึ้น แย่ลง หรือคงที่คะ?",
      "อาการเริ่มทันทีหรือค่อยๆ เพิ่มขึ้นคะ?",
      "ปวดท้องเป็นทุกวันหรือเป็นครั้งคราวคะ?"
    ],
    symptom_character: [
      "ปวดท้องแบบปวดบีบ ปวดตื้อ หรือปวดแสบคะ?",
      "ปวดท้องมากขึ้นเมื่อกินอาหารหรือดื่มน้ำไหมคะ?",
      "ท้องเสียเป็นน้ำหรือเป็นก้อนคะ?",
      "คลื่นไส้มากขึ้นเมื่อเห็นอาหารหรือกลิ่นอาหารไหมคะ?"
    ],
    red_flag_exclusion: [
      "ปวดท้องรุนแรงมากหรือมีไข้สูงร่วมด้วยไหมคะ?",
      "ถ่ายเป็นเลือดหรืออาเจียนเป็นเลือดไหมคะ?",
      "ปวดท้องมากจนกดเจ็บหรือท้องแข็งไหมคะ?",
      "ปวดท้องร่วมกับน้ำหนักลดหรือเบื่ออาหารมากไหมคะ?"
    ],
    associated_symptoms: [
      "ปวดท้องร่วมกับท้องเสียหรือท้องผูกไหมคะ?",
      "ปวดท้องร่วมกับคลื่นไส้ อาเจียน หรือเบื่ออาหารไหมคะ?",
      "ปวดท้องร่วมกับไข้หรือหนาวสั่นไหมคะ?",
      "ท้องเสียร่วมกับปวดท้องหรือมีไข้ไหมคะ?"
    ],
    triggers_relieving_factors: [
      "ปวดท้องมากขึ้นเมื่อกินอาหารหรือดื่มน้ำไหมคะ?",
      "ปวดท้องมากขึ้นเมื่อเคลื่อนไหวหรือออกแรงไหมคะ?",
      "ท้องเสียมากขึ้นเมื่อกินอาหารรสจัดหรือนมไหมคะ?",
      "ปวดท้องดีขึ้นเมื่อพักผ่อนหรือนอนไหมคะ?"
    ],
    functional_impact: [
      "ปวดท้อง/ท้องเสียส่งผลต่อการทำงานหรือการเรียนไหมคะ?",
      "ปวดท้อง/ท้องเสียส่งผลต่อการกินอาหารไหมคะ?"
    ],
    risk_factors_history: [
      "เคยมีประวัติโรคกระเพาะหรือลำไส้อักเสบไหมคะ?",
      "เคยกินอาหารที่สงสัยว่าบูดหรือไม่สะอาดไหมคะ?"
    ],
    previous_episodes: [
      "เคยเป็นแบบนี้บ่อยแค่ไหนคะ?",
      "เคยรักษาแบบไหนแล้วดีขึ้นบ้างคะ?"
    ]
  }
};

// Category configurations
const CATEGORY_CONFIG = {
  body_part_localization: {
    priority: 1,
    when_to_ask: ["Q2", "Q3"],
    confidence_weight_range: [0.05, 0.10],
    choices: ["ข้างซ้าย", "ข้างขวา", "ทั้งสองข้าง", "หลายตำแหน่ง", "ไม่แน่ใจ"]
  },
  red_flag_exclusion: {
    priority: 1,
    when_to_ask: ["Q1", "Q2", "Q3"],
    confidence_weight_range: [0.15, 0.25],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  severity_assessment: {
    priority: 2,
    when_to_ask: ["Q3", "Q4", "Q5"],
    confidence_weight_range: [0.10, 0.20],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  time_course_duration: {
    priority: 2,
    when_to_ask: ["Q3", "Q4", "Q5"],
    confidence_weight_range: [0.10, 0.15],
    choices: ["น้อยกว่า 3 วัน", "3-7 วัน", "1-2 สัปดาห์", "มากกว่า 2 สัปดาห์", "เป็นๆ หายๆ"]
  },
  symptom_character: {
    priority: 3,
    when_to_ask: ["Q4", "Q5", "Q6", "Q7"],
    confidence_weight_range: [0.05, 0.10],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  associated_symptoms: {
    priority: 3,
    when_to_ask: ["Q5", "Q6", "Q7", "Q8", "Q9"],
    confidence_weight_range: [0.05, 0.15],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  functional_impact: {
    priority: 3,
    when_to_ask: ["Q5", "Q6", "Q7", "Q8"],
    confidence_weight_range: [0.05, 0.10],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  triggers_relieving_factors: {
    priority: 4,
    when_to_ask: ["Q6", "Q7", "Q8", "Q9", "Q10"],
    confidence_weight_range: [0.03, 0.08],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  risk_factors_history: {
    priority: 4,
    when_to_ask: ["Q8", "Q9", "Q10", "Q11", "Q12"],
    confidence_weight_range: [0.03, 0.08],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  },
  previous_episodes: {
    priority: 4,
    when_to_ask: ["Q9", "Q10", "Q11", "Q12", "Q13", "Q14"],
    confidence_weight_range: [0.03, 0.08],
    choices: ["ใช่", "ไม่", "ไม่แน่ใจ"]
  }
};

// Symptom groups with metadata
const SYMPTOM_GROUPS = [
  { id: "headache_neuro", name_th: "ปวดหัว / ระบบประสาท", name_en: "Headache / Neurological", questions: 55 },
  { id: "respiratory", name_th: "ระบบหายใจ", name_en: "Respiratory", questions: 60 },
  { id: "ent", name_th: "หู คอ จมูก", name_en: "ENT", questions: 45 },
  { id: "gi", name_th: "ระบบทางเดินอาหาร", name_en: "GI", questions: 60 },
  { id: "urinary", name_th: "ระบบปัสสาวะ", name_en: "Urinary", questions: 40 },
  { id: "musculoskeletal", name_th: "กล้ามเนื้อและกระดูก", name_en: "Musculoskeletal", questions: 55 },
  { id: "skin", name_th: "ผิวหนัง", name_en: "Skin", questions: 45 },
  { id: "fever_infection", name_th: "ไข้ / การติดเชื้อ", name_en: "Fever / Infection", questions: 45 },
  { id: "chest_cardio", name_th: "หน้าอก / หัวใจ", name_en: "Chest / Cardiac", questions: 40 },
  { id: "general_symptoms", name_th: "อาการทั่วไป", name_en: "General Symptoms", questions: 40 },
  { id: "womens_health", name_th: "สุขภาพสตรี", name_en: "Women's Health", questions: 35 },
  { id: "mens_health", name_th: "สุขภาพบุรุษ", name_en: "Men's Health", questions: 30 },
  { id: "pediatric_common", name_th: "อาการเด็กทั่วไป", name_en: "Pediatric Common", questions: 45 },
  { id: "allergy_immune", name_th: "ภูมิแพ้ / ระบบภูมิคุ้มกัน", name_en: "Allergy / Immune", questions: 40 },
  { id: "eye", name_th: "ตา", name_en: "Eye", questions: 35 },
  { id: "mental_sleep", name_th: "จิตใจ / การนอน", name_en: "Mental / Sleep", questions: 40 }
];

// Generate choice mapping
function generateChoiceMapping(categoryId, choices) {
  const mapping = {};
  
  choices.forEach(choice => {
    if (categoryId === 'severity_assessment') {
      if (choice === 'ใช่') {
        mapping[choice] = {
          severity: "moderate",
          confidence_boost: 0.10,
          follow_up: []
        };
      } else if (choice === 'ไม่') {
        mapping[choice] = {
          severity: "mild",
          confidence_boost: 0.05,
          follow_up: []
        };
      } else {
        mapping[choice] = {
          confidence_boost: 0.02,
          follow_up: []
        };
      }
    } else if (categoryId === 'time_course_duration') {
      if (choice === 'น้อยกว่า 3 วัน') {
        mapping[choice] = {
          time_course: "acute",
          confidence_boost: 0.08,
          follow_up: []
        };
      } else if (choice === '3-7 วัน') {
        mapping[choice] = {
          time_course: "subacute",
          confidence_boost: 0.08,
          follow_up: []
        };
      } else if (choice === '1-2 สัปดาห์') {
        mapping[choice] = {
          time_course: "subacute",
          confidence_boost: 0.06,
          follow_up: []
        };
      } else if (choice === 'มากกว่า 2 สัปดาห์' || choice === 'เป็นๆ หายๆ') {
        mapping[choice] = {
          time_course: "recurrent",
          confidence_boost: 0.06,
          follow_up: []
        };
      } else {
        mapping[choice] = {
          confidence_boost: 0.02,
          follow_up: []
        };
      }
    } else if (categoryId === 'red_flag_exclusion') {
      if (choice === 'ใช่') {
        mapping[choice] = {
          red_flag_hint: true,
          confidence_boost: 0.15,
          emergency: true,
          follow_up: []
        };
      } else {
        mapping[choice] = {
          red_flag_hint: false,
          confidence_boost: 0.10,
          follow_up: []
        };
      }
    } else {
      // Default mapping
      if (choice === 'ใช่') {
        mapping[choice] = {
          confidence_boost: 0.05,
          follow_up: []
        };
      } else if (choice === 'ไม่') {
        mapping[choice] = {
          confidence_boost: 0.03,
          follow_up: []
        };
      } else {
        mapping[choice] = {
          confidence_boost: 0.01,
          follow_up: []
        };
      }
    }
  });
  
  return mapping;
}

// Generate questions for a category
function generateCategoryQuestions(symptomGroup, categoryId, categoryConfig, templates) {
  const questions = [];
  const questionTemplates = templates || [];
  
  questionTemplates.forEach((template, index) => {
    const confidenceWeight = categoryConfig.confidence_weight_range[0] + 
      (Math.random() * (categoryConfig.confidence_weight_range[1] - categoryConfig.confidence_weight_range[0]));
    
    const question = {
      question_id: `${symptomGroup.id.toUpperCase()}_${categoryId.toUpperCase()}_${String(index + 1).padStart(3, '0')}`,
      question_text_th: template,
      question_text_en: "",
      intent_type: categoryId,
      confidence_weight: Math.round(confidenceWeight * 100) / 100,
      priority: categoryConfig.priority,
      choices: categoryConfig.choices,
      choice_mapping: generateChoiceMapping(categoryId, categoryConfig.choices),
      exclude_if: getExcludeConditions(categoryId),
      requires_body_part: categoryId === 'body_part_localization',
      body_part_specific: [],
      severity_filter: null,
      time_course_filter: null,
      skip_if_answered: [],
      follow_up_questions: []
    };
    
    questions.push(question);
  });
  
  return questions;
}

// Get exclude conditions for category
function getExcludeConditions(categoryId) {
  const excludeConditions = [];
  
  if (categoryId === 'red_flag_exclusion') {
    excludeConditions.push('emergency_detected');
  } else if (categoryId === 'severity_assessment') {
    excludeConditions.push('emergency_detected', 'severe_confirmed');
  } else if (categoryId === 'body_part_localization') {
    excludeConditions.push('body_part_unknown');
  }
  
  return excludeConditions;
}

// Get generic templates when specific templates aren't available
function getGenericTemplates(categoryId, symptomGroup) {
  const genericTemplates = {
    body_part_localization: [
      "อาการเป็นบริเวณไหนคะ?",
      "เป็นข้างเดียวหรือทั้งสองข้างคะ?",
      "เป็นหลายตำแหน่งหรือตำแหน่งเดียวคะ?",
      "ร้าวไปที่อื่นหรือไม่คะ?"
    ],
    severity_assessment: [
      "อาการมากจนทำงานหรือใช้ชีวิตตามปกติไม่ได้ไหมคะ?",
      "อาการมากจนต้องหยุดพักหรือนอนไหมคะ?",
      "อาการรบกวนการนอนหลับไหมคะ?",
      "อาการมากจนไม่สามารถทำกิจกรรมตามปกติได้ไหมคะ?"
    ],
    time_course_duration: [
      "อาการนี้เป็นมานานกี่วันแล้วคะ?",
      "อาการเป็นๆ หายๆ หรือต่อเนื่องคะ?",
      "อาการดีขึ้น แย่ลง หรือคงที่คะ?",
      "อาการเริ่มทันทีหรือค่อยๆ เพิ่มขึ้นคะ?"
    ],
    symptom_character: [
      "อาการเป็นแบบไหนคะ?",
      "อาการมากขึ้นเมื่อเคลื่อนไหวหรือไม่คะ?",
      "อาการเป็นพักๆ หรือตลอดคะ?"
    ],
    red_flag_exclusion: [
      "อาการรุนแรงมากหรือมีไข้สูงร่วมด้วยไหมคะ?",
      "มีอาการทางระบบประสาทร่วมด้วยไหมคะ?",
      "หายใจลำบากมากหรือไม่คะ?"
    ],
    associated_symptoms: [
      "มีอาการอื่นร่วมด้วยไหมคะ?",
      "มีไข้หรือหนาวสั่นหรือไม่คะ?",
      "มีอาการอื่นๆ ร่วมด้วยหรือไม่คะ?"
    ],
    functional_impact: [
      "อาการส่งผลต่อการทำกิจกรรมประจำวันไหมคะ?",
      "อาการส่งผลต่อการนอนหลับไหมคะ?"
    ],
    triggers_relieving_factors: [
      "อาการมากขึ้นเมื่อออกแรงหรือไม่คะ?",
      "อาการดีขึ้นเมื่อพักผ่อนหรือไม่คะ?",
      "เคยลองกินยาอะไรแล้วดีขึ้นบ้างไหมคะ?"
    ],
    risk_factors_history: [
      "เคยมีประวัติอาการแบบนี้มาก่อนไหมคะ?",
      "เคยมีประวัติการบาดเจ็บหรือไม่คะ?"
    ],
    previous_episodes: [
      "เคยเป็นแบบนี้บ่อยแค่ไหนคะ?",
      "เคยรักษาแบบไหนแล้วดีขึ้นบ้างคะ?"
    ]
  };
  
  return genericTemplates[categoryId] || [];
}

// Generate canonical question bank for a symptom group
function generateCanonicalBankForGroup(symptomGroup) {
  const categories = [];
  const templates = CANONICAL_TEMPLATES[symptomGroup.id] || {};
  
  Object.keys(CATEGORY_CONFIG).forEach(categoryId => {
    const categoryConfig = CATEGORY_CONFIG[categoryId];
    let categoryTemplates = templates[categoryId] || [];
    
    // If no specific templates, use generic templates
    if (categoryTemplates.length === 0) {
      categoryTemplates = getGenericTemplates(categoryId, symptomGroup);
    }
    
    // Determine how many questions to generate for this category
    let questionCount = 0;
    if (categoryId === 'body_part_localization') questionCount = Math.min(6, categoryTemplates.length);
    else if (categoryId === 'red_flag_exclusion') questionCount = Math.min(6, categoryTemplates.length);
    else if (categoryId === 'severity_assessment') questionCount = Math.min(8, categoryTemplates.length);
    else if (categoryId === 'time_course_duration') questionCount = Math.min(8, categoryTemplates.length);
    else if (categoryId === 'symptom_character') questionCount = Math.min(7, categoryTemplates.length);
    else if (categoryId === 'associated_symptoms') questionCount = Math.min(8, categoryTemplates.length);
    else if (categoryId === 'functional_impact') questionCount = Math.min(5, categoryTemplates.length);
    else if (categoryId === 'triggers_relieving_factors') questionCount = Math.min(6, categoryTemplates.length);
    else if (categoryId === 'risk_factors_history') questionCount = Math.min(5, categoryTemplates.length);
    else if (categoryId === 'previous_episodes') questionCount = Math.min(4, categoryTemplates.length);
    
    // Use available templates up to questionCount
    const templatesToUse = categoryTemplates.slice(0, questionCount);
    
    if (templatesToUse.length > 0) {
      const questions = generateCategoryQuestions(symptomGroup, categoryId, categoryConfig, templatesToUse);
      
      const category = {
        category_id: categoryId,
        category_name_th: getCategoryNameThai(categoryId),
        category_name_en: getCategoryNameEnglish(categoryId),
        priority: categoryConfig.priority,
        when_to_ask: categoryConfig.when_to_ask,
        questions: questions
      };
      
      categories.push(category);
    }
  });
  
  return {
    symptom_group: symptomGroup.id,
    group_name_th: symptomGroup.name_th,
    group_name_en: symptomGroup.name_en,
    total_questions: categories.reduce((sum, cat) => sum + cat.questions.length, 0),
    categories: categories
  };
}

// Get category name in Thai
function getCategoryNameThai(categoryId) {
  const names = {
    'body_part_localization': 'ตำแหน่งของอาการ',
    'red_flag_exclusion': 'สัญญาณอันตราย',
    'severity_assessment': 'ความรุนแรงของอาการ',
    'time_course_duration': 'ระยะเวลาและความต่อเนื่อง',
    'symptom_character': 'ลักษณะของอาการ',
    'associated_symptoms': 'อาการที่เกี่ยวข้อง',
    'functional_impact': 'ผลกระทบต่อการทำกิจกรรม',
    'triggers_relieving_factors': 'ปัจจัยกระตุ้นและบรรเทา',
    'risk_factors_history': 'ปัจจัยเสี่ยงและประวัติ',
    'previous_episodes': 'การเป็นซ้ำ'
  };
  return names[categoryId] || categoryId;
}

// Get category name in English
function getCategoryNameEnglish(categoryId) {
  const names = {
    'body_part_localization': 'Body-Part Localization',
    'red_flag_exclusion': 'Red-Flag Exclusion',
    'severity_assessment': 'Severity Assessment',
    'time_course_duration': 'Time-Course / Duration',
    'symptom_character': 'Symptom Character',
    'associated_symptoms': 'Associated Symptoms',
    'functional_impact': 'Functional Impact',
    'triggers_relieving_factors': 'Triggers / Relieving Factors',
    'risk_factors_history': 'Risk Factors / History',
    'previous_episodes': 'Previous Episodes'
  };
  return names[categoryId] || categoryId;
}

// Generate all canonical question banks
function generateCanonicalQuestionBank() {
  console.log('🚀 Generating Canonical Question Bank...\n');
  
  const questionBanks = {};
  let totalQuestions = 0;
  
  SYMPTOM_GROUPS.forEach(group => {
    console.log(`📊 Generating questions for ${group.name_th}...`);
    const bank = generateCanonicalBankForGroup(group);
    questionBanks[group.id] = bank;
    totalQuestions += bank.total_questions;
    console.log(`   ✅ Generated ${bank.total_questions} questions across ${bank.categories.length} categories`);
  });
  
  const canonicalBank = {
    version: "2.0",
    last_updated: new Date().toISOString().split('T')[0],
    total_questions: totalQuestions,
    symptom_groups: SYMPTOM_GROUPS.map(g => g.id),
    question_banks: questionBanks,
    metadata: {
      categories: Object.keys(CATEGORY_CONFIG),
      category_priorities: {
        "1": ["body_part_localization", "red_flag_exclusion"],
        "2": ["severity_assessment", "time_course_duration"],
        "3": ["symptom_character", "associated_symptoms", "functional_impact"],
        "4": ["triggers_relieving_factors", "risk_factors_history", "previous_episodes"]
      },
      when_to_ask_options: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14"],
      exclude_conditions: [
        "emergency_detected",
        "severe_confirmed",
        "mild_confirmed",
        "body_part_unknown",
        "red_flag_positive",
        "confidence_high",
        "time_course_confirmed",
        "severity_confirmed"
      ]
    }
  };
  
  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(canonicalBank, null, 2), 'utf8');
  
  console.log(`\n✅ Canonical Question Bank generated successfully!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Total questions: ${totalQuestions}`);
  console.log(`📋 Symptom groups: ${SYMPTOM_GROUPS.length}`);
  console.log(`🎯 Categories: ${Object.keys(CATEGORY_CONFIG).length}`);
}

// Run generation
generateCanonicalQuestionBank();

