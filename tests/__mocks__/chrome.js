// __mocks__/chrome.ts

const storageMock = {
	local: {
		get: jest.fn((keys, callback) => {
			callback({});
		}),
		set: jest.fn((obj, callback) => {
			callback();
		}),
	},
};

const tabsMock = {
	remove: jest.fn((tabId, callback) => {
		callback();
	}),
};

global.chrome = {
	storage: storageMock,
	tabs: tabsMock,
	runtime: {
		lastError: null,
	},
};

export default global.chrome;
