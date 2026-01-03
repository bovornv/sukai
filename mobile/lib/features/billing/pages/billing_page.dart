import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shared_preferences/shared_preferences.dart';

import '../../../app/theme.dart';
import '../../../services/billing_service.dart';

class BillingPage extends ConsumerStatefulWidget {
  const BillingPage({super.key});

  @override
  ConsumerState<BillingPage> createState() => _BillingPageState();
}

class _BillingPageState extends ConsumerState<BillingPage> {
  BillingService? _billingService;
  SubscriptionPlan? _currentPlan;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeService();
  }

  Future<void> _initializeService() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _billingService = BillingService(prefs: prefs, ref: ref);
    });
    _loadCurrentPlan();
  }

  Future<void> _loadCurrentPlan() async {
    if (_billingService == null) return;
    final plan = await _billingService!.getCurrentPlan();
    setState(() {
      _currentPlan = plan;
      _isLoading = false;
    });
  }

  Future<void> _subscribe(SubscriptionPlan plan) async {
    if (_billingService == null) return;
    
    setState(() {
      _isLoading = true;
    });

    final success = await _billingService!.subscribe(plan);
    
    setState(() {
      _isLoading = false;
    });

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('สมัครสมาชิก ${_getPlanName(plan)} สำเร็จ')),
      );
      _loadCurrentPlan();
    }
  }

  String _getPlanName(SubscriptionPlan plan) {
    switch (plan) {
      case SubscriptionPlan.free:
        return 'ฟรี';
      case SubscriptionPlan.pro:
        return 'Pro';
      case SubscriptionPlan.premiumDoctor:
        return 'Premium Doctor';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('แผนการใช้งาน'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_currentPlan != null)
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.primarySoft, // Soft primary background
                        borderRadius: BorderRadius.circular(16), // Rounded corners (14-16px)
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04), // Soft shadow
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle_outline, color: AppTheme.statusSafe),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'แผนปัจจุบัน: ${_getPlanName(_currentPlan!)}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  _buildPlanCard(
                    context,
                    SubscriptionPlan.free,
                    'ฟรี',
                    '฿0',
                    [
                      'ตรวจอาการพื้นฐาน',
                      'การประเมินเบื้องต้น',
                      'สรุปผลการประเมิน',
                      'จำกัด 3 ครั้ง/วัน',
                    ],
                    Colors.grey,
                    _currentPlan == SubscriptionPlan.free,
                  ),
                  const SizedBox(height: 16),
                  _buildPlanCard(
                    context,
                    SubscriptionPlan.pro,
                    'Pro',
                    '฿99/เดือน',
                    [
                      'ตรวจไม่จำกัด',
                      'คำแนะนำแบบละเอียด',
                      'คำแนะนำการใช้ยา',
                      'ติดตามอาการ',
                    ],
                    AppTheme.navActive, // Dark gray (Notion-style, no blue)
                    _currentPlan == SubscriptionPlan.pro,
                  ),
                  const SizedBox(height: 16),
                  _buildPlanCard(
                    context,
                    SubscriptionPlan.premiumDoctor,
                    'Premium Doctor',
                    '฿299/ครั้ง',
                    [
                      'ตรวจสอบโดยแพทย์',
                      'บันทึกจากแพทย์',
                      'ลำดับความสำคัญ',
                      'แชร์ครอบครัว (จำกัด)',
                    ],
                    AppTheme.accentGreen, // Muted green
                    _currentPlan == SubscriptionPlan.premiumDoctor,
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildPlanCard(
    BuildContext context,
    SubscriptionPlan plan,
    String title,
    String price,
    List<String> features,
    Color color,
    bool isCurrent,
  ) {
    // Notion-inspired: Clean card, soft shadow, rounded corners
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.circular(16), // Rounded corners (14-16px)
        border: isCurrent ? Border.all(
          color: color.withValues(alpha: 0.5),
          width: 2,
        ) : Border.all(
          color: AppTheme.borderLight,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04), // Soft shadow
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18, // Smaller
                    fontWeight: FontWeight.w600, // Medium-bold (not bold)
                    color: AppTheme.textPrimary,
                    letterSpacing: -0.1,
                  ),
                ),
                Text(
                  price,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600, // Medium-bold (not bold)
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Notion-style: Simple bullet points, no colored icons
            ...features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 6, right: 10),
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppTheme.textTertiary, // Gray bullet
                          shape: BoxShape.circle,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          feature,
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textPrimary,
                            height: 1.5,
                            fontWeight: FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isCurrent
                    ? null
                    : () => _subscribe(plan),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isCurrent ? Colors.grey : color,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text(
                  isCurrent ? 'แผนปัจจุบัน' : 'สมัครสมาชิก',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
