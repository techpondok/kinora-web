# Flutter Dual-Environment Setup Guide

Apply these changes to the Kinora Flutter project.

## 1. AppConfig (`lib/core/config/app_config.dart`)

```dart
/// Centralized environment configuration.
/// All environment-specific values flow through here.
class AppConfig {
  AppConfig._();

  static const String environment = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  static bool get isProduction => environment == 'production';
  static bool get isDevelopment => environment == 'development';

  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// Safety check — call at app startup
  static void validate() {
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw StateError(
        '[AppConfig] Missing SUPABASE_URL or SUPABASE_ANON_KEY. '
        'Pass via --dart-define when running flutter.',
      );
    }

    const prodRef = 'sasigbuckngggpwpxlhz';

    if (isDevelopment && supabaseUrl.contains(prodRef)) {
      throw StateError(
        '[AppConfig] APP_ENV=development but SUPABASE_URL points to PRODUCTION! '
        'Use the development Supabase project URL.',
      );
    }

    if (isProduction && !supabaseUrl.contains(prodRef)) {
      throw StateError(
        '[AppConfig] APP_ENV=production but SUPABASE_URL does not match production project.',
      );
    }
  }
}
```

## 2. main.dart

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/config/app_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Validate environment before anything else
  AppConfig.validate();

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
  );

  runApp(const KinoraApp());
}
```

## 3. Android Flavors (`android/app/build.gradle`)

```groovy
android {
    // ...existing config...

    flavorDimensions "environment"

    productFlavors {
        dev {
            dimension "environment"
            applicationIdSuffix ".dev"
            resValue "string", "app_name", "Kinora Dev"
            // Uses android/app/src/dev/google-services.json
        }
        prod {
            dimension "environment"
            applicationIdSuffix ""
            resValue "string", "app_name", "Kinora"
            // Uses android/app/src/prod/google-services.json
        }
    }
}
```

## 4. Firebase Configuration

Place Firebase config files per flavor:

```
android/app/src/
├── dev/
│   └── google-services.json    ← Kinora Dev Firebase project
├── prod/
│   └── google-services.json    ← Kinora Production Firebase project
```

## 5. Run Commands

Create `Makefile` or scripts:

```bash
# Development
flutter run \
  --flavor dev \
  --dart-define=APP_ENV=development \
  --dart-define=SUPABASE_URL=https://YOUR_DEV_REF.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_dev_anon_key

# Production release build
flutter build appbundle \
  --release \
  --flavor prod \
  --dart-define=APP_ENV=production \
  --dart-define=SUPABASE_URL=https://sasigbuckngggpwpxlhz.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_prod_anon_key

# Production APK (testing)
flutter build apk \
  --release \
  --flavor prod \
  --dart-define=APP_ENV=production \
  --dart-define=SUPABASE_URL=https://sasigbuckngggpwpxlhz.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_prod_anon_key
```

## 6. DEV Indicator Widget

```dart
/// Shows "DEV" banner only in development builds.
class DevIndicator extends StatelessWidget {
  const DevIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    if (AppConfig.isProduction) return const SizedBox.shrink();

    return Positioned(
      top: 0,
      right: 0,
      child: Banner(
        message: 'DEV',
        location: BannerLocation.topEnd,
        color: Colors.orange,
      ),
    );
  }
}
```

Or wrap the app:

```dart
Widget build(BuildContext context) {
  return MaterialApp(
    // ...
    builder: (context, child) {
      if (AppConfig.isDevelopment) {
        return Banner(
          message: 'DEV',
          location: BannerLocation.topEnd,
          color: Colors.orange,
          child: child!,
        );
      }
      return child!;
    },
  );
}
```

## 7. VS Code launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Kinora Dev",
      "type": "dart",
      "request": "launch",
      "program": "lib/main.dart",
      "args": [
        "--flavor", "dev",
        "--dart-define=APP_ENV=development",
        "--dart-define=SUPABASE_URL=https://YOUR_DEV_REF.supabase.co",
        "--dart-define=SUPABASE_ANON_KEY=your_dev_anon_key"
      ]
    },
    {
      "name": "Kinora Prod (debug)",
      "type": "dart",
      "request": "launch",
      "program": "lib/main.dart",
      "args": [
        "--flavor", "prod",
        "--dart-define=APP_ENV=production",
        "--dart-define=SUPABASE_URL=https://sasigbuckngggpwpxlhz.supabase.co",
        "--dart-define=SUPABASE_ANON_KEY=your_prod_anon_key"
      ]
    }
  ]
}
```

## 8. CI/CD (GitHub Actions example)

```yaml
jobs:
  build-dev:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: |
          flutter build apk \
            --flavor dev \
            --dart-define=APP_ENV=development \
            --dart-define=SUPABASE_URL=${{ secrets.SUPABASE_DEV_URL }} \
            --dart-define=SUPABASE_ANON_KEY=${{ secrets.SUPABASE_DEV_ANON_KEY }}

  build-prod:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: |
          flutter build appbundle \
            --release \
            --flavor prod \
            --dart-define=APP_ENV=production \
            --dart-define=SUPABASE_URL=${{ secrets.SUPABASE_PROD_URL }} \
            --dart-define=SUPABASE_ANON_KEY=${{ secrets.SUPABASE_PROD_ANON_KEY }}
```
