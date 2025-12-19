import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../models/health_profile.dart';
import '../providers/health_profile_provider.dart';
import '../../auth/providers/auth_provider.dart';

class HealthProfileFormPage extends ConsumerStatefulWidget {
  const HealthProfileFormPage({super.key});

  @override
  ConsumerState<HealthProfileFormPage> createState() =>
      _HealthProfileFormPageState();
}

class _HealthProfileFormPageState
    extends ConsumerState<HealthProfileFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  String? _gender;
  DateTime? _birthDate;
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final List<String> _chronicDiseases = [];
  final List<String> _drugAllergies = [];
  final _chronicDiseaseController = TextEditingController();
  final _drugAllergyController = TextEditingController();
  bool _isLoading = false;

  // Common chronic diseases
  final List<String> _commonChronicDiseases = [
    'เบาหวาน',
    'ความดันโลหิตสูง',
    'โรคหัวใจ',
    'โรคไต',
    'โรคตับ',
    'หอบหืด',
    'ภูมิแพ้',
    'โรคข้ออักเสบ',
  ];

  @override
  void initState() {
    super.initState();
    _loadExistingProfile();
  }

  Future<void> _loadExistingProfile() async {
    final profileAsync = ref.read(healthProfileProvider);
    await profileAsync.when(
      data: (profile) {
        if (profile != null) {
          _fullNameController.text = profile.fullName ?? '';
          _gender = profile.gender;
          _birthDate = profile.birthDate;
          _weightController.text =
              profile.weightKg?.toString() ?? '';
          _heightController.text =
              profile.heightCm?.toString() ?? '';
          setState(() {
            _chronicDiseases.addAll(profile.chronicDiseases);
            _drugAllergies.addAll(profile.drugAllergies);
          });
        }
      },
      loading: () {},
      error: (_, __) {},
    );
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _chronicDiseaseController.dispose();
    _drugAllergyController.dispose();
    super.dispose();
  }

  Future<void> _selectBirthDate() async {
    if (!mounted) return;
    
    final now = DateTime.now();
    // Convert to พศ for display
    final firstDateBE = now.year - 120 + 543; // 120 years ago in พศ
    final lastDateBE = now.year + 543; // Current year in พศ
    
    // For date picker, we'll use AD dates but display in พศ
    final firstDate = DateTime(now.year - 120);
    final lastDate = now;
    
    // Convert current _birthDate from AD to พศ for initial display
    DateTime? initialDate;
    if (_birthDate != null) {
      initialDate = _birthDate;
    } else {
      initialDate = DateTime(now.year - 30, 1, 1);
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      locale: const Locale('th', 'TH'),
      helpText: 'เลือกวันเดือนปีเกิด (พ.ศ.)',
      cancelText: 'ยกเลิก',
      confirmText: 'ยืนยัน',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            datePickerTheme: DatePickerThemeData(
              headerHelpStyle: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          child: Localizations.override(
            context: context,
            locale: const Locale('th', 'TH'),
            child: child!,
          ),
        );
      },
    );

    if (picked != null && mounted) {
      setState(() {
        _birthDate = picked; // Store as AD date (database expects AD)
      });
    }
  }

  void _addChronicDisease() {
    final disease = _chronicDiseaseController.text.trim();
    if (disease.isNotEmpty && !_chronicDiseases.contains(disease)) {
      setState(() {
        _chronicDiseases.add(disease);
        _chronicDiseaseController.clear();
      });
    }
  }

  void _removeChronicDisease(String disease) {
    setState(() {
      _chronicDiseases.remove(disease);
    });
  }

  void _addDrugAllergy() {
    final allergy = _drugAllergyController.text.trim();
    if (allergy.isNotEmpty && !_drugAllergies.contains(allergy)) {
      setState(() {
        _drugAllergies.add(allergy);
        _drugAllergyController.clear();
      });
    }
  }

  void _removeDrugAllergy(String allergy) {
    setState(() {
      _drugAllergies.remove(allergy);
    });
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authState = ref.read(authProvider);
      final userId = authState.userId;

      if (userId == null) {
        throw Exception('ไม่พบข้อมูลผู้ใช้');
      }

      final profile = HealthProfile(
        fullName: _fullNameController.text.trim(),
        gender: _gender,
        birthDate: _birthDate,
        weightKg: double.tryParse(_weightController.text),
        heightCm: double.tryParse(_heightController.text),
        chronicDiseases: _chronicDiseases,
        drugAllergies: _drugAllergies,
      );

      // Check mounted before using notifier
      if (!mounted) return;
      
      final notifier = ref.read(healthProfileNotifierProvider.notifier);
      await notifier.saveProfile(profile);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('บันทึกข้อมูลสุขภาพเรียบร้อยแล้ว'),
            backgroundColor: Colors.green,
          ),
        );
        if (mounted) {
          context.pop();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('เกิดข้อผิดพลาด: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('แก้ไขข้อมูลสุขภาพ'),
        backgroundColor: AppTheme.cardBackground,
        foregroundColor: AppTheme.textPrimary,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info Card
              Card(
                color: AppTheme.primaryYellow.withValues(alpha: 0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline,
                          color: AppTheme.textPrimary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'ข้อมูลนี้ช่วยให้ AI ประเมินได้แม่นยำขึ้นและปลอดภัยขึ้น',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Full Name
              TextFormField(
                controller: _fullNameController,
                decoration: const InputDecoration(
                  labelText: 'ชื่อจริง *',
                  hintText: 'กรุณากรอกชื่อจริง',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'กรุณากรอกชื่อจริง';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Gender
              DropdownButtonFormField<String>(
                value: _gender,
                decoration: const InputDecoration(
                  labelText: 'เพศ *',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'male', child: Text('ชาย')),
                  DropdownMenuItem(value: 'female', child: Text('หญิง')),
                  DropdownMenuItem(value: 'other', child: Text('อื่น ๆ')),
                ],
                onChanged: (value) {
                  setState(() {
                    _gender = value;
                  });
                },
                validator: (value) {
                  if (value == null) {
                    return 'กรุณาเลือกเพศ';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Birth Date
              InkWell(
                onTap: _selectBirthDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'วันเดือนปีเกิด (พ.ศ.) *',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today),
                    helperText: 'ปฏิทินแสดง ค.ศ. แต่จะบันทึกเป็น พ.ศ.',
                    helperMaxLines: 2,
                  ),
                  child: Text(
                    _birthDate != null
                        ? '${_birthDate!.day}/${_birthDate!.month}/${_birthDate!.year + 543} (พ.ศ.)'
                        : 'กรุณาเลือกวันเดือนปีเกิด',
                    style: TextStyle(
                      color: _birthDate != null
                          ? AppTheme.textPrimary
                          : AppTheme.textTertiary,
                    ),
                  ),
                ),
              ),
              if (_birthDate != null) ...[
                const SizedBox(height: 8),
                Text(
                  'อายุ: ${DateTime.now().year - _birthDate!.year} ปี',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 16),

              // Weight
              TextFormField(
                controller: _weightController,
                decoration: const InputDecoration(
                  labelText: 'น้ำหนัก (กก.) *',
                  hintText: 'เช่น 65.5',
                  border: OutlineInputBorder(),
                  suffixText: 'กก.',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'กรุณากรอกน้ำหนัก';
                  }
                  final weight = double.tryParse(value);
                  if (weight == null || weight <= 0 || weight > 300) {
                    return 'กรุณากรอกน้ำหนักที่ถูกต้อง (1-300 กก.)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Height
              TextFormField(
                controller: _heightController,
                decoration: const InputDecoration(
                  labelText: 'ส่วนสูง (ซม.) *',
                  hintText: 'เช่น 170',
                  border: OutlineInputBorder(),
                  suffixText: 'ซม.',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'กรุณากรอกส่วนสูง';
                  }
                  final height = double.tryParse(value);
                  if (height == null || height <= 0 || height > 250) {
                    return 'กรุณากรอกส่วนสูงที่ถูกต้อง (1-250 ซม.)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // BMI Display
              if (_weightController.text.isNotEmpty &&
                  _heightController.text.isNotEmpty) ...[
                Builder(
                  builder: (context) {
                    final weight =
                        double.tryParse(_weightController.text);
                    final height =
                        double.tryParse(_heightController.text);
                    if (weight != null && height != null && height > 0) {
                      final bmi = weight / ((height / 100) * (height / 100));
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.textPrimary.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'BMI: ${bmi.toStringAsFixed(1)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Chronic Diseases
              const Text(
                'โรคประจำตัว',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _commonChronicDiseases.map((disease) {
                  final isSelected = _chronicDiseases.contains(disease);
                  return FilterChip(
                    label: Text(disease),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          if (!_chronicDiseases.contains(disease)) {
                            _chronicDiseases.add(disease);
                          }
                        } else {
                          _chronicDiseases.remove(disease);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _chronicDiseaseController,
                      decoration: const InputDecoration(
                        hintText: 'พิมพ์เพิ่มโรคประจำตัว',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onSubmitted: (_) => _addChronicDisease(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _addChronicDisease,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              if (_chronicDiseases.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _chronicDiseases.map((disease) {
                    return Chip(
                      label: Text(disease),
                      onDeleted: () => _removeChronicDisease(disease),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 24),

              // Drug Allergies
              const Text(
                'แพ้ยา',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _drugAllergyController,
                      decoration: const InputDecoration(
                        hintText: 'ระบุชื่อยาที่แพ้ (เช่น พาราเซตามอล)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onSubmitted: (_) => _addDrugAllergy(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _addDrugAllergy,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              if (_drugAllergies.isEmpty) ...[
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _drugAllergies.add('ไม่มี');
                    });
                  },
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('ไม่มี'),
                ),
              ],
              if (_drugAllergies.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _drugAllergies.map((allergy) {
                    return Chip(
                      label: Text(allergy),
                      onDeleted: () => _removeDrugAllergy(allergy),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 32),

              // Save Button
              ElevatedButton(
                onPressed: _isLoading ? null : _saveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryYellow,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'บันทึกข้อมูลสุขภาพ',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

