import * as _ from "lodash";
import Tab, { TabId } from "../domain/Tab";

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
							result[this.storageKey] as { id: TabId; lastInteract: number }[]
						)?.map((obj) => new Tab(obj.id, obj.lastInteract)) || []
					);
				}
			});
		});
	}

	static async updateTabIndex(tabId: TabId, newIndex: number) {
		const tabs = await this.getTabs();
		const tab = tabs.find((t) => _.isEqual(t.id, tabId));

		tab.id.index = newIndex;
		return await this.setTabs(tabs);
	}

	static async updateTabTime(tabId: TabId, time: number): Promise<void> {
		const tabs = await this.getTabs();
		tabs.find((t) => _.isEqual(t.id, tabId))?.update(time);

		return await this.setTabs(tabs);
	}

	static async updateTabsTimes(tabIds: TabId[], time: number): Promise<void> {
		const tabs = await this.getTabs();
		tabs
			.filter((t) => tabIds.some((id) => _.isEqual(id, t.id)))
			.forEach((t) => t.update(time));

		return await this.setTabs(tabs);
	}

	static async removeTab(tabId: TabId): Promise<void> {
		let tabs = await this.getTabs();
		tabs.filter((t) => _.isEqual(t.id, tabId));

		return await this.setTabs(tabs);
	}

	static async removeTabs(tabIds: TabId[]): Promise<void> {
		let tabs = await this.getTabs();
		tabs.filter((t) => tabIds.some((id) => _.isEqual(id, t.id)));

		return await this.setTabs(tabs);
	}
}
