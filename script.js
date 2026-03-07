document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Animate hamburger to X
            const spans = menuBtn.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Close mobile menu when a link is clicked
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const spans = menuBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    initializeImageTool();
});

async function fetchImageAsBlob(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Could not load image content');
    }
    return response.blob();
}

function setPreview(imgEl, placeholderEl, src) {
    imgEl.src = src;
    imgEl.classList.add('visible');
    placeholderEl.style.display = 'none';
}

function clearPreview(imgEl, placeholderEl) {
    imgEl.removeAttribute('src');
    imgEl.classList.remove('visible');
    placeholderEl.style.display = 'block';
}

function setDownloadState(downloadBtn, enabled, url = null) {
    if (enabled && url) {
        downloadBtn.href = url;
        downloadBtn.classList.remove('disabled');
        downloadBtn.setAttribute('aria-disabled', 'false');
        return;
    }

    downloadBtn.href = '#';
    downloadBtn.classList.add('disabled');
    downloadBtn.setAttribute('aria-disabled', 'true');
}

function renderWikimediaResults(container, results, onSelect) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<p class="preview-placeholder">No Wikimedia images found for that search.</p>';
        return;
    }

    results.forEach(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wikimedia-result-item';
        button.dataset.imageUrl = item.url;

        const thumb = document.createElement('img');
        thumb.src = item.thumbUrl || item.url;
        thumb.alt = item.title;

        const label = document.createElement('span');
        label.textContent = item.title;

        button.append(thumb, label);
        button.addEventListener('click', () => onSelect(item, button));
        container.appendChild(button);
    });
}

function applyOutlineToBlob(cutoutBlob, outlineColor, outlineThickness) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(cutoutBlob);
        const image = new Image();

        image.onload = () => {
            const width = image.naturalWidth;
            const height = image.naturalHeight;
            const tintCanvas = document.createElement('canvas');
            const finalCanvas = document.createElement('canvas');
            tintCanvas.width = width;
            tintCanvas.height = height;
            finalCanvas.width = width;
            finalCanvas.height = height;

            const tintCtx = tintCanvas.getContext('2d');
            const finalCtx = finalCanvas.getContext('2d');

            tintCtx.drawImage(image, 0, 0);
            tintCtx.globalCompositeOperation = 'source-in';
            tintCtx.fillStyle = outlineColor;
            tintCtx.fillRect(0, 0, width, height);
            tintCtx.globalCompositeOperation = 'source-over';

            const steps = Math.max(16, Math.round(12 + outlineThickness * 2));
            for (let step = 0; step < steps; step += 1) {
                const angle = (Math.PI * 2 * step) / steps;
                const x = Math.cos(angle) * outlineThickness;
                const y = Math.sin(angle) * outlineThickness;
                finalCtx.drawImage(tintCanvas, x, y);
            }

            finalCtx.drawImage(image, 0, 0);
            finalCanvas.toBlob(blob => {
                URL.revokeObjectURL(objectUrl);
                if (!blob) {
                    reject(new Error('Could not generate outlined image'));
                    return;
                }
                resolve(blob);
            }, 'image/png');
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not decode processed image'));
        };

        image.src = objectUrl;
    });
}

function resolveBackgroundRemovalFunction(moduleNamespace) {
    const candidates = [
        moduleNamespace?.default,
        moduleNamespace?.removeBackground,
        moduleNamespace?.default?.removeBackground,
        moduleNamespace?.default?.default
    ];

    const resolved = candidates.find(candidate => typeof candidate === 'function');
    if (resolved) {
        return resolved;
    }

    const exportedKeys = Object.keys(moduleNamespace || {});
    throw new Error(
        `Could not find a compatible remover export (found: ${exportedKeys.join(', ') || 'none'})`
    );
}

function initializeImageTool() {
    const localInput = document.getElementById('local-image-input');
    const wikiQueryInput = document.getElementById('wikimedia-query');
    const wikiSearchButton = document.getElementById('wikimedia-search-btn');
    const wikiResultsContainer = document.getElementById('wikimedia-results');
    const outlineEnabledInput = document.getElementById('outline-enabled');
    const outlineColorInput = document.getElementById('outline-color');
    const outlineThicknessInput = document.getElementById('outline-thickness');
    const outlineThicknessValue = document.getElementById('outline-thickness-value');
    const processButton = document.getElementById('process-image-btn');
    const downloadButton = document.getElementById('download-processed-btn');
    const statusText = document.getElementById('image-tool-status');
    const sourcePreview = document.getElementById('source-preview');
    const sourcePlaceholder = document.getElementById('source-placeholder');
    const processedPreview = document.getElementById('processed-preview');
    const processedPlaceholder = document.getElementById('processed-placeholder');

    if (
        !localInput || !wikiQueryInput || !wikiSearchButton || !wikiResultsContainer ||
        !outlineEnabledInput || !outlineColorInput || !outlineThicknessInput || !outlineThicknessValue ||
        !processButton || !downloadButton || !statusText || !sourcePreview || !sourcePlaceholder ||
        !processedPreview || !processedPlaceholder
    ) {
        return;
    }

    let selectedImageSource = null;
    let selectedImageLabel = '';
    let activeResultButton = null;
    let processedObjectUrl = null;
    let backgroundRemovalFn = null;
    let localSourceObjectUrl = null;

    const releasePreviousResult = () => {
        if (processedObjectUrl) {
            URL.revokeObjectURL(processedObjectUrl);
            processedObjectUrl = null;
        }
        setDownloadState(downloadButton, false);
        clearPreview(processedPreview, processedPlaceholder);
    };

    const chooseSource = (sourceUrl, label) => {
        selectedImageSource = sourceUrl;
        selectedImageLabel = label;
        setPreview(sourcePreview, sourcePlaceholder, sourceUrl);
        releasePreviousResult();
        statusText.textContent = `Selected image: ${label}`;
    };

    localInput.addEventListener('change', event => {
        const [file] = event.target.files || [];
        if (!file) {
            return;
        }

        if (activeResultButton) {
            activeResultButton.classList.remove('active');
            activeResultButton = null;
        }

        if (localSourceObjectUrl) {
            URL.revokeObjectURL(localSourceObjectUrl);
            localSourceObjectUrl = null;
        }

        const localObjectUrl = URL.createObjectURL(file);
        localSourceObjectUrl = localObjectUrl;
        chooseSource(localObjectUrl, file.name);
    });

    outlineThicknessInput.addEventListener('input', () => {
        outlineThicknessValue.textContent = `${outlineThicknessInput.value}px`;
    });

    wikiSearchButton.addEventListener('click', async () => {
        const query = wikiQueryInput.value.trim();
        if (!query) {
            statusText.textContent = 'Enter a Wikimedia search term first.';
            return;
        }

        statusText.textContent = 'Searching Wikimedia Commons...';
        wikiResultsContainer.innerHTML = '';

        try {
            const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=320`;
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Wikimedia request failed');
            }

            const data = await response.json();
            const pages = Object.values(data?.query?.pages || {});
            const results = pages
                .map(page => {
                    const info = page.imageinfo && page.imageinfo[0];
                    if (!info || !info.url || !info.mime || !info.mime.startsWith('image/')) {
                        return null;
                    }
                    return {
                        title: (page.title || 'Wikimedia image').replace(/^File:/, ''),
                        url: info.url,
                        thumbUrl: info.thumburl || info.url
                    };
                })
                .filter(Boolean);

            renderWikimediaResults(wikiResultsContainer, results, (selectedItem, button) => {
                if (activeResultButton) {
                    activeResultButton.classList.remove('active');
                }
                activeResultButton = button;
                activeResultButton.classList.add('active');

                if (localSourceObjectUrl) {
                    URL.revokeObjectURL(localSourceObjectUrl);
                    localSourceObjectUrl = null;
                }

                chooseSource(selectedItem.url, selectedItem.title);
            });

            statusText.textContent = results.length > 0
                ? 'Pick one of the Wikimedia images to use as your source.'
                : 'No usable image results returned from Wikimedia.';
        } catch (error) {
            statusText.textContent = `Wikimedia search failed: ${error.message}`;
        }
    });

    processButton.addEventListener('click', async () => {
        if (!selectedImageSource) {
            statusText.textContent = 'Please upload or select a source image first.';
            return;
        }

        processButton.disabled = true;
        processButton.textContent = 'Processing...';
        releasePreviousResult();

        try {
            if (!backgroundRemovalFn) {
                statusText.textContent = 'Loading background removal model (first run can take longer)...';
                const module = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm');
                backgroundRemovalFn = resolveBackgroundRemovalFunction(module);
            }

            statusText.textContent = `Removing background from: ${selectedImageLabel}`;
            const sourceBlob = await fetchImageAsBlob(selectedImageSource);
            let outputBlob = await backgroundRemovalFn(sourceBlob);

            if (outlineEnabledInput.checked) {
                statusText.textContent = 'Applying object outline...';
                outputBlob = await applyOutlineToBlob(
                    outputBlob,
                    outlineColorInput.value,
                    Number(outlineThicknessInput.value)
                );
            }

            processedObjectUrl = URL.createObjectURL(outputBlob);
            setPreview(processedPreview, processedPlaceholder, processedObjectUrl);
            setDownloadState(downloadButton, true, processedObjectUrl);
            statusText.textContent = 'Done. Your isolated object is ready to download.';
        } catch (error) {
            statusText.textContent = `Processing failed: ${error.message}`;
        } finally {
            processButton.disabled = false;
            processButton.textContent = 'Remove Background';
        }
    });

    window.addEventListener('beforeunload', () => {
        if (processedObjectUrl) {
            URL.revokeObjectURL(processedObjectUrl);
        }
        if (localSourceObjectUrl) {
            URL.revokeObjectURL(localSourceObjectUrl);
        }
    });
}
