import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/pages/login_page.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/chat/pages/chat_page.dart';
import '../features/home/pages/home_page.dart';
import '../features/summary/pages/summary_page.dart';
import '../features/billing/pages/billing_page.dart';
import '../features/followup/pages/followup_page.dart';
import '../features/profile/pages/profile_page.dart';

/// App Router with Authentication Guards
class AppRouter {
  static GoRouter createRouter(WidgetRef ref) {
    return GoRouter(
      initialLocation: '/',
      redirect: (context, state) {
        final isAuthenticated = ref.read(authProvider).isAuthenticated;
        final isLoginPage = state.uri.path == '/login';
        
        // Redirect to login if not authenticated (except login page)
        if (!isAuthenticated && !isLoginPage) {
          return '/login';
        }
        
        // Redirect to home if authenticated and on login page
        if (isAuthenticated && isLoginPage) {
          return '/';
        }
        
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginPage(),
        ),
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
          path: '/profile',
          name: 'profile',
          builder: (context, state) => const ProfilePage(),
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
  
  // Keep static router for backward compatibility
  // Will be replaced with createRouter in main.dart
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
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
