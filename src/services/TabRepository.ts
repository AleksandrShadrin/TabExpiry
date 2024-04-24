export type TabTimes = { [tabId: number]: number };

export class TabRepository {
	private static readonly storageKey = "tabTimes";

	static setTabTimes(tabTimes: TabTimes): Promise<void> {
		return new Promise((resolve, reject) => {
			chrome.storage.local.set({ [this.storageKey]: tabTimes }, () => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve();
				}
			});
		});
	}

	static async getTabTimes(): Promise<TabTimes> {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get([this.storageKey], (result) => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve(result[this.storageKey] || {});
				}
			});
		});
	}

	static async updateTabTime(tabId: number, time: number): Promise<void> {
		const tabTimes = await this.getTabTimes();
		tabTimes[tabId] = time;
		return await this.setTabTimes(tabTimes);
	}

	static async updateTabTimes(tabIds: number[], time: number): Promise<void> {
		const tabTimes = await this.getTabTimes();
		tabIds.forEach((id) => (tabTimes[id] = time));
		return await this.setTabTimes(tabTimes);
	}

	static async removeTab(tabId: number): Promise<void> {
		const tabTimes = await this.getTabTimes();
		delete tabTimes[tabId];
		return await this.setTabTimes(tabTimes);
	}

	static async removeTabs(tabIds: number[]): Promise<void> {
		const tabTimes = await this.getTabTimes();
		tabIds.forEach((id) => delete tabTimes[id]);
		return await this.setTabTimes(tabTimes);
	}
}
