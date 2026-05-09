/**
 * Scrolls the page to the top if it's currently scrolled down
 * @param {HTMLElement|null} element - The element to scroll, defaults to window
 * @param {boolean} smooth - Whether to use smooth scrolling animation
 * @returns {void}
 */
export function scrollToTop(element = null, smooth = true) {
  const scrollTop = element ? element.scrollTop : (window.scrollY || document.documentElement.scrollTop);

  if (scrollTop > 0) {
    if (element) {
      element.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }
}
