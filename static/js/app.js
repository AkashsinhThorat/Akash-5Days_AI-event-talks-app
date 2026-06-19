// State management
let allNotes = [];
let filteredNotes = [];
let selectedNotes = new Set(); // Stores note IDs

// DOM Elements
const notesFeed = document.getElementById('notes-feed');
const searchBox = document.getElementById('search-box');
const filterChipsContainer = document.getElementById('filter-chips-container');
const lastFetchedTime = document.getElementById('last-fetched-time');
const refreshBtn = document.getElementById('refresh-btn');
const floatingActionBar = document.getElementById('floating-action-bar');
const selectedCountEl = document.getElementById('selected-count');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const tweetBulkBtn = document.getElementById('tweet-bulk-btn');

// Modal Elements
const tweetDialog = document.getElementById('tweet-dialog');
const modalBackdrop = document.getElementById('modal-backdrop-el');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalShareBtn = document.getElementById('modal-share-btn');
const tweetPreviewText = document.getElementById('tweet-preview-text');
const tweetTextInput = document.getElementById('tweet-text-input');
const tweetCharCounter = document.getElementById('tweet-char-counter');

// Toast Notification helper
function showToast(message, type = 'success') {
    const toastBin = document.getElementById('toast-bin');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `${icon}<span>${message}</span>`;
    toastBin.appendChild(toast);
    
    // Trigger transition
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Fetch Notes from API
async function loadNotes(isRefresh = false) {
    if (isRefresh) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
    }
    
    try {
        const endpoint = isRefresh ? '/api/refresh' : '/api/notes';
        const method = isRefresh ? 'POST' : 'GET';
        
        const response = await fetch(endpoint, { method });
        const data = await response.json();
        
        if (data.success) {
            allNotes = data.entries;
            lastFetchedTime.textContent = data.last_fetched;
            
            // Retain selected notes that still exist in new load
            const updatedSelected = new Set();
            allNotes.forEach(n => {
                if (selectedNotes.has(n.id)) updatedSelected.add(n.id);
            });
            selectedNotes = updatedSelected;
            
            updateFiltersAndCounts();
            renderNotes();
            updateFloatingBar();
            
            if (isRefresh) {
                showToast('Successfully fetched latest release notes!');
            }
        } else {
            showToast(data.error || 'Failed to parse feed data.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error communicating with backend.', 'error');
    } finally {
        if (isRefresh) {
            refreshBtn.classList.remove('refreshing');
            refreshBtn.disabled = false;
        }
    }
}

// Calculate counts for filters
function updateFiltersAndCounts() {
    const counts = {
        all: allNotes.length,
        feature: 0,
        announcement: 0,
        issue: 0,
        deprecation: 0,
        other: 0
    };
    
    allNotes.forEach(note => {
        const typeKey = note.type.toLowerCase();
        if (typeKey in counts) {
            counts[typeKey]++;
        } else {
            counts.other++;
        }
    });
    
    // Update labels in UI
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-feature').textContent = counts.feature;
    document.getElementById('count-announcement').textContent = counts.announcement;
    document.getElementById('count-issue').textContent = counts.issue;
    document.getElementById('count-deprecation').textContent = counts.deprecation;
    document.getElementById('count-other').textContent = counts.other;
}

// Get the current active filter type
function getActiveFilter() {
    const activeChip = filterChipsContainer.querySelector('.chip.active');
    return activeChip ? activeChip.getAttribute('data-filter') : 'all';
}

// Render filtered notes
function renderNotes() {
    const filter = getActiveFilter();
    const query = searchBox.value.toLowerCase().trim();
    
    // Apply filters
    filteredNotes = allNotes.filter(note => {
        // Type filter match
        let matchesType = false;
        if (filter === 'all') {
            matchesType = true;
        } else if (filter === 'other') {
            const standardTypes = ['feature', 'announcement', 'issue', 'deprecation'];
            matchesType = !standardTypes.includes(note.type.toLowerCase());
        } else {
            matchesType = note.type.toLowerCase() === filter;
        }
        
        // Search query match (search within Date, Type, Content text)
        const textToSearch = `${note.date} ${note.type} ${note.content_text}`.toLowerCase();
        const matchesQuery = textToSearch.includes(query);
        
        return matchesType && matchesQuery;
    });
    
    // Clear feed
    notesFeed.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesFeed.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No updates found</h3>
                <p>Try clearing your search query or choosing a different filter category.</p>
            </div>
        `;
        return;
    }
    
    // Create elements
    filteredNotes.forEach(note => {
        const isSelected = selectedNotes.has(note.id);
        const typeClass = getBadgeClass(note.type);
        
        const card = document.createElement('article');
        card.className = `note-card ${isSelected ? 'selected' : ''}`;
        card.dataset.id = note.id;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="badge ${typeClass}">${note.type}</span>
                    <span class="card-date">${note.date}</span>
                </div>
                <div class="card-select-btn" title="Select to Tweet">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>
            <div class="card-body">
                ${note.content_html}
            </div>
            <div class="card-footer">
                <a href="${note.url}" target="_blank" class="card-source-link">
                    <span>Release Docs</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm single-tweet-btn" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: var(--radius-sm);">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Tweet</span>
                    </button>
                </div>
            </div>
        `;
        
        // Setup card interactions
        // Click on checkbox / toggle select
        const selectBtn = card.querySelector('.card-select-btn');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelectNote(note.id);
        });
        
        // Single card tweet button click
        const tweetBtn = card.querySelector('.single-tweet-btn');
        tweetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTweetModal([note]);
        });
        
        // Clicking anywhere on card toggles it (makes selecting easy and tactile)
        card.addEventListener('click', () => {
            toggleSelectNote(note.id);
        });
        
        notesFeed.appendChild(card);
    });
}

// Get Badge CSS class based on release type
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t === 'feature') return 'badge-feature';
    if (t === 'announcement') return 'badge-announcement';
    if (t === 'issue') return 'badge-issue';
    if (t === 'deprecation') return 'badge-deprecation';
    return 'badge-other';
}

// Toggle item selection
function toggleSelectNote(id) {
    if (selectedNotes.has(id)) {
        selectedNotes.delete(id);
    } else {
        selectedNotes.add(id);
    }
    
    // Rerender specific card or class list to avoid fully re-rendering HTML
    const card = document.querySelector(`.note-card[data-id="${id}"]`);
    if (card) {
        card.classList.toggle('selected');
    }
    
    updateFloatingBar();
}

// Update state of floating bar
function updateFloatingBar() {
    const count = selectedNotes.size;
    selectedCountEl.textContent = count;
    
    if (count > 0) {
        floatingActionBar.classList.add('active');
    } else {
        floatingActionBar.classList.remove('active');
    }
}

// Clear selected items
function clearSelection() {
    selectedNotes.clear();
    const cards = document.querySelectorAll('.note-card');
    cards.forEach(c => c.classList.remove('selected'));
    updateFloatingBar();
}

// Open Composer Modal
function openTweetModal(notesToShare) {
    if (notesToShare.length === 0) return;
    
    let previewText = '';
    let defaultTweet = '';
    
    if (notesToShare.length === 1) {
        const note = notesToShare[0];
        previewText = `[${note.date}] ${note.content_text}`;
        
        // Create an smart-truncated tweet draft
        const dateStr = note.date;
        const cleanContent = cleanTextForTweet(note.content_text);
        
        // Construct the draft:
        // "BigQuery [Type] ([Date]): [Summary] #GoogleCloud #BigQuery [Link]"
        const prefix = `BigQuery ${note.type} (${dateStr}): `;
        const suffix = ` #BigQuery #GoogleCloud`;
        const link = `\n\nDocs: ${note.url}`;
        
        const availableLength = 280 - prefix.length - suffix.length - link.length;
        
        let summary = cleanContent;
        if (summary.length > availableLength) {
            summary = summary.substring(0, availableLength - 3) + '...';
        }
        
        defaultTweet = `${prefix}${summary}${link}${suffix}`;
    } else {
        // Bulk selection sharing
        previewText = `${notesToShare.length} updates selected:\n` + 
            notesToShare.map(n => `- [${n.date}] ${n.type}: ${n.content_text.substring(0, 60)}...`).join('\n');
            
        // Construct bulk summary
        const dateRange = getNoteDateRange(notesToShare);
        const hashtags = ` #BigQuery #GoogleCloud`;
        const url = `\n\nFeed: https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`;
        const listText = notesToShare.map(n => `- ${n.type}: ${cleanTextForTweet(n.content_text)}`).join('\n');
        
        const prefix = `Latest BigQuery Updates (${dateRange}):\n`;
        const availableLength = 280 - prefix.length - hashtags.length - url.length;
        
        let body = listText;
        if (body.length > availableLength) {
            body = body.substring(0, availableLength - 3) + '...';
        }
        
        defaultTweet = `${prefix}${body}${url}${hashtags}`;
    }
    
    // Set UI
    tweetPreviewText.textContent = previewText;
    tweetTextInput.value = defaultTweet;
    
    updateCharCount();
    
    // Open Dialog
    tweetDialog.classList.add('active');
    tweetTextInput.focus();
}

// Clean details for tweet text (remove double spaces, keep it short)
function cleanTextForTweet(text) {
    // Strip type prefix if present
    let clean = text.replace(/^(Feature|Announcement|Issue|Deprecation):\s*/i, '');
    
    // Remove references to tags/URLs that look like "text (url)" to make tweets cleaner
    clean = clean.replace(/ \((http|https):\/\/[^\)]+\)/g, '');
    
    // Replace newline blocks with spaces/single newlines
    clean = clean.replace(/\n+/g, ' ');
    
    return clean;
}

// Find Date range for multiple updates
function getNoteDateRange(notes) {
    const dates = notes.map(n => new Date(n.date)).sort((a,b) => a - b);
    if (dates.length === 0) return 'Recent';
    
    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (dates.length === 1) return formatDate(dates[0]);
    
    const minDate = formatDate(dates[0]);
    const maxDate = formatDate(dates[dates.length - 1]);
    
    if (minDate === maxDate) return minDate;
    return `${minDate} - ${maxDate}`;
}

// Close Modal
function closeTweetModal() {
    tweetDialog.classList.remove('active');
}

// Character counter update
function updateCharCount() {
    const len = tweetTextInput.value.length;
    tweetCharCounter.textContent = `${len} / 280`;
    
    // Visual indicators
    tweetCharCounter.className = 'char-counter';
    if (len > 260 && len <= 280) {
        tweetCharCounter.classList.add('warning');
    } else if (len > 280) {
        tweetCharCounter.classList.add('danger');
    }
    
    // Enable/disable share button
    modalShareBtn.disabled = len > 280 || len === 0;
}

// Handle Tweet Submission (Twitter Intent)
function submitTweet() {
    const tweetText = tweetTextInput.value;
    if (!tweetText || tweetText.length > 280) return;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
    
    showToast('Redirected to Twitter/X to post your update!');
    closeTweetModal();
    clearSelection();
}

// Set up event listeners
function init() {
    // Refresh button click
    refreshBtn.addEventListener('click', () => loadNotes(true));
    
    // Search event
    searchBox.addEventListener('input', renderNotes);
    
    // Filter chip clicks
    filterChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        // Set active chip
        filterChipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Render
        renderNotes();
    });
    
    // Floating bar buttons
    clearSelectionBtn.addEventListener('click', clearSelection);
    tweetBulkBtn.addEventListener('click', () => {
        // Collect selected notes object
        const selectedObjList = allNotes.filter(n => selectedNotes.has(n.id));
        openTweetModal(selectedObjList);
    });
    
    // Modal actions
    modalCloseBtn.addEventListener('click', closeTweetModal);
    modalCancelBtn.addEventListener('click', closeTweetModal);
    modalBackdrop.addEventListener('click', closeTweetModal);
    tweetTextInput.addEventListener('input', updateCharCount);
    modalShareBtn.addEventListener('click', submitTweet);
    
    // Load initial data
    loadNotes();
}

// Initialise App
document.addEventListener('DOMContentLoaded', init);
