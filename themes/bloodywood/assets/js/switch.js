const html = document.querySelector('html');
const darkModeSwitcher = document.getElementById("dark-mode-toggle");
const darkModeIcon = document.getElementById("dark-mode-icon");

darkModeSwitcher.addEventListener("change", (event) => {
  const mode = (event.target.checked) ? 'dark' : 'light';
  setTheme(mode);
  localStorage.setItem("theme", mode);
});

function setTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  darkModeIcon.className = mode === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

export function initTheme() {
  let mode = localStorage.getItem('theme');
  if (!mode) {
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      function getModeFromMediaQuery() {
        return darkModeMediaQuery.matches ? 'dark' : 'light';
      }

      mode = getModeFromMediaQuery();

      darkModeMediaQuery.addEventListener('change', () => {
        if (!localStorage.getItem('theme')) {
          const newMode = getModeFromMediaQuery();
          setTheme(newMode);
          darkModeSwitcher.checked = (newMode === 'dark');
        }
      });
    } else {
      mode = 'light';
    }
  }
  setTheme(mode);
  darkModeSwitcher.checked = (mode === 'dark');
}
