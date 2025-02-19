import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables from .env (located in the project root)
dotenv.config({ path: path.join(__dirname, "../.env") });

async function processTestScript(testScript: string, filePath: string) {
  // Create the AI prompt
  const prompt = createAIPrompt(testScript);

  // Call the AI API
  let aiResponse: string;
  try {
    aiResponse = await callOpenAIAPI(prompt);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error.message);
    } else {
      vscode.window.showErrorMessage("An unknown error occurred.");
    }
    return;
  }

  // Save the AI response to a file in the workspace folder
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  // Get the base file name without extension (e.g., "loggingIn" from "loggingIn.ts")
  const baseName = path.basename(filePath, path.extname(filePath));
  const outputFilePath = path.join(
    workspaceFolders[0].uri.fsPath,
    `s2mTestcase-${baseName}.txt`
  );

  fs.writeFile(outputFilePath, aiResponse, async (err) => {
    if (err) {
      vscode.window.showErrorMessage("Failed to write the file.");
      return;
    }
    vscode.window.showInformationMessage(
      `Manual test case generated at: ${outputFilePath}`
    );

    // Automatically open the generated file in a new editor tab
    try {
      const doc = await vscode.workspace.openTextDocument(outputFilePath);
      await vscode.window.showTextDocument(doc);
    } catch (openErr) {
      vscode.window.showErrorMessage("Failed to open the generated file.");
    }
  });
}

function createAIPrompt(testScript: string): string {
  // This prompt is used as the user message after the system instructions.
  const prompt = `
    Please convert the following automation test script written in TypeScript into a detailed manual test case.
    Break down the script into:
      - Pre-conditions
      - Test steps
      - Expected results
      - Overall expected outcome

    Script:
    ${testScript}
  `;
  return prompt;
}

async function callOpenAIAPI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not set in the .env file.");
  }

  // Define the system prompt that will always be used.
  const systemMessage = `Use the automated test script provided to write a manual test script.

- ignore the imports.
- Tests should be written using **test steps** and **expected results**.
- The **step and results should be created from the "it" block statements primarily**.
- **Method names** in the provided script **should help summarize the goal of the test step** but should not be directly referenced.
- **Do not create a test step for every method.**
- There should be **a minimum of one test step per "it" block**, but no more than **three per block**.
- **Preconditions should be included.**
- **Summarize the overall expected result at the end.**
- responses should be formatted with minimal spacing

### **Response Format:**
\`\`\`
Preconditions:
- Logged in to the secure site
- Have a linked Trading account.

Test Steps:
Step 1: Navigate to the Research Hub within the Secure Site
- Set content preferences using a valid account.
- Log in to the secure site using a valid account email.
- Navigate to the "Research Hub" page via the header.

Expected Result: The Research Hub page loads successfully.
\`\`\``;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Use your desired model
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 8000, // Increased tokens for more comprehensive responses
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    // Extract and return the AI's response text
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch response from the OpenAI API.");
  }
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "script2manual.convertTestScript",
    async () => {
      // Create a status bar item to show progress
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = "Script2Manual: Waiting for file selection...";
      statusBarItem.show();

      // Open file selection dialog
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select a Test Script",
        filters: {
          "TypeScript Files": ["ts"],
        },
      });

      if (fileUri && fileUri[0]) {
        const filePath = fileUri[0].fsPath;

        // Start a progress notification using withProgress
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Script2Manual: Converting test script...",
            cancellable: false,
          },
          async (progress) => {
            // Step 1: Reading file
            progress.report({ increment: 0, message: "Reading file..." });
            statusBarItem.text = "Script2Manual: Reading file...";
            let data: string;
            try {
              data = await fs.promises.readFile(filePath, "utf8");
            } catch (err) {
              vscode.window.showErrorMessage("Error reading the file.");
              statusBarItem.text = "Script2Manual: Error reading file.";
              setTimeout(() => statusBarItem.hide(), 3000);
              return;
            }

            // Step 2: Processing script
            progress.report({ increment: 30, message: "Processing script..." });
            statusBarItem.text = "Script2Manual: Processing script...";
            await processTestScript(data, filePath);

            // Step 3: Completion
            progress.report({ increment: 70, message: "Conversion complete!" });
            statusBarItem.text = "Script2Manual: Conversion complete!";
            setTimeout(() => statusBarItem.hide(), 3000);
          }
        );
      } else {
        statusBarItem.text = "Script2Manual: No file selected.";
        setTimeout(() => statusBarItem.hide(), 3000);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
