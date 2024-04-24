import { TabRepository } from "./TabRepository";

export class TabManagerService {
	private expirationTime: number;
	private lastActiveTabId: number | undefined;

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
			const [currentTab] = await chrome.tabs.query({
				lastFocusedWindow: true,
				active: true,
			});

			if (currentTab || this.lastActiveTabId) {
				console.log(currentTab);
				await this.updateTabActivity(currentTab?.id || this.lastActiveTabId);
			}

			const tabsToDelete = Object.entries(tabTimes)
				.filter(
					([tabIdStr, lastActiveTime]) =>
						currentTime - lastActiveTime > expirationTime &&
						parseInt(tabIdStr, 10) !== currentTab?.id
				)
				.sort(
					([, lastActiveTimeA], [, lastActiveTimeB]) =>
						lastActiveTimeA - lastActiveTimeB
				)
				.map(([tabIdStr, _]) => parseInt(tabIdStr, 10));

			if (tabsToDelete.length > 0) {
				this.promptUser(tabsToDelete);
			}
		});
	}

	private async promptUser(tabIds: number[]) {
		const tabs = (
			await Promise.all(
				tabIds.map(async (id) => {
					const tab = await this.getTab(id);
					if (!tab) {
						await TabRepository.removeTab(id);
					}

					return tab;
				})
			)
		).filter((t) => !!t);

		chrome.notifications.create(`delete-tabs`, {
			type: "basic",
			iconUrl: "/icons/icon128.png",
			title: "Confirm Tab Deletion",
			message: `Do you want to delete ${tabs.length} Tab's? \n ${tabs
				.map((tab) => this.truncate(tab?.title, 40))
				.slice(0, 3)
				.join("\n")}`,
			buttons: [{ title: "Yes" }, { title: "No" }],
			isClickable: false,
			priority: 2,
		});

		chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
			if (notifId === `delete-tabs`) {
				if (btnIdx === 0) {
					this.deleteTabs(tabs.map((t) => t?.id));
				} else if (btnIdx === 1) {
					TabRepository.updateTabTimes(tabIds, Date.now());
				}
				chrome.notifications.clear(notifId);
			}
		});
	}

	private deleteTabs(tabIds: number[]): void {
		chrome.tabs.remove(tabIds, () => {
			if (chrome.runtime.lastError) {
				console.warn(`Error removing tab: ${chrome.runtime.lastError.message}`);
			} else {
				TabRepository.removeTabs(tabIds).then(() => {
					console.log(`Tab ${tabIds} was closed and removed from repository.`);
				});
			}
		});
	}

	public async setLastActiveTab(id: number) {
		if (this.lastActiveTabId) {
			const lastTab = await this.getTab(this.lastActiveTabId);

			if (!lastTab) {
				await TabRepository.removeTab(this.lastActiveTabId);
			} else {
				await this.updateTabActivity(lastTab.id);
			}
		}

		this.lastActiveTabId = id;
		await this.updateTabActivity(id);
	}

	// Update the last active time for a tab
	public async updateTabActivity(tabId: number) {
		await TabRepository.updateTabTime(tabId, Date.now());
	}

	// Remove a tab from the repository when it is closed
	public async onTabClosed(tabId: number) {
		await TabRepository.removeTab(tabId);
	}

	private truncate(text: string, num: number) {
		if (text?.length > num) {
			return `${text.substring(0, num - 3)}...`;
		}
		return text;
	}

	private getTab(tabId: number): Promise<chrome.tabs.Tab | undefined> {
		return chrome.tabs
			.get(tabId)
			.then<chrome.tabs.Tab | undefined>((res) => res)
			.catch<chrome.tabs.Tab | undefined>(async (_) => {
				return undefined;
			});
	}
}
