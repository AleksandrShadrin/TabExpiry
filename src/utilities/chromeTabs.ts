import { TabId } from "../domain/Tab";

export function convertToId(tab: chrome.tabs.Tab): TabId {
	return {
		index: tab.index,
		url: tab.url,
	};
}
