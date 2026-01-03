/// Unified Clinical Dataset Loader
/// 
/// Single source of truth for all clinical datasets.
/// Loads and caches all datasets in memory for fast access.
/// 
/// All clinical logic should read from these datasets, not hardcoded values.
import 'dart:convert';
import 'package:flutter/services.dart';

class ClinicalDatasetLoader {
  // Cached datasets
  static Map<String, dynamic>? _severityTimecourseMatrix;
  static Map<String, dynamic>? _redFlagRules;
  static Map<String, dynamic>? _canonicalQuestionBanks;
  static Map<String, dynamic>? _otcCatalog;
  static Map<String, dynamic>? _selfcareCatalog;
  static Map<String, dynamic>? _otcSelfcareMapping;

  /// Load all datasets (call once at app startup)
  static Future<void> loadAllDatasets() async {
    try {
      await Future.wait([
        _loadSeverityTimecourseMatrix(),
        _loadRedFlagRules(),
        _loadCanonicalQuestionBanks(),
        _loadOtcCatalog(),
        _loadSelfcareCatalog(),
        _loadOtcSelfcareMapping(),
      ]);
      print('[ClinicalDatasetLoader] ✅ All datasets loaded successfully');
    } catch (e) {
      print('[ClinicalDatasetLoader] ❌ Error loading datasets: $e');
      rethrow;
    }
  }

  /// Load severity × time-course matrix
  static Future<void> _loadSeverityTimecourseMatrix() async {
    if (_severityTimecourseMatrix != null) return;
    
    final String jsonString = await rootBundle
        .loadString('assets/data/severity_timecourse_matrix.json');
    _severityTimecourseMatrix = json.decode(jsonString) as Map<String, dynamic>;
  }

  /// Load red flag rules
  static Future<void> _loadRedFlagRules() async {
    if (_redFlagRules != null) return;
    
    final String jsonString = await rootBundle
        .loadString('assets/data/red_flag_rules.json');
    _redFlagRules = json.decode(jsonString) as Map<String, dynamic>;
  }

  /// Load canonical question banks
  static Future<void> _loadCanonicalQuestionBanks() async {
    if (_canonicalQuestionBanks != null) return;
    
    final String jsonString = await rootBundle
        .loadString('assets/data/canonical_question_banks.json');
    _canonicalQuestionBanks = json.decode(jsonString) as Map<String, dynamic>;
  }

  /// Load OTC catalog
  static Future<void> _loadOtcCatalog() async {
    if (_otcCatalog != null) return;
    
    final String jsonString = await rootBundle
        .loadString('assets/data/otc_catalog_th.json');
    _otcCatalog = json.decode(jsonString) as Map<String, dynamic>;
  }

  /// Load self-care catalog
  static Future<void> _loadSelfcareCatalog() async {
    if (_selfcareCatalog != null) return;
    
    final String jsonString = await rootBundle
        .loadString('assets/data/selfcare_catalog_th.json');
    _selfcareCatalog = json.decode(jsonString) as Map<String, dynamic>;
  }

  /// Load OTC ↔ Self-care mapping
  static Future<void> _loadOtcSelfcareMapping() async {
    if (_otcSelfcareMapping != null) return;
    
    final String jsonString = await rootBundle
        .loadString('assets/data/otc_selfcare_mapping.json');
    _otcSelfcareMapping = json.decode(jsonString) as Map<String, dynamic>;
  }

  // Getters for datasets
  static Map<String, dynamic>? get severityTimecourseMatrix => _severityTimecourseMatrix;
  static Map<String, dynamic>? get redFlagRules => _redFlagRules;
  static Map<String, dynamic>? get canonicalQuestionBanks => _canonicalQuestionBanks;
  static Map<String, dynamic>? get otcCatalog => _otcCatalog;
  static Map<String, dynamic>? get selfcareCatalog => _selfcareCatalog;
  static Map<String, dynamic>? get otcSelfcareMapping => _otcSelfcareMapping;

  /// Get red-flag question for a symptom
  static String? getRedFlagQuestion(String symptom, String language) {
    if (_redFlagRules == null) return null;
    
    final symptomMap = _redFlagRules!['symptom_question_map'] as Map<String, dynamic>?;
    if (symptomMap == null) return null;
    
    // Try exact match first
    if (symptomMap.containsKey(symptom)) {
      return symptomMap[symptom] as String?;
    }
    
    // Try partial match
    for (final key in symptomMap.keys) {
      if (symptom.toLowerCase().contains(key.toLowerCase()) ||
          key.toLowerCase().contains(symptom.toLowerCase())) {
        return symptomMap[key] as String?;
      }
    }
    
    return null;
  }

  /// Get severity × time-course triage decision
  static String? getTriageFromMatrix(String severity, String timeCourse) {
    if (_severityTimecourseMatrix == null) return null;
    
    final matrix = _severityTimecourseMatrix!['universal_matrix'] as Map<String, dynamic>?;
    if (matrix == null) return null;
    
    final severityRow = matrix[severity] as Map<String, dynamic>?;
    if (severityRow == null) return null;
    
    return severityRow[timeCourse] as String?;
  }

  /// Get OTC options for a group
  static List<dynamic>? getOtcOptions(String otcGroup) {
    if (_otcCatalog == null) return null;
    
    final categories = _otcCatalog!['categories'] as Map<String, dynamic>?;
    if (categories == null) return null;
    
    return categories[otcGroup] as List<dynamic>?;
  }

  /// Get self-care protocol
  static List<String>? getSelfcareProtocol(String protocolId) {
    if (_selfcareCatalog == null) return null;
    
    final protocols = _selfcareCatalog!['protocols'] as Map<String, dynamic>?;
    if (protocols == null) return null;
    
    final protocol = protocols[protocolId] as List<dynamic>?;
    return protocol?.map((e) => e.toString()).toList();
  }

  /// Get self-care protocols for a symptom
  static List<String>? getSelfcareProtocolsForSymptom(String symptom) {
    if (_selfcareCatalog == null) return null;
    
    final symptomMap = _selfcareCatalog!['symptom_protocol_map'] as Map<String, dynamic>?;
    if (symptomMap == null) return null;
    
    final protocolId = symptomMap[symptom] as String?;
    if (protocolId == null) return null;
    
    return getSelfcareProtocol(protocolId);
  }

  /// Get OTC ↔ Self-care mapping
  static Map<String, dynamic>? getOtcSelfcareMapping(String otcGroup) {
    if (_otcSelfcareMapping == null) return null;
    
    final mappings = _otcSelfcareMapping!['mappings'] as Map<String, dynamic>?;
    if (mappings == null) return null;
    
    return mappings[otcGroup] as Map<String, dynamic>?;
  }

  /// Clear all cached datasets (for testing or reload)
  static void clearCache() {
    _severityTimecourseMatrix = null;
    _redFlagRules = null;
    _canonicalQuestionBanks = null;
    _otcCatalog = null;
    _selfcareCatalog = null;
    _otcSelfcareMapping = null;
  }
}

