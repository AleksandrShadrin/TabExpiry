// popup.ts

// Save the expiration time setting when the form is submitted
document
	.getElementById("settings-form")!
	.addEventListener("submit", (event) => {
		event.preventDefault();
		const expirationTimeInput = document.getElementById(
			"expiration-time"
		) as HTMLInputElement;
		const expirationTime = parseInt(expirationTimeInput.value, 10) * 60 * 1000; // Convert minutes to milliseconds

		chrome.storage.local.set({ expirationTime }, () => {
			window.close(); // Close the popup after saving
		});
	});

// Load the saved expiration time setting when the popup is opened
window.onload = () => {
	chrome.storage.local.get(["expirationTime"], (result) => {
		const expirationTimeInput = document.getElementById(
			"expiration-time"
		) as HTMLInputElement;

		expirationTimeInput.value = (
			(result.expirationTime || 60 * 1000) /
			(60 * 1000)
		).toFixed(0);
	});
};
