"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LoginPage_1 = require("../pageObjects/LoginPage");
const AccountPage_1 = require("../pageObjects/AccountPage");
const DocumentsPage_1 = require("../pageObjects/DocumentsPage");
describe("User Journey on My Big Software Company", () => {
    let loginPage;
    let accountPage;
    let documentsPage;
    before(() => {
        loginPage = new LoginPage_1.LoginPage();
        accountPage = new AccountPage_1.AccountPage();
        documentsPage = new DocumentsPage_1.DocumentsPage();
    });
    it("should allow a user to log in successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        yield loginPage.navigate();
        yield loginPage.enterUsername("testuser");
        yield loginPage.enterPassword("Test@1234");
        yield loginPage.submit();
        yield accountPage.verifyUserLoggedIn();
    }));
    it("should navigate to the documents section and display previous month statements", () => __awaiter(void 0, void 0, void 0, function* () {
        yield accountPage.goToDocumentsSection();
        yield documentsPage.verifyStatementsDisplayed("previousMonth");
    }));
    it("should allow filtering of documents by a specific date range", () => __awaiter(void 0, void 0, void 0, function* () {
        yield documentsPage.openFilterOptions();
        yield documentsPage.setDateRange("2023-08-01", "2023-08-31");
        yield documentsPage.applyFilter();
        yield documentsPage.verifyFilteredResults("2023-08");
    }));
    it("should check that the download statement button is present", () => __awaiter(void 0, void 0, void 0, function* () {
        const isVisible = yield documentsPage.isDownloadButtonVisible();
        if (!isVisible) {
            throw new Error("Download statement button is not visible");
        }
    }));
});
//# sourceMappingURL=testScenarioOne.js.map