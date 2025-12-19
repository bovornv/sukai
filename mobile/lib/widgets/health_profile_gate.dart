import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../app/theme.dart';
import '../features/profile/providers/health_profile_provider.dart';

/// Health Profile Gate Widget
/// Blocks access to features if health profile is incomplete
class HealthProfileGate extends ConsumerWidget {
  final Widget child;
  final String featureName;

  const HealthProfileGate({
    super.key,
    required this.child,
    required this.featureName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCompleteAsync = ref.watch(healthProfileCompleteProvider);

    return isCompleteAsync.when(
      data: (isComplete) {
        if (isComplete) {
          return child;
        }

        // Show blocking message
        return Scaffold(
          appBar: AppBar(
            title: const Text('ข้อมูลสุขภาพ'),
            backgroundColor: AppTheme.cardBackground,
            foregroundColor: AppTheme.textPrimary,
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.health_and_safety,
                    size: 80,
                    color: AppTheme.primaryYellow,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'กรุณากรอกข้อมูลสุขภาพก่อนใช้งาน',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.textPrimary.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'เพื่อความปลอดภัยและความแม่นยำ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'กรุณากรอกข้อมูลสุขภาพของคุณให้ครบก่อนนะคะ\nใช้เวลาไม่เกิน 1 นาทีค่ะ',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        context.push('/health-profile');
                      },
                      icon: const Icon(Icons.health_and_safety),
                      label: const Text(
                        'กรอกข้อมูลสุขภาพตอนนี้',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryYellow,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () {
                      context.pop();
                    },
                    child: Text(
                      'กลับ',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) => Scaffold(
        appBar: AppBar(
          title: const Text('เกิดข้อผิดพลาด'),
          backgroundColor: AppTheme.cardBackground,
          foregroundColor: AppTheme.textPrimary,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลสุขภาพ',
                style: TextStyle(color: AppTheme.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(healthProfileCompleteProvider);
                },
                child: const Text('ลองอีกครั้ง'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

