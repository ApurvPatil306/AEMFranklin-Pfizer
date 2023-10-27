
import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';
const isDesktop = window.matchMedia('(min-width: 768px)');
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const sections = nav.querySelector('.nav-sections');
    const navSectionExpanded = sections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllSections(sections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, sections);
      nav.querySelector('button').focus();
    }
  }
}
function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li.nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} sections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, sections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (!expanded && !isDesktop.matches) {
    const announcement = document.querySelector('body > aside.announcement');
    const height = window.innerHeight - (announcement ? announcement.offsetHeight : 0);
    nav.style.height = `${height}px`;
  } else {
    nav.removeAttribute('style');
  }
  toggleAllSections(sections, !expanded || isDesktop.matches ? 'false' : 'true');
  const button = nav.querySelector('.nav-hamburger button');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = sections.querySelectorAll('.nav-drop');
  navDrops.forEach((drop) => {
    if (!drop.hasAttribute('tabindex')) {
      drop.setAttribute('role', 'button');
      drop.setAttribute('tabindex', 0);
      drop.addEventListener('focus', focusNavSection);
    }
  });
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'menu' , 'support'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    // decorate brand
    const brand = nav.querySelector('.nav-brand');
    if (brand) {
      const a = document.createElement('a');
      a.href = '/';
      a.append(...brand.children);
      brand.append(a);
    }

    // decorate dropdown navigation
    const sections = nav.querySelector('.nav-sections');
    if (sections) {
      sections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) {
          navSection.classList.add('nav-drop');
          const drop = navSection.querySelector('ul');
          drop.remove();
          const navText = document.createElement('span');
          navText.innerHTML = navSection.innerHTML.trim();
          navSection.innerHTML = '';
          navSection.append(navText, drop);
        }
        navSection.addEventListener('click', () => {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllSections(sections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      });
      const as = [...sections.querySelectorAll('a[href]')];
      const current = as.find((a) => {
        const { pathname } = new URL(a.href);
        return pathname === window.location.pathname;
      });
      if (current) {
        current.setAttribute('aria-current', 'page');
        const currentDrop = current.closest('.nav-drop');
        if (currentDrop) {
          currentDrop.setAttribute('aria-expanded', true);
        }
      }
    }
    // build utility links from menu for mobile
    const menu = nav.querySelector('.nav-menu');
    if (menu) {
      const bold = menu.querySelectorAll('li');
      if (bold) {
        const utility = document.createElement('div');
        utility.className = 'nav-utility';
        const ul = document.createElement('ul');
        const lis = [...bold].map((b) => b.closest('li'));
        lis.forEach((li) => {
          const a = li.querySelector('a[href]');
          // remove unnecessary styling
          const cleanA = document.createElement('a');
          cleanA.href = a.href;
          cleanA.textContent = a.textContent;
          li.innerHTML = cleanA.outerHTML;
          li.className = 'nav-utility-link';
          // add to utility section for mobile
          const utilityLi = document.createElement('li');
          utilityLi.append(cleanA);
          ul.append(utilityLi);
        });
        if (utility.hasChildNodes) {
          utility.append(ul);
          nav.prepend(utility);
        }
      }
    }
    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, sections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, sections, isDesktop.matches);
    // open current nav section
    const current = nav.querySelector('[aria-current]');
    if (current) {
      const currentDrop = current.closest('.nav-drop');
      if (currentDrop) currentDrop.setAttribute('aria-expanded', true);
    }
    isDesktop.addEventListener('change', () => toggleMenu(nav, sections, isDesktop.matches));

    decorateIcons(nav);
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.innerHTML = '';
    block.append(navWrapper);
  }
}
