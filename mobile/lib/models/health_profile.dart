/// Health Profile Model
/// Represents user health information required for clinical triage
class HealthProfile {
  final String? fullName;
  final String? gender; // 'male', 'female', 'other'
  final DateTime? birthDate; // System calculates age from this
  final double? weightKg;
  final double? heightCm;
  final List<String> chronicDiseases;
  final List<String> drugAllergies;

  HealthProfile({
    this.fullName,
    this.gender,
    this.birthDate,
    this.weightKg,
    this.heightCm,
    this.chronicDiseases = const [],
    this.drugAllergies = const [],
  });

  /// Check if health profile is complete (all required fields filled)
  bool get isComplete {
    return fullName != null &&
        fullName!.isNotEmpty &&
        gender != null &&
        birthDate != null &&
        weightKg != null &&
        weightKg! > 0 &&
        heightCm != null &&
        heightCm! > 0;
  }

  /// Calculate age from birth date
  int? get age {
    if (birthDate == null) return null;
    final now = DateTime.now();
    int age = now.year - birthDate!.year;
    if (now.month < birthDate!.month ||
        (now.month == birthDate!.month && now.day < birthDate!.day)) {
      age--;
    }
    return age;
  }

  /// Calculate BMI
  double? get bmi {
    if (weightKg == null || heightCm == null || heightCm == 0) return null;
    final heightM = heightCm! / 100;
    return weightKg! / (heightM * heightM);
  }

  factory HealthProfile.fromJson(Map<String, dynamic> json) {
    return HealthProfile(
      fullName: json['full_name'] as String?,
      gender: json['gender'] as String?,
      birthDate: json['birth_date'] != null
          ? DateTime.parse(json['birth_date'] as String)
          : null,
      weightKg: json['weight_kg'] != null
          ? (json['weight_kg'] as num).toDouble()
          : null,
      heightCm: json['height_cm'] != null
          ? (json['height_cm'] as num).toDouble()
          : null,
      chronicDiseases: json['chronic_diseases'] != null
          ? List<String>.from(json['chronic_diseases'] as List)
          : [],
      drugAllergies: json['drug_allergies'] != null
          ? List<String>.from(json['drug_allergies'] as List)
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'full_name': fullName,
      'gender': gender,
      'birth_date': birthDate?.toIso8601String().split('T')[0], // YYYY-MM-DD
      'weight_kg': weightKg,
      'height_cm': heightCm,
      'chronic_diseases': chronicDiseases,
      'drug_allergies': drugAllergies,
    };
  }

  HealthProfile copyWith({
    String? fullName,
    String? gender,
    DateTime? birthDate,
    double? weightKg,
    double? heightCm,
    List<String>? chronicDiseases,
    List<String>? drugAllergies,
  }) {
    return HealthProfile(
      fullName: fullName ?? this.fullName,
      gender: gender ?? this.gender,
      birthDate: birthDate ?? this.birthDate,
      weightKg: weightKg ?? this.weightKg,
      heightCm: heightCm ?? this.heightCm,
      chronicDiseases: chronicDiseases ?? this.chronicDiseases,
      drugAllergies: drugAllergies ?? this.drugAllergies,
    );
  }
}

