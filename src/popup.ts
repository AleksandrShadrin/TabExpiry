// popup.ts

document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("settings-form") as HTMLFormElement;
	const weeksInput = document.getElementById(
		"expiration-weeks"
	) as HTMLInputElement;
	const daysInput = document.getElementById(
		"expiration-days"
	) as HTMLInputElement;
	const hoursInput = document.getElementById(
		"expiration-hours"
	) as HTMLInputElement;
	const minutesInput = document.getElementById(
		"expiration-minutes"
	) as HTMLInputElement;

	chrome.storage.local.get(["expirationTime"], (result) => {
		const totalMinutes = (result.expirationTime || 0) / 60000;

		const weeks = Math.floor(totalMinutes / (7 * 24 * 60));
		const days = Math.floor((totalMinutes - weeks * 7 * 24 * 60) / (24 * 60));
		const hours = Math.floor(
			(totalMinutes - days * 24 * 60 - weeks * 7 * 24 * 60) / 60
		);
		const minutes = totalMinutes % 60;

		weeksInput.value = weeks.toString();
		daysInput.value = days.toString();
		hoursInput.value = hours.toString();
		minutesInput.value = minutes.toString();
	});

	// Save the expiration time setting when the form is submitted
	form.addEventListener("submit", (event) => {
		event.preventDefault();

		const weeks = parseInt(weeksInput.value, 10);
		const days = parseInt(daysInput.value, 10);
		const hours = parseInt(hoursInput.value, 10);
		const minutes = parseInt(minutesInput.value, 10);

		const expirationTime =
			(weeks * 7 * 24 * 60 + days * 24 * 60 + hours * 60 + minutes) * 60 * 1000;

		chrome.storage.local.set({ expirationTime }, () => {
			window.close();
		});
	});
});
