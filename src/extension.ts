import * as vscode from "vscode"
import { TokenManager } from "./tokenManager"
import { CopilotClient } from "./copilotClient"
import { GitService } from "./gitService"
import { SYSTEM_PROMPTS } from "./prompts"

let tokenManager: TokenManager
let copilotClient: CopilotClient | null = null

/**
 * @note Extension activation entry point
 * @param context - VSCode extension context
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  tokenManager = new TokenManager(context)

  // @note check token on startup
  const token = await tokenManager.getToken()
  if (!token) {
    showTokenNotification()
  } else {
    const config = vscode.workspace.getConfiguration("commitGenerator")
    const model = config.get<string>("model") || "gpt-4o-mini"
    copilotClient = new CopilotClient(token, model)
  }

  // @note register generate message command
  const generateCommand = vscode.commands.registerCommand(
    "commitGenerator.generateMessage",
    async () => {
      await generateCommitMessage()
    }
  )

  // @note register input token command
  const inputTokenCommand = vscode.commands.registerCommand(
    "commitGenerator.inputToken",
    async () => {
      await promptForToken()
    }
  )

  context.subscriptions.push(generateCommand, inputTokenCommand)
}

/**
 * @note Show notification when token is not configured
 */
function showTokenNotification(): void {
  vscode.window
    .showWarningMessage(
      "GitHub token not configured for LazyCommit",
      "Get Token",
      "Input Token"
    )
    .then((selection) => {
      if (selection === "Get Token") {
        vscode.env.openExternal(
          vscode.Uri.parse(
            "https://github.com/settings/personal-access-tokens/new?user_models=read"
          )
        )
      } else if (selection === "Input Token") {
        promptForToken()
      }
    })
}

/**
 * @note Prompt user to input GitHub token
 */
async function promptForToken(): Promise<void> {
  const token = await vscode.window.showInputBox({
    prompt: "Enter your GitHub Personal Access Token",
    password: true,
    placeHolder: "ghp_xxxxxxxxxxxx",
    ignoreFocusOut: true,
  })

  if (!token) {
    return
  }

  // @note validate token
  const tempClient = new CopilotClient(token, "gpt-4o-mini")
  const isValid = await tempClient.validateToken()

  if (!isValid) {
    vscode.window.showErrorMessage("Invalid GitHub token. Please check and try again.")
    return
  }

  await tokenManager.saveToken(token)
  const config = vscode.workspace.getConfiguration("commitGenerator")
  const model = config.get<string>("model") || "gpt-4o-mini"
  copilotClient = new CopilotClient(token, model)
  vscode.window.showInformationMessage("GitHub token saved successfully!")
}

/**
 * @note Generate commit message from staged changes
 */
async function generateCommitMessage(): Promise<void> {
  // @note check token
  const token = await tokenManager.getToken()
  if (!token) {
    showTokenNotification()
    return
  }

  if (!copilotClient) {
    const config = vscode.workspace.getConfiguration("commitGenerator")
    const model = config.get<string>("model") || "gpt-4o-mini"
    copilotClient = new CopilotClient(token, model)
  }

  // @note get staged changes
  const gitService = new GitService()
  const stagedDiff = await gitService.getStagedDiff()

  if (!stagedDiff) {
    vscode.window.showWarningMessage("No staged changes found. Stage some changes first.")
    return
  }

  // @note get commit format
  const config = vscode.workspace.getConfiguration("commitGenerator")
  const format = config.get<string>("commitFormat") || "default"
  const systemPrompt = SYSTEM_PROMPTS[format as keyof typeof SYSTEM_PROMPTS]

  // @note generate message
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Generating commit message...",
      cancellable: false,
    },
    async () => {
      try {
        const message = await copilotClient!.generateCommitMessage(
          systemPrompt,
          stagedDiff
        )

        // @note set message to scm input box
        const gitExtension = vscode.extensions.getExtension("vscode.git")
        if (gitExtension) {
          const git = gitExtension.exports.getAPI(1)
          const repo = git.repositories[0]
          if (repo) {
            repo.inputBox.value = message
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        vscode.window.showErrorMessage(`Failed to generate commit message: ${errorMsg}`)
      }
    }
  )
}

export function deactivate(): void {}
