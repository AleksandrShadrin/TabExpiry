jest.mock("../../src/services/TabRepository", () => ({
	TabRepository: {
		getTabTimes: jest.fn(() => Promise.resolve()),
		updateTabTime: jest.fn(() => Promise.resolve()),
		removeTab: jest.fn(() => Promise.resolve()),
	},
}));

import { TabRepository } from "../../../src/services/TabRepository";
import { TabManagerService } from "../../../src/services/TabManagerService";
import chrome from "../chrome";

describe("TabManagerService", () => {
	let tabManagerService: TabManagerService;

	beforeEach(() => {
		// Clear all instances and calls to constructor and all methods:
		jest.clearAllMocks();
		tabManagerService = new TabManagerService(60000); // 1 minute
	});

	it("should update tab activity", async () => {
		const tabId = 123;
		await tabManagerService.updateTabActivity(tabId);
		expect(TabRepository.updateTabTime).toHaveBeenCalledWith(
			tabId,
			expect.any(Number)
		);
	});

	it("should remove a tab when it is closed", async () => {
		const tabId = 123;
		await tabManagerService.onTabClosed(tabId);
		expect(TabRepository.removeTab).toHaveBeenCalledWith(tabId);
	});

	it("should check inactive tabs and close them if they exceed the expiration time", async () => {
		const currentTime = Date.now();

		(TabRepository.getTabTimes as jest.Mock).mockResolvedValue({
			"123": currentTime - 61000, // 61 seconds ago
			"124": currentTime - 59000, // 59 seconds ago
		});
		chrome.tabs.remove.mockImplementation((tabId, callback) => callback());
		await tabManagerService.checkInactiveTabsAndCloseThem();

		expect(TabRepository.getTabTimes).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.remove).toHaveBeenCalledWith(123, expect.any(Function));
		expect(chrome.tabs.remove).not.toHaveBeenCalledWith(
			124,
			expect.any(Function)
		);
	});
});
