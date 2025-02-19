"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LoginPage_1 = __importDefault(require("../../../../../pages/LoginPage"));
const Header_1 = __importDefault(require("../../../../../pages/secureSite/webRoot/Header"));
const newsAccounts_1 = __importDefault(require("../../../../../../shared/data/accounts/newsAccounts"));
const general_1 = __importDefault(require("../../../../../helpers/general"));
const sharesResearch_1 = __importDefault(require("../../../../../pages/secureSite/researchHub/sharesResearch"));
const displayPreferences_1 = __importDefault(require("../../../../../../API/helpers/displayPreferences"));
describe("Research hub", () => {
    //https://dc1-iptstr-v1.tdwh.co.uk/testrail/index.php?/suites/view/1749&group_id=23400&group_by=cases:section_id&group_order=asc&display_deleted_cases=0
    //last checked: February 2024
    before(async () => {
        const userDetails = await newsAccounts_1.default.getNewsAccount();
        await displayPreferences_1.default.dismissMorningstarPartnershipInfoBox({
            accountID: userDetails.linkedAccountNumbers.trading[0],
        });
        await LoginPage_1.default.loginToSecureSite({
            acceptCookie: true,
            email: userDetails.email,
        });
    });
    it("View Shares Research Section", async () => {
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
    });
    it("Click on Basic Materials", async () => {
        await sharesResearch_1.default.clickOnUSsectorCard("basic-materials");
        await general_1.default.waitForPageChange({
            url: "/us-outlook?report=basic-materials",
        });
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Communication Services", async () => {
        await sharesResearch_1.default.clickOnUSsectorCard("communication-services");
        await general_1.default.waitForPageChange({
            url: "/us-outlook?report=communication-services",
        });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Consumer Cyclical", async () => {
        await sharesResearch_1.default.clickOnUSsectorCard("consumer-cyclical");
        await general_1.default.waitForPageChange({
            url: "/us-outlook?report=consumer-cyclical",
        });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Consumer Defensive", async () => {
        await sharesResearch_1.default.clickOnUSsectorCard("consumer-defensive");
        await general_1.default.waitForPageChange({
            url: "/us-outlook?report=consumer-defensive",
        });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Energy", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("energy");
        await general_1.default.waitForPageChange({ url: "/us-outlook?report=energy" });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Financial Services", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("financial-services");
        await general_1.default.waitForPageChange({
            url: "/us-outlook?report=financial-services",
        });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Healthcare", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("healthcare");
        await general_1.default.waitForPageChange({ url: "/us-outlook?report=healthcare" });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Industrials", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("industrials");
        await general_1.default.waitForPageChange({ url: "/us-outlook?report=industrials" });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Real Estate", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("real-estate");
        await general_1.default.waitForPageChange({ url: "/us-outlook?report=real-estate" });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Technology", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("technology");
        await general_1.default.waitForPageChange({ url: "/us-outlook?report=technology" });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
    it("Click on Utilities", async () => {
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorNextSlide();
        await sharesResearch_1.default.clickOnUSsectorCard("utilities");
        await general_1.default.waitForPageChange({ url: "/us-outlook?report=utilities" });
        await browser.pause(1000);
        await Header_1.default.goToSecureSitePage({ page: "Research hub" });
        await Header_1.default.goToSecureSitePage({
            page: "Shares research",
        });
        await sharesResearch_1.default.waitForSharesResearch();
    });
});
//# sourceMappingURL=testscript.js.map