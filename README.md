# Console Tree

A Visual Studio Code extension that provides a tree view to easily find, navigate, and remove console statements from your project.

## Features

✨ **Tree View Interface** - Browse all console statements organized by files  
🔍 **Smart Detection** - Finds console.log, console.warn, console.error, console.info, and console.debug  
🎯 **Click to Navigate** - Jump directly to any console statement in your code  
🗑️ **One-Click Removal** - Remove individual console statements or all at once  
⚡ **Auto-Refresh** - Tree updates automatically when you modify files  
⚙️ **Configurable** - Customize file patterns and search patterns

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Console Tree"
4. Click Install

## Usage

1. Open a project in VSCode
2. Click on the Console Tree icon in the Activity Bar (sidebar)
3. The tree view will show all console statements in your project
4. **Navigate**: Click on any console statement to jump to that line
5. **Remove individual**: Use the trash icon next to any console statement
6. **Remove all**: Use the trash icon in the tree view title bar

## Configuration

```json
{
  "consoleTree.includePatterns": [
    "**/*.js",
    "**/*.ts",
    "**/*.jsx",
    "**/*.tsx",
    "**/*.vue"
  ],
  "consoleTree.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.js"
  ]
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments

If you find this extension helpful and give credits, it would be greatly appreciated! Feel free to:

- ⭐ Star this repository
- 🐛 Report issues or suggest improvements
- 💬 Share your experience with the extension

---

**Made with ❤️ for the VS Code community**
