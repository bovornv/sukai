import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/health_profile.dart';
import '../../../services/health_profile_service.dart';
import '../../auth/providers/auth_provider.dart';

/// Health Profile Provider
/// Manages health profile state
final healthProfileProvider =
    FutureProvider.autoDispose<HealthProfile?>((ref) async {
  final authState = ref.watch(authProvider);
  final userId = authState.userId;

  if (userId == null) return null;

  final service = HealthProfileService();
  return await service.getHealthProfile(userId);
});

/// Health Profile Completeness Provider
/// Checks if health profile is complete
final healthProfileCompleteProvider =
    FutureProvider.autoDispose<bool>((ref) async {
  final authState = ref.watch(authProvider);
  final userId = authState.userId;

  if (userId == null) return false;

  final service = HealthProfileService();
  return await service.isHealthProfileComplete(userId);
});

/// Health Profile Notifier
/// For updating health profile
class HealthProfileNotifier extends StateNotifier<AsyncValue<HealthProfile?>> {
  final HealthProfileService _service;
  final String _userId;

  HealthProfileNotifier(this._service, this._userId)
      : super(const AsyncValue.loading()) {
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    state = const AsyncValue.loading();
    try {
      final profile = await _service.getHealthProfile(_userId);
      state = AsyncValue.data(profile);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> saveProfile(HealthProfile profile) async {
    state = const AsyncValue.loading();
    try {
      await _service.saveHealthProfile(_userId, profile);
      await _loadProfile();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

/// Health Profile Notifier Provider
final healthProfileNotifierProvider =
    StateNotifierProvider.autoDispose<HealthProfileNotifier, AsyncValue<HealthProfile?>>((ref) {
  final authState = ref.watch(authProvider);
  final userId = authState.userId ?? '';
  final service = HealthProfileService();
  return HealthProfileNotifier(service, userId);
});

