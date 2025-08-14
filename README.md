# **Script2Manual - VS Code Extension**

**Script2Manual** is a Visual Studio Code extension that converts automated test scripts written in TypeScript into detailed manual test cases. Leveraging an integrated AI solution, it transforms test code into clear, human-readable test instructions that include **preconditions, test steps, and expected results**.

---

## **🚀 Features**

✅ **Automated Conversion**: Transforms TypeScript test scripts (using the page object model) into structured manual test cases.  
✅ **Custom System Prompt**: Uses a predefined system prompt to ensure consistent formatting and test step summarization.  
✅ **Dynamic File Naming**: Automatically names output files based on the original test script.  
✅ **CSV or Plain Text Export**: Generate test cases in **plain text** or **CSV format** for test management tools.  
✅ **Seamless Integration**: Easily invoked from the VS Code **Command Palette**.  
✅ **User-configurable Settings**: Customize output behavior through the **VS Code settings menu**.

---

## **📌 Requirements**

- Visual Studio Code (Latest version recommended)

---

## **🛠 Usage Instructions**

1️⃣ Open the **Command Palette** in VS Code (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).  
2️⃣ Run the command: **"Script2Manual: Convert Test Script"**.  
3️⃣ Select the desired TypeScript test script file.  
4️⃣ The extension processes the file and generates a **manual test case** in your workspace folder.

---

## **⚙ Extension Settings**

You can configure settings in **VS Code Settings (`Ctrl+,` or `Cmd+,`)** by searching for **"Script2Manual"**.

### **Available Settings**

| Setting                               | Description                                                                                                                | Default     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `script2manual.defaultOutputFileType` | Set the default output file type. Options: `ask` (prompt every time), `csv` (always CSV), `plaintext` (always Plain Text). | `ask`       |
| `script2manual.autoOpenFile`          | Automatically open the generated file upon conversion.                                                                     | `false`     |
| `script2manual.apiKey`                | Stores your OpenAI API Key securely.                                                                                       | _(empty)_   |
| `script2manual.fileNaming`            | Allows customization of output file naming rules.                                                                          | `"default"` |

---

## **🐞 Known Issues**

🔹 No major issues reported. If you encounter a problem, please submit an issue on [GitHub](https://github.com/toadie83/script2manual/issues).

---

## **📜 Release Notes**

### **📌 1.0.5 - Latest Release**

✅ **Enhancements & Improvements:**

- **Improved OpenAI Error Handling**:

  - Now displays clear, user-friendly messages for common API errors (invalid/missing key, quota issues, rate limits, etc.).
  - Added “Copy details” option for full technical error output, including OpenAI’s raw response for debugging.
  - Error logs now include request IDs (when available) for easier support and troubleshooting.

- **API Key Resolution**:
  - The extension now correctly checks for keys set in the `script2manual.apiKey` setting if one exists
  - Ensures users can configure or replace keys directly in VS Code

---

### **📌 1.0.4**

- Updated API key.

### **📌 1.0.3**

✅ **Enhancements & Features:**

- **Added a Settings Menu**: Users can now configure extension behavior.
- **New Setting: Default Output File Type**: Choose between `Ask each time`, `Always CSV`, or `Always Plain Text`.
- **New Setting: Automatically Open Generated File**: Option to automatically open test cases after generation.
- **Refactored Settings for Better Control**: Consolidated file format options into a single setting.

### **📌 1.0.2**

- Fixed support for CSV exports.

### **📌 1.0.1**

- Added support for CSV exports.

### **📌 1.0.0**

- Initial release.

---

## **📜 License**

📄 MIT License - [View License](https://github.com/toadie83/script2manual/blob/master/LICENSE.md)

---

**🎉 Enjoy using Script2Manual! If you like it, consider leaving a review! 🚀**
