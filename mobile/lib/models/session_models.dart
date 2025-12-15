/// Triage Session Model
/// Represents a past triage session for display in history
class TriageSession {
  final String sessionId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String triageLevel;
  final List<String> symptoms;
  
  TriageSession({
    required this.sessionId,
    required this.createdAt,
    required this.updatedAt,
    required this.triageLevel,
    required this.symptoms,
  });
  
  factory TriageSession.fromJson(Map<String, dynamic> json) {
    return TriageSession(
      sessionId: json['session_id'] as String,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      triageLevel: json['triage_level'] as String,
      symptoms: List<String>.from(json['symptoms'] as List? ?? []),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'triage_level': triageLevel,
      'symptoms': symptoms,
    };
  }
}

