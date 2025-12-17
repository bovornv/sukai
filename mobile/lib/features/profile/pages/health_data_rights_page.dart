import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class HealthDataRightsPage extends StatelessWidget {
  const HealthDataRightsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('สิทธิ์ในข้อมูลสุขภาพ'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'สิทธิ์ในข้อมูลสุขภาพของคุณ',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'ผู้ใช้มีสิทธิ์:',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildBulletPoint('ดูข้อมูลสุขภาพของตนเอง'),
            _buildBulletPoint('แก้ไขข้อมูลให้ถูกต้อง'),
            _buildBulletPoint('ลบข้อมูลออกจากระบบ'),
            const SizedBox(height: 24),
            const Text(
              'ผู้ใช้สามารถเลือก:',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildBulletPoint('จะกรอกข้อมูลสุขภาพหรือไม่'),
            _buildBulletPoint('จะใช้ข้อมูลเพื่อการแนะนำที่แม่นยำขึ้นหรือไม่'),
            const SizedBox(height: 24),
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
                  Icon(Icons.info_outline, color: AppTheme.green, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'SukAI จะใช้ข้อมูลเท่าที่จำเป็นเท่านั้น',
                      style: TextStyle(
                        fontSize: 15,
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 8, right: 12),
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: AppTheme.textPrimary,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 15,
                color: AppTheme.textPrimary,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

