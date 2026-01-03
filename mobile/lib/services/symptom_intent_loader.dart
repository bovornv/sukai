/// Symptom Intent Loader
/// Loads structured symptom intents from JSON/CSV for medical-grade triage
import 'dart:convert';
import 'package:flutter/services.dart';
import '../models/symptom_intent.dart';

class SymptomIntentLoader {
  static List<SymptomIntent>? _cachedIntents;
  static Map<String, SymptomIntent>? _intentById;
  static Map<String, List<SymptomIntent>>? _intentsByPrimarySymptom;

  /// Load intents from JSON asset file
  static Future<List<SymptomIntent>> loadIntents() async {
    if (_cachedIntents != null) {
      return _cachedIntents!;
    }

    try {
      // Load from JSON asset (can be replaced with API call later)
      final String jsonString = await rootBundle
          .loadString('assets/data/symptom_intents_master.json');
      final Map<String, dynamic> jsonData = json.decode(jsonString);
      
      final List<dynamic> intentsJson = jsonData['intents'] as List<dynamic>;
      _cachedIntents = intentsJson
          .map((json) {
            try {
              return SymptomIntent.fromJson(json as Map<String, dynamic>);
            } catch (e) {
              print('[SymptomIntentLoader] Error parsing intent: $e');
              print('[SymptomIntentLoader] Intent data: ${json.toString().substring(0, 100)}');
              return null;
            }
          })
          .whereType<SymptomIntent>() // Filter out nulls
          .toList();

      // Build index maps for fast lookup
      _buildIndexes();

      return _cachedIntents!;
    } catch (e) {
      print('[SymptomIntentLoader] Error loading intents: $e');
      // Return empty list if loading fails (fallback to old system)
      return [];
    }
  }

  /// Build index maps for fast lookup
  static void _buildIndexes() {
    if (_cachedIntents == null) return;

    _intentById = {};
    _intentsByPrimarySymptom = {};

    for (final intent in _cachedIntents!) {
      // Index by intent_id
      _intentById![intent.intentId] = intent;

      // Index by primary symptom
      if (!_intentsByPrimarySymptom!.containsKey(intent.primarySymptom)) {
        _intentsByPrimarySymptom![intent.primarySymptom] = [];
      }
      _intentsByPrimarySymptom![intent.primarySymptom]!.add(intent);
    }
  }

  /// Get intent by ID
  static SymptomIntent? getIntentById(String intentId) {
    return _intentById?[intentId];
  }

  /// Get all intents for a primary symptom
  static List<SymptomIntent> getIntentsByPrimarySymptom(String primarySymptom) {
    return _intentsByPrimarySymptom?[primarySymptom] ?? [];
  }

  /// Search intents by display text (Thai or English)
  /// Now also searches aliases for better matching
  static List<SymptomIntent> searchIntents(String query, String language) {
    if (_cachedIntents == null) return [];

    final normalizedQuery = query.toLowerCase().trim();
    final matches = <SymptomIntent>[];

    for (final intent in _cachedIntents!) {
      final displayText = intent.getDisplayText(language).toLowerCase();
      final primarySymptom = intent.primarySymptom.toLowerCase();
      
      // Check aliases based on language
      final aliases = language == 'th' ? intent.aliasesTh : intent.aliasesEn;
      final normalizedAliases = aliases.map((a) => a.toLowerCase()).toList();

      // Exact match or contains (display text, primary symptom, or aliases)
      if (displayText.contains(normalizedQuery) ||
          normalizedQuery.contains(displayText) ||
          primarySymptom.contains(normalizedQuery) ||
          normalizedQuery.contains(primarySymptom) ||
          normalizedAliases.any((alias) => 
            alias.contains(normalizedQuery) || normalizedQuery.contains(alias))) {
        matches.add(intent);
      }
    }

    return matches;
  }

  /// Get default intents (common symptoms) when input is empty
  /// Returns diverse set: one intent per primary symptom to avoid duplicates
  static List<SymptomIntent> getDefaultIntents(String language, {int limit = 10}) {
    if (_cachedIntents == null) return [];

    // Return diverse set: one intent per primary symptom
    final activeIntents = _cachedIntents!
        .where((intent) => intent.metadata.status == 'active')
        .toList();
    
    final seenSymptoms = <String>{};
    final diverseIntents = <SymptomIntent>[];
    
    // First pass: get one intent per primary symptom
    for (final intent in activeIntents) {
      if (diverseIntents.length >= limit) break;
      
      if (!seenSymptoms.contains(intent.primarySymptom)) {
        seenSymptoms.add(intent.primarySymptom);
        diverseIntents.add(intent);
      }
    }
    
    // If we need more and haven't reached limit, add more from different symptoms
    if (diverseIntents.length < limit) {
      for (final intent in activeIntents) {
        if (diverseIntents.length >= limit) break;
        
        // Add if we haven't seen this exact intent_id yet
        if (!diverseIntents.any((i) => i.intentId == intent.intentId)) {
          diverseIntents.add(intent);
        }
      }
    }
    
    return diverseIntents;
  }

  /// Clear cache (useful for testing or reloading)
  static void clearCache() {
    _cachedIntents = null;
    _intentById = null;
    _intentsByPrimarySymptom = null;
  }
}
