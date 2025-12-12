import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'l10n/app_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(
    const ProviderScope(
      child: SukaiApp(),
    ),
  );
}

class SukaiApp extends StatelessWidget {
  const SukaiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'SukAI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('th', 'TH'), // Thai (default)
        Locale('en', 'US'), // English (future)
      ],
      locale: const Locale('th', 'TH'),
      routerConfig: AppRouter.router,
    );
  }
}
