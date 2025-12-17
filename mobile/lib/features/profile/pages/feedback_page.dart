import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class FeedbackPage extends StatelessWidget {
  const FeedbackPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ส่งความคิดเห็น'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.feedback_outlined, color: AppTheme.textPrimary, size: 28),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'SukAI ยินดีรับฟังความคิดเห็นจากคุณ',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'ข้อเสนอแนะของคุณช่วยให้แอปดีขึ้น',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'สามารถส่ง:',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildFeedbackType(
                      icon: Icons.lightbulb_outline,
                      text: 'คำแนะนำ',
                      color: AppTheme.amber,
                    ),
                    const SizedBox(height: 12),
                    _buildFeedbackType(
                      icon: Icons.bug_report,
                      text: 'ปัญหาที่พบ',
                      color: AppTheme.red,
                    ),
                    const SizedBox(height: 12),
                    _buildFeedbackType(
                      icon: Icons.add_circle_outline,
                      text: 'ฟีเจอร์ที่อยากให้เพิ่ม',
                      color: AppTheme.green,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'แบบฟอร์มส่งความคิดเห็น',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'ประเภท',
                        border: OutlineInputBorder(),
                        hintText: 'เช่น คำแนะนำ, ปัญหา, ฟีเจอร์ใหม่',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'รายละเอียด',
                        border: OutlineInputBorder(),
                        hintText: 'บอกความคิดเห็นของคุณ...',
                      ),
                      maxLines: 6,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('ส่งความคิดเห็นสำเร็จ ขอบคุณสำหรับข้อเสนอแนะ!'),
                              backgroundColor: AppTheme.green,
                            ),
                          );
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.send),
                        label: const Text('ส่งความคิดเห็น'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeedbackType({
    required IconData icon,
    required String text,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 12),
        Text(
          text,
          style: const TextStyle(
            fontSize: 15,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}

