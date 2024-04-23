import { TabManagerService } from "./services/TabManagerService";

const tabManagerService = new TabManagerService(60000); // Set the desired expiration time

tabManagerService.initializeTabTimes();

// Update the timestamp when the tab is first created or activated
chrome.tabs.onCreated.addListener((tab) => {
	if (tab.id !== undefined) {
		tabManagerService.updateTabActivity(tab.id);
	}
});

chrome.tabs.onActivated.addListener((activeInfo) => {
	tabManagerService.updateTabActivity(activeInfo.tabId);
});

// Listen for messages from content scripts and update the tab time
chrome.runtime.onMessage.addListener((message, sender) => {
	if (message.tabUpdated && sender.tab?.id) {
		tabManagerService.updateTabActivity(sender.tab.id);
	}
});

// Check inactive tabs at a regular interval and close them if necessary
setInterval(() => {
	tabManagerService.checkInactiveTabsAndCloseThem();
}, 5000);

// Remove tab information from the repository when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
	tabManagerService.onTabClosed(tabId);
});

// Log installation of the extension
chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension installed");
});
