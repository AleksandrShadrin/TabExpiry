const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: {
		background: "./src/background.ts",
		content: "./src/content.ts",
		popup: "./src/popup.ts",
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		filename: "[name].js", // Output files will be background.js and content.js
		path: path.resolve(__dirname, "dist"), // Output directory
	},
	plugins: [
		new CopyPlugin({
			patterns: [{ from: "public", to: "." }],
		}),
	],
};
