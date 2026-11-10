# Sudoris

Sudoris is a mobile-first puzzle game that combines Sudoku-style row and column rules with Tetris-like drag-and-drop pieces. It is built with web technologies and runs as an Android app using Capacitor.

## About the game

Fill the empty spaces on the board by placing number-filled pieces. Numbers must not repeat in any row or column. Use the clues on the board to find the correct placement for each piece.

The main game does not use the 3×3 region rule from classic Sudoku. Its boards follow Latin square row and column rules.

- 40 levels across 4 chapters
- Boards ranging from 4×4 to 9×9
- Touch-based drag-and-drop controls
- Turkish and English language support
- Progress saved on the device

## Technologies

- HTML, CSS, and JavaScript
- Capacitor 7
- Android
- Node.js and npm

## Run the web version

The web game’s source files are in the `www/` folder. Open `www/index.html` in a browser to play.

## Run the Android app

Prerequisites:

- Node.js and npm
- Android Studio
- Android SDK installed through Android Studio

Install the dependencies:

```bash
npm install
```
Sync the web files with the Android project:
```bash
npx cap sync android
```

Then open the android/ folder in Android Studio, select a device or emulator, and click Run.

After changing files in www/, sync the Android project again to update the app:
npx cap sync android

Project structure
```text
www/        Web game HTML, CSS, JavaScript, and translation files
android/    Capacitor Android project
assets/     Source images and app icon
icons/      App and web icons
public/     Web app manifest
tools/      Development utilities
```
The permanent source files for the web game are in www/. The android/app/src/main/assets/public/ folder is a copy generated during Capacitor sync.
Generate app icons
To generate Android and web icons from the source app icon, run this command from the project root:
npm run icons:android
Project documentation
- [Architecture notes](ARCHITECTURE.md)
- [Design notes](DESIGN_NOTES.md)
