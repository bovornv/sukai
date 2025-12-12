import 'package:go_router/go_router.dart';

import '../features/chat/pages/chat_page.dart';
import '../features/home/pages/home_page.dart';
import '../features/summary/pages/summary_page.dart';
import '../features/billing/pages/billing_page.dart';
import '../features/followup/pages/followup_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/chat',
        name: 'chat',
        builder: (context, state) {
          final sessionId = state.uri.queryParameters['sessionId'];
          return ChatPage(sessionId: sessionId);
        },
      ),
      GoRoute(
        path: '/summary',
        name: 'summary',
        builder: (context, state) {
          final sessionId = state.uri.queryParameters['sessionId'];
          return SummaryPage(sessionId: sessionId ?? '');
        },
      ),
      GoRoute(
        path: '/billing',
        name: 'billing',
        builder: (context, state) => const BillingPage(),
      ),
      GoRoute(
        path: '/followup',
        name: 'followup',
        builder: (context, state) {
          final sessionId = state.uri.queryParameters['sessionId'];
          return FollowupPage(sessionId: sessionId ?? '');
        },
      ),
    ],
  );
}
