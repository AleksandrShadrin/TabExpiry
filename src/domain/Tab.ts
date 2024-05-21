export type TabId = {
	url: string;
	index: number;
};

export default class Tab {
	id: TabId;
	lastInteract: number;

	constructor(id: TabId, lastInteract: number) {
		this.id = id;
		this.lastInteract = lastInteract;
	}

	public isExpired(now: number, expirationTime: number) {
		return now - this.lastInteract > expirationTime;
	}

	public update(time: number) {
		this.lastInteract = time;
	}
}
