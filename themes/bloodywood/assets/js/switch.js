/* Inspired by https://radu-matei.com/blog/dark-mode/ */

const html = document.querySelector('html');
const darkModeSwitcher = document.getElementById("dark-mode-toggle");
const darkModeIcon = document.getElementById("dark-mode-icon");

darkModeSwitcher.addEventListener("change", (event) => {
  (event.target.checked) ? setTheme("dark") : setTheme("light");
});

function setTheme(mode) {
  localStorage.setItem("dark-mode-storage", mode);

  if (mode === "dark") {
    html.className = 'dark-mode';
    darkModeIcon.className = "fa-solid fa-sun";
  } else if (mode === "light") {
    html.className = 'light-mode';
    darkModeIcon.className = "fa-solid fa-moon";
  }
}

export function loadThemeMode() {
  // the default theme is light
  const savedTheme = localStorage.getItem("dark-mode-storage") || "light";
  darkModeSwitcher.checked = (savedTheme === 'dark');
  setTheme(savedTheme);
}
