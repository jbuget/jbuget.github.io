const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const themeSwitcherMenuToggle = document.querySelector('.theme-switcher-menu__toggle');
const themeSwitcherMenuList = document.querySelector('.theme-switcher-menu__list');
const themeSwitchMenuButtons = document.querySelectorAll('.theme-switcher-menu__button');
const themeMenuToggleIcon = document.getElementById('theme-switcher-menu__icon');

darkModeMediaQuery.onchange = () => {
  if (!localStorage.getItem('theme')) {
    const newMode = getModeFromMediaQuery();
    setTheme(newMode);
  }
};

function getCurrentMode() {
  if (!localStorage.getItem('theme')) {
    return 'os-default';
  }
  return localStorage.getItem('theme');
}

function getModeFromMediaQuery() {
  return darkModeMediaQuery.matches ? 'dark' : 'light';
}

function setToggleIcon(mode) {
  let className;
  if (mode === 'os-default') {
    className = 'fa-solid fa-circle-half-stroke'
  } else {
    if (mode === 'light') {
      className = 'fa-solid fa-sun'
    } else {
      className = 'fa-solid fa-moon'
    }
  }
  themeMenuToggleIcon.className = className;
}

function setTheme(mode) {
  let theme;
  if (mode === 'os-default') {
    theme = getModeFromMediaQuery();
  } else {
    /* mode = ['light'|'dark'] */
    theme = mode;
  }
  document.documentElement.setAttribute('data-theme', theme);
}

function setActiveOption(mode) {
  themeSwitchMenuButtons.forEach((e) => {
    if (e.getAttribute('data-theme-option') === mode) {
      e.classList.add('active');
    } else {
      e.classList.remove('active');
    }
  });
}

export function initTheme() {
  let mode = localStorage.getItem('theme') || 'os-default';
  setTheme(mode);
  setToggleIcon(mode);
  setActiveOption(mode);
}

themeSwitcherMenuToggle.addEventListener('click', () => {
  if (themeSwitcherMenuList.classList.contains('hidden')) {
    themeSwitcherMenuList.classList.remove('hidden');
  } else {
    themeSwitcherMenuList.classList.add('hidden');
  }
});

themeSwitchMenuButtons.forEach((element) => {
  element.addEventListener('click', () => {
    themeSwitcherMenuList.classList.add('hidden');

    if (element.getAttribute('data-theme-option') !== getCurrentMode()) {
      const targetMode = element.getAttribute('data-theme-option');
      if (targetMode === 'os-default') {
        localStorage.removeItem('theme');
        initTheme();
      } else {
        localStorage.setItem('theme', targetMode);
        setTheme(targetMode);
        setToggleIcon(targetMode);
        setActiveOption(targetMode);
      }
    }
  });
});

document.addEventListener('click', (event) => {
  /* If menu is displayed… */
  if (!themeSwitcherMenuList.classList.contains('hidden')) {
    const clickedElement = event.target;
    /* … and we click outside the menu component… */
    if (clickedElement.closest('.theme-switcher-menu') === null) {
      /* … then we close it */
      themeSwitcherMenuList.classList.add('hidden');
    }
  }
});
