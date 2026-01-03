/**
 * OTC Severity × Time-course Mapper (Medical Textbook-Grade)
 * 
 * Maps symptom × severity × time-course combinations to OTC medication hierarchy
 * Supports 300+ symptoms via intent dataset
 * 
 * Core Principle:
 * OTC recommendations follow medical hierarchy:
 * First-line → Second-line → Alternative
 * 
 * Each symptom × severity × time-course combination defines:
 * - Allowed OTC groups
 * - Disallowed OTC groups
 * - OTC hierarchy (First-line, Second-line, Alternative)
 * - Self-care intensity level
 */

import { getOtcGroups } from './intent_loader.js';
import { getOTCMedsByCategory } from './thai_otc_catalog.js';

/**
 * OTC Mapping Rules by Symptom Category × Severity × Time-course
 * Medical textbook-grade hierarchy
 */
const OTC_MAPPING_RULES = {
  fever_pain: {
    mild: {
      acute: {
        first_line: ['พาราเซตามอล'],
        second_line: ['ไอบูโพรเฟน'],
        alternative: ['พาราเซตามอล + คาเฟอีน', 'ไดโคลฟีแนคเจล (ทาภายนอก)'],
        rationale: 'Mild acute pain: Start with safest option (paracetamol), escalate if needed',
      },
      subacute: {
        first_line: ['พาราเซตามอล'],
        second_line: ['ไอบูโพรเฟน', 'นาโพรเซน'],
        alternative: ['ไดโคลฟีแนคเจล (ทาภายนอก)'],
        rationale: 'Mild subacute: May need anti-inflammatory if inflammation present',
      },
      progressive: {
        first_line: ['พาราเซตามอล'],
        second_line: ['ไอบูโพรเฟน'],
        alternative: [],
        rationale: 'Mild progressive: Use cautiously, monitor for worsening',
        warning: '⚠️ Progressive symptoms require medical evaluation if not improving',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: ['พาราเซตามอล (short-term only)'],
        rationale: 'Mild chronic: Avoid long-term OTC use, need doctor evaluation',
        warning: '⚠️ Chronic symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['พาราเซตามอล'],
        second_line: ['ไอบูโพรเฟน'],
        alternative: ['Lifestyle modification'],
        rationale: 'Mild recurrent: Treat episodes, identify triggers',
      },
    },
    moderate: {
      acute: {
        first_line: ['พาราเซตามอล'],
        second_line: ['ไอบูโพรเฟน', 'นาโพรเซน'],
        alternative: ['พาราเซตามอล + คาเฟอีน'],
        rationale: 'Moderate acute: Can use stronger options if no contraindications',
      },
      subacute: {
        first_line: ['ไอบูโพรเฟน', 'นาโพรเซน'],
        second_line: ['พาราเซตามอล'],
        alternative: ['ไดโคลฟีแนคเจล (ทาภายนอก)'],
        rationale: 'Moderate subacute: Prefer NSAIDs for inflammation',
      },
      progressive: {
        first_line: ['ไอบูโพรเฟน'],
        second_line: ['พาราเซตามอล'],
        alternative: [],
        rationale: 'Moderate progressive: Use NSAIDs if inflammation, monitor closely',
        warning: '⚠️ Progressive symptoms require medical evaluation if not improving in 24-48 hours',
      },
      chronic: {
        first_line: [],
        second_line: ['พาราเซตามอล (short-term)'],
        alternative: [],
        rationale: 'Moderate chronic: Avoid long-term OTC, need doctor evaluation',
        warning: '⚠️ Chronic moderate symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['พาราเซตามอล'],
        second_line: ['ไอบูโพรเฟน'],
        alternative: ['Trigger avoidance', 'Lifestyle modification'],
        rationale: 'Moderate recurrent: Treat episodes, identify and avoid triggers',
      },
    },
    severe: {
      acute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe acute: Emergency - no OTC recommendations',
        warning: '🚨 Severe acute symptoms require immediate medical attention',
      },
      subacute: {
        first_line: [],
        second_line: ['ไอบูโพรเฟน (temporary relief only)'],
        alternative: [],
        rationale: 'Severe subacute: Temporary relief only, urgent medical evaluation needed',
        warning: '⚠️ Severe subacute symptoms require urgent medical evaluation',
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe progressive: Emergency - no OTC recommendations',
        warning: '🚨 Severe progressive symptoms require immediate medical attention',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe chronic: Specialist evaluation required - no OTC',
        warning: '⚠️ Severe chronic symptoms require specialist evaluation',
      },
      recurrent: {
        first_line: ['ไอบูโพรเฟน'],
        second_line: ['พาราเซตามอล'],
        alternative: [],
        rationale: 'Severe recurrent: Treat episodes, urgent evaluation for pattern',
        warning: '⚠️ Severe recurrent symptoms require medical evaluation',
      },
    },
  },
  
  nasal_congestion: {
    mild: {
      acute: {
        first_line: ['ลอราทาดีน', 'เซทิริซีน'],
        second_line: ['น้ำเกลือล้างจมูก'],
        alternative: ['Steam inhalation'],
        rationale: 'Mild acute: Non-sedating antihistamine first',
      },
      subacute: {
        first_line: ['ลอราทาดีน', 'เซทิริซีน'],
        second_line: ['ซูโดเอฟีดรีน'],
        alternative: ['น้ำเกลือล้างจมูก'],
        rationale: 'Mild subacute: Antihistamine, add decongestant if needed',
      },
      progressive: {
        first_line: ['ลอราทาดีน'],
        second_line: ['น้ำเกลือล้างจมูก'],
        alternative: [],
        rationale: 'Mild progressive: Monitor for worsening',
        warning: '⚠️ Progressive symptoms require medical evaluation',
      },
      chronic: {
        first_line: ['น้ำเกลือล้างจมูก'],
        second_line: ['ลอราทาดีน'],
        alternative: [],
        rationale: 'Mild chronic: Prefer non-drug options, need doctor evaluation',
        warning: '⚠️ Chronic symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['ลอราทาดีน', 'เซทิริซีน'],
        second_line: ['น้ำเกลือล้างจมูก'],
        alternative: ['Allergen avoidance'],
        rationale: 'Mild recurrent: Treat episodes, identify triggers',
      },
    },
    moderate: {
      acute: {
        first_line: ['ลอราทาดีน', 'เซทิริซีน'],
        second_line: ['ซูโดเอฟีดรีน'],
        alternative: ['น้ำเกลือล้างจมูก'],
        rationale: 'Moderate acute: Antihistamine + decongestant if BP safe',
      },
      subacute: {
        first_line: ['ลอราทาดีน'],
        second_line: ['ซูโดเอฟีดรีน'],
        alternative: ['น้ำเกลือล้างจมูก'],
        rationale: 'Moderate subacute: Antihistamine + decongestant combination',
      },
      progressive: {
        first_line: ['ลอราทาดีน'],
        second_line: ['น้ำเกลือล้างจมูก'],
        alternative: [],
        rationale: 'Moderate progressive: Monitor closely',
        warning: '⚠️ Progressive symptoms require medical evaluation if not improving',
      },
      chronic: {
        first_line: ['น้ำเกลือล้างจมูก'],
        second_line: ['ลอราทาดีน'],
        alternative: [],
        rationale: 'Moderate chronic: Need doctor evaluation',
        warning: '⚠️ Chronic moderate symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['ลอราทาดีน', 'เซทิริซีน'],
        second_line: ['น้ำเกลือล้างจมูก'],
        alternative: ['Allergen identification'],
        rationale: 'Moderate recurrent: Treat episodes, identify triggers',
      },
    },
    severe: {
      acute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe acute: Emergency - no OTC',
        warning: '🚨 Severe acute symptoms require immediate medical attention',
      },
      subacute: {
        first_line: [],
        second_line: ['ลอราทาดีน (temporary)'],
        alternative: [],
        rationale: 'Severe subacute: Urgent medical evaluation needed',
        warning: '⚠️ Severe subacute symptoms require urgent medical evaluation',
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe progressive: Emergency - no OTC',
        warning: '🚨 Severe progressive symptoms require immediate medical attention',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe chronic: Specialist evaluation required',
        warning: '⚠️ Severe chronic symptoms require specialist evaluation',
      },
      recurrent: {
        first_line: ['ลอราทาดีน'],
        second_line: [],
        alternative: [],
        rationale: 'Severe recurrent: Urgent evaluation needed',
        warning: '⚠️ Severe recurrent symptoms require medical evaluation',
      },
    },
  },
  
  sore_throat_cough: {
    mild: {
      acute: {
        first_line: ['น้ำผึ้งผสมมะนาว'],
        second_line: ['ยาอมบรรเทาอาการเจ็บคอ'],
        alternative: ['Hydration', 'Steam'],
        rationale: 'Mild acute: Start with natural remedies',
      },
      subacute: {
        first_line: ['ยาอมบรรเทาอาการเจ็บคอ'],
        second_line: ['น้ำผึ้งผสมมะนาว'],
        alternative: ['Hydration'],
        rationale: 'Mild subacute: Lozenges for persistent symptoms',
      },
      progressive: {
        first_line: ['น้ำผึ้งผสมมะนาว'],
        second_line: [],
        alternative: [],
        rationale: 'Mild progressive: Monitor for worsening',
        warning: '⚠️ Progressive symptoms require medical evaluation',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: ['น้ำผึ้งผสมมะนาว'],
        rationale: 'Mild chronic: Need doctor evaluation',
        warning: '⚠️ Chronic symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['น้ำผึ้งผสมมะนาว'],
        second_line: ['ยาอมบรรเทาอาการเจ็บคอ'],
        alternative: ['Trigger avoidance'],
        rationale: 'Mild recurrent: Treat episodes, identify triggers',
      },
    },
    moderate: {
      acute: {
        dry_cough: {
          first_line: ['เดกซ์โทรเมทอร์แฟน'],
          second_line: ['น้ำผึ้งผสมมะนาว'],
          alternative: ['Lozenges'],
          rationale: 'Moderate acute dry cough: Cough suppressant',
        },
        productive_cough: {
          first_line: ['กวายเฟนีซิน'],
          second_line: ['Hydration', 'Steam'],
          alternative: ['น้ำผึ้งผสมมะนาว'],
          rationale: 'Moderate acute productive cough: Expectorant to loosen phlegm',
        },
      },
      subacute: {
        dry_cough: {
          first_line: ['เดกซ์โทรเมทอร์แฟน'],
          second_line: ['น้ำผึ้งผสมมะนาว'],
          alternative: [],
          rationale: 'Moderate subacute dry cough: Persistent suppressant',
        },
        productive_cough: {
          first_line: ['กวายเฟนีซิน'],
          second_line: ['Hydration'],
          alternative: [],
          rationale: 'Moderate subacute productive cough: Continue expectorant',
        },
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Moderate progressive: Need medical evaluation',
        warning: '⚠️ Progressive symptoms require medical evaluation',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Moderate chronic: Need doctor evaluation',
        warning: '⚠️ Chronic moderate symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['น้ำผึ้งผสมมะนาว'],
        second_line: ['ยาอมบรรเทาอาการเจ็บคอ'],
        alternative: ['Trigger avoidance'],
        rationale: 'Moderate recurrent: Treat episodes, identify triggers',
      },
    },
    severe: {
      acute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe acute: Emergency - no OTC',
        warning: '🚨 Severe acute symptoms require immediate medical attention',
      },
      subacute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe subacute: Urgent medical evaluation needed',
        warning: '⚠️ Severe subacute symptoms require urgent medical evaluation',
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe progressive: Emergency - no OTC',
        warning: '🚨 Severe progressive symptoms require immediate medical attention',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe chronic: Specialist evaluation required',
        warning: '⚠️ Severe chronic symptoms require specialist evaluation',
      },
      recurrent: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe recurrent: Urgent evaluation needed',
        warning: '⚠️ Severe recurrent symptoms require medical evaluation',
      },
    },
  },
  
  gi_symptoms: {
    mild: {
      acute: {
        diarrhea: {
          first_line: ['ORS (น้ำเกลือแร่)'],
          second_line: ['โพรไบโอติก'],
          alternative: ['Dietary modification'],
          rationale: 'Mild acute diarrhea: ORS critical, probiotics help',
        },
        reflux: {
          first_line: ['ยาลดกรด (แอนตาซิด)'],
          second_line: [],
          alternative: ['Lifestyle modification'],
          rationale: 'Mild acute reflux: Antacids for quick relief',
        },
        bloating: {
          first_line: ['Simethicone'],
          second_line: [],
          alternative: ['Dietary modification'],
          rationale: 'Mild acute bloating: Simethicone for gas',
        },
      },
      subacute: {
        diarrhea: {
          first_line: ['ORS (น้ำเกลือแร่)'],
          second_line: ['โพรไบโอติก'],
          alternative: [],
          rationale: 'Mild subacute diarrhea: Continue ORS + probiotics',
        },
        reflux: {
          first_line: ['ยาลดกรด (แอนตาซิด)'],
          second_line: ['ฟาโมทิดีน'],
          alternative: [],
          rationale: 'Mild subacute reflux: Antacids or H2 blocker',
        },
        bloating: {
          first_line: ['Simethicone'],
          second_line: [],
          alternative: [],
          rationale: 'Mild subacute bloating: Continue simethicone',
        },
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Mild progressive: Monitor for worsening',
        warning: '⚠️ Progressive symptoms require medical evaluation',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Mild chronic: Need doctor evaluation',
        warning: '⚠️ Chronic symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['ORS (น้ำเกลือแร่)', 'ยาลดกรด (แอนตาซิด)'],
        second_line: ['โพรไบโอติก'],
        alternative: ['Dietary modification'],
        rationale: 'Mild recurrent: Treat episodes, identify triggers',
      },
    },
    moderate: {
      acute: {
        diarrhea: {
          first_line: ['ORS (น้ำเกลือแร่)'],
          second_line: ['โลเพอราไมด์'],
          alternative: ['โพรไบโอติก'],
          rationale: 'Moderate acute diarrhea: ORS + loperamide if no infection',
        },
        reflux: {
          first_line: ['ยาลดกรด (แอนตาซิด)'],
          second_line: ['ฟาโมทิดีน'],
          alternative: [],
          rationale: 'Moderate acute reflux: Antacids or H2 blocker',
        },
        bloating: {
          first_line: ['Simethicone'],
          second_line: [],
          alternative: [],
          rationale: 'Moderate acute bloating: Simethicone',
        },
      },
      subacute: {
        diarrhea: {
          first_line: ['ORS (น้ำเกลือแร่)'],
          second_line: ['โลเพอราไมด์'],
          alternative: ['โพรไบโอติก'],
          rationale: 'Moderate subacute diarrhea: ORS + loperamide if no infection',
        },
        reflux: {
          first_line: ['ฟาโมทิดีน'],
          second_line: ['ยาลดกรด (แอนตาซิด)'],
          alternative: [],
          rationale: 'Moderate subacute reflux: H2 blocker preferred',
        },
        bloating: {
          first_line: ['Simethicone'],
          second_line: [],
          alternative: [],
          rationale: 'Moderate subacute bloating: Continue simethicone',
        },
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Moderate progressive: Need medical evaluation',
        warning: '⚠️ Progressive symptoms require medical evaluation if not improving',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Moderate chronic: Need doctor evaluation',
        warning: '⚠️ Chronic moderate symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['ORS (น้ำเกลือแร่)', 'ฟาโมทิดีน'],
        second_line: ['โพรไบโอติก'],
        alternative: ['Dietary modification'],
        rationale: 'Moderate recurrent: Treat episodes, identify triggers',
      },
    },
    severe: {
      acute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe acute: Emergency - no OTC',
        warning: '🚨 Severe acute symptoms require immediate medical attention',
      },
      subacute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe subacute: Urgent medical evaluation needed',
        warning: '⚠️ Severe subacute symptoms require urgent medical evaluation',
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe progressive: Emergency - no OTC',
        warning: '🚨 Severe progressive symptoms require immediate medical attention',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe chronic: Specialist evaluation required',
        warning: '⚠️ Severe chronic symptoms require specialist evaluation',
      },
      recurrent: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe recurrent: Urgent evaluation needed',
        warning: '⚠️ Severe recurrent symptoms require medical evaluation',
      },
    },
  },
  
  skin_allergy: {
    mild: {
      acute: {
        first_line: ['คาลาไมน์ (ทาภายนอก)'],
        second_line: ['ไฮโดรคอร์ติโซน 1% (ทาภายนอก)'],
        alternative: ['Cool compress'],
        rationale: 'Mild acute: Start with calamine, escalate if needed',
      },
      subacute: {
        first_line: ['ไฮโดรคอร์ติโซน 1% (ทาภายนอก)'],
        second_line: ['คาลาไมน์ (ทาภายนอก)'],
        alternative: [],
        rationale: 'Mild subacute: Topical steroid for persistent itch',
      },
      progressive: {
        first_line: ['คาลาไมน์ (ทาภายนอก)'],
        second_line: [],
        alternative: [],
        rationale: 'Mild progressive: Monitor for worsening',
        warning: '⚠️ Progressive symptoms require medical evaluation',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: ['คาลาไมน์ (ทาภายนอก)'],
        rationale: 'Mild chronic: Need doctor evaluation',
        warning: '⚠️ Chronic symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['คาลาไมน์ (ทาภายนอก)'],
        second_line: ['ไฮโดรคอร์ติโซน 1% (ทาภายนอก)'],
        alternative: ['Allergen avoidance'],
        rationale: 'Mild recurrent: Treat episodes, identify triggers',
      },
    },
    moderate: {
      acute: {
        first_line: ['ไฮโดรคอร์ติโซน 1% (ทาภายนอก)'],
        second_line: ['คาลาไมน์ (ทาภายนอก)'],
        alternative: ['Oral antihistamine'],
        rationale: 'Moderate acute: Topical steroid + oral antihistamine',
      },
      subacute: {
        first_line: ['ไฮโดรคอร์ติโซน 1% (ทาภายนอก)'],
        second_line: ['ลอราทาดีน', 'เซทิริซีน'],
        alternative: [],
        rationale: 'Moderate subacute: Topical steroid + oral antihistamine',
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Moderate progressive: Need medical evaluation',
        warning: '⚠️ Progressive symptoms require medical evaluation if not improving',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Moderate chronic: Need doctor evaluation',
        warning: '⚠️ Chronic moderate symptoms require medical evaluation',
      },
      recurrent: {
        first_line: ['ไฮโดรคอร์ติโซน 1% (ทาภายนอก)'],
        second_line: ['ลอราทาดีน'],
        alternative: ['Allergen identification'],
        rationale: 'Moderate recurrent: Treat episodes, identify triggers',
      },
    },
    severe: {
      acute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe acute: Emergency - no OTC',
        warning: '🚨 Severe acute symptoms require immediate medical attention',
      },
      subacute: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe subacute: Urgent medical evaluation needed',
        warning: '⚠️ Severe subacute symptoms require urgent medical evaluation',
      },
      progressive: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe progressive: Emergency - no OTC',
        warning: '🚨 Severe progressive symptoms require immediate medical attention',
      },
      chronic: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe chronic: Specialist evaluation required',
        warning: '⚠️ Severe chronic symptoms require specialist evaluation',
      },
      recurrent: {
        first_line: [],
        second_line: [],
        alternative: [],
        rationale: 'Severe recurrent: Urgent evaluation needed',
        warning: '⚠️ Severe recurrent symptoms require medical evaluation',
      },
    },
  },
};

/**
 * Get OTC mapping for symptom × severity × time-course combination
 * Returns medical hierarchy: first_line, second_line, alternative
 */
export function getOTCMappingForSeverityTimecourse(symptomCategory, severity, timeCourse, symptomSubtype = {}) {
  const mapping = OTC_MAPPING_RULES[symptomCategory];
  if (!mapping) {
    console.log(`[OTC-MAPPER] No mapping rules for category: ${symptomCategory}`);
    return null;
  }
  
  const severityMap = mapping[severity];
  if (!severityMap) {
    console.log(`[OTC-MAPPER] No mapping rules for severity: ${severity}`);
    return null;
  }
  
  // Handle cough subtypes (dry vs productive)
  if (symptomCategory === 'sore_throat_cough' && severity === 'moderate') {
    const timeCourseMap = severityMap[timeCourse];
    if (timeCourseMap && typeof timeCourseMap === 'object' && !Array.isArray(timeCourseMap)) {
      // Check for cough subtype
      if (symptomSubtype.dry_cough || symptomSubtype.no_phlegm) {
        return timeCourseMap.dry_cough || timeCourseMap;
      } else if (symptomSubtype.productive_cough || symptomSubtype.has_phlegm) {
        return timeCourseMap.productive_cough || timeCourseMap;
      }
    }
  }
  
  // Handle GI subtypes (diarrhea, reflux, bloating)
  if (symptomCategory === 'gi_symptoms') {
    const timeCourseMap = severityMap[timeCourse];
    if (timeCourseMap && typeof timeCourseMap === 'object' && !Array.isArray(timeCourseMap)) {
      // Check for GI subtype
      if (symptomSubtype.diarrhea) {
        return timeCourseMap.diarrhea || timeCourseMap;
      } else if (symptomSubtype.reflux || symptomSubtype.acid_reflux) {
        return timeCourseMap.reflux || timeCourseMap;
      } else if (symptomSubtype.bloating) {
        return timeCourseMap.bloating || timeCourseMap;
      }
    }
  }
  
  const timeCourseMap = severityMap[timeCourse];
  if (!timeCourseMap) {
    console.log(`[OTC-MAPPER] No mapping rules for time-course: ${timeCourse}`);
    return null;
  }
  
  return timeCourseMap;
}

/**
 * Get allowed OTC medications for symptom × severity × time-course
 * Returns array of medication generic names in hierarchy order
 */
export function getAllowedOTCsForSeverityTimecourse(symptomCategory, severity, timeCourse, symptomSubtype = {}) {
  const mapping = getOTCMappingForSeverityTimecourse(symptomCategory, severity, timeCourse, symptomSubtype);
  if (!mapping) {
    return [];
  }
  
  const allowed = [
    ...(mapping.first_line || []),
    ...(mapping.second_line || []),
    ...(mapping.alternative || []),
  ];
  
  return allowed;
}

/**
 * Get disallowed OTC medications for symptom × severity × time-course
 * Returns array of medication generic names that should NOT be recommended
 */
export function getDisallowedOTCsForSeverityTimecourse(symptomCategory, severity, timeCourse) {
  const mapping = getOTCMappingForSeverityTimecourse(symptomCategory, severity, timeCourse);
  if (!mapping) {
    return [];
  }
  
  // If mapping exists but has no medications, all OTCs are disallowed
  const hasAnyMedications = (mapping.first_line && mapping.first_line.length > 0) ||
                            (mapping.second_line && mapping.second_line.length > 0) ||
                            (mapping.alternative && mapping.alternative.length > 0);
  
  if (!hasAnyMedications) {
    // Return all medications in category as disallowed
    const allMeds = getOTCMedsByCategory(symptomCategory);
    return allMeds.map(m => m.generic);
  }
  
  return mapping.disallowed || [];
}

/**
 * Get rationale for OTC mapping
 */
export function getOTCMappingRationale(symptomCategory, severity, timeCourse, symptomSubtype = {}) {
  const mapping = getOTCMappingForSeverityTimecourse(symptomCategory, severity, timeCourse, symptomSubtype);
  if (!mapping) {
    return null;
  }
  
  return {
    rationale: mapping.rationale || '',
    warning: mapping.warning || null,
  };
}

