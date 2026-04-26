// ============================================================
//  CART.JS — logika koszyka
//  Zawiera: stan koszyka (cart, previousCartItemCount),
//  operacje na koszyku (add/remove/update quantity),
//  obliczanie rabatów, renderowanie koszyka oraz modala podsumowania.
//
//  Zależności zewnętrzne (muszą być dostępne w runtime gdy funkcje są
//  wywoływane — czyli po załadowaniu głównego skryptu index.html):
//    • DOM: cartPanel, cartPanelOverlay, cartItemsContainer,
//           cartEmptyMessage, cartTotalPrice, cartCheckoutButton,
//           cartBadges, mobileCartButton, cartDiscountReminder,
//           cartSummaryModalOverlay, desktopCartContainer
//    • Selecty/inputy: shelfTypeSelect, heightSelect, widthSelect
//    • Funkcje: generateOrderCode(), computePriceDetailed(),
//               generate3dSnapshotFromCurrentModel()
//    • Zmienne Three.js: shelfGroup, currentAnimationTimeline
//    • Zmienne wzorów/cen: DISCOUNTS (z wzory.js/ceny.js)
//    • Custom flags: customShelfPositionEnabled
// ============================================================

// ---- STAN KOSZYKA (globalny, używany też poza cart.js — np. przy
//      wyświetlaniu rabatu na stronie głównej) ----
let cart = [];
let previousCartItemCount = 0;
let modalScrollListener = null;

// ---- OPERACJE NA POZYCJACH KOSZYKA ----
function increaseQuantity(itemCode) {
    const item = cart.find(i => i.code === itemCode);
    if (item) { item.quantity++; }
    updateCartDisplay();
}

function decreaseQuantity(itemCode) {
    const item = cart.find(i => i.code === itemCode);
    if (item && item.quantity > 1) {
        item.quantity--;
    } else {
        cart = cart.filter(i => i.code !== itemCode);
    }
    updateCartDisplay();
}

function removeFromCart(itemCode) {
    cart = cart.filter(item => item.code !== itemCode);
    updateCartDisplay();
}

// ---- OBLICZANIE SUMY KOSZYKA + RABATÓW ----
function calculateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount10 = 0;
    let discount25 = 0;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems === 1) {
        const itemPrice = cart[0].price;
        discount10 = itemPrice * DISCOUNTS.discount1item;
    } else if (totalItems >= 2) {
        const allPrices = [];
        cart.forEach(item => {
            for (let i = 0; i < item.quantity; i++) { allPrices.push(item.price); }
        });
        allPrices.sort((a, b) => b - a);
        const maxPrice = allPrices[0];
        const minPrice = allPrices[allPrices.length - 1];
        discount10 = maxPrice * DISCOUNTS.discountBest;
        discount25 = minPrice * DISCOUNTS.discountCheap;
    }
    const totalDiscount = discount10 + discount25;
    const total = subtotal - totalDiscount;
    return { subtotal, discount10, discount25, totalDiscount, total };
}

// ---- OTWIERANIE / ZAMYKANIE PANELU KOSZYKA ----
function openCart() {
    if (cartPanel && cartPanelOverlay) {
        cartPanel.classList.add('visible');
        cartPanelOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

function closeCart() {
    if (cartPanel && cartPanelOverlay) {
        cartPanel.classList.remove('visible');
        cartPanelOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

// ---- DODAWANIE DO KOSZYKA (z animacją snapshotu 3D) ----
async function addToCart() {
    const orderCode = generateOrderCode();
    const priceDetails = computePriceDetailed();
    if (!orderCode || !priceDetails) {
        alert("Proszę, dokończ konfigurację półki przed dodaniem jej do koszyka.");
        return;
    }
    const existingItem = cart.find(item => item.code === orderCode);
    if (existingItem) {
        increaseQuantity(existingItem.code);
        openCart();
        const itemElement = cartItemsContainer.querySelector(`[data-code="${existingItem.code}"]`);
        if (itemElement) {
            itemElement.classList.remove('section-highlight-flash');
            void itemElement.offsetWidth;
            itemElement.classList.add('section-highlight-flash');
        }
        return;
    }
    const activeAddToCartButton = document.getElementById('addToCartBtn');
    const originalButtonContent = activeAddToCartButton.innerHTML;
    activeAddToCartButton.innerHTML = `<svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Generuję...</span>`;
    activeAddToCartButton.disabled = true;
    try {
        // FIX: poczekaj aż aktualna animacja 3D się skończy, żeby snapshot łapał finalny model
        if (currentAnimationTimeline && currentAnimationTimeline.isActive && currentAnimationTimeline.isActive()) {
            await new Promise(resolve => {
                const _tl = currentAnimationTimeline;
                _tl.eventCallback('onComplete', () => { setTimeout(resolve, 80); });
                // fallback w razie gdyby timeline już zakończył się zanim listener się podpiął
                setTimeout(resolve, 1500);
            });
        } else {
            // nawet bez animacji daj krótką chwilę na synchronizację renderera
            await new Promise(r => setTimeout(r, 50));
        }
        const snapshotDataUrl = await generate3dSnapshotFromCurrentModel();

        const isModular = shelfTypeSelect.value === 'modular';

        const newItem = {
            name: shelfTypeSelect.options[shelfTypeSelect.selectedIndex].text,
            summary: `${document.getElementById("widthSummary").textContent} x ${document.getElementById("heightSummary").textContent} x ${document.getElementById("depthSummary").textContent}`,
            shelfCountText: document.getElementById("shelfCountSummary").textContent,
            gapInfo: (function() {
                if (typeof customShelfPositionEnabled !== "undefined" && customShelfPositionEnabled) return "Własne rozmieszczenie";
                // Odczytaj rzeczywiste przerwy z aktualnego modelu 3D
                if (shelfGroup && shelfGroup.children.length > 0) {
                    const _t = 0.18;
                    const _shelves = shelfGroup.children.filter(c => c.isMesh && c.name && c.name.startsWith('internalShelf_')).sort((a,b) => a.position.y - b.position.y);
                    if (_shelves.length > 0) {
                        const _tp = shelfGroup.getObjectByName('topPanel');
                        const _bp = shelfGroup.getObjectByName('bottomPanel');
                        const _h = parseFloat(heightSelect.value) / 10;
                        const _botY = _bp ? _bp.position.y + _t/2 : -_h/2;
                        const _topY = _tp ? _tp.position.y - _t/2 : _h/2;
                        const _gaps = [];
                        _gaps.push(Math.round((_shelves[0].position.y - _t/2 - _botY) * 10 * 10) / 10);
                        for (let _i = 0; _i < _shelves.length - 1; _i++) {
                            _gaps.push(Math.round((_shelves[_i+1].position.y - _t/2 - (_shelves[_i].position.y + _t/2)) * 10 * 10) / 10);
                        }
                        _gaps.push(Math.round((_topY - (_shelves[_shelves.length-1].position.y + _t/2)) * 10 * 10) / 10);
                        const _allEqual = _gaps.every(g => Math.abs(g - _gaps[0]) < 0.2);
                        if (_allEqual) return `${_gaps[0]} cm`;
                        return _gaps.map(g => g + ' cm').join(' / ');
                    }
                }
                return document.getElementById("gapSummary").textContent;
            })(),
            sideColor: document.getElementById("sideColorSummary").textContent,
            shelfColor: document.getElementById("shelfColorSummary").textContent,
            extras: document.getElementById("extraOptionsSummary").textContent,
            price: priceDetails.total,
            code: orderCode,
            quantity: 1,
            snapshot: snapshotDataUrl,
        };

        // Animacja "lotu" półki do ikony koszyka
        const cartIcon = window.innerWidth >= 768 ? desktopCartContainer : document.getElementById('mobileCartButton');
        const startRect = activeAddToCartButton.getBoundingClientRect();
        const endRect = cartIcon.getBoundingClientRect();
        const flyingShelf = document.createElement('img');
        flyingShelf.src = snapshotDataUrl;
        flyingShelf.className = 'shelf-to-cart-animation';
        document.body.appendChild(flyingShelf);
        flyingShelf.style.left = `${startRect.left + startRect.width / 2 - 50}px`;
        flyingShelf.style.top = `${startRect.top + startRect.height / 2 - 50}px`;
        flyingShelf.style.width = `100px`;
        flyingShelf.style.height = `100px`;
        flyingShelf.getBoundingClientRect();
        flyingShelf.style.transform = `translate(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px) scale(0.2)`;
        flyingShelf.style.opacity = '0';
        cart.push(newItem);
        setTimeout(() => {
            if (document.body.contains(flyingShelf)) document.body.removeChild(flyingShelf);
            updateCartDisplay();
            openCart();
        }, 1000);
    } catch (e) {
        console.error("Nie udało się wygenerować miniatury przy dodawaniu do koszyka:", e);
        alert("Wystąpił błąd podczas generowania podglądu. Spróbuj ponownie.");
    } finally {
        activeAddToCartButton.innerHTML = originalButtonContent;
        activeAddToCartButton.disabled = false;
    }
}

// ---- ANIMACJA BŁYSKU PRZY UZYSKANIU RABATU ----
function triggerDiscountAnimation() {
    const subtotalPriceEl = document.getElementById('cartSubtotalPrice');
    const discountLineEl10 = document.getElementById('cartDiscountLine10');
    const discountLineEl25 = document.getElementById('cartDiscountLine25');
    const totalPriceLineEl = document.getElementById('cartTotalPriceLine');
    if (!subtotalPriceEl || !totalPriceLineEl || !discountLineEl10 || !discountLineEl25) return;
    subtotalPriceEl.classList.add('discount-subtotal-wobble');
    if (discountLineEl10.style.display === 'flex') discountLineEl10.classList.add('discount-line-pop');
    if (discountLineEl25.style.display === 'flex') discountLineEl25.classList.add('discount-line-pop');
    totalPriceLineEl.classList.add('discount-total-glow');
    setTimeout(() => {
        subtotalPriceEl.classList.remove('discount-subtotal-wobble');
        if (discountLineEl10) discountLineEl10.classList.remove('discount-line-pop');
        if (discountLineEl25) discountLineEl25.classList.remove('discount-line-pop');
        totalPriceLineEl.classList.remove('discount-total-glow');
    }, 2000);
}

// ---- MAPOWANIE NAZWY KOLORU → HEX ----
function getColorHex(label) {
    if (!label) return '#888';
    const l = label.toLowerCase();
    if (l.includes('ąb') || l.includes('ab') || l.includes('dąb')) return '#8B5A2B';
    if (l.includes('biał') || l.includes('bial') || l.includes('white')) return '#FFFFFF';
    if (l.includes('czarn') || l.includes('black')) return '#000000';
    return '#888888';
}

// ---- RENDEROWANIE PANELU KOSZYKA ----
function updateCartDisplay() {
    if (!cartItemsContainer || !cartBadges) return;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const justGotDiscount = (totalItems === 1 && previousCartItemCount === 0) || (totalItems >= 2 && previousCartItemCount < 2);
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        if (cartEmptyMessage) {
            cartEmptyMessage.style.display = 'block';
            cartItemsContainer.appendChild(cartEmptyMessage);
        }
    } else {
        if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item-card';
            itemElement.dataset.code = item.code;
            itemElement.innerHTML = `
            <div class="cart-item-thumb" data-snap="${item.snapshot||''}">
                ${item.snapshot ? `<img src="${item.snapshot}" alt="${item.name}">` : '<div style="font-size:10px;color:#d1d5db;text-align:center;padding:8px">brak</div>'}
            </div>
            <div class="cart-item-body">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                    <div class="cart-item-name">${item.name}</div>
                    <span class="cart-item-price">${(item.price * item.quantity).toFixed(2).replace('.',',')} zł</span>
                </div>
                <div class="cart-item-specs">
                    <span class="cart-item-spec-label">Wymiary</span>
                    <span class="cart-item-spec-val">${item.summary}</span>
                    <span class="cart-item-spec-label">Półki</span>
                    <span class="cart-item-spec-val">${item.shelfCountText||'—'}</span>
                    <span class="cart-item-spec-label">Boki</span>
                    <span class="cart-item-spec-val"><span class="cart-item-color-dot" style="background:${getColorHex(item.sideColor)}"></span>${item.sideColor}</span>
                    <span class="cart-item-spec-label">Półki kol.</span>
                    <span class="cart-item-spec-val"><span class="cart-item-color-dot" style="background:${getColorHex(item.shelfColor)}"></span>${item.shelfColor}</span>
                </div>
                <div class="cart-item-bottom">
                    <div class="cart-item-actions">
                        <div class="cart-item-qty">
                            <button onclick="decreaseQuantity('${item.code}')">−</button>
                            <span>${item.quantity}</span>
                            <button onclick="increaseQuantity('${item.code}')">+</button>
                        </div>
                        <button class="cart-item-remove" onclick="removeFromCart('${item.code}')" title="Usuń">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
            cartItemsContainer.appendChild(itemElement);
        });
    }
    // --- wariant UI z tagami rabatów (cartVariantC) ---
    const totals = calculateCartTotal();
    const variantC = document.getElementById('cartVariantC');
    const cartDiscountTags = document.getElementById('cartDiscountTags');
    const cartSavingsLine = document.getElementById('cartSavingsLine');
    const cartUpsellHint = document.getElementById('cartUpsellHint');
    if (variantC) {
        if (totalItems > 0) {
            variantC.style.display = 'block';
            const subtotalEl = document.getElementById('cartSubtotalPrice');
            if (subtotalEl) {
                subtotalEl.textContent = totals.totalDiscount > 0 ? totals.subtotal.toFixed(2).replace('.',',') + ' zł' : '';
                if (totals.totalDiscount > 0) {
                    subtotalEl.classList.add('discount-subtotal-slash');
                } else {
                    subtotalEl.classList.remove('discount-subtotal-slash');
                }
            }
            if (cartDiscountTags) {
                cartDiscountTags.innerHTML = '';
                if (totals.discount10 > 0) {
                    cartDiscountTags.innerHTML += `<span style="background:#f0fdf4;border:0.5px solid #bbf7d0;border-radius:99px;font-size:9px;font-weight:700;color:#15803d;padding:2px 7px;">-10% półka 1.</span>`;
                }
                if (totals.discount25 > 0) {
                    cartDiscountTags.innerHTML += `<span style="background:#f0fdf4;border:0.5px solid #bbf7d0;border-radius:99px;font-size:9px;font-weight:700;color:#15803d;padding:2px 7px;">-25% półka 2.</span>`;
                }
            }
            if (cartSavingsLine) {
                if (totals.totalDiscount > 0) {
                    cartSavingsLine.textContent = 'oszczędzasz ' + totals.totalDiscount.toFixed(2).replace('.',',') + ' zł';
                    cartSavingsLine.style.display = 'block';
                } else {
                    cartSavingsLine.style.display = 'none';
                }
            }
            if (cartUpsellHint) {
                cartUpsellHint.style.display = (totalItems === 1 && totals.discount25 === 0) ? 'flex' : 'none';
            }
        } else {
            variantC.style.display = 'none';
        }
    }
    if (justGotDiscount) { triggerDiscountAnimation(); }
    cartTotalPrice.textContent = `${totals.total.toFixed(2).replace('.',',')} zł`;
    cartBadges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    if (mobileCartButton) {
        const mobileCartPriceSpan = mobileCartButton.querySelector('.mobile-cart-price');
        if (mobileCartPriceSpan) {
            mobileCartPriceSpan.textContent = totalItems > 0 ? `${totals.total.toFixed(2)} zł` : 'Koszyk';
        }
    }
    cartCheckoutButton.disabled = cart.length === 0;
    previousCartItemCount = totalItems;
}

// ---- SPRAWDZANIE CZY SEKCJA KODÓW JEST WIDOCZNA (scroll w modalu) ----
function checkCodesVisibility() {
    const modalBody = document.querySelector('#cartSummaryModal .modal-body');
    const codesSection = document.getElementById('codesSection');
    const scrollToBtn = document.getElementById('scrollToCodesBtn');
    if (!modalBody || !codesSection || !scrollToBtn) return;
    const modalRect = modalBody.getBoundingClientRect();
    const codesRect = codesSection.getBoundingClientRect();
    if (codesRect.bottom > modalRect.bottom + 5) {
        scrollToBtn.classList.add('visible');
    } else {
        scrollToBtn.classList.remove('visible');
    }
}

// ---- ANIMACJA "WPISYWANIA" KODÓW ZAMÓWIEŃ ----
function animateCodeTyping(fullText) {
    const textarea = document.getElementById('cartSummaryAllCodes');
    const displayEl = document.getElementById('codeDisplayText');
    const cursor = document.getElementById('typingCursor');
    const badge = document.getElementById('codeReadyBadge');
    if (!displayEl || !cursor) return;
    if (textarea) textarea.value = fullText;
    displayEl.textContent = '';
    if (badge) { badge.style.display = 'none'; }
    cursor.style.display = 'inline-block';
    const chars = fullText.split('');
    let i = 0;
    const typingSpeed = 28;
    function type() {
        if (i < chars.length) {
            displayEl.textContent += chars[i];
            i++;
            setTimeout(type, typingSpeed);
        } else {
            cursor.style.display = 'none';
            if (badge) { badge.style.display = 'flex'; }
            checkCodesVisibility();
        }
    }
    type();
}

// ---- OTWARCIE MODALA PODSUMOWANIA (handleCheckout) ----
function handleCheckout() {
    if (cart.length === 0) return;
    const scrollToCodesBtn = document.getElementById('scrollToCodesBtn');
    if (scrollToCodesBtn) {
        scrollToCodesBtn.classList.remove('visible', 'pulse-glow-animation');
    }
    closeCart();
    const totals = calculateCartTotal();
    const allCodes = cart.flatMap(item => Array(item.quantity).fill(item.code)).join('\n');
    const cartSummaryItemsContainer = document.getElementById('cartSummaryItemsContainer');
    const cartSummarySubtotalLine = document.getElementById('cartSummarySubtotalLine');
    const cartSummarySubtotalPrice = document.getElementById('cartSummarySubtotalPrice');
    const cartSummaryCombinedDiscountLine = document.getElementById('cartSummaryCombinedDiscountLine');
    const cartSummaryCombinedDiscountAmount = document.getElementById('cartSummaryCombinedDiscountAmount');
    const cartSummaryTotalPrice = document.getElementById('cartSummaryTotalPrice');
    const cartSummaryModalOverlay = document.getElementById('cartSummaryModalOverlay');
    cartSummaryItemsContainer.innerHTML = '';
    cart.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'cart-item-card';
        itemCard.innerHTML = `
            <div class="cart-item-thumb" data-snap="${item.snapshot||''}">
                ${item.snapshot ? `<img src="${item.snapshot}" alt="${item.name}">` : '<div style="font-size:10px;color:#d1d5db;text-align:center;padding:8px">brak</div>'}
            </div>
            <div class="cart-item-body">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                    <div class="cart-item-name">${item.name}</div>
                    <span style="font-size:14px;font-weight:800;color:#16a34a;flex-shrink:0;margin-left:6px">${(item.price * item.quantity).toFixed(2).replace('.',',')} zł</span>
                </div>
                <div class="cart-item-specs">
                    <span class="cart-item-spec-label">Wymiary</span>
                    <span class="cart-item-spec-val">${item.summary}</span>
                    <span class="cart-item-spec-label">Półki</span>
                    <span class="cart-item-spec-val">${item.shelfCountText||'—'}</span>
                    <span class="cart-item-spec-label">Boki</span>
                    <span class="cart-item-spec-val"><span class="cart-item-color-dot" style="background:${getColorHex(item.sideColor)}"></span>${item.sideColor}</span>
                    <span class="cart-item-spec-label">Półki kol.</span>
                    <span class="cart-item-spec-val"><span class="cart-item-color-dot" style="background:${getColorHex(item.shelfColor)}"></span>${item.shelfColor}</span>
                    ${item.extras && item.extras !== 'standardowa' ? `<span class="cart-item-spec-label">Opcje</span><span class="cart-item-spec-val">${item.extras}</span>` : ''}
                </div>
                <div style="font-size:11px;color:#9ca3af;margin-top:4px">Ilość: ${item.quantity}</div>
            </div>
        `;
        cartSummaryItemsContainer.appendChild(itemCard);
    });
    if (totals.totalDiscount > 0) {
        cartSummarySubtotalLine.style.display = 'flex';
        cartSummarySubtotalPrice.textContent = `${totals.subtotal.toFixed(2).replace('.',',')} zł`;
        cartSummaryCombinedDiscountAmount.textContent = `oszczędzasz ${totals.totalDiscount.toFixed(2).replace('.',',')} zł`;
    } else {
        cartSummarySubtotalLine.style.display = 'none';
        cartSummaryCombinedDiscountLine.style.display = 'none';
        cartSummarySubtotalPrice.classList.remove('discount-subtotal-slash');
    }
    cartSummaryTotalPrice.textContent = `${totals.total.toFixed(2)} zł`;

    const codesSection = document.getElementById('codesSection');
    const codesTextarea = document.getElementById('cartSummaryAllCodes');
    const typingCursor = document.getElementById('typingCursor');
    codesTextarea.value = '';
    codesSection.classList.remove('visible');
    if (typingCursor) typingCursor.style.display = 'none';
    cartSummaryModalOverlay.classList.add('visible');
    document.body.classList.add('no-scroll');
    const modalBody = document.querySelector('#cartSummaryModal .modal-body');
    if (modalScrollListener) {
        modalBody.removeEventListener('scroll', modalScrollListener);
    }
    modalScrollListener = () => checkCodesVisibility();
    modalBody.addEventListener('scroll', modalScrollListener);
    setTimeout(() => {
        codesSection.classList.add('visible');
        animateCodeTyping(allCodes);
        checkCodesVisibility();
    }, 300);
}

// ---- ZAMKNIĘCIE MODALA PODSUMOWANIA ----
function closeCartSummaryModal() {
    const cartSummaryModalOverlay = document.getElementById('cartSummaryModalOverlay');
    if (cartSummaryModalOverlay) {
        cartSummaryModalOverlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        const modalBody = document.querySelector('#cartSummaryModal .modal-body');
        if (modalBody && modalScrollListener) {
            modalBody.removeEventListener('scroll', modalScrollListener);
            modalScrollListener = null;
        }
    }
}

// ---- POBIERANIE PODSUMOWANIA ZAMÓWIENIA (plik .txt) ----
function downloadFullCartSummary() {
    if (cart.length === 0) { alert("Koszyk jest pusty."); return; }
    const totals = calculateCartTotal();
    const allCodes = cart.flatMap(item => Array(item.quantity).fill(item.code)).join('\n');
    const date = new Date().toLocaleString('pl-PL');
    let content = `PODSUMOWANIE ZAMÓWIENIA\n`;
    content += `Data wygenerowania: ${date}\n`;
    content += `========================================\n\n`;
    cart.forEach((item, index) => {
        content += `PRODUKT ${index + 1}: ${item.name} (x${item.quantity})\n`;
        content += `  Wymiary: ${item.summary}\n`;
        content += `  Kolor boków: ${item.sideColor}\n`;
        content += `  Kolor półek: ${item.shelfColor}\n`;
        content += `  Ilość półek wewn.: ${item.shelfCountText}\n`;
        content += `  Opcje: ${item.extras}\n`;
        content += `  Cena jedn.: ${item.price.toFixed(2)} zł\n\n`;
    });
    content += `========================================\n`;
    if (totals.totalDiscount > 0) {
        content += `SUMA CZĘŚCIOWA: ${totals.subtotal.toFixed(2)} zł\n`;
        if (totals.discount10 > 0) content += `Rabat na 1. półkę (-10%): -${totals.discount10.toFixed(2)} zł\n`;
        if (totals.discount25 > 0) content += `Rabat na 2. półkę (-25%): -${totals.discount25.toFixed(2)} zł\n`;
    }
    content += `ŁĄCZNIE DO ZAPŁATY: ${totals.total.toFixed(2)} zł\n\n`;
    content += `KODY ZAMÓWIEŃ DO WKLEJENIA NA ALLEGRO:\n`;
    content += `${allCodes}\n`;
    content += `========================================\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filenameDate = new Date().toISOString().slice(0, 10);
    link.download = `zamowienie-polki-${filenameDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
