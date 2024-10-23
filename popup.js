document.addEventListener('DOMContentLoaded', () => {
  const searchRows = document.getElementById('searchRows');
  const addRowBtn = document.getElementById('addRow');
  const clearAllBtn = document.getElementById('clearAll');
  const caseSensitiveToggle = document.getElementById('caseSensitiveToggle');
  const resultCount = document.getElementById('resultCount');
  let debounceTimer;

  // Load saved searches and preferences
  chrome.storage.local.get(['searches', 'caseSensitive'], (result) => {
    if (result.searches && result.searches.length > 0) {
      result.searches.forEach(search => addSearchRow(search.term, search.color));
    } else {
      addSearchRow();
    }
    caseSensitiveToggle.checked = result.caseSensitive || false;
    updateCaseSensitivity(result.caseSensitive || false);
  });

  function addSearchRow(term = '', color = getRandomColor()) {
    const row = document.createElement('div');
    row.className = 'search-row';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = 'Enter search term';
    input.value = term;
    
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'color-picker';
    colorPicker.value = color;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    
    removeBtn.addEventListener('click', () => {
      if (searchRows.children.length > 1) {
        row.remove();
        triggerSearch();
      }
    });

    // Debounced search on input
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(triggerSearch, 300);
    });

    colorPicker.addEventListener('change', triggerSearch);
    
    row.appendChild(input);
    row.appendChild(colorPicker);
    row.appendChild(removeBtn);
    searchRows.appendChild(row);
  }

  async function triggerSearch() {
    const searches = Array.from(searchRows.children).map(row => ({
      term: row.querySelector('.search-input').value,
      color: row.querySelector('.color-picker').value
    })).filter(search => search.term.trim() !== '');

    // Save searches
    chrome.storage.local.set({ searches });

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'highlight',
      searches
    }, response => {
      if (response && response.count !== undefined) {
        resultCount.textContent = `${response.count} matches`;
      }
    });
  }

  function updateCaseSensitivity(value) {
    chrome.storage.local.set({ caseSensitive: value });
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'setCaseSensitive',
        value
      });
    });
    triggerSearch();
  }

  addRowBtn.addEventListener('click', () => addSearchRow());

  clearAllBtn.addEventListener('click', () => {
    searchRows.innerHTML = '';
    addSearchRow();
    resultCount.textContent = '';
    chrome.storage.local.remove(['searches']);
    triggerSearch();
  });

  caseSensitiveToggle.addEventListener('change', (e) => {
    updateCaseSensitivity(e.target.checked);
  });

  // Navigation with keyboard
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'navigate',
        direction: e.ctrlKey ? 'prev' : 'next'
      });
    }
  });
});