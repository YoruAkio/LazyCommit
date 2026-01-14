import * as vscode from "vscode"
import { TokenManager } from "./tokenManager"
import { CopilotClient } from "./copilotClient"
import { GitService } from "./gitService"
import { SYSTEM_PROMPTS } from "./prompts"

let tokenManager: TokenManager
let copilotClient: CopilotClient | null = null

// @note available models for selection
const AVAILABLE_MODELS = [
  { label: "GPT-4o Mini", value: "gpt-4o-mini", description: "Fast and efficient" },
  { label: "GPT-4o", value: "gpt-4o", description: "Most capable" },
  { label: "GPT-4.1", value: "gpt-4.1", description: "Latest GPT-4 version" },
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini", description: "Balanced performance" },
  { label: "GPT-4.1 Nano", value: "gpt-4.1-nano", description: "Lightweight and fast" }
]

// @note commit style options
const COMMIT_STYLES = [
  { label: "Default", value: "default", description: "With scope: feat(auth): message" },
  { label: "Simple", value: "simple", description: "Without scope: feat: message" },
  { label: "Short", value: "short", description: "One line: feat: change1; change2" },
]

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
    const config = vscode.workspace.getConfiguration("lazycommit")
    const model = config.get<string>("model") || "gpt-4o-mini"
    copilotClient = new CopilotClient(token, model)
  }

  // @note register generate message command
  const generateCommand = vscode.commands.registerCommand(
    "lazycommit.generateMessage",
    async () => {
      await generateCommitMessage()
    }
  )

  // @note register input token command
  const inputTokenCommand = vscode.commands.registerCommand(
    "lazycommit.inputToken",
    async () => {
      await promptForToken()
    }
  )

  // @note register get token command (opens github page)
  const getTokenCommand = vscode.commands.registerCommand(
    "lazycommit.getToken",
    async () => {
      await openGitHubTokenPage()
    }
  )

  // @note register select model command
  const selectModelCommand = vscode.commands.registerCommand(
    "lazycommit.selectModel",
    async () => {
      await selectModel()
    }
  )

  // @note register select commit style command
  const selectCommitStyleCommand = vscode.commands.registerCommand(
    "lazycommit.selectCommitStyle",
    async () => {
      await selectCommitStyle()
    }
  )

  context.subscriptions.push(
    generateCommand,
    inputTokenCommand,
    getTokenCommand,
    selectModelCommand,
    selectCommitStyleCommand
  )
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
        openGitHubTokenPage()
      } else if (selection === "Input Token") {
        promptForToken()
      }
    })
}

/**
 * @note Open GitHub PAT creation page
 */
async function openGitHubTokenPage(): Promise<void> {
  await vscode.env.openExternal(
    vscode.Uri.parse(
      "https://github.com/settings/personal-access-tokens/new?user_models=read"
    )
  )
}

/**
 * @note Prompt user to input GitHub token
 */
async function promptForToken(): Promise<void> {
  const token = await vscode.window.showInputBox({
    prompt: "Enter your GitHub Personal Access Token (Fine-grained)",
    password: true,
    placeHolder: "github_pat_xxxxxxxxxxxx",
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
  const config = vscode.workspace.getConfiguration("lazycommit")
  const model = config.get<string>("model") || "gpt-4o-mini"
  copilotClient = new CopilotClient(token, model)
  vscode.window.showInformationMessage("GitHub token saved successfully!")
}

/**
 * @note Show model selection quick pick
 */
async function selectModel(): Promise<void> {
  const config = vscode.workspace.getConfiguration("lazycommit")
  const currentModel = config.get<string>("model") || "gpt-4o-mini"

  const items = AVAILABLE_MODELS.map((model) => ({
    label: model.label,
    description: model.value === currentModel ? "(current)" : model.description,
    value: model.value,
  }))

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select AI model for commit generation",
    title: "LazyCommit: Select AI Model",
  })

  if (!selected) {
    return
  }

  await config.update("model", selected.value, vscode.ConfigurationTarget.Global)

  // @note update copilot client with new model
  const token = await tokenManager.getToken()
  if (token) {
    copilotClient = new CopilotClient(token, selected.value)
  }

  vscode.window.showInformationMessage(`Model changed to ${selected.label}`)
}

/**
 * @note Show commit style selection quick pick
 */
async function selectCommitStyle(): Promise<void> {
  const config = vscode.workspace.getConfiguration("lazycommit")
  const currentStyle = config.get<string>("commitFormat") || "default"

  const items = COMMIT_STYLES.map((style) => ({
    label: style.label,
    description: style.value === currentStyle ? "(current)" : style.description,
    value: style.value,
  }))

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select commit message style",
    title: "LazyCommit: Select Commit Style",
  })

  if (!selected) {
    return
  }

  await config.update("commitFormat", selected.value, vscode.ConfigurationTarget.Global)
  vscode.window.showInformationMessage(`Commit style changed to ${selected.label}`)
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
    const config = vscode.workspace.getConfiguration("lazycommit")
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
  const config = vscode.workspace.getConfiguration("lazycommit")
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
