let highlights = [];
let currentHighlightIndex = -1;
let isCaseSensitive = false;

// Generate random color
function getRandomColor() {
  const colors = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#B5B9FF', '#E0BBE4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlight') {
    clearHighlights();
    request.searches.forEach(search => highlightText(search.term, search.color));
    sendResponse({ count: highlights.length });
  } else if (request.action === 'navigate') {
    navigateHighlights(request.direction);
  } else if (request.action === 'setCaseSensitive') {
    isCaseSensitive = request.value;
  }
});

function clearHighlights() {
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    }
  });
  highlights = [];
  currentHighlightIndex = -1;
}

function navigateHighlights(direction) {
  if (highlights.length === 0) return;

  // Remove active class from current highlight
  if (currentHighlightIndex >= 0) {
    highlights[currentHighlightIndex].classList.remove('active-highlight');
  }

  // Update index based on direction
  if (direction === 'next') {
    currentHighlightIndex = (currentHighlightIndex + 1) % highlights.length;
  } else {
    currentHighlightIndex = currentHighlightIndex <= 0 ? highlights.length - 1 : currentHighlightIndex - 1;
  }

  // Add active class to new current highlight and scroll into view
  const currentHighlight = highlights[currentHighlightIndex];
  currentHighlight.classList.add('active-highlight');
  currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function highlightText(searchText, color) {
  if (!searchText) return;
  
  const flags = isCaseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapeRegExp(searchText), flags);
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.parentNode.nodeName !== 'SCRIPT' &&
               node.parentNode.nodeName !== 'STYLE' &&
               node.parentNode.nodeName !== 'NOSCRIPT' &&
               !node.parentNode.classList.contains('multi-search-highlight')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(textNode => {
    const matches = textNode.textContent.match(regex);
    if (!matches) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(textNode.textContent)) !== null) {
      const beforeText = textNode.textContent.slice(lastIndex, match.index);
      if (beforeText) {
        fragment.appendChild(document.createTextNode(beforeText));
      }

      const highlight = document.createElement('mark');
      highlight.className = 'multi-search-highlight';
      highlight.style.backgroundColor = color;
      highlight.style.color = getContrastColor(color);
      highlight.textContent = match[0];
      fragment.appendChild(highlight);
      highlights.push(highlight);

      lastIndex = regex.lastIndex;
    }

    const afterText = textNode.textContent.slice(lastIndex);
    if (afterText) {
      fragment.appendChild(document.createTextNode(afterText));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getContrastColor(hexcolor) {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}