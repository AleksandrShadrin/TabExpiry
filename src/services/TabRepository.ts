import Tab from "../domain/Tab";

export default class TabRepository {
	private static readonly storageKey = "tabTimes";

	static setTabs(tabs: Tab[]): Promise<void> {
		return new Promise((resolve, reject) => {
			chrome.storage.local.set({ [this.storageKey]: tabs }, () => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve();
				}
			});
		});
	}

	static async addTab(tab: Tab): Promise<void> {
		const tabs = await this.getTabs();
		tabs.push(tab);

		return await this.setTabs(tabs);
	}

	static async getTabs(): Promise<Tab[]> {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get([this.storageKey], (result) => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve(
						(
							result[this.storageKey] as { id: number; lastInteract: number }[]
						)?.map((obj) => new Tab(obj.id, obj.lastInteract)) || []
					);
				}
			});
		});
	}

	static async updateTabTime(tabId: number, time: number): Promise<void> {
		const tabs = await this.getTabs();
		tabs.find((t) => t.id === tabId)?.update(time);

		return await this.setTabs(tabs);
	}

	static async updateTabs(tabIds: number[], time: number): Promise<void> {
		const tabs = await this.getTabs();
		tabs.filter((t) => t.id in tabIds).forEach((t) => t.update(time));

		return await this.setTabs(tabs);
	}

	static async removeTab(tabId: number): Promise<void> {
		let tabs = await this.getTabs();
		tabs.filter((t) => t.id === tabId);

		return await this.setTabs(tabs);
	}

	static async removeTabs(tabIds: number[]): Promise<void> {
		let tabs = await this.getTabs();
		tabs.filter((t) => t.id in tabIds);

		return await this.setTabs(tabs);
	}
}
