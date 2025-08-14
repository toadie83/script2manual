import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables from .env (located in the project root)
dotenv.config({ path: path.join(__dirname, "../.env") });

// ===== Script2Manual: OpenAI error handling & key resolution helpers =====
const script2ManualOutput = vscode.window.createOutputChannel("Script2Manual");

function logVerbose(label: string, details: string) {
  try {
    script2ManualOutput.appendLine(
      `=== ${label} @ ${new Date().toISOString()} ===`
    );
    script2ManualOutput.appendLine(details);
    script2ManualOutput.appendLine("");
  } catch {}
}

function resolveOpenAIKey(): string | undefined {
  const { apiKey: keyFromSettings } = getUserSettings();
  const trimmed = (val?: string) => (val && val.trim()) || undefined;
  return trimmed(keyFromSettings) || trimmed(process.env.OPENAI_API_KEY);
}

function formatOpenAIError(err: unknown): { summary: string; details: string } {
  let summary = "Unexpected error calling OpenAI.";
  let details = "";

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const headers = err.response?.headers ?? {};
    const reqId =
      (headers as any)["x-request-id"] ||
      (headers as any)["x-requestid"] ||
      (headers as any)["request-id"];
    const payload = err.response?.data as any;

    const apiMsg = payload?.error?.message;
    const apiCode = payload?.error?.code;
    const apiType = payload?.error?.type;

    if (status === 401 || apiCode === "invalid_api_key") {
      summary =
        "Your OpenAI API key is invalid, missing, or was revoked. Update your key in Settings.";
    } else if (status === 429 && apiCode === "insufficient_quota") {
      summary =
        "You’ve run out of OpenAI credits (insufficient_quota). Check billing/usage.";
    } else if (status === 429) {
      summary =
        "Rate limit reached for OpenAI. Try again shortly or lower concurrency.";
    } else if (
      status === 404 &&
      typeof apiMsg === "string" &&
      /model/i.test(apiMsg)
    ) {
      summary =
        "Requested model not found or not enabled for your account. Check the model name.";
    } else if (status && status >= 500) {
      summary = "OpenAI is temporarily unavailable (server error). Try again.";
    } else if (apiMsg) {
      summary = apiMsg;
    }

    details = JSON.stringify(
      {
        status,
        request_id: reqId ?? null,
        openai_error: {
          message: apiMsg ?? null,
          code: apiCode ?? null,
          type: apiType ?? null,
        },
        axios_message: err.message,
        raw: payload ?? null,
      },
      null,
      2
    );
  } else if (err instanceof Error) {
    summary = `[Script2Manual handler] ${err.message}`;
    details = err.stack ?? err.message;
  } else {
    summary = `[Script2Manual handler] ${String(err)}`;
    details = String(err);
  }

  return { summary, details };
}

function getUserSettings() {
  const config = vscode.workspace.getConfiguration("script2manual");
  const apiKey = config.get<string>("apiKey", "");
  const fileNaming = config.get<string>("fileNaming", "default");
  const autoOpenFile = config.get<boolean>("autoOpenFile", false);
  const defaultOutputFileType = config.get<string>(
    "defaultOutputFileType",
    "ask"
  );
  return { apiKey, fileNaming, autoOpenFile, defaultOutputFileType };
}

async function processTestScript(testScript: string, filePath: string) {
  const { defaultOutputFileType } = getUserSettings();

  let format: string;
  if (defaultOutputFileType === "ask") {
    const selectedFormat = await vscode.window.showQuickPick(
      ["Plain Text", "CSV"],
      {
        placeHolder: "Select output format",
      }
    );
    if (!selectedFormat) {
      vscode.window.showWarningMessage(
        "No format selected. Conversion cancelled."
      );
      return;
    }
    format = selectedFormat;
  } else if (defaultOutputFileType === "csv") {
    format = "CSV";
  } else {
    format = "Plain Text";
  }

  const prompt = createAIPrompt(testScript);

  let aiResponse: string;
  try {
    aiResponse = await callOpenAIAPI(prompt);
  } catch (error) {
    const { summary, details } = formatOpenAIError(error);
    const action = await vscode.window.showErrorMessage(
      `OpenAI error: ${summary}`,
      "Copy details"
    );
    if (action === "Copy details") {
      await vscode.env.clipboard.writeText(details);
      vscode.window.showInformationMessage("Error details copied.");
    }
    logVerbose("callOpenAIAPI Error", details);
    return;
  }

  if (format === "CSV") {
    try {
      aiResponse = await convertToCSV(aiResponse, filePath);
    } catch (error) {
      const { summary, details } = formatOpenAIError(error);
      const action = await vscode.window.showErrorMessage(
        `CSV conversion failed: ${summary}`,
        "Copy details"
      );
      if (action === "Copy details") {
        await vscode.env.clipboard.writeText(details);
        vscode.window.showInformationMessage("Error details copied.");
      }
      logVerbose("convertToCSV Error", details);
      return;
    }
  }

  saveResponseToFile(aiResponse, filePath, format === "CSV" ? "csv" : "txt");
}

async function convertToCSV(
  plainTextResponse: string,
  filePath: string
): Promise<string> {
  const fileName = path.basename(filePath, path.extname(filePath));
  const apiKey = resolveOpenAIKey();
  if (!apiKey) {
    throw new Error("No OpenAI API key found. Set it in Settings or .env.");
  }

  const systemMessage = `
    You are an AI assistant designed to extract structured test cases from unstructured text.
    Your task is to analyze a provided test case document containing preconditions, steps, and expected results, then convert it into a structured CSV format.

    **Instructions:**
    
    **Extract Preconditions:**
    - Locate the section labeled "Preconditions:" and extract all listed items.
    - Store these as a single string, separating each precondition with a semicolon (;).
    - Ensure all test cases include the same preconditions.

    **Extract Test Steps and Expected Results:**
    - Identify test steps, which start with "Step X:".
    - Capture all subsequent lines associated with each step until an "Expected Result:" line appears.
    - Store the step description and details as a single string.

    **Map Steps to Expected Results:**
    - Ensure each step is placed in the same row as its corresponding expected result.
    - The expected result should be extracted as-is, removing the "Expected Result:" prefix.

    **Format Output as CSV:**
    - The first row **must always** be the header row with column names:
      - "Title","Description","Preconditions","Steps","Expected Result","State","Type","Automation"
    - Each subsequent row should represent a test case, ensuring **no blank rows** at the start.
    - The title should be set to the filename: **"${fileName}"**.
    - All text should be enclosed in double quotes to prevent formatting issues.
    - No additional empty lines should appear before or after the CSV content.
    - Save the file in **CSV format with UTF-8 encoding**. 

    **Example Output (Correct Format):**
    "Title","Description","Preconditions","Steps","Expected Result","State","Type","Automation"
    "${fileName}","Verify the functionality of the Research Hub page, specifically the Shares Research section.","Logged in to the secure site; Have a linked Trading account.; Content preferences are set.","Step 3: Verify available account types and select accounts
    - Verify the available account types for both 'From' and 'To' accounts.
    - Select a valid Trading account as the 'From' account.
    - Verify the available account types for the 'To' account.","The available account types should be correctly listed for selection.","Active","High Level","Automated"

    Ensure that:
    - There are **no extra empty lines or characters before the first row**.
    - All columns are consistently aligned with properly escaped quotation marks where necessary.
    - The generated output should be ready for direct import into a test management tool.
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: plainTextResponse },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    let csvOutput = response.data.choices[0].message.content.trim();
    csvOutput = csvOutput.replace(/^\s*[\r\n]+/, "");
    return csvOutput;
  } catch (error) {
    const { summary, details } = formatOpenAIError(error);
    logVerbose("convertToCSV Error", details);
    throw new Error(summary);
  }
}

function createAIPrompt(testScript: string): string {
  const prompt = `
    Please convert the following automation test script written in TypeScript into a detailed manual test case.
    Break down the script into:
      - Pre-conditions
      - Test steps
      - Expected results
      - Overall expected outcome
      - State
      - Type
      - Automation

    Script:
    ${testScript}
  `;
  return prompt;
}

async function callOpenAIAPI(prompt: string): Promise<string> {
  const apiKey = resolveOpenAIKey();
  if (!apiKey) {
    throw new Error("No OpenAI API key found. Set it in Settings or .env.");
  }

  const systemMessage = `Use the automated test script provided to write a manual test script.

- ignore the imports.
- Tests should be written using **test steps** and **expected results**.  
- The **step and results should be created from the "it" block statements primarily**.  
- **Method names** in the provided script **should help summarize the goal of the test step** but should not be directly referenced.  
- **Do not create a test step for every method.**  
- There should be **a minimum of one test step per "it" block**, but no more than **three per block**.  
- Steps should avoid using Commas.
- **Preconditions should be included.**  
- **Leave Title blank**
- **Description should be a high level summary of the test**
- If the code contains a FOR loop, each loop should have its own test step and expected result.
- State: should be "Active"
- Type: should be "High Level"
- Automation: should be "Automated"
- **Summarize the overall expected result at the end.**  
- responses should be formatted with minimal spacing

### **Response Format:**

Title:
"insert title here"

Description:
Ensure the research hub loads


Preconditions:
- Logged in to the secure site
- Have a linked Trading account.

Test Steps:
Step 1: Navigate to the Research Hub within the Secure Site  
- Set content preferences using a valid account.  
- Log in to the secure site using a valid account email.  
- Navigate to the "Research Hub" page via the header.  

 
Expected Result: The Research Hub page loads successfully.

State:
Active

Type:
High Level

Automation:
Automated

`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    const { summary, details } = formatOpenAIError(error);
    logVerbose("callOpenAIAPI Error", details);
    throw new Error(summary);
  }
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "script2manual.convertTestScript",
    async () => {
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      statusBarItem.text = "Script2Manual: Waiting for file selection...";
      statusBarItem.show();

      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select a Test Script",
        filters: { "TypeScript Files": ["ts"] },
      });

      if (fileUri && fileUri[0]) {
        const filePath = fileUri[0].fsPath;

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Script2Manual: Converting test script...",
            cancellable: false,
          },
          async (progress) => {
            progress.report({ increment: 0, message: "Reading file..." });
            statusBarItem.text = "Script2Manual: Reading file...";
            let data: string;
            try {
              data = await fs.promises.readFile(filePath, "utf8");
            } catch {
              vscode.window.showErrorMessage("Error reading the file.");
              statusBarItem.text = "Script2Manual: Error reading file.";
              setTimeout(() => statusBarItem.hide(), 3000);
              return;
            }

            progress.report({ increment: 30, message: "Processing script..." });
            statusBarItem.text = "Script2Manual: Processing script...";
            await processTestScript(data, filePath);

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

function saveResponseToFile(
  aiResponse: string,
  filePath: string,
  extension: string
) {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const outputFile = path.join(dir, `${baseName}_manual.${extension}`);

  fs.promises
    .writeFile(outputFile, aiResponse, "utf8")
    .then(() => {
      vscode.window.showInformationMessage(
        `Manual test case saved to ${outputFile}`
      );
      const { autoOpenFile } = getUserSettings();
      if (autoOpenFile) {
        vscode.workspace.openTextDocument(outputFile).then((doc) => {
          vscode.window.showTextDocument(doc, { preview: false });
        });
      }
    })
    .catch((err) => {
      vscode.window.showErrorMessage(
        `Failed to save manual test case: ${err.message}`
      );
      logVerbose("saveResponseToFile Error", err.stack || String(err));
    });
}

export function deactivate() {}
