module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	transform: {
		"^.+\\.ts$": "ts-jest",
		"^.+\\.js$": "babel-jest",
	},
	moduleFileExtensions: ["ts", "js"],
	setupFiles: ["<rootDir>/tests/__mocks__/chrome.js"],
};
