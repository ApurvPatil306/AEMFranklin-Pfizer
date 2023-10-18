export function removeEmptyPTags(element) {
    element.querySelectorAll('p').forEach((p) => {
        if (p.children.length === 0) {
            p.remove();
        }
    });
}
export default function decorate(block) {
    const elementContainer = block.querySelector(':scope > div > div');
    const ImageContainer = document.createElement('div');
    rightBox.classList.add('hero-image-container');
    rightBox.append(elementContainer.querySelector('picture'));
    block.append(ImageContainer);
    const overlayContainer = document.createElement('div');
    overlayContainer.classList.add('hero-content-container');
    overlayContainer.append(...elementContainer.children);
    block.append(overlayContainer);
    elementContainer.parentElement.remove();
    removeEmptyPTags(block);
}
