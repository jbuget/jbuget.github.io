/*
 * On déclare les éléments HTML dont nous aurons besoin tout au long du composant.
 *
 * Ça consomme un peu d'espace mémoire, mais honnêtement, ça passe.
 *
 * Par ailleurs, comme le script est chargé en `defer`, on est sûr que le DOM est complètement chargé et analysé.
 * Donc que les éléments requis sont présents.
 */

/*
 * Variable un peu particulière du type mediaquerylist
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList
 */
const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const themeSwitcherMenuToggle = document.querySelector('.theme-switcher-menu__toggle');
const themeSwitcherMenuList = document.querySelector('.theme-switcher-menu__list');
const themeSwitchMenuButtons = document.querySelectorAll('.theme-switcher-menu__button');
/* Peut-être que ce serait mieux de passer par un sélecteur de classe pour être */
const themeMenuToggleIcon = document.getElementById('theme-switcher-menu__icon');

function getCurrentMode() {
  if (!localStorage.getItem('theme')) {
    return 'os-default';
  }
  return localStorage.getItem('theme');
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
    theme = darkModeMediaQuery.matches ? 'dark' : 'light';
  } else {
    theme = mode;
  }
  document.documentElement.setAttribute('data-theme', theme);
}

function setActiveOption(mode) {
  themeSwitchMenuButtons.forEach((event) => {
    if (event.getAttribute('data-theme-option') === mode) {
      event.classList.add('active');
    } else {
      event.classList.remove('active');
    }
  });
}

export function initTheme() {
  let mode = localStorage.getItem('theme') || 'os-default';
  setTheme(mode);
  setToggleIcon(mode);
  setActiveOption(mode);
}

darkModeMediaQuery.addEventListener('change', () => {
  /* On empêche l'adaptation des préférences dans le cas où on a forcé un mode ou l'autre (via le `localStorage` */
  if (!localStorage.getItem('theme')) {
    setTheme('os-default');
  }
});

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
