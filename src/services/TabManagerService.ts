import { TabRepository } from "./TabRepository";

export class TabManagerService {
	private expirationTime: number; // Expiration time in milliseconds

	constructor(expirationTime: number = 60000) {
		this.expirationTime = expirationTime; // Default to 1 minute
	}

	// Check all tabs and close the ones that have been inactive longer than the expirationTime
	public checkInactiveTabsAndCloseThem(): void {
		chrome.storage.local.get(["expirationTime"], (result) => {
			const expirationTime = result.expirationTime || this.expirationTime;

			TabRepository.getTabTimes().then((tabTimes) => {
				const currentTime: number = Date.now();
				Object.entries(tabTimes).forEach(([tabIdStr, lastActiveTime]) => {
					const tabId: number = parseInt(tabIdStr, 10);
					if (currentTime - lastActiveTime > expirationTime) {
						this.deleteTab(tabId);
					}
				});
			});
		});
	}

	// Delete a tab from the browser and the repository
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
	public updateTabActivity(tabId: number): void {
		TabRepository.updateTabTime(tabId, Date.now());
	}

	// Remove a tab from the repository when it is closed
	public onTabClosed(tabId: number): void {
		TabRepository.removeTab(tabId);
	}
}
