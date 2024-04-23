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

	static getTabTimes(): Promise<TabTimes> {
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

	static updateTabTime(tabId: number, time: number): Promise<void> {
		return this.getTabTimes().then((tabTimes) => {
			tabTimes[tabId] = time;
			return this.setTabTimes(tabTimes);
		});
	}

	static removeTab(tabId: number): Promise<void> {
		return this.getTabTimes().then((tabTimes) => {
			delete tabTimes[tabId];
			return this.setTabTimes(tabTimes);
		});
	}
}
