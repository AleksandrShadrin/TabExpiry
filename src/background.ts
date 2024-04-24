import { TabManagerService } from "./services/TabManagerService";

const tabManagerService = new TabManagerService();

tabManagerService.initializeTabTimes();

async function checkAlarmState() {
	const alarm = await chrome.alarms.get("check-tabs-alarm");

	if (!alarm) {
		await chrome.alarms.create("check-tabs-alarm", { periodInMinutes: 1 });
	}
}

checkAlarmState();

// Update the timestamp when the tab is first created or activated
chrome.tabs.onCreated.addListener((tab) => {
	if (tab.id !== undefined) {
		tabManagerService.updateTabActivity(tab.id);
	}
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
	await tabManagerService.setLastActiveTab(activeInfo.tabId);
});

// Remove tab information from the repository when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
	tabManagerService.onTabClosed(tabId);
});

// Log installation of the extension
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason !== "install") {
		return;
	}

	console.log("Installed");
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === "check-tabs-alarm") {
		tabManagerService.checkInactiveTabsAndCloseThem();
	}
});
