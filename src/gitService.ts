import * as vscode from "vscode"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

/**
 * @note Git service for interacting with git repository
 */
export class GitService {
  /**
   * @note Get staged changes diff
   * @returns Staged diff string or null if no changes
   */
  async getStagedDiff(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null
    }

    const cwd = workspaceFolders[0].uri.fsPath

    try {
      // @note get staged diff
      const { stdout: diff } = await execAsync("git diff --cached", { cwd })

      if (!diff.trim()) {
        return null
      }

      // @note limit diff size to prevent token overflow
      const maxLength = 8000
      if (diff.length > maxLength) {
        return diff.substring(0, maxLength) + "\n... (truncated)"
      }

      return diff
    } catch {
      return null
    }
  }

  /**
   * @note Get list of staged files
   * @returns Array of staged file names
   */
  async getStagedFiles(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return []
    }

    const cwd = workspaceFolders[0].uri.fsPath

    try {
      const { stdout } = await execAsync(
        "git diff --cached --name-only",
        { cwd }
      )
      return stdout.trim().split("\n").filter(Boolean)
    } catch {
      return []
    }
  }
}
