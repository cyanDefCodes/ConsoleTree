# Console Tree 🌳

A Visual Studio Code extension that provides a tree view to easily find, navigate, and remove console statements from your project.

## ✨ Features

🌳 **Tree View Interface** - Browse all console statements organized by files  
🔍 **Smart Detection** - Finds console.log, console.warn, console.error, console.info, and console.debug  
🎯 **Click to Navigate** - Jump directly to any console statement in your code  
🗑️ **One-Click Removal** - Remove individual console statements or all at once  
⚡ **Auto-Refresh** - Tree updates automatically when you modify files  
⚙️ **Configurable** - Customize file patterns and search patterns

## 📦 Installation

### From VS Code Marketplace

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Console Tree"
4. Click Install

### From Source

```bash
git clone https://github.com/MarcosKlender/ConsoleTree.git
cd ConsoleTree
pnpm install
pnpm run compile
```

Then press F5 to test the extension.

## 🚀 Usage

1. Open a project in VSCode
2. Click on the **Console Tree** icon in the Activity Bar (sidebar)
3. The tree view will show all console statements in your project organized by files
4. **Navigate**: Click on any console statement to jump to that line
5. **Remove individual**: Click the trash icon next to any console statement
6. **Remove all**: Click the trash icon in the tree view title bar
7. **Refresh**: Click the refresh icon to manually update the tree

## ⚙️ Configuration

You can customize Console Tree in your VSCode settings:

```json
{
  "consoleTree.includePatterns": [
    "**/*.js",
    "**/*.ts",
    "**/*.jsx",
    "**/*.tsx",
    "**/*.vue",
    "**/*.svelte"
  ],
  "consoleTree.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.js"
  ],
  "consoleTree.patterns": [
    "console\\.log\\s*\\(",
    "console\\.warn\\s*\\(",
    "console\\.error\\s*\\(",
    "console\\.info\\s*\\(",
    "console\\.debug\\s*\\("
  ]
}
```

## 🎯 Supported File Types

- JavaScript (`.js`, `.mjs`, `.cjs`)
- TypeScript (`.ts`)
- React (`.jsx`, `.tsx`)
- Vue.js (`.vue`)
- Svelte (`.svelte`)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

If you find this extension helpful and give credits, it would be greatly appreciated! Feel free to:

- ⭐ Star this repository
- 🐛 Report issues or suggest improvements
- 💬 Share your experience with the extension

---

- Inspired by the popular Todo Tree extension
- Made with ❤️ for the VS Code community
- Enjoy coding without console clutter! 🚀
