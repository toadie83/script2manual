# script2manual README

Script2Manual is a Visual Studio Code extension that converts automated test scripts written in TypeScript into detailed manual test cases. Leveraging OpenAI's ChatGPT API, it transforms test code into clear, human-readable test instructions that include preconditions, test steps, and expected results.

## Features

Automated Conversion: Transforms TypeScript test scripts (using the page object model) into manual test cases.
Custom System Prompt: Uses a custom system prompt to ensure consistent formatting and focus on test step summarization.
Dynamic File Naming: Generates an output file with the original script's name (e.g., manual-test-case-loggingIn.txt).
Seamless Integration: Easily invoked from the VS Code Command Palette.

## Requirements

Visual Studio Code

## Extension Settings

Open the Command Palette in VS Code (Ctrl+Shift+P or Cmd+Shift+P).
Run the command: Script2Manual: Convert Test Script.
Select the desired TypeScript test script file.
The extension processes the file and creates a manual test case in your workspace folder.

## Known Issues

## Release Notes

### 1.0.0

Initial release

### 1.0.1

Added support for CSV exports

### License

MIT - https://github.com/toadie83/script2manual/blob/master/LICENSE.md

**Enjoy!**
