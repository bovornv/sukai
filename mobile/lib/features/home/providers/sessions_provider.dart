import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/session_models.dart';
import '../../../services/sessions_service.dart';

/// Sessions Provider
/// Provides access to user's past triage sessions
final sessionsProvider = FutureProvider<List<TriageSession>>((ref) async {
  final service = SessionsService(ref: ref);
  return await service.getSessions();
});

