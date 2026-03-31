let searchTheme = determineComputedTheme();
const ninjaKeys = document.querySelector("ninja-keys");

if (searchTheme === "dark") {
  ninjaKeys.classList.add("dark");
} else {
  ninjaKeys.classList.remove("dark");
}

const openSearchModal = () => {
  const $siteNav = $("#site-nav");
  $siteNav.find(".hidden-links").addClass("hidden");
  $siteNav.find(".greedy-nav__toggle").attr("aria-expanded", "false");
  ninjaKeys.open();
};
