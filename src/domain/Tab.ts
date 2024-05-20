export default class Tab {
	id: number;
	lastInteract: number;

	constructor(id: number, lastInteract: number) {
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
