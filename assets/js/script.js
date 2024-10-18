document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.clickable-card');
    const searchInput = document.querySelector('.search-wrapper input');
    const searchButton = document.querySelector('.search-wrapper button');

    cards.forEach(card => {
        card.addEventListener('click', handleCardClick);
        const visitSiteBtn = card.querySelector('.visit-site');
        if (visitSiteBtn) {
            visitSiteBtn.addEventListener('click', handleCardClick);
        }
    });
    searchInput.addEventListener('input', performSearch);
    searchButton.addEventListener('click', performSearch);

    async function handleCardClick(event) {
        event.preventDefault();
        const card = event.target.closest('.clickable-card');
        const urlsData = JSON.parse(card.dataset.urls);
        const cardTitle = card.querySelector('.card-title').textContent;
        const sortedUrls = urlsData.sort((a, b) => a.priority - b.priority);

        showLoadingIndicator();

        try {
            const availableUrl = await checkUrlsInOrder(sortedUrls);
            window.open(availableUrl, '_blank');
        } catch (error) {
            console.error('All URLs failed:', error);
            showErrorMessage(cardTitle);
        } finally {
            hideLoadingIndicator();
        }
    }

    async function checkUrlsInOrder(urls) {
        for (const urlData of urls) {
            try {
                const availableUrl = await checkUrl(urlData.url);
                return availableUrl;
            } catch (error) {
                console.error(`URL ${urlData.url} failed:`, error);
            }
        }
        throw new Error('All URLs failed');
    }

    async function checkUrl(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            // Try HTTPS first
            const httpsUrl = url.startsWith('http') ? url : `https://${url}`;
            const response = await fetch(httpsUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return httpsUrl;
        } catch (httpsError) {
            // If HTTPS fails, try HTTP
            try {
                const httpUrl = url.startsWith('http') ? url.replace('https://', 'http://') : `http://${url}`;
                const response = await fetch(httpUrl, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return httpUrl;
            } catch (httpError) {
                clearTimeout(timeoutId);
                throw httpError;
            }
        }
    }

    function showLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loadingIndicator);
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    function showErrorMessage(cardTitle) {
        const errorMessage = `
            <div class="error-modal">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle error-icon"></i>
                    <h2>Server Unavailable</h2>
                    <p>We apologize, but the ${cardTitle} servers are currently unreachable. This may be due to maintenance or temporary technical issues.</p>
                    <p>Please try again later. If the problem persists, contact our support team.</p>
                    <button onclick="this.closest('.error-modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', errorMessage);
    }

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let foundMatch = false;
        const cardContainer = document.querySelector('.row-cols-1');
        const cols = cardContainer.querySelectorAll('.col');

        cols.forEach(col => {
            const card = col.querySelector('.card');
            const cardTitle = card.querySelector('.card-title').textContent.toLowerCase();
            if (cardTitle.includes(searchTerm)) {
                col.style.display = 'flex';
                foundMatch = true;
            } else {
                col.style.display = 'none';
            }
        });

        let noResultsMessage = document.getElementById('no-results-message');
        if (!foundMatch) {
            if (!noResultsMessage) {
                noResultsMessage = document.createElement('div');
                noResultsMessage.id = 'no-results-message';
                noResultsMessage.className = 'alert alert-info mt-4 text-center';
                noResultsMessage.textContent = 'No matching websites found. Please try a different search term.';
                cardContainer.insertAdjacentElement('beforebegin', noResultsMessage);
            }
        } else if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }

    function setCardIcon(card, iconClass, imageSrc) {
        const iconWrapper = card.querySelector('.card-icon-wrapper');
        const faIcon = iconWrapper.querySelector('i.card-icon');
        const imgIcon = iconWrapper.querySelector('img.card-icon');

        if (imageSrc) {
            faIcon.classList.add('d-none');
            imgIcon.classList.remove('d-none');
            imgIcon.src = imageSrc;
            imgIcon.alt = card.querySelector('.card-title').textContent;
        } else {
            faIcon.classList.remove('d-none');
            imgIcon.classList.add('d-none');
            faIcon.className = `card-icon ${iconClass}`;
        }
    }
    document.querySelectorAll('.card').forEach(card => {
        const iconData = card.dataset.icon;
        if (iconData) {
            const { class: iconClass, src: imageSrc } = JSON.parse(iconData);
            setCardIcon(card, iconClass, imageSrc);
        }
    });
});
