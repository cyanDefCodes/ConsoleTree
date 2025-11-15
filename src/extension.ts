import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface ConsoleLogMatch {
  file: string;
  line: number;
  column: number;
  text: string;
  fullLine: string;
}

class ConsoleLogProvider implements vscode.TreeDataProvider<ConsoleLogItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ConsoleLogItem | undefined | null | void
  > = new vscode.EventEmitter<ConsoleLogItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ConsoleLogItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private consoleLogs: ConsoleLogMatch[] = [];
  private isRefreshing: boolean = false;

  constructor() {
    this.refresh();
  }

  refresh(): void {
    if (this.isRefreshing) {
      return;
    }
    this.isRefreshing = true;
    this.findConsoleLogs()
      .then(() => {
        this._onDidChangeTreeData.fire();
        this.isRefreshing = false;
      })
      .catch(() => {
        this.isRefreshing = false;
      });
  }

  getTreeItem(element: ConsoleLogItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConsoleLogItem): Thenable<ConsoleLogItem[]> {
    if (!element) {
      const fileGroups = this.groupByFile();
      return Promise.resolve(
        fileGroups.map(
          (group) =>
            new ConsoleLogItem(
              path.basename(group.file),
              vscode.TreeItemCollapsibleState.Expanded,
              {
                file: group.file,
                matches: group.matches,
              }
            )
        )
      );
    } else if (element.contextValue === "file") {
      const matches = element.data?.matches || [];
      return Promise.resolve(
        matches.map(
          (match: ConsoleLogMatch) =>
            new ConsoleLogItem(
              `Line ${match.line + 1}: ${match.fullLine
                .trim()
                .substring(0, 50)}`,
              vscode.TreeItemCollapsibleState.None,
              { match },
              {
                command: "vscode.open",
                title: "Open",
                arguments: [
                  vscode.Uri.file(match.file),
                  {
                    selection: new vscode.Range(
                      match.line,
                      match.column,
                      match.line,
                      match.column + match.text.length
                    ),
                  },
                ],
              }
            )
        )
      );
    }
    return Promise.resolve([]);
  }

  private groupByFile(): { file: string; matches: ConsoleLogMatch[] }[] {
    const groups = new Map<string, ConsoleLogMatch[]>();

    this.consoleLogs.forEach((log) => {
      if (!groups.has(log.file)) {
        groups.set(log.file, []);
      }
      groups.get(log.file)!.push(log);
    });

    return Array.from(groups.entries()).map(([file, matches]) => ({
      file,
      matches,
    }));
  }

  private async findConsoleLogs(): Promise<void> {
    const config = vscode.workspace.getConfiguration("consoleTree");
    const includePatterns = config.get<string[]>("includePatterns") || [
      "**/*.js",
      "**/*.ts",
      "**/*.jsx",
      "**/*.tsx",
      "**/*.vue",
    ];
    const excludePatterns = config.get<string[]>("excludePatterns") || [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
    ];
    const searchPatterns = config.get<string[]>("patterns") || [
      "console\\.log\\s*\\(",
      "console\\.warn\\s*\\(",
      "console\\.error\\s*\\(",
      "console\\.info\\s*\\(",
      "console\\.debug\\s*\\(",
    ];

    this.consoleLogs = [];
    const processedFiles = new Set<string>();
    const allFiles = new Set<vscode.Uri>();

    // Collect all files first
    for (const includePattern of includePatterns) {
      try {
        const files = await vscode.workspace.findFiles(
          includePattern,
          `{${excludePatterns.join(",")}}`
        );
        files.forEach((file) => allFiles.add(file));
      } catch (error) {
        console.error(
          `Error finding files with pattern ${includePattern}:`,
          error
        );
      }
    }

    // Process each unique file
    for (const file of allFiles) {
      if (processedFiles.has(file.fsPath)) {
        continue;
      }
      processedFiles.add(file.fsPath);

      try {
        const content = fs.readFileSync(file.fsPath, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, lineIndex) => {
          // Create a combined regex to match all patterns in one pass
          const combinedPattern = searchPatterns.join("|");
          const regex = new RegExp(combinedPattern, "g");

          let match;
          const processedMatches = new Set<number>();

          while ((match = regex.exec(line)) !== null) {
            // Avoid duplicate matches at the same position
            if (processedMatches.has(match.index)) {
              continue;
            }
            processedMatches.add(match.index);

            this.consoleLogs.push({
              file: file.fsPath,
              line: lineIndex,
              column: match.index,
              text: match[0],
              fullLine: line,
            });
          }
        });
      } catch (error) {
        console.error(`Error reading file ${file.fsPath}:`, error);
      }
    }

    vscode.commands.executeCommand(
      "setContext",
      "workspaceHasConsoleLogs",
      this.consoleLogs.length > 0
    );
  }

  async removeConsoleLog(item: ConsoleLogItem): Promise<void> {
    if (!item.data?.match) return;

    const match = item.data.match;
    const document = await vscode.workspace.openTextDocument(match.file);
    const edit = new vscode.WorkspaceEdit();

    const line = document.lineAt(match.line);
    const lineText = line.text;

    if (
      lineText
        .trim()
        .match(/^\s*console\.(log|warn|error|info|debug)\s*\([^;]*;?\s*$/)
    ) {
      edit.delete(document.uri, line.rangeIncludingLineBreak);
    } else {
      const consoleMatch = lineText.match(
        /console\.(log|warn|error|info|debug)\s*\([^)]*\);?/
      );
      if (consoleMatch) {
        // Extension made by MarcosKlender
        const start = lineText.indexOf(consoleMatch[0]);
        const end = start + consoleMatch[0].length;
        edit.delete(
          document.uri,
          new vscode.Range(match.line, start, match.line, end)
        );
      }
    }

    await vscode.workspace.applyEdit(edit);
    this.refresh();
  }

  async removeAllConsoleLogs(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      `Remove all ${this.consoleLogs.length} console log statements?`,
      { modal: true },
      "Yes",
      "No"
    );

    if (result !== "Yes") return;

    const edit = new vscode.WorkspaceEdit();
    const fileChanges = new Map<string, vscode.TextDocument>();

    for (const log of this.consoleLogs) {
      if (!fileChanges.has(log.file)) {
        const document = await vscode.workspace.openTextDocument(log.file);
        fileChanges.set(log.file, document);
      }
    }

    for (const [filePath, document] of fileChanges) {
      const logsInFile = this.consoleLogs.filter(
        (log) => log.file === filePath
      );
      logsInFile.sort((a, b) => b.line - a.line);

      for (const log of logsInFile) {
        const line = document.lineAt(log.line);
        const lineText = line.text;

        if (
          lineText
            .trim()
            .match(/^\s*console\.(log|warn|error|info|debug)\s*\([^;]*;?\s*$/)
        ) {
          edit.delete(document.uri, line.rangeIncludingLineBreak);
        } else {
          const consoleMatch = lineText.match(
            /console\.(log|warn|error|info|debug)\s*\([^)]*\);?/
          );
          if (consoleMatch) {
            const start = lineText.indexOf(consoleMatch[0]);
            const end = start + consoleMatch[0].length;
            edit.delete(
              document.uri,
              new vscode.Range(log.line, start, log.line, end)
            );
          }
        }
      }
    }

    await vscode.workspace.applyEdit(edit);
    this.refresh();

    vscode.window.showInformationMessage(
      `Removed ${this.consoleLogs.length} console log statements!`
    );
  }
}

class ConsoleLogItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly data?: any,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    if (data?.match) {
      this.contextValue = "consoleLog";
      this.iconPath = new vscode.ThemeIcon("debug-console");
      this.tooltip = `${data.match.fullLine.trim()} (Line ${
        data.match.line + 1
      })`;
    } else if (data?.matches) {
      this.contextValue = "file";
      this.iconPath = vscode.ThemeIcon.File;
      this.description = `${data.matches.length} console logs`;
      this.tooltip = `${data.file} - ${data.matches.length} console logs found`;
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new ConsoleLogProvider();

  vscode.window.registerTreeDataProvider("consoleTree", provider);

  const findCommand = vscode.commands.registerCommand(
    "console-tree.findConsoleLogs",
    () => {
      provider.refresh();
      vscode.window.showInformationMessage(
        `Found ${provider["consoleLogs"].length} console log statements`
      );
    }
  );

  const removeAllCommand = vscode.commands.registerCommand(
    "console-tree.removeAllConsoleLogs",
    () => {
      provider.removeAllConsoleLogs();
    }
  );

  const refreshCommand = vscode.commands.registerCommand(
    "console-tree.refreshTree",
    () => {
      provider.refresh();
    }
  );

  const removeCommand = vscode.commands.registerCommand(
    "console-tree.removeConsoleLog",
    (item: ConsoleLogItem) => {
      provider.removeConsoleLog(item);
    }
  );

  let refreshTimeout: NodeJS.Timeout | undefined;
  const debouncedRefresh = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(() => {
      provider.refresh();
    }, 1000);
  };

  const watcher = vscode.workspace.createFileSystemWatcher(
    "**/*.{js,ts,jsx,tsx,vue}"
  );
  watcher.onDidChange(() => debouncedRefresh());
  watcher.onDidCreate(() => debouncedRefresh());
  watcher.onDidDelete(() => debouncedRefresh());

  context.subscriptions.push(
    findCommand,
    removeAllCommand,
    refreshCommand,
    removeCommand,
    watcher
  );

  provider.refresh();
}

export function deactivate() {}
