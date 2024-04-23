document.addEventListener("click", () => {
	chrome.runtime.sendMessage({ tabUpdated: true });
});

document.addEventListener("scroll", () => {
	chrome.runtime.sendMessage({ tabUpdated: true });
});

document.addEventListener("keydown", () => {
	chrome.runtime.sendMessage({ tabUpdated: true });
});
