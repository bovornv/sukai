/// Symptom Suggestion Service (Medical-Grade, Scalable to 700 intents)
/// 
/// Hybrid approach:
/// 1. Tries to load structured intents from JSON (700-intent schema)
/// 2. Falls back to legacy string-based system if intents not available
/// 
/// Structure: Primary Symptom → 8-15 Clinical Intents
/// Each intent includes modifiers:
/// - Severity (เบา / ปานกลาง / รุนแรง)
/// - Time-course (ทันที / เป็นวัน / เรื้อรัง / แย่ลง)
/// - Location (ข้างเดียว / สองข้าง / จุดเฉพาะ)
/// - Trigger (หลังอาหาร / ตอนลุก / หลังออกแรง)
/// - Associated symptoms (ร่วมกับ...)
/// - Red-flag intent (must catch)
/// 
/// Formula: 60-70 primary symptoms × 10-12 intents = 600-840 intents
/// Rules: Every intent must map to red-flag, severity×time-course, OTC/self-care
import '../models/symptom_suggestion.dart';
import '../models/symptom_intent.dart';
import 'symptom_intent_loader.dart';

class SymptomSuggestionService {
  // Base symptoms mapped to clinical variations (Scalable structure)
  // Each variation = 1 clear clinical intent for ER triage
  // No duplicate synonyms - every intent changes clinical decision
  static const Map<String, List<String>> _symptomVariations = {
    // 🧠 Neurology / Head (≈70 intents)
    'ปวดหัว': [
      // Location/Pattern
      'ปวดหัวข้างเดียว',
      'ปวดหัวสองข้าง',
      'ปวดหัวร้าวไปคอ',
      // Severity/Time-course
      'ปวดหัวรุนแรงทันที',
      'ปวดหัวมากขึ้นเรื่อย ๆ',
      'ปวดหัวทุกวัน',
      'ปวดหัวมา ๆ หาย ๆ',
      // Trigger/Modifier
      'ปวดหัวตอนเช้า',
      'ปวดหัวหลังอดนอน',
      'ปวดหัวหลังดื่มแอลกอฮอล์',
      // Associated Symptoms (Red-flag intents)
      'ปวดหัวร่วมกับอาเจียน',
      'ปวดหัวร่วมกับตาพร่า',
      'ปวดหัวร่วมกับคอแข็ง',
      'ปวดหัวร่วมกับไข้',
      'ปวดหัวหลังบาดเจ็บ',
    ],
    'เวียนหัว': [
      'เวียนหัวหมุน',
      'เวียนหัวเหมือนจะเป็นลม',
      'เวียนหัวตอนลุกยืน',
      'เวียนหัวร่วมกับคลื่นไส้',
      'เวียนหัวร่วมกับหูอื้อ',
      'เวียนหัวเป็นนาที',
      'เวียนหัวเป็นชั่วโมง',
      'เวียนหัวเมื่อเปลี่ยนท่า',
      'เวียนหัวรุนแรง',
      'เวียนหัวเป็น ๆ หาย ๆ',
    ],
    'หน้ามืด': [
      'หน้ามืดเวลาลุก',
      'หน้ามืดเป็นวูบ',
      'หน้ามืดร่วมกับใจสั่น',
      'หน้ามืดร่วมกับเหงื่อออก',
      'หน้ามืดเหมือนจะเป็นลม',
    ],
    // 🫁 Respiratory (≈70 intents)
    'ไอ': [
      'ไอแห้ง',
      'ไอมีเสมหะ',
      'ไอมีเสมหะสีเหลือง',
      'ไอมีเสมหะสีเขียว',
      'ไอเป็นเลือด',
      'ไอตอนกลางคืน',
      'ไอเรื้อรังเกิน 2 สัปดาห์',
      'ไอมากกว่า 1 สัปดาห์',
      'ไอร่วมกับเจ็บหน้าอก',
      'ไอร่วมกับเจ็บคอ',
      'ไอร่วมกับหายใจหอบ',
      'ไอร่วมกับไข้',
      'ไอหลังนอน',
      'ไอรุนแรง',
    ],
    'หายใจลำบาก': [
      'หายใจไม่อิ่ม',
      'หายใจเร็วผิดปกติ',
      'หายใจลำบากขณะพัก',
      'หายใจลำบากหลังออกแรง',
      'หายใจลำบากร่วมกับแน่นหน้าอก',
      'หายใจลำบากร่วมกับเจ็บหน้าอก',
      'หายใจหอบ',
      'หายใจลำบากหลังออกกำลัง',
      'หายใจลำบากรุนแรง',
      'หายใจลำบากร่วมกับไอ',
    ],
    // ❤️ Cardiology (≈60 intents)
    'เจ็บหน้าอก': [
      'เจ็บหน้าอกแน่น',
      'เจ็บหน้าอกเหมือนถูกกด',
      'เจ็บหน้าอกแปล๊บ',
      'เจ็บหน้าอกร้าวแขนซ้าย',
      'เจ็บหน้าอกร้าวกราม',
      'เจ็บหน้าอกร่วมกับเหงื่อออก',
      'เจ็บหน้าอกขณะพัก',
      'เจ็บหน้าอกขณะออกแรง',
      'เจ็บหน้าอกร่วมกับหายใจลำบาก',
      'เจ็บหน้าอกรุนแรงทันที',
      'เจ็บหน้าอกหลังออกกำลัง',
      'เจ็บหน้าอกเป็น ๆ หาย ๆ',
    ],
    'ใจสั่น': [
      'ใจสั่นเป็นพัก ๆ',
      'ใจสั่นต่อเนื่อง',
      'ใจสั่นร่วมกับหน้ามืด',
      'ใจสั่นหลังดื่มกาแฟ',
      'ใจสั่นตอนกลางคืน',
      'ใจสั่นตอนพัก',
      'ใจสั่นรุนแรง',
      'ใจสั่นนานหลายชั่วโมง',
    ],
    // 🍽️ Gastrointestinal (≈90 intents)
    'ปวดท้อง': [
      'ปวดท้องบิด',
      'ปวดท้องรุนแรง',
      'ปวดท้องขวาล่าง',
      'ปวดท้องซ้ายบน',
      'ปวดท้องบนลิ้นปี่',
      'ปวดท้องหลังอาหาร',
      'ปวดท้องร่วมกับไข้',
      'ปวดท้องร่วมกับอาเจียน',
      'ปวดท้องด้านบน',
      'ปวดท้องด้านล่าง',
      'ปวดท้องด้านขวา',
      'ปวดท้องด้านซ้าย',
      'ปวดท้องเป็น ๆ หาย ๆ',
    ],
    'ท้องเสีย': [
      'ท้องเสียหลายครั้งต่อวัน',
      'ท้องเสียเป็นน้ำ',
      'ท้องเสียมีมูกเลือด',
      'ท้องเสียร่วมกับไข้',
      'ท้องเสียหลังทานอาหาร',
      'ท้องเสียรุนแรง',
      'ท้องเสียเป็น ๆ หาย ๆ',
      'ท้องเสียร่วมกับปวดท้อง',
    ],
    'คลื่นไส้': [
      'คลื่นไส้ร่วมกับอาเจียน',
      'คลื่นไส้หลังทานอาหาร',
      'คลื่นไส้ร่วมกับปวดท้อง',
      'คลื่นไส้เป็น ๆ หาย ๆ',
      'คลื่นไส้ร่วมกับเวียนหัว',
      'คลื่นไส้รุนแรง',
    ],
    'อาเจียน': [
      'อาเจียนรุนแรง',
      'อาเจียนเป็นเลือด',
      'อาเจียนร่วมกับปวดหัว',
      'อาเจียนหลังอาหาร',
      'อาเจียนหลายครั้ง',
      'อาเจียนร่วมกับไข้',
    ],
    // 🦷 ENT / Oral (≈60 intents)
    'เจ็บคอ': [
      'เจ็บคอมาก',
      'เจ็บคอข้างเดียว',
      'เจ็บคอร่วมกับไข้',
      'เจ็บคอร่วมกับเสียงแหบ',
      'เจ็บคอร่วมกับไอ',
      'เจ็บคอกลืนลำบาก',
      'เจ็บคอเป็น ๆ หาย ๆ',
    ],
    'ปวดฟัน': [
      'ปวดฟันตุบ',
      'ปวดฟันเวลากัด',
      'ปวดฟันร่วมกับเหงือกบวม',
      'ปวดฟันร่วมกับไข้',
      'ปวดฟันรุนแรง',
      'ปวดฟันเป็น ๆ หาย ๆ',
    ],
    'หูอื้อ': [
      'หูอื้อร่วมกับเวียนหัว',
      'หูอื้อข้างเดียว',
      'หูอื้อทั้งสองข้าง',
      'หูอื้อร่วมกับปวดหู',
    ],
    'ปวดหู': [
      'ปวดหูข้างเดียว',
      'ปวดหูทั้งสองข้าง',
      'ปวดหูร่วมกับไข้',
      'ปวดหูรุนแรง',
      'ปวดหูร่วมกับหูอื้อ',
    ],
    // 🩸 Gynecological / Women's Health (≈40 intents)
    'ปวดประจำเดือน': [
      // Severity/Time-course
      'ปวดประจำเดือนรุนแรง',
      'ปวดประจำเดือนมาก',
      'ปวดประจำเดือนทุกเดือน',
      'ปวดประจำเดือนเป็น ๆ หาย ๆ',
      'ปวดประจำเดือนนานหลายวัน',
      // Associated symptoms
      'ปวดประจำเดือนร่วมกับคลื่นไส้',
      'ปวดประจำเดือนร่วมกับอาเจียน',
      'ปวดประจำเดือนร่วมกับปวดหลัง',
      'ปวดประจำเดือนร่วมกับปวดหัว',
      'ปวดประจำเดือนร่วมกับท้องเสีย',
      // Time-course hints
      'ปวดประจำเดือนก่อนมีประจำเดือน',
      'ปวดประจำเดือนระหว่างมีประจำเดือน',
      'ปวดประจำเดือนหลังมีประจำเดือน',
      'ปวดประจำเดือนเรื้อรัง',
    ],
    // 🧍 Musculoskeletal (≈70 intents)
    'ปวดหลัง': [
      'ปวดหลังรุนแรง',
      'ปวดหลังส่วนล่าง',
      'ปวดหลังร้าวลงขา',
      'ปวดหลังหลังยกของ',
      'ปวดหลังเรื้อรัง',
      'ปวดหลังส่วนบน',
      'ปวดหลังร่วมกับขาอ่อนแรง',
      'ปวดหลังร่วมกับชา',
      'ปวดหลังกลั้นปัสสาวะไม่ได้',
      'ปวดหลังรุนแรงทันที',
      'ปวดหลังเป็น ๆ หาย ๆ',
    ],
    'ปวดคอ': [
      'ปวดคอตึง',
      'ปวดคอขยับไม่ได้',
      'ปวดคอร่วมกับไข้',
      'ปวดคอรุนแรง',
      'ปวดคอหลังนอน',
    ],
    'ปวดบ่า': [
      'ปวดบ่าตึง',
      'ปวดบ่าขยับไม่ได้',
      'ปวดบ่าหลังทำงาน',
      'ปวดบ่ารุนแรง',
    ],
    'ปวดข้อ': [
      'ปวดข้อเข่า',
      'ปวดข้อบวมแดง',
      'ปวดข้อหลังตื่นนอน',
      'ปวดข้อรุนแรง',
      'ปวดข้อหลายข้อ',
    ],
    // 🌡️ General / Infection (≈50 intents)
    'ไข้': [
      'ไข้สูง',
      'ไข้ต่ำหลายวัน',
      'ไข้ต่ำ ๆ หลายวัน',
      'ไข้ร่วมกับหนาวสั่น',
      'ไข้ร่วมกับผื่น',
      'ไข้ในเด็ก',
      'ไข้เป็น ๆ หาย ๆ',
      'ไข้หลังเดินทาง',
      'ไข้ร่วมกับปวดหัว',
      'ไข้ร่วมกับไอ',
    ],
    'อ่อนเพลีย': [
      'อ่อนเพลียมาก',
      'อ่อนเพลียเรื้อรัง',
      'อ่อนเพลียร่วมกับน้ำหนักลด',
      'อ่อนเพลียทุกวัน',
      'อ่อนเพลียหลังป่วย',
    ],
    'ผื่น': [
      'ผื่นคัน',
      'ผื่นร่วมกับไข้',
      'ผื่นแดง',
      'ผื่นเป็น ๆ หาย ๆ',
      'ผื่นหลังทานยา',
      'ผื่นขึ้นทั่วตัว',
    ],
    'บวม': [
      'บวมที่หน้า',
      'บวมที่ขา',
      'บวมที่มือ',
      'บวมร่วมกับเจ็บ',
      'บวมหลังบาดเจ็บ',
      'บวมทั้งตัว',
    ],
    'เดินเซ': [
      'เดินเซร่วมกับพูดไม่ชัด',
      'เดินเซร่วมกับเวียนหัว',
      'เดินเซหลังบาดเจ็บ',
      'เดินเซรุนแรง',
      'เดินเซเป็น ๆ หาย ๆ',
    ],
    // Additional common symptoms
    'ปวดเมื่อย': [
      'ปวดเมื่อยทั้งตัว',
      'ปวดเมื่อยหลังออกกำลัง',
      'ปวดเมื่อยร่วมกับไข้',
      'ปวดเมื่อยเรื้อรัง',
      'ปวดเมื่อยทุกวัน',
    ],
    'นอนไม่หลับ': [
      'นอนไม่หลับหลายคืน',
      'นอนไม่หลับร่วมกับวิตกกังวล',
      'นอนไม่หลับเรื้อรัง',
      'นอนไม่หลับทุกคืน',
    ],
    'ตาแดง': [
      'ตาแดงข้างเดียว',
      'ตาแดงทั้งสองข้าง',
      'ตาแดงร่วมกับคัน',
      'ตาแดงร่วมกับน้ำตาไหล',
      'ตาแดงร่วมกับปวด',
    ],
    'น้ำมูกไหล': [
      // Adjectives (สี / ลักษณะ)
      'น้ำมูกไหล ใส เหมือนน้ำ',
      'น้ำมูกไหล ข้น สีเหลืองหรือเขียว',
      'น้ำมูกไหล สีเขียว',
      'น้ำมูกไหล สีเหลือง',
      // Associated symptoms
      'น้ำมูกไหล ร่วมกับคัดจมูก',
      'น้ำมูกไหล และจามบ่อย',
      'น้ำมูกไหล ร่วมกับไข้',
      'น้ำมูกไหล ร่วมกับปวดหน้า/ไซนัส',
      'น้ำมูกไหล แต่ไม่มีไข้',
      // Time-course
      'น้ำมูกไหล เป็นมาหลายวัน',
      'น้ำมูกไหล ตอนเช้าเป็นหลัก',
      'น้ำมูกไหล เรื้อรัง',
      // Triggers
      'น้ำมูกไหล หลังโดนฝุ่นหรืออากาศเย็น',
      'น้ำมูกไหล เมื่อเจออากาศเย็น',
    ],
    'คัดจมูก': [
      'คัดจมูกทั้งสองข้าง',
      'คัดจมูกร่วมกับน้ำมูกไหล',
      'คัดจมูกเรื้อรัง',
      'คัดจมูกทุกวัน',
    ],
    'ชา': [
      'ชาที่มือ',
      'ชาที่เท้า',
      'ชาร้าวลงแขน',
      'ชาร่วมกับปวด',
      'ชาเป็น ๆ หาย ๆ',
    ],
    'ชัก': [
      'ชักเป็นครั้งแรก',
      'ชักหลายครั้ง',
      'ชักร่วมกับไข้',
      'ชักนานหลายนาที',
    ],
    'เลือดออก': [
      'เลือดออกมาก',
      'เลือดออกไม่หยุด',
      'เลือดออกร่วมกับบาดเจ็บ',
      'เลือดออกจากจมูก',
    ],
    'แผล': [
      'แผลลึก',
      'แผลไม่หาย',
      'แผลมีหนอง',
      'แผลร่วมกับไข้',
    ],
    'น้ำร้อนลวก': [
      'น้ำร้อนลวกกว้าง',
      'น้ำร้อนลวกลึก',
      'น้ำร้อนลวกมีพอง',
      'น้ำร้อนลวกรุนแรง',
    ],
    'แผลไหม้': [
      'แผลไหม้กว้าง',
      'แผลไหม้ลึก',
      'แผลไหม้มีพอง',
      'แผลไหม้รุนแรง',
    ],
    // Additional symptoms to reach 60-70 primary symptoms
    'ปวดตา': [
      'ปวดตารุนแรง',
      'ปวดตาร่วมกับตาแดง',
      'ปวดตาร่วมกับตาพร่า',
      'ปวดตาหลังใช้คอมพิวเตอร์',
      'ปวดตาทั้งสองข้าง',
    ],
    'ท้องผูก': [
      'ท้องผูกหลายวัน',
      'ท้องผูกเรื้อรัง',
      'ท้องผูกร่วมกับปวดท้อง',
      'ท้องผูกมากกว่า 3 วัน',
    ],
  };

  // Base symptoms for matching (60-70 primary symptoms, scalable to 600-700 intents)
  // Formula: 60-70 symptoms × 10-12 intents = 600-840 clinical intents
  // Rules: Every intent must map to red-flag, severity×time-course, OTC/self-care
  static const List<String> _baseSymptoms = [
    // 🧠 Neurology / Head
    'ปวดหัว',
    'เวียนหัว',
    'หน้ามืด',
    'เป็นลม',
    // 🫁 Respiratory
    'ไอ',
    'หายใจลำบาก',
    'หายใจหอบ',
    'หายใจไม่อิ่ม',
    // ❤️ Cardiology
    'เจ็บหน้าอก',
    'ปวดหน้าอก', // Also support "ปวดหน้าอก" (pain chest)
    'ใจสั่น',
    // 🍽️ Gastrointestinal
    'ปวดท้อง',
    'ท้องเสีย',
    'ท้องผูก',
    'คลื่นไส้',
    'อาเจียน',
    // 🦷 ENT / Oral
    'เจ็บคอ',
    'ปวดฟัน',
    'หูอื้อ',
    'ปวดหู',
    'น้ำมูกไหล',
    'คัดจมูก',
    // 💧 Urological
    'ฉี่บ่อย',
    'ปัสสาวะบ่อย',
    // 🧍 Musculoskeletal
    'ปวดหลัง',
    'ปวดคอ',
    'ปวดบ่า',
    'ปวดข้อ',
    'ปวดเมื่อย',
    // 🌡️ General / Infection
    'ไข้',
    'อ่อนเพลีย',
    'ผื่น',
    'บวม',
    'หน้าบวม',
    'ตาแดง',
    'คัน',
    // Neurological
    'เดินเซ',
    'ชา',
    'ชัก',
    // Other
    'เลือดออก',
    'แผล',
    'น้ำร้อนลวก',
    'แผลไหม้',
    'นอนไม่หลับ',
    'ปวดตา',
    // 🩸 Gynecological / Women's Health
    'ปวดประจำเดือน',
    // Common slang/variations (Thai user language - natural speech)
    'หัวตื้อ',
    'มึนหัว',
    'แน่นอก',
    'เจ็บจี๊ด',
    'ปวดตุบ',
    'ปวดบิด',
  ];

  /// Get clinical-grade symptom suggestions based on user input
  /// Returns 8-12 suggestions with clinical context (like doctors use)
  /// Uses structured intents if available, falls back to legacy system
  /// Automatically detects language from input text if Thai characters are present
  static Future<List<SymptomSuggestion>> getSuggestions(
    String input, {
    String language = 'th',
  }) async {
    // Auto-detect language from input text
    // If input contains Thai characters, use Thai; otherwise use provided language
    final detectedLanguage = _detectLanguageFromInput(input, language);
    
    // Try to load structured intents first
    try {
      final intents = await SymptomIntentLoader.loadIntents();
      if (intents.isNotEmpty) {
        return _getSuggestionsFromIntents(input, intents, detectedLanguage);
      }
    } catch (e) {
      print('[SymptomSuggestionService] Failed to load intents, using legacy: $e');
    }

    // Fallback to legacy string-based system
    return _getSuggestionsLegacy(input, detectedLanguage);
  }

  /// Detect language from input text
  /// Returns 'th' if input contains Thai characters, otherwise returns provided language
  static String _detectLanguageFromInput(String input, String defaultLanguage) {
    if (input.trim().isEmpty) {
      return defaultLanguage;
    }
    
    // Check if input contains Thai characters (Unicode range: 0x0E00-0x0E7F)
    final thaiCharPattern = RegExp(r'[\u0E00-\u0E7F]');
    if (thaiCharPattern.hasMatch(input)) {
      return 'th';
    }
    
    // Check if input contains English/Latin characters
    final latinCharPattern = RegExp(r'[a-zA-Z]');
    if (latinCharPattern.hasMatch(input)) {
      return 'en';
    }
    
    // Default to provided language
    return defaultLanguage;
  }

  /// Get suggestions from structured intents (700-intent schema)
  static List<SymptomSuggestion> _getSuggestionsFromIntents(
    String input,
    List<SymptomIntent> intents,
    String language,
  ) {
    if (input.trim().isEmpty) {
      // Return diverse default intents when empty (one per primary symptom)
      final defaults = SymptomIntentLoader.getDefaultIntents(language, limit: 12);
      final suggestions = defaults
          .map((intent) => SymptomSuggestion.fromIntent(intent, language))
          .toList();
      
      // Ensure no duplicates by intent_id AND display text
      final seenIds = <String>{};
      final seenTexts = <String>{};
      return suggestions.where((s) {
        // Check both intentId and displayText to avoid duplicates
        if (s.intentId != null && seenIds.contains(s.intentId)) {
          return false;
        }
        if (seenTexts.contains(s.displayText)) {
          return false;
        }
        if (s.intentId != null) {
          seenIds.add(s.intentId!);
        }
        seenTexts.add(s.displayText);
        return true;
      }).toList();
    }

    final normalizedInput = input.toLowerCase().trim();
    final matches = <SymptomSuggestion>[];
    final seenIds = <String>{};
    final seenTexts = <String>{}; // Track display texts to avoid duplicates

    // First, check if input matches a primary symptom exactly
    // Also check for variations (e.g., "ฉี่บ่อย" matches "ปัสสาวะบ่อย")
    String? matchingPrimary;
    for (final base in _baseSymptoms) {
      if (normalizedInput == base.toLowerCase()) {
        matchingPrimary = base;
        break;
      }
    }
    
    // If no exact match, check for semantic matches (e.g., "ฉี่บ่อย" = "ปัสสาวะบ่อย")
    if (matchingPrimary == null) {
      matchingPrimary = _findSemanticMatch(normalizedInput);
    }
    
    // CRITICAL: If input contains a location but doesn't match exactly, try to find related base symptom
    // Example: "ปวดหน้าอก" → match to "เจ็บหน้าอก" for smart expansions
    if (matchingPrimary == null && input.trim().isNotEmpty) {
      // Check if input contains location keywords that match a base symptom
      final locationKeywords = ['หน้าอก', 'อก', 'หัว', 'ท้อง', 'หลัง', 'คอ', 'แขน', 'ขา', 'มือ', 'เท้า'];
      for (final keyword in locationKeywords) {
        if (normalizedInput.contains(keyword)) {
          // Find base symptom that contains this keyword
          for (final base in _baseSymptoms) {
            if (base.contains(keyword)) {
              matchingPrimary = base;
              break;
            }
          }
          if (matchingPrimary != null) break;
        }
      }
    }

    // CRITICAL: Always include exact user input FIRST, then generate expansions
    // User typed "ปวดประจำเดือน" → Show "ปวดประจำเดือน" first, then "ปวดประจำเดือนรุนแรง", etc.
    final exactUserInput = input.trim(); // Preserve exact user input (case, spacing)
    
    // Step 1: Add exact user input FIRST (if not empty and not already in matches)
    if (exactUserInput.isNotEmpty && !seenTexts.contains(exactUserInput)) {
      final exactSuggestion = SymptomSuggestion.fromString(exactUserInput);
      matches.add(exactSuggestion);
      seenTexts.add(exactUserInput);
    }
    
    // Step 2: If input matches a primary symptom, generate smart expansions
    if (matchingPrimary != null) {
      // Generate smart expansions using exact user input as anchor
      final smartExpansions = _generateSmartExpansions(matchingPrimary!, exactUserInput);
      
      // Add smart expansions (these use exact user input as anchor)
      for (final expansion in smartExpansions) {
        if (matches.length >= 12) break;
        if (seenTexts.contains(expansion)) continue;
        
        final suggestion = SymptomSuggestion.fromString(expansion);
        matches.add(suggestion);
        seenTexts.add(expansion);
      }
      
      // Then add structured intents if available (but skip base symptom)
      final relatedIntents = SymptomIntentLoader.getIntentsByPrimarySymptom(matchingPrimary);
      for (final intent in relatedIntents) {
        if (matches.length >= 12) break;
        if (intent.metadata.status != 'active') continue;
        
        final suggestion = SymptomSuggestion.fromIntent(intent, language);
        final suggestionText = suggestion.displayText.toLowerCase();
        
        // CRITICAL: Skip base symptom if it matches user input exactly
        // User typed "น้ำมูกไหล" - never show just "น้ำมูกไหล" alone
        if (suggestionText == normalizedInput && suggestionText == matchingPrimary!.toLowerCase()) {
          continue; // Skip base symptom - only show expansions
        }
        
        // Skip if we've already seen this display text
        if (seenTexts.contains(suggestion.displayText)) continue;
        if (seenIds.contains(intent.intentId)) continue;
        
        matches.add(suggestion);
        seenIds.add(intent.intentId);
        seenTexts.add(suggestion.displayText);
      }
    } else {
      // Input doesn't match primary symptom exactly - search by display text
      // But first, try to generate smart expansions from semantic match
      final semanticMatch = _findSemanticMatch(normalizedInput);
      if (semanticMatch != null) {
        // Generate smart expansions using exact user input as anchor
        final smartExpansions = _generateSmartExpansions(semanticMatch, exactUserInput);
        for (final expansion in smartExpansions) {
          if (matches.length >= 12) break;
          if (seenTexts.contains(expansion)) continue;
          
          final suggestion = SymptomSuggestion.fromString(expansion);
          matches.add(suggestion);
          seenTexts.add(expansion);
        }
      }
      
      // Then search intents
      final searchResults = SymptomIntentLoader.searchIntents(input, language);

      // Add matching intents (limit to 12, ensure unique by both ID and text)
      for (final intent in searchResults) {
        if (matches.length >= 12) break;
        if (intent.metadata.status != 'active') continue;
        if (seenIds.contains(intent.intentId)) continue;
        
        final suggestion = SymptomSuggestion.fromIntent(intent, language);
        // Skip if we've already seen this display text
        if (seenTexts.contains(suggestion.displayText)) continue;
        
        matches.add(suggestion);
        seenIds.add(intent.intentId);
        seenTexts.add(suggestion.displayText);
      }

      // If not enough matches, add related intents by primary symptom
      if (matches.length < 8) {
        // Find primary symptoms that match input
        final matchingPrimaries = <String>[];
        for (final base in _baseSymptoms) {
          if (normalizedInput.contains(base.toLowerCase()) ||
              base.toLowerCase().contains(normalizedInput)) {
            if (!matchingPrimaries.contains(base)) {
              matchingPrimaries.add(base);
            }
          }
        }

        // Add intents for matching primary symptoms (ensure diversity)
        for (final primary in matchingPrimaries) {
          if (matches.length >= 12) break;
          final relatedIntents = SymptomIntentLoader.getIntentsByPrimarySymptom(primary);
          for (final intent in relatedIntents) {
            if (matches.length >= 12) break;
            if (intent.metadata.status != 'active') continue;
            if (seenIds.contains(intent.intentId)) continue;
            
            final suggestion = SymptomSuggestion.fromIntent(intent, language);
            // Skip if we've already seen this display text
            if (seenTexts.contains(suggestion.displayText)) continue;
            
            matches.add(suggestion);
            seenIds.add(intent.intentId);
            seenTexts.add(suggestion.displayText);
          }
        }
      }
    }

    // Ensure we have 8-12 diverse suggestions
    // If still not enough, try generating smart expansions from semantic match
    if (matches.length < 8) {
      // First try defaults from intents
      final defaults = SymptomIntentLoader.getDefaultIntents(language, limit: 12);
      for (final intent in defaults) {
        if (matches.length >= 12) break;
        if (seenIds.contains(intent.intentId)) continue;
        
        final suggestion = SymptomSuggestion.fromIntent(intent, language);
        // Skip if we've already seen this display text
        if (seenTexts.contains(suggestion.displayText)) continue;
        
        matches.add(suggestion);
        seenIds.add(intent.intentId);
        seenTexts.add(suggestion.displayText);
      }
      
      // If still not enough, try semantic match and generate expansions
      if (matches.length < 8 && input.trim().isNotEmpty) {
        final semanticMatch = _findSemanticMatch(normalizedInput);
        if (semanticMatch != null) {
          final exactUserInput = input.trim(); // Preserve exact user input
          final smartExpansions = _generateSmartExpansions(semanticMatch, exactUserInput);
          for (final expansion in smartExpansions) {
            if (matches.length >= 12) break;
            if (seenTexts.contains(expansion)) continue;
            
            final suggestion = SymptomSuggestion.fromString(expansion);
            matches.add(suggestion);
            seenTexts.add(expansion);
          }
        }
      }
    }

    return matches.take(12).toList();
  }

  /// Legacy string-based suggestion system (fallback)
  static List<SymptomSuggestion> _getSuggestionsLegacy(String input, String language) {
    if (input.trim().isEmpty) {
      // Return common symptoms when empty
      return _baseSymptoms
          .take(10)
          .map((s) => SymptomSuggestion.fromString(s))
          .toList();
    }

    final normalizedInput = input.toLowerCase().trim();
    final matches = <SymptomSuggestion>[];
    final seenTexts = <String>{};

    // CRITICAL: Always include exact user input FIRST
    final exactUserInput = input.trim();
    if (exactUserInput.isNotEmpty && !seenTexts.contains(exactUserInput)) {
      final exactSuggestion = SymptomSuggestion.fromString(exactUserInput);
      matches.add(exactSuggestion);
      seenTexts.add(exactUserInput);
    }

    // Step 1: Find matching base symptoms
    final matchingBases = <String>[];
    for (final base in _baseSymptoms) {
      if (base.toLowerCase().contains(normalizedInput) ||
          normalizedInput.contains(base.toLowerCase())) {
        matchingBases.add(base);
      }
    }
    
    // Also check for semantic matches (e.g., "ฉี่บ่อย" = "ปัสสาวะบ่อย")
    final semanticMatch = _findSemanticMatch(normalizedInput);
    if (semanticMatch != null && !matchingBases.contains(semanticMatch)) {
      matchingBases.add(semanticMatch);
    }

    // Step 2: If we found matching bases, return their clinical variations
    // CRITICAL: Generate smart expansions using exact user input as anchor
    if (matchingBases.isNotEmpty) {
      for (final base in matchingBases) {
        if (_symptomVariations.containsKey(base)) {
          final variations = _symptomVariations[base]!;
          for (final variation in variations) {
            if (matches.length >= 12) break;
            
            // Skip base symptom if it matches user input exactly
            final variationLower = variation.toLowerCase();
            if (variationLower == normalizedInput && variationLower == base.toLowerCase()) {
              continue; // Never show base symptom alone
            }
            
            final suggestion = SymptomSuggestion.fromString(variation);
            if (!matches.contains(suggestion)) {
              matches.add(suggestion);
            }
          }
          
          // Generate smart expansions using exact user input as anchor
          final smartExpansions = _generateSmartExpansions(base, exactUserInput);
          for (final expansion in smartExpansions) {
            if (matches.length >= 12) break;
            if (seenTexts.contains(expansion)) continue;
            
            final suggestion = SymptomSuggestion.fromString(expansion);
            matches.add(suggestion);
            seenTexts.add(expansion);
          }
        } else {
          // No variations defined - generate smart expansions
          // Always generate expansions using exact user input as anchor
          final smartExpansions = _generateSmartExpansions(base, exactUserInput);
          for (final expansion in smartExpansions) {
            if (matches.length >= 12) break;
            if (seenTexts.contains(expansion)) continue;
            
            final suggestion = SymptomSuggestion.fromString(expansion);
            matches.add(suggestion);
            seenTexts.add(expansion);
          }
        }
      }
    } else {
      // Step 3: Partial word matching (for typos, slang, etc.)
      final inputWords = normalizedInput.split(RegExp(r'\s+'));
      for (final base in _baseSymptoms) {
        final baseLower = base.toLowerCase();
        for (final word in inputWords) {
          if (word.length > 1 && baseLower.contains(word)) {
            if (!matchingBases.contains(base)) {
              matchingBases.add(base);
            }
            break;
          }
        }
      }

      // Add variations for matched bases
      for (final base in matchingBases) {
        if (matches.length >= 12) break;
        if (_symptomVariations.containsKey(base)) {
          final variations = _symptomVariations[base]!;
          for (final variation in variations) {
            if (matches.length >= 12) break;
            
            // Skip base symptom if it matches user input exactly
            final variationLower = variation.toLowerCase();
            if (variationLower == normalizedInput && variationLower == base.toLowerCase()) {
              continue; // Never show base symptom alone
            }
            
            final suggestion = SymptomSuggestion.fromString(variation);
            if (!matches.contains(suggestion)) {
              matches.add(suggestion);
            }
          }
          
          // Generate smart expansions using exact user input as anchor
          final smartExpansions = _generateSmartExpansions(base, exactUserInput);
          for (final expansion in smartExpansions) {
            if (matches.length >= 12) break;
            if (seenTexts.contains(expansion)) continue;
            
            final suggestion = SymptomSuggestion.fromString(expansion);
            matches.add(suggestion);
            seenTexts.add(expansion);
          }
        } else {
          // No variations defined - generate smart expansions
          // Always generate expansions using exact user input as anchor
          final smartExpansions = _generateSmartExpansions(base, exactUserInput);
          for (final expansion in smartExpansions) {
            if (matches.length >= 12) break;
            if (seenTexts.contains(expansion)) continue;
            
            final suggestion = SymptomSuggestion.fromString(expansion);
            matches.add(suggestion);
            seenTexts.add(expansion);
          }
        }
      }
    }

    // Step 4: If still not enough, try generating smart expansions from semantic match
    // CRITICAL: Never add base symptom if it matches user input exactly
    if (matches.length < 8) {
      // First try semantic match and generate expansions
      final semanticMatch = _findSemanticMatch(normalizedInput);
      if (semanticMatch != null) {
        final exactUserInput = input.trim(); // Preserve exact user input
        final smartExpansions = _generateSmartExpansions(semanticMatch, exactUserInput);
        for (final expansion in smartExpansions) {
          if (matches.length >= 12) break;
          if (matches.any((s) => s.displayText == expansion)) continue;
          
          final suggestion = SymptomSuggestion.fromString(expansion);
          matches.add(suggestion);
        }
      }
      
      // If still not enough, add common related symptoms (but never the base if it matches input)
      if (matches.length < 8) {
        for (final base in _baseSymptoms) {
          if (matches.length >= 12) break;
          
          // Skip base symptom if it matches user input exactly
          if (base.toLowerCase() == normalizedInput) {
            continue; // Never show base symptom alone
          }
          
          final suggestion = SymptomSuggestion.fromString(base);
          if (!matches.contains(suggestion) && !matchingBases.contains(base)) {
            matches.add(suggestion);
          }
        }
      }
    }

    // Return 10-12 suggestions (doctor-like precision)
    // Ensure minimum 10, maximum 12
    if (matches.length < 10) {
      // Try to fill with more variations if available
      final matchingPrimary = _findSemanticMatch(normalizedInput);
      if (matchingPrimary != null && _symptomVariations.containsKey(matchingPrimary)) {
        final variations = _symptomVariations[matchingPrimary]!;
        for (final variation in variations) {
          if (matches.length >= 12) break;
          if (seenTexts.contains(variation)) continue;
          matches.add(SymptomSuggestion.fromString(variation));
          seenTexts.add(variation);
        }
      }
    }
    
    return matches.take(12).toList();
  }
  
  /// Generate smart clinical expansions for a base symptom
  /// CRITICAL: Always preserves exact user input as anchor phrase
  /// Creates 10-12 clinically meaningful expansions using 5 medical dimensions
  /// Rule: Every suggestion MUST start with user's exact words
  static List<String> _generateSmartExpansions(String baseSymptom, String userInput) {
    final expansions = <String>[];
    
    // Detect language from user input
    final language = _detectLanguageFromInput(userInput, 'th');
    
    // Get expansion modifiers organized by 5 medical dimensions
    final modifiersByDimension = _getExpansionModifiersByDimension(baseSymptom, language);
    
    // Generate 10-12 suggestions by combining modifiers from different dimensions
    // Priority: Clinical relevance, risk signals, frequency in Thailand
    
    // Dimension A: Quality/Character (2-3 suggestions)
    for (final modifier in modifiersByDimension['quality'] ?? []) {
      if (expansions.length >= 12) break;
      expansions.add('$userInput $modifier');
    }
    
    // Dimension B: Time & Frequency (2-3 suggestions)
    for (final modifier in modifiersByDimension['time'] ?? []) {
      if (expansions.length >= 12) break;
      expansions.add('$userInput $modifier');
    }
    
    // Dimension C: Severity hints (2 suggestions)
    for (final modifier in modifiersByDimension['severity'] ?? []) {
      if (expansions.length >= 12) break;
      expansions.add('$userInput $modifier');
    }
    
    // Dimension D: Associated symptoms (2-3 suggestions, prioritize red-flags)
    for (final modifier in modifiersByDimension['associated'] ?? []) {
      if (expansions.length >= 12) break;
      expansions.add('$userInput $modifier');
    }
    
    // Dimension E: One/both sides (1-2 suggestions)
    for (final modifier in modifiersByDimension['location'] ?? []) {
      if (expansions.length >= 12) break;
      expansions.add('$userInput $modifier');
    }
    
    // Fill remaining slots with high-priority combinations
    if (expansions.length < 10) {
      // Combine quality + time
      final qualityMods = modifiersByDimension['quality'] ?? [];
      final timeMods = modifiersByDimension['time'] ?? [];
      for (final q in qualityMods.take(2)) {
        if (expansions.length >= 12) break;
        for (final t in timeMods.take(2)) {
          if (expansions.length >= 12) break;
          final combined = '$userInput $q $t';
          if (!expansions.contains(combined)) {
            expansions.add(combined);
          }
        }
      }
    }
    
    // Ensure we have 10-12 suggestions
    return expansions.take(12).toList();
  }
  
  /// Get expansion modifiers organized by 5 medical dimensions
  /// Returns Map with keys: quality, time, severity, associated, location
  static Map<String, List<String>> _getExpansionModifiersByDimension(String symptom, String language) {
    final modifiers = <String, List<String>>{
      'quality': <String>[],
      'time': <String>[],
      'severity': <String>[],
      'associated': <String>[],
      'location': <String>[],
    };
    
    if (language == 'en') {
      return _getExpansionModifiersByDimensionEnglish(symptom);
    }
    
    // Thai modifiers organized by dimension
    final symptomLower = symptom.toLowerCase();
    
    // Special handling for eye symptoms (example from requirements)
    if (symptomLower.contains('ตา') || symptomLower.contains('eye')) {
      modifiers['quality']!.addAll([
        'แดง',
        'บวม',
        'แสบ',
        'เคือง',
        'มีขี้ตา',
        'แห้ง',
        'น้ำตาไหล',
        'เหมือนมีทรายในตา',
      ]);
      modifiers['time']!.addAll([
        'เป็นมา 2–3 วัน',
        'เป็น ๆ หาย ๆ',
        'เป็นตลอดทั้งวัน',
        'เป็นตอนเช้า',
        'เป็นตอนกลางคืน',
      ]);
      modifiers['severity']!.addAll([
        'เล็กน้อย',
        'รบกวนชีวิตประจำวัน',
        'ปวดมาก',
        'มองเห็นลดลง',
      ]);
      modifiers['associated']!.addAll([
        'ร่วมกับจามและน้ำมูก',
        'ร่วมกับปวดหัว',
        'ร่วมกับไข้',
        'ร่วมกับคันจมูก',
      ]);
      modifiers['location']!.addAll([
        'ข้างเดียว',
        'สองข้าง',
      ]);
    } else {
      // Use existing modifier system for other symptoms
      final allModifiers = _getExpansionModifiers(symptom, language);
      
      // Categorize existing modifiers
      for (final mod in allModifiers) {
        if (mod.contains('ข้างเดียว') || mod.contains('สองข้าง') || mod.contains('ข้าง')) {
          modifiers['location']!.add(mod);
        } else if (mod.contains('รุนแรง') || mod.contains('มาก') || mod.contains('เล็กน้อย') || 
                   mod.contains('มองเห็น') || mod.contains('รบกวน')) {
          modifiers['severity']!.add(mod);
        } else if (mod.contains('ร่วมกับ') || mod.contains('พร้อม')) {
          modifiers['associated']!.add(mod);
        } else if (mod.contains('เป็นมา') || mod.contains('เป็น ๆ') || mod.contains('ตอน') || 
                   mod.contains('ทุก') || mod.contains('เรื้อรัง')) {
          modifiers['time']!.add(mod);
        } else {
          modifiers['quality']!.add(mod);
        }
      }
    }
    
    return modifiers;
  }
  
  /// Get expansion modifiers by dimension for English
  static Map<String, List<String>> _getExpansionModifiersByDimensionEnglish(String symptom) {
    final modifiers = <String, List<String>>{
      'quality': <String>[],
      'time': <String>[],
      'severity': <String>[],
      'associated': <String>[],
      'location': <String>[],
    };
    
    final symptomLower = symptom.toLowerCase();
    
    if (symptomLower.contains('itchy') && symptomLower.contains('eye')) {
      modifiers['quality']!.addAll([
        'with redness and tearing',
        'in one eye with discharge',
        'with burning sensation',
      ]);
      modifiers['time']!.addAll([
        'for several days',
        'on and off',
        'in the morning',
      ]);
      modifiers['severity']!.addAll([
        'mild but persistent',
        'with blurred vision',
      ]);
      modifiers['associated']!.addAll([
        'with sneezing and runny nose',
        'with headache',
        'after contact lens use',
      ]);
      modifiers['location']!.addAll([
        'in one eye',
        'in both eyes',
      ]);
    } else {
      // Use existing English modifiers
      final allModifiers = _getExpansionModifiersEnglish(symptom);
      for (final mod in allModifiers) {
        if (mod.contains('one') || mod.contains('both')) {
          modifiers['location']!.add(mod);
        } else if (mod.contains('severe') || mod.contains('mild') || mod.contains('vision')) {
          modifiers['severity']!.add(mod);
        } else if (mod.contains('with') || mod.contains('and')) {
          modifiers['associated']!.add(mod);
        } else if (mod.contains('for') || mod.contains('days') || mod.contains('morning') || 
                   mod.contains('night') || mod.contains('chronic')) {
          modifiers['time']!.add(mod);
        } else {
          modifiers['quality']!.add(mod);
        }
      }
    }
    
    return modifiers;
  }
  
  /// Get expansion modifiers for a specific symptom
  /// Returns modifiers only (not full phrases) - will be appended to user's exact input
  /// Uses Thai clinical language patterns (OPD-style, not textbook)
  static List<String> _getExpansionModifiers(String symptom, String language) {
    final modifiers = <String>[];
    
    if (language == 'en') {
      return _getExpansionModifiersEnglish(symptom);
    }
    
    // Thai modifiers
    switch (symptom) {
      case 'น้ำมูกไหล':
        modifiers.addAll([
          'ใส เหมือนน้ำ',
          'ข้น สีเหลืองหรือเขียว',
          'ร่วมกับคัดจมูก',
          'และจามบ่อย',
          'ร่วมกับไข้',
          'เป็นมาหลายวัน',
          'ตอนเช้าเป็นหลัก',
          'หลังโดนฝุ่นหรืออากาศเย็น',
          'ร่วมกับปวดหน้า/ไซนัส',
          'แต่ไม่มีไข้',
          'เรื้อรัง',
          'เมื่อเจออากาศเย็น',
        ]);
        break;
        
      case 'ปวดหัว':
        modifiers.addAll([
          'ข้างเดียว',
          'สองข้าง',
          'รุนแรงทันที',
          'มากขึ้นเรื่อย ๆ',
          'ทุกวัน',
          'มา ๆ หาย ๆ',
          'ตอนเช้า',
          'หลังอดนอน',
          'ร่วมกับอาเจียน',
          'ร่วมกับตาพร่า',
          'ร่วมกับไข้',
          'หลังบาดเจ็บ',
        ]);
        break;
        
      case 'ไอ':
        modifiers.addAll([
          'แห้ง',
          'มีเสมหะ',
          'มีเสมหะสีเหลือง',
          'มีเสมหะสีเขียว',
          'ตอนกลางคืน',
          'เรื้อรังเกิน 2 สัปดาห์',
          'ร่วมกับเจ็บหน้าอก',
          'ร่วมกับเจ็บคอ',
          'ร่วมกับหายใจหอบ',
          'ร่วมกับไข้',
          'หลังนอน',
          'รุนแรง',
        ]);
        break;
        
      case 'เจ็บคอ':
        modifiers.addAll([
          'มาก',
          'เวลากลืน',
          'ร่วมกับไข้',
          'ร่วมกับต่อมน้ำเหลืองโต',
          'เรื้อรัง',
          'เป็น ๆ หาย ๆ',
          'ร่วมกับไอ',
          'แต่ไม่มีไข้',
          'หลังตื่นนอน',
          'ร่วมกับเสียงแหบ',
        ]);
        break;
        
      case 'ปวดท้อง':
        modifiers.addAll([
          'ส่วนบน',
          'ส่วนล่าง',
          'ข้างขวา',
          'ข้างซ้าย',
          'รุนแรงทันที',
          'เป็น ๆ หาย ๆ',
          'หลังอาหาร',
          'ร่วมกับคลื่นไส้',
          'ร่วมกับท้องเสีย',
          'เรื้อรัง',
          'ตอนเช้า',
          'หลังทานยา',
        ]);
        break;
        
      case 'ไข้':
        modifiers.addAll([
          'สูง',
          'ต่ำหลายวัน',
          'ร่วมกับหนาวสั่น',
          'ร่วมกับผื่น',
          'ในเด็ก',
          'เป็น ๆ หาย ๆ',
          'หลังเดินทาง',
          'ร่วมกับปวดหัว',
          'ร่วมกับไอ',
          'ร่วมกับเจ็บคอ',
          'แต่ไม่มีอาการอื่น',
          'เรื้อรัง',
        ]);
        break;
        
      case 'ปวดประจำเดือน':
        modifiers.addAll([
          // Severity hints
          'รุนแรง',
          'มาก',
          'ปานกลาง',
          'เบา',
          // Time-course hints
          'ทุกเดือน',
          'เป็น ๆ หาย ๆ',
          'นานหลายวัน',
          'ก่อนมีประจำเดือน',
          'ระหว่างมีประจำเดือน',
          // Associated symptoms
          'ร่วมกับคลื่นไส้',
          'ร่วมกับอาเจียน',
          'ร่วมกับปวดหลัง',
          'ร่วมกับปวดหัว',
          'ร่วมกับท้องเสีย',
          'ร่วมกับเวียนหัว',
          // Adverbs
          'เรื้อรัง',
          'มากขึ้นเรื่อย ๆ',
        ]);
        break;
        
      default:
        // Generic modifiers for any symptom
        modifiers.addAll([
          'รุนแรง',
          'เป็นมาหลายวัน',
          'เรื้อรัง',
          'เป็น ๆ หาย ๆ',
          'ร่วมกับไข้',
          'แต่ไม่มีไข้',
          'ตอนเช้า',
          'ตอนกลางคืน',
          'หลังอาหาร',
          'หลังออกแรง',
          'รุนแรงทันที',
          'มากขึ้นเรื่อย ๆ',
        ]);
    }
    
    return modifiers.take(12).toList();
  }
  
  /// Get expansion modifiers for English input
  static List<String> _getExpansionModifiersEnglish(String symptom) {
    final modifiers = <String>[];
    
    // Map common symptoms to English modifiers
    final symptomLower = symptom.toLowerCase();
    
    if (symptomLower.contains('urination') || symptomLower.contains('urinate') || 
        symptomLower.contains('frequent') && symptomLower.contains('urine')) {
      modifiers.addAll([
        'with small volume but frequent',
        'at night',
        'with burning sensation',
        'with lower abdominal pain',
        'with cloudy or foul-smelling urine',
        'for several days',
        'but no pain',
        'with fever',
        'with unusually large volume',
        'on and off',
        'with back pain',
        'after drinking water',
      ]);
    } else if (symptomLower.contains('headache') || symptomLower.contains('head')) {
      modifiers.addAll([
        'on one side',
        'on both sides',
        'severe and sudden',
        'getting worse',
        'every day',
        'comes and goes',
        'in the morning',
        'after lack of sleep',
        'with vomiting',
        'with blurred vision',
        'with fever',
        'after injury',
      ]);
    } else if (symptomLower.contains('cough')) {
      modifiers.addAll([
        'dry',
        'with phlegm',
        'with yellow phlegm',
        'with green phlegm',
        'at night',
        'lasting over 2 weeks',
        'with chest pain',
        'with sore throat',
        'with shortness of breath',
        'with fever',
        'after lying down',
        'severe',
      ]);
    } else if (symptomLower.contains('sore throat') || symptomLower.contains('throat')) {
      modifiers.addAll([
        'severe',
        'when swallowing',
        'with fever',
        'with swollen lymph nodes',
        'chronic',
        'comes and goes',
        'with cough',
        'but no fever',
        'after waking up',
        'with hoarse voice',
      ]);
    } else if (symptomLower.contains('stomach') || symptomLower.contains('abdominal') || 
               symptomLower.contains('belly')) {
      modifiers.addAll([
        'upper abdomen',
        'lower abdomen',
        'right side',
        'left side',
        'severe and sudden',
        'comes and goes',
        'after eating',
        'with nausea',
        'with diarrhea',
        'chronic',
        'in the morning',
        'after taking medication',
      ]);
    } else if (symptomLower.contains('fever')) {
      modifiers.addAll([
        'high',
        'low for several days',
        'with chills',
        'with rash',
        'in children',
        'comes and goes',
        'after travel',
        'with headache',
        'with cough',
        'with sore throat',
        'but no other symptoms',
        'chronic',
      ]);
    } else if (symptomLower.contains('menstrual') || symptomLower.contains('period') || 
               symptomLower.contains('cramp') && symptomLower.contains('period')) {
      modifiers.addAll([
        'severe',
        'moderate',
        'mild',
        'every month',
        'comes and goes',
        'lasting several days',
        'before period',
        'during period',
        'with nausea',
        'with vomiting',
        'with back pain',
        'with headache',
        'with diarrhea',
        'chronic',
        'getting worse',
      ]);
    } else if (symptomLower.contains('chest') && (symptomLower.contains('pain') || symptomLower.contains('hurt'))) {
      modifiers.addAll([
        // Adjectives (color / characteristic)
        'tight',
        'like being pressed',
        'sharp',
        'dull',
        'radiating',
        // Location within chest
        'left side',
        'right side',
        'center',
        'heart area',
        'lung area',
        // Adverbs (duration / frequency)
        'for several days',
        'frequent',
        'comes and goes',
        'chronic',
        // Associated symptoms
        'with shortness of breath',
        'with sweating',
        'with palpitations',
        'with dizziness',
        'with cough',
        // Severity hints
        'severe',
        'severe and sudden',
        'getting worse',
        // Time-course hints
        'at rest',
        'during exertion',
        'after exercise',
        'at night',
      ]);
    } else {
      // Generic English modifiers
      modifiers.addAll([
        'severe',
        'for several days',
        'chronic',
        'comes and goes',
        'with fever',
        'but no fever',
        'in the morning',
        'at night',
        'after eating',
        'after exertion',
        'severe and sudden',
        'getting worse',
      ]);
    }
    
    return modifiers.take(12).toList();
  }

  /// Normalize symptom text for backend mapping
  /// Maps clinical variations back to base symptom for triage logic
  /// Now supports both SymptomSuggestion and String input
  static String normalizeSymptom(dynamic suggestion) {
    String text;
    String? intentId;
    
    if (suggestion is SymptomSuggestion) {
      text = suggestion.displayText;
      intentId = suggestion.intentId;
    } else {
      text = suggestion.toString();
    }
    
    // If we have intent_id, return it (backend can use it for structured lookup)
    if (intentId != null) {
      return intentId; // Backend can map intent_id to red-flag questions
    }
    
    // Fallback: Remove clinical modifiers to get base symptom
    final normalized = text.toLowerCase().trim();
    
    // Check if suggestion matches a base symptom directly
    for (final base in _baseSymptoms) {
      if (normalized.contains(base.toLowerCase())) {
        return base; // Return base symptom for backend mapping
      }
    }
    
    // If no match, return as-is (backend will handle it)
    return text;
  }
  
  /// Find semantic match for user input (e.g., "ฉี่บ่อย" matches "ปัสสาวะบ่อย")
  /// Returns base symptom if semantic match found, null otherwise
  static String? _findSemanticMatch(String userInput) {
    final inputLower = userInput.toLowerCase();
    
    // Chest pain variations: "ปวดหน้าอก" matches "เจ็บหน้าอก"
    if ((inputLower.contains('ปวด') || inputLower.contains('เจ็บ')) && 
        (inputLower.contains('หน้าอก') || inputLower.contains('อก') || inputLower.contains('chest'))) {
      return 'เจ็บหน้าอก';
    }
    
    // Urological variations
    if (inputLower.contains('ฉี่') || inputLower.contains('ปัสสาวะ') || 
        inputLower.contains('urination') || inputLower.contains('urinate')) {
      if (inputLower.contains('บ่อย') || inputLower.contains('frequent')) {
        return 'ฉี่บ่อย';
      }
    }
    
    // Headache variations
    if (inputLower.contains('หัว') || inputLower.contains('head')) {
      if (inputLower.contains('ปวด') || inputLower.contains('ache') || inputLower.contains('pain')) {
        return 'ปวดหัว';
      }
    }
    
    // Cough variations
    if (inputLower.contains('ไอ') || inputLower.contains('cough')) {
      return 'ไอ';
    }
    
    // Sore throat variations
    if (inputLower.contains('คอ') || inputLower.contains('throat')) {
      if (inputLower.contains('เจ็บ') || inputLower.contains('sore') || inputLower.contains('pain')) {
        return 'เจ็บคอ';
      }
    }
    
    // Stomach pain variations
    if (inputLower.contains('ท้อง') || inputLower.contains('stomach') || inputLower.contains('abdominal')) {
      if (inputLower.contains('ปวด') || inputLower.contains('pain') || inputLower.contains('ache')) {
        return 'ปวดท้อง';
      }
    }
    
    // Fever variations
    if (inputLower.contains('ไข้') || inputLower.contains('fever')) {
      return 'ไข้';
    }
    
    // Menstrual pain variations
    if (inputLower.contains('ประจำเดือน') || inputLower.contains('menstrual') || 
        inputLower.contains('period') && (inputLower.contains('ปวด') || inputLower.contains('pain') || inputLower.contains('cramp'))) {
      return 'ปวดประจำเดือน';
    }
    
    return null;
  }
}
