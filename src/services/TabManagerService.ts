import { TabRepository } from "./TabRepository";

export class TabManagerService {
	private expirationTime: number; // Expiration time in milliseconds

	constructor(expirationTime: number = 60000) {
		this.expirationTime = expirationTime; // Default to 1 minute
	}

	public async initializeTabTimes() {
		const tabTimes = await TabRepository.getTabTimes();

		chrome.tabs.query({}, async (tabs) => {
			for (let i = 0; i < tabs.length; i++) {
				if (tabs[i].id && !tabTimes[tabs[i].id]) {
					await this.updateTabActivity(tabs[i].id);
				}
			}
		});
	}

	// Check all tabs and close the ones that have been inactive longer than the expirationTime
	public checkInactiveTabsAndCloseThem() {
		chrome.storage.local.get(["expirationTime"], async (result) => {
			const expirationTime = result.expirationTime || this.expirationTime;

			const tabTimes = await TabRepository.getTabTimes();
			const currentTime: number = Date.now();

			Object.entries(tabTimes).forEach(([tabIdStr, lastActiveTime]) => {
				const tabId: number = parseInt(tabIdStr, 10);
				if (currentTime - lastActiveTime > expirationTime) {
					this.deleteTab(tabId);
				}
			});
		});
	}

	private deleteTab(tabId: number): void {
		chrome.tabs.remove(tabId, () => {
			// Check for errors, as the tab may have been closed manually
			if (chrome.runtime.lastError) {
				console.warn(`Error removing tab: ${chrome.runtime.lastError.message}`);
			} else {
				TabRepository.removeTab(tabId).then(() => {
					console.log(`Tab ${tabId} was closed and removed from repository.`);
				});
			}
		});
	}

	// Update the last active time for a tab
	public async updateTabActivity(tabId: number) {
		await TabRepository.updateTabTime(tabId, Date.now());
	}

	// Remove a tab from the repository when it is closed
	public async onTabClosed(tabId: number) {
		await TabRepository.removeTab(tabId);
	}
}
