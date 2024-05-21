import * as _ from "lodash";
import Tab, { TabId } from "../domain/Tab";
import TabRepository from "./TabRepository";
import { convertToId } from "../utilities/chromeTabs";

export default class TabManagerService {
	private expirationTime: number;
	private lastActiveTabId: number | undefined;

	constructor(expirationTime: number = 600000) {
		this.expirationTime = expirationTime; // Default to 10 minute
	}

	public async initializeTabTimes() {
		const tabs = await TabRepository.getTabs();

		chrome.tabs.query({}, async (result) => {
			for (let i = 0; i < result.length; i++) {
				const currentId = convertToId(result[i]);
				if (result[i].id && !tabs.some((t) => _.isEqual(t.id, currentId))) {
					await this.updateTabActivity(result[i].id);
					await TabRepository.addTab(new Tab(currentId, Date.now()));
				}
			}
		});

		const expirationTime = (await chrome.storage.local.get(["expirationTime"]))
			.expirationTime;

		if (!expirationTime) {
			await chrome.storage.local.set({ expirationTime: this.expirationTime });
		}
	}

	// Check all tabs and close the ones that have been inactive longer than the expirationTime
	public checkInactiveTabsAndCloseThem() {
		chrome.storage.local.get(["expirationTime"], async (result) => {
			const expirationTime = result.expirationTime || this.expirationTime;

			const tabs = await TabRepository.getTabs().then((res) =>
				this.checkAndInvalidateTabs(res)
			);

			const currentTime: number = Date.now();
			const [currentTab] = await chrome.tabs.query({
				lastFocusedWindow: true,
				active: true,
			});

			if (currentTab || this.lastActiveTabId) {
				await this.updateTabActivity(currentTab?.id || this.lastActiveTabId);
			}

			const tabsToDelete = tabs
				.filter(
					(t) =>
						t.isExpired(currentTime, expirationTime) &&
						(!currentTab || _.isEqual(t, convertToId(currentTab)))
				)
				.sort((a, b) => a.lastInteract - b.lastInteract);

			if (tabsToDelete.length > 0) {
				this.promptUser(tabsToDelete);
			}
		});
	}

	private async promptUser(tabs: Tab[]) {
		const chromeTabs = await this.getChromeTabs(tabs);

		chrome.notifications.create(`delete-tabs`, {
			type: "basic",
			iconUrl: "/icons/icon128.png",
			title: "Confirm Tab Deletion",
			message: `Do you want to delete ${
				chromeTabs.length
			} Tab's? \n ${chromeTabs
				.map((t) => this.truncate(t?.title, 40))
				.slice(0, 3)
				.join("\n")}`,
			buttons: [{ title: "Yes" }, { title: "No" }],
			isClickable: false,
			priority: 2,
		});

		chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
			if (notifId === `delete-tabs`) {
				if (btnIdx === 0) {
					this.deleteTabs(chromeTabs);
				} else if (btnIdx === 1) {
					TabRepository.updateTabsTimes(
						chromeTabs.map(convertToId),
						Date.now()
					);
				}
				chrome.notifications.clear(notifId);
			}
		});
	}

	private async deleteTabs(tabs: chrome.tabs.Tab[]) {
		chrome.tabs.remove(
			tabs.map((t) => t.id),
			() => {
				if (chrome.runtime.lastError) {
					console.warn(
						`Error removing tab: ${chrome.runtime.lastError.message}`
					);
				} else {
					TabRepository.removeTabs(tabs.map(convertToId)).then(() => {
						console.log(`Tab ${tabs} was closed and removed from repository.`);
					});
				}
			}
		);
	}

	public async setLastActiveTab(id: number) {
		if (this.lastActiveTabId) {
			const lastTab = await chrome.tabs.get(this.lastActiveTabId);

			if (!!lastTab) {
				await this.updateTabActivity(lastTab.id);
			}
		}

		this.lastActiveTabId = id;
		await this.updateTabActivity(id);
	}

	// Update the last active time for a tab
	public async updateTabActivity(tabId: number) {
		const tab = await chrome.tabs.get(tabId);
		await TabRepository.updateTabTime(convertToId(tab), Date.now());
	}

	// Remove a tab from the repository when it is closed
	public async onTabClosed(tabId: number) {
		const tab = await chrome.tabs.get(tabId);
		await TabRepository.removeTab({
			index: tab.index,
			url: tab.url,
		});
	}

	// Update index on move tab
	public async OnTabMove(id: number, from: number, to: number) {
		const tab = await chrome.tabs.get(id);

		const [fromTab, toTab] = (await TabRepository.getTabs()).filter(
			(t) => t.id.index === from || t.id.index === to
		);

		await this.updateTabActivity(id);
		await TabRepository.updateTabIndex(fromTab.id, to);
		await TabRepository.updateTabIndex(toTab.id, from);
	}

	private truncate(text: string, num: number) {
		if (text?.length > num) {
			return `${text.substring(0, num - 3)}...`;
		}
		return text;
	}

	private async getChromeTabs(tabs: Tab[]) {
		const chromeTabs = await Promise.all(
			tabs.map((t) => this.getChromeTab(t.id))
		);

		return chromeTabs.filter((t) => !!t);
	}

	private async getChromeTab(
		tabId: TabId
	): Promise<chrome.tabs.Tab | undefined> {
		try {
			const result = await chrome.tabs.query({
				index: tabId.index,
				url: tabId.url,
			});

			return result.find((_) => true);
		} catch (_) {
			return undefined;
		}
	}

	private async checkAndInvalidateTabs(tabs: Tab[]) {
		for (let i = 0; i < tabs.length; i++) {
			const tab = await this.getChromeTab(tabs[i].id);
			if (!tab) {
				await TabRepository.removeTab(tabs[i].id);
			}
		}

		return await TabRepository.getTabs();
	}
}
