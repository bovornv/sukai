enum TriageLevel {
  selfCare('self_care'),
  pharmacy('pharmacy'),
  gp('gp'),
  emergency('emergency'),
  uncertain('uncertain');

  final String value;
  const TriageLevel(this.value);

  static TriageLevel fromString(String value) {
    return TriageLevel.values.firstWhere(
      (e) => e.value == value,
      orElse: () => TriageLevel.uncertain,
    );
  }
}

class TriageResponse {
  final bool needMoreInfo;
  final String? nextQuestion;
  final TriageLevel triageLevel;

  const TriageResponse({
    required this.needMoreInfo,
    this.nextQuestion,
    required this.triageLevel,
  });

  factory TriageResponse.fromJson(Map<String, dynamic> json) {
    return TriageResponse(
      needMoreInfo: json['need_more_info'] as bool,
      nextQuestion: json['next_question'] as String?,
      triageLevel: TriageLevel.fromString(json['triage_level'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'need_more_info': needMoreInfo,
      'next_question': nextQuestion,
      'triage_level': triageLevel.value,
    };
  }
}

class Recommendations {
  final List<String> homeCare;
  final List<String> otcMeds;
  final List<String> whenToSeeDoctor;
  final List<String> dangerSigns;
  final List<String> additionalAdvice;

  const Recommendations({
    required this.homeCare,
    required this.otcMeds,
    required this.whenToSeeDoctor,
    required this.dangerSigns,
    required this.additionalAdvice,
  });

  factory Recommendations.fromJson(Map<String, dynamic> json) {
    return Recommendations(
      homeCare: List<String>.from(json['home_care'] as List),
      otcMeds: List<String>.from(json['otc_meds'] as List),
      whenToSeeDoctor: List<String>.from(json['when_to_see_doctor'] as List),
      dangerSigns: List<String>.from(json['danger_signs'] as List),
      additionalAdvice: List<String>.from(json['additional_advice'] as List),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'home_care': homeCare,
      'otc_meds': otcMeds,
      'when_to_see_doctor': whenToSeeDoctor,
      'danger_signs': dangerSigns,
      'additional_advice': additionalAdvice,
    };
  }
}

class FollowUp {
  final String timing;
  final String watchSigns;

  const FollowUp({
    required this.timing,
    required this.watchSigns,
  });

  factory FollowUp.fromJson(Map<String, dynamic> json) {
    return FollowUp(
      timing: json['timing'] as String? ?? '24–48 ชม.',
      watchSigns: json['watch_signs'] as String? ?? 'อาการแย่ลง, มีไข้สูง, ปวดมากขึ้น',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'timing': timing,
      'watch_signs': watchSigns,
    };
  }
}

class DiagnosisResponse {
  final TriageLevel triageLevel;
  final String summary;
  final Recommendations recommendations;
  final String? severityStatement;
  final String? whyExplanation;
  final FollowUp? followUp;

  const DiagnosisResponse({
    required this.triageLevel,
    required this.summary,
    required this.recommendations,
    this.severityStatement,
    this.whyExplanation,
    this.followUp,
  });

  factory DiagnosisResponse.fromJson(Map<String, dynamic> json) {
    return DiagnosisResponse(
      triageLevel: TriageLevel.fromString(json['triage_level'] as String),
      summary: json['summary'] as String,
      recommendations: Recommendations.fromJson(
        json['recommendations'] as Map<String, dynamic>,
      ),
      severityStatement: json['severity_statement'] as String?,
      whyExplanation: json['why_explanation'] as String?,
      followUp: json['follow_up'] != null
          ? FollowUp.fromJson(json['follow_up'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'triage_level': triageLevel.value,
      'summary': summary,
      'recommendations': recommendations.toJson(),
      if (severityStatement != null) 'severity_statement': severityStatement,
      if (whyExplanation != null) 'why_explanation': whyExplanation,
      if (followUp != null) 'follow_up': followUp!.toJson(),
    };
  }
}
