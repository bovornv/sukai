import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  // Thai translations (default)
  static const Map<String, String> _th = {
    'app_name': 'SukAI',
    'app_tagline': 'AI Doctor for Thai families',
    
    // Home
    'start_check': 'เริ่มตรวจอาการ',
    'recent_sessions': 'ประวัติการตรวจ',
    'no_recent_sessions': 'ยังไม่มีประวัติการตรวจ',
    
    // Chat
    'symptom_input_hint': 'บอกอาการของคุณ...',
    'send': 'ส่ง',
    'typing': 'กำลังพิมพ์...',
    'doctor_thinking': 'หมอกำลังประเมิน...',
    
    // Triage levels
    'triage_self_care': 'ดูแลที่บ้าน',
    'triage_pharmacy': 'ไปร้านยา',
    'triage_gp': 'พบแพทย์',
    'triage_emergency': 'ฉุกเฉิน',
    'triage_uncertain': 'ไม่แน่ใจ',
    
    // Summary card
    'summary_title': 'สรุปผลการประเมิน',
    'what_this_means': 'นี่หมายความว่าอย่างไร',
    
    // Recommendations (PROBLEM_DRIVEN_IMPLEMENTATION.md format)
    'home_care': 'วิธีดูแลตัวเอง',
    'otc_meds': 'ยาที่ควรทาน (OTC เท่านั้น)',
    'when_to_see_doctor': 'ควรพบแพทย์เมื่อไหร่',
    'danger_signs': 'สัญญาณอันตราย',
    'additional_advice': 'ข้อแนะนำเพิ่มเติม',
    
    // Billing
    'free': 'ฟรี',
    'pro': 'Pro',
    'premium_doctor': 'Premium Doctor',
    'unlimited_checks': 'ตรวจไม่จำกัด',
    'detailed_recommendations': 'คำแนะนำแบบละเอียด',
    'medication_guidance': 'คำแนะนำการใช้ยา',
    'followup_monitoring': 'ติดตามอาการ',
    'human_doctor_review': 'ตรวจสอบโดยแพทย์',
    'doctor_note': 'บันทึกจากแพทย์',
    'priority_escalation': 'ลำดับความสำคัญ',
    'family_sharing': 'แชร์ครอบครัว',
    'subscribe': 'สมัครสมาชิก',
    'current_plan': 'แผนปัจจุบัน',
    
    // Follow-up
    'followup_title': 'ติดตามอาการ',
    'how_are_you_feeling': 'วันนี้รู้สึกอย่างไร',
    'better': 'ดีขึ้น',
    'same': 'เหมือนเดิม',
    'worse': 'แย่ลง',
    'check_in_daily': 'ตรวจสอบรายวัน',
    'symptom_trend': 'แนวโน้มอาการ',
    
    // Common
    'ok': 'ตกลง',
    'cancel': 'ยกเลิก',
    'back': 'กลับ',
    'next': 'ถัดไป',
    'save': 'บันทึก',
  };

  String translate(String key) {
    return _th[key] ?? key;
  }

  // Getters for convenience
  String get appName => translate('app_name');
  String get appTagline => translate('app_tagline');
  String get startCheck => translate('start_check');
  String get symptomInputHint => translate('symptom_input_hint');
  String get send => translate('send');
  String get typing => translate('typing');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['th', 'en'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
