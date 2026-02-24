import * as vscode from "vscode"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

/**
 * @note Git service for interacting with git repository
 */
export class GitService {
  /**
   * @note resolve default git cwd from workspace root
   * @returns workspace folder path or null
   */
  private getDefaultCwd(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null
    }

    return workspaceFolders[0].uri.fsPath
  }

  /**
   * @note Get staged changes diff
   * @param cwd - optional git repository path
   * @returns staged diff string or null if no changes
   */
  async getStagedDiff(cwd?: string): Promise<string | null> {
    const resolvedCwd = cwd || this.getDefaultCwd()
    if (!resolvedCwd) {
      return null
    }

    try {
      // @note get staged diff
      const { stdout: diff } = await execAsync("git diff --cached", {
        cwd: resolvedCwd,
      })

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
   * @param cwd - optional git repository path
   * @returns array of staged file names
   */
  async getStagedFiles(cwd?: string): Promise<string[]> {
    const resolvedCwd = cwd || this.getDefaultCwd()
    if (!resolvedCwd) {
      return []
    }

    try {
      const { stdout } = await execAsync(
        "git diff --cached --name-only",
        { cwd: resolvedCwd }
      )
      return stdout.trim().split("\n").filter(Boolean)
    } catch {
      return []
    }
  }
}
