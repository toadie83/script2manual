import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables from .env (located in the project root)
dotenv.config({ path: path.join(__dirname, "../.env") });

async function processTestScript(testScript: string, filePath: string) {
  // Ask the user whether they want the output as TXT or CSV
  const format = await vscode.window.showQuickPick(["Plain Text", "CSV"], {
    placeHolder: "Select output format",
  });

  if (!format) {
    vscode.window.showWarningMessage(
      "No format selected. Conversion cancelled."
    );
    return;
  }

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

  if (format === "CSV") {
    // Convert AI response into CSV format, passing the filePath
    try {
      aiResponse = await convertToCSV(aiResponse, filePath);
    } catch (error) {
      vscode.window.showErrorMessage("Failed to convert to CSV.");
      return;
    }
  }

  // Save the AI response to a file in the workspace folder
  saveResponseToFile(aiResponse, filePath, format === "CSV" ? "csv" : "txt");
}

async function convertToCSV(
  plainTextResponse: string,
  filePath: string
): Promise<string> {
  // Extract the filename without extension (e.g., "loginTest" from "loginTest.ts")
  const fileName = path.basename(filePath, path.extname(filePath));

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
          { role: "user", content: plainTextResponse }, // Injects AI's first response
        ],
        max_tokens: 8000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    let csvOutput = response.data.choices[0].message.content.trim();

    // Remove unintended leading characters or extra newlines
    csvOutput = csvOutput.replace(/^\s*[\r\n]+/, "");

    return csvOutput;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to convert response to CSV.");
  }
}

function saveResponseToFile(
  response: string,
  filePath: string,
  extension: string
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  const baseName = path.basename(filePath, path.extname(filePath));
  const outputFilePath = path.join(
    workspaceFolders[0].uri.fsPath,
    `s2mTestcase-${baseName}.${extension}`
  );

  fs.writeFile(outputFilePath, response, async (err) => {
    if (err) {
      vscode.window.showErrorMessage("Failed to write the file.");
      return;
    }
    vscode.window.showInformationMessage(
      `Test case generated at: ${outputFilePath}`
    );

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
      - State
      - Type
      - Automation

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
