# Portable Inventory App

Easily track, manage, and organize your items—anytime, anywhere.  
**Built with:** React Native, TypeScript, Redux Toolkit, Expo, SQLite, React Navigation, Electron.

## Tech Stack

- React Native
- TypeScript
- Redux Toolkit
- Expo
- SQLite
- React Navigation

## Quickstart (Windows)
1. Install tooling: Node 18+, Python 3, Visual Studio Build Tools (Desktop C++).
2. Install deps and rebuild native modules:
   ```bash
   npm i --legacy-peer-deps
   npm run rebuild
   ```
3. Dev: launches Vite + tsup + Electron automatically
   ```bash
   npm run dev
   ```
4. Package portable .exe
   ```bash
   npm run build && npm run dist
   ```
   Output: `dist/InventoryApp-<version>-portable.exe`

## Repo layout
See the folder tree at the top of this document.

## Negative stock policy
Edit `ALLOW_NEGATIVE_STOCK` in `electron/main.ts`.

## Tests
Open dev app; inline tests run in the renderer console (Ctrl+Shift+I → Console).