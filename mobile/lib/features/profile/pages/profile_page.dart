import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../services/billing_service.dart';
import '../providers/health_profile_provider.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
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
      _billingService = BillingService(prefs: prefs);
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

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ออกจากระบบ'),
        content: const Text('คุณต้องการออกจากระบบหรือไม่?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ยกเลิก'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ออกจากระบบ'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.signOut();
      if (mounted) {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('โปรไฟล์'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Card (Trust Center)
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(24), // More padding for breathing room
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: AppTheme.textPrimary.withValues(alpha: 0.1), // Subtle background
                          child: Text(
                            user?.email?.substring(0, 1).toUpperCase() ?? 'U',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user?.userMetadata?['full_name'] ?? user?.email ?? 'ผู้ใช้',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user?.email ?? '-',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppTheme.textSecondary,
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (_currentPlan != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'แผนปัจจุบัน: ${_getPlanName(_currentPlan!)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const SizedBox(height: 24),

            // Health Profile Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24), // More padding for breathing room
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.health_and_safety, color: AppTheme.textPrimary, size: 24),
                        const SizedBox(width: 12),
                        const Text(
                          'ข้อมูลสุขภาพ',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow('อายุ', '-'),
                    _buildInfoRow('โรคประจำตัว', '-'),
                    _buildInfoRow('แพ้ยา', '-'),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.lightbulb_outline, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'ช่วยให้ AI ประเมินแม่นยำขึ้น',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้')),
                          );
                        },
                        icon: const Icon(Icons.edit, size: 18, color: AppTheme.textPrimary),
                        label: const Text(
                          'แก้ไขข้อมูลสุขภาพ',
                          style: TextStyle(color: AppTheme.textPrimary),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.textPrimary, // Dark text
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: BorderSide(color: AppTheme.textSecondary.withValues(alpha: 0.3)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // My Plan Section
            Row(
              children: [
                Icon(Icons.card_membership, color: AppTheme.textPrimary, size: 24),
                const SizedBox(width: 12),
                const Text(
                  'แผนบริการของฉัน',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24), // More padding for breathing room
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_isLoading)
                      const Center(child: CircularProgressIndicator())
                    else ...[
                      if (_currentPlan != null)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.green.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppTheme.green.withValues(alpha: 0.3),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, color: AppTheme.green, size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'แผนปัจจุบัน: ${_getPlanName(_currentPlan!)}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 16),
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
                      const SizedBox(height: 12),
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
                        AppTheme.amber, // Changed from yellow for better contrast
                        _currentPlan == SubscriptionPlan.pro,
                      ),
                      const SizedBox(height: 12),
                      _buildPlanCard(
                        context,
                        SubscriptionPlan.premiumDoctor,
                        'Premium Doctor',
                        '฿299/ครั้ง',
                        [
                          'ตรวจสอบโดยแพทย์',
                          'AI + สรุปจากแพทย์',
                          'ลำดับความสำคัญ',
                          'แชร์ครอบครัว (จำกัด)',
                        ],
                        AppTheme.green,
                        _currentPlan == SubscriptionPlan.premiumDoctor,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Privacy & PDPA Section (Serious, hospital-like tone)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24), // More padding for breathing room
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.shield, color: AppTheme.textPrimary, size: 24),
                        const SizedBox(width: 12),
                        const Text(
                          'ความเป็นส่วนตัว & PDPA',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildListTile(
                      context,
                      'นโยบายความเป็นส่วนตัว',
                      Icons.privacy_tip,
                      () {
                        context.push('/privacy-policy');
                      },
                    ),
                    const Divider(height: 1),
                    _buildListTile(
                      context,
                      'สิทธิ์ในข้อมูลสุขภาพ',
                      Icons.health_and_safety,
                      () {
                        context.push('/health-data-rights');
                      },
                    ),
                    const Divider(height: 1),
                    _buildListTile(
                      context,
                      'การปฏิบัติตาม PDPA',
                      Icons.verified_user,
                      () {
                        context.push('/pdpa-compliance');
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Medical Disclaimer Section (Short, clear, not scary)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24), // More padding for breathing room
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: AppTheme.textPrimary, size: 24),
                        const SizedBox(width: 12),
                        const Text(
                          'ข้อจำกัดทางการแพทย์',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'SukAI เป็นเครื่องมือช่วยคัดกรองเบื้องต้นเท่านั้น ไม่สามารถแทนที่การวินิจฉัยจากแพทย์ได้',
                      style: TextStyle(
                        fontSize: 15,
                        color: AppTheme.textPrimary,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'กรุณาปรึกษาแพทย์หากมีอาการรุนแรงหรือไม่แน่ใจ',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: () {
                        context.push('/medical-disclaimer');
                      },
                      icon: const Icon(Icons.arrow_forward, size: 18),
                      label: const Text('อ่านรายละเอียดเพิ่มเติม'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Help Center Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24), // More padding for breathing room
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.help_outline, color: AppTheme.textPrimary, size: 24),
                        const SizedBox(width: 12),
                        const Text(
                          'ศูนย์ช่วยเหลือ',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildListTile(
                      context,
                      'คำถามที่พบบ่อย (FAQ)',
                      Icons.question_answer,
                      () {
                        context.push('/faq');
                      },
                    ),
                    const Divider(height: 1),
                    _buildListTile(
                      context,
                      'ติดต่อฝ่ายสนับสนุน',
                      Icons.support_agent,
                      () {
                        context.push('/support');
                      },
                    ),
                    const Divider(height: 1),
                    _buildListTile(
                      context,
                      'ส่งความคิดเห็น',
                      Icons.feedback_outlined,
                      () {
                        context.push('/feedback');
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _handleLogout,
                icon: const Icon(Icons.logout),
                label: const Text('ออกจากระบบ'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.red,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 2,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'หน้าแรก',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: 'แชทแพทย์ AI',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'โปรไฟล์',
          ),
        ],
        onTap: (index) {
          if (index == 0) {
            context.go('/');
          } else if (index == 1) {
            final sessionId = const Uuid().v4();
            context.push('/chat?sessionId=$sessionId');
          }
        },
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
              maxLines: 2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListTile(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.textPrimary, size: 24), // Darker, larger icons
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 15,
          color: AppTheme.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.textTertiary),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(vertical: 8), // More vertical padding
      dense: false,
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
    return Card(
      elevation: isCurrent ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isCurrent ? color : Colors.transparent,
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    price,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      Icon(Icons.check, color: color, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          feature,
                          style: const TextStyle(fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 2,
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isCurrent
                    ? null
                    : () => _subscribe(plan),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isCurrent ? Colors.grey : color,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                child: Text(
                  isCurrent ? 'แผนปัจจุบัน' : 'สมัครสมาชิก',
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

