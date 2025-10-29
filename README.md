# Inlang Data Repository

This repository manages internationalization (i18n) data using the [Inlang](https://inlang.com) framework. It handles translations for frontend (FE) and mobile platforms (Android and iOS), providing export and sync capabilities to integrate with existing projects.

## Features

- **Translation Management**: Store and manage translations in JSON format for different languages and platforms.
- **Mobile Export**: Export translations to Android XML and iOS XCStrings formats.
- **Sync to Parent Project**: Copy exported files and FE translations to the parent project as a submodule.
- **Per-Platform Operations**: Export and sync can be done for specific platforms (FE, Android, iOS) or all at once.

## Folder Structure

- `messages/`: Source translation files
  - `{lang}/`: Language directories (e.g., `en/`, `id/`)
    - `common.json`: Frontend-specific translations
    - `android.json`: Android-specific translations
    - `ios.json`: iOS-specific translations
    - `be-message.json`: Backend error messages
    - `main.json`: Common translations for all platforms
- `output/`: Exported mobile files (generated)
  - `android/`: Android XML files
  - `ios/`: iOS XCStrings files
- `src/`: Source code for exporters and utilities
- `project.inlang/`: Inlang project configuration

## Setup as Submodule

To use this repo in your existing project:

1. Add this repo as a Git submodule in your project's root:

   ```bash
   git submodule add <this-repo-url> i18n-data
   git submodule update --init --recursive
   ```

2. Create a configuration file `.i18n-config.json` in your project's root (not in the submodule) to define target paths:

   ```json
   {
     "fe": {
       "en": "public/locales/en/common.json",
       "id": "public/locales/id/common.json"
     },
     "android": "android/app/src/main/res/values/",
     "ios": "ios/"
   }
   ```

   - `fe`: Object mapping language codes to target paths for frontend `common.json` files
   - `android`: Directory path for Android XML files
   - `ios`: Directory path for iOS XCStrings files

3. Navigate to the submodule and install dependencies:

   ```bash
   cd i18n-data
   npm install
   ```

## Usage

### Exporting Translations

Export translations for mobile platforms:

- Export all platforms: `npm run export-mobile`
- Export Android only: `npm run export-android`
- Export iOS only: `npm run export-ios`

Exported files will be placed in the `output/` directory.

### Syncing Downstream (Repo to Parent Project)

Sync exported and FE files to the configured target paths in the parent project:

- Sync all platforms: `npm run sync-downstream`
- Sync FE only: `npm run sync-downstream-fe`
- Sync Android only: `npm run sync-downstream-android`
- Sync iOS only: `npm run sync-downstream-ios`

The sync reads `.i18n-config.json` from the parent directory (`../`) to determine target paths.

### Syncing Upstream (Parent Project to Repo)

Import changes from the parent project's mobile files back to this repo's JSON sources:

- Import all platforms: `npm run sync-upstream`
- Import Android only: `npm run sync-upstream-android`
- Import iOS only: `npm run sync-upstream-ios`

The import reads files from the configured paths, parses them, and merges into `messages/{lang}/{platform}.json`. For value conflicts, it prompts for confirmation to overwrite.

### Other Commands

- `npm run machine-translate`: Run machine translation
- `npm run test`: Run tests

## Configuration

- **Target Config Path**: Override the default config path (`../.i18n-config.json`) by setting the `TARGET_CONFIG` environment variable:
  ```bash
  TARGET_CONFIG=/custom/path/config.json npm run sync
  ```

- **Inlang Settings**: Configure translation rules in `project.inlang/settings.json`

## Rules and Conventions

See `RULES.md` for translation formatting rules and platform-specific requirements.

## Contributing

1. Make changes to translation files in `messages/`
2. Export and test: `npm run export-mobile && npm run test`
3. Sync to parent: `npm run sync`
4. Commit changes

## License

ISC