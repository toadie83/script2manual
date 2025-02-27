import { LoginPage } from "../pageObjects/LoginPage";
import { AccountPage } from "../pageObjects/AccountPage";
import { DocumentsPage } from "../pageObjects/DocumentsPage";

describe("User Journey on My Big Software Company", () => {
  let loginPage: LoginPage;
  let accountPage: AccountPage;
  let documentsPage: DocumentsPage;

  before(() => {
    loginPage = new LoginPage();
    accountPage = new AccountPage();
    documentsPage = new DocumentsPage();
  });

  it("should allow a user to log in successfully", async () => {
    await loginPage.navigate();
    await loginPage.enterUsername("testuser");
    await loginPage.enterPassword("Test@1234");
    await loginPage.submit();
    await accountPage.verifyUserLoggedIn();
  });

  it("should navigate to the documents section and display previous month statements", async () => {
    await accountPage.goToDocumentsSection();
    await documentsPage.verifyStatementsDisplayed("previousMonth");
  });

  it("should allow filtering of documents by a specific date range", async () => {
    await documentsPage.openFilterOptions();
    await documentsPage.setDateRange("2023-08-01", "2023-08-31");
    await documentsPage.applyFilter();
    await documentsPage.verifyFilteredResults("2023-08");
  });

  it("should check that the download statement button is present", async () => {
    const isVisible = await documentsPage.isDownloadButtonVisible();
    if (!isVisible) {
      throw new Error("Download statement button is not visible");
    }
  });
});
