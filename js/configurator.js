// --- Zmienne globalne i elementy DOM ---
        let scene, camera, renderer, shelfGroup, controls;
        let shelfContainer, threeJsCanvasWrapper, materialSwiperInstance, gallerySwiperInstance;
        let shelfTypeSelect, widthSelect, heightSelect, depthSelect, shelfCountSelect;
        let customWidthInput, customWidthDisplay, customWidthFee;
        let shelfTypeOptionsDiv, widthSelectionArea, dimensionSectionAnchor, colorSectionAnchor, shelfTypeSectionAnchor;
        let standardDimensionsContainer, modularShelfOptionsContainer, moduleWidthSelect, moduleHeightSelect, connectingShelfWidthSelect;
        let heightLabel, depthLabel, sideColorSelect, shelfColorSelect;
        let mugShelfSpecificOptionsContainer, mugShelfMountOptionsDiv, mugShelfDividersOptionsDiv;
        let dividersTopCheckbox, dividersMiddleCheckbox, dividersBottomCheckbox;
        let configuratorSection, shelfCountSection, viewerInfoText, modularInfoText;
        let galleryTabsContainer, galleryGridContainer, galleryImageArea, galleryPrevArrow, galleryNextArrow;
        let show3dButton, collapse3dPanelButton;
        let autoRotateEnabled = false;
        const initialCameraPosition = { x: 3, y: 6, z: 7 };
        let currentAnimationTimeline = null;
        let lastValidConfig = {};
        // Custom półki/przegródki z edytora (dla isCustomLayout)
        let _customShelves  = null;
        let _customDividers = null;
        let _baseCustomWidth = null; // oryginalna szerokość wzoru (do skalowania)
        let _custMountType   = null; // wybrany typ montażu: 'hanging' | 'standing'
        // Aktywna konfiguracja z galerii (może zawierać shelves/dividers z editor2)
        let activeGalleryConfig = null;

        // `cart`, `previousCartItemCount`, `modalScrollListener` — zadeklarowane w cart.js
        let desktopCartContainer, cartPanel, cartPanelOverlay, cartPanelCloseBtn, cartItemsContainer, cartEmptyMessage, cartTotalPrice, cartCheckoutButton, cartBadges, mobileCartButton, cartDiscountReminder;
        let cartSubtotalLine, cartSubtotalPrice, cartDiscountLine10, cartDiscountAmount10, cartDiscountLine25, cartDiscountAmount25;
        let mugShelfDividerIconsContainer, addTopDividerBtn, addMiddleDividerBtn, addBottomDividerBtn, dividerTooltip;
        let modularShelfIconsContainer, mobileModularHangingBtn, mobileModularStandingBtn, mobileModularNoTopBtn, mobileModularNoBottomBtn;
        let mobileMugShelfMountPanel, mobileMountHangingStripBtn, mobileMountStandingStripBtn;
        let mobileIconDetailsType, mobileIconDetailsDimensions, mobileIconDetailsColors, mobileIconDetailsShelves;
        let mobile3dActionsContainer, mobilePriceValue, mobileGoToSummaryBtn;
        let desktopDividerDimensionsInfo;
        let viewOrderCodeInput, orderDetailsModalOverlay, orderDetailsModal, modalCloseButton, modalOrderCodeSpan, modalOrderSummaryP;
        let priceAndActionsContainer, priceHint, addToCartBtn;
        let imageLightbox, lightboxImage, lightboxCloseBtn;
        
        // NOWE ZMIENNE
        let visualDetailsModalOverlay, visualDetailsModal, visualDetailsModalCloseBtn, visualDetailsLoader, visualDetailsContent, visualDetailsError, visualDetailsOrderCode, visualDetailsSnapshot, visualDetailsSpecsList, printVisualDetailsBtn;
        let currentDetailsForVisualModal = null;

        // `modalScrollListener`, `previousCartItemCount` — zadeklarowane w cart.js

        // wiszace_configs, stojace_configs, kubki_configs, modular_configs,
        // predefinedShelfConfigurations, galleryData — wczytane z wzory.js
        const originalPreviewMaterialParams = { color: 0x777777, metalness: 0, roughness: 0.6 };
        let originalWidthOptions = [];
        let originalHeightOptions = [];
        // pricing, mugShelfPricing, FEES, DISCOUNTS — wczytane z ceny.js
        // SHELF_TYPES, COLORS, galleryData, predefinedShelfConfigurations — wczytane z wzory.js
        // codeToValue i valueToCode wyliczane dynamicznie z wzory.js:
        const _stdTypes = SHELF_TYPES.filter(t => t.code && t.id && !t.isCustomLayout);
        const codeToValue = { type: Object.fromEntries(_stdTypes.map(t => [t.code, t.id])), color: Object.fromEntries(COLORS.map(c => [c.code, c.value])), mugMount: { h: 'hanging', s: 'standing' } };
        const valueToCode = { type: Object.fromEntries(_stdTypes.map(t => [t.id, t.code])), color: Object.fromEntries(COLORS.map(c => [c.value, c.code])) };

        
        // Funkcje koszyka (checkCodesVisibility, animateCodeTyping, increaseQuantity,
        // decreaseQuantity, removeFromCart, calculateCartTotal, openCart, closeCart,
        // addToCart, triggerDiscountAnimation, getColorHex, updateCartDisplay,
        // handleCheckout, closeCartSummaryModal, downloadFullCartSummary) — przeniesione do js/cart.js
        
    function applyShelfConfigurationFromGallery(galleryIndex, imageIndex) {
            // ── WZORY NIESTANDARDOWE (zakładka 5) ──────────────────────────────
            if (galleryIndex === 4) {
                let config = predefinedShelfConfigurations[4]?.[imageIndex];
                const allTypes = (typeof SHELF_TYPES !== 'undefined' ? SHELF_TYPES : []);
                // Fallback 1: gdy brak wpisu w custom_configs, szukaj wzoru po galleryPhoto
                if (!config || config.type !== 'custom_layout') {
                    const imgPathRaw = galleryData[4]?.imgs?.[imageIndex];
                    const imgPath = Array.isArray(imgPathRaw) ? imgPathRaw[0] : imgPathRaw;
                    const matchedByPhoto = imgPath ? allTypes.find(t => t.galleryPhoto && t.galleryPhoto === imgPath) : null;
                    if (matchedByPhoto) {
                        config = { type: 'custom_layout', patternId: matchedByPhoto.id };
                    }
                }
                // Fallback 2: szukaj n-tego wzoru custom w SHELF_TYPES (po kolejności)
                if (!config || config.type !== 'custom_layout') {
                    const customTypes = allTypes.filter(t => t.isCustomLayout);
                    const matchedByIndex = customTypes[imageIndex];
                    if (matchedByIndex) {
                        config = { type: 'custom_layout', patternId: matchedByIndex.id };
                    } else {
                        console.warn('Brak custom_layout config dla imageIndex:', imageIndex);
                        return;
                    }
                }
                // Znajdź wzór w SHELF_TYPES po patternId
                const pattern = allTypes.find(t => t.id === config.patternId);
                if (!pattern) {
                    console.warn('Nie znaleziono wzoru:', config.patternId);
                    return;
                }
                activeGalleryConfig = config;
                // Ustaw shelfType na id wzoru — handleShelfTypeChange załaduje geometrię
                shelfTypeSelect.value = config.patternId;
                if (typeof handleShelfTypeChange === 'function') handleShelfTypeChange(true);
                // Ustaw kolory
                sideColorSelect.value  = config.sideColor  || pattern.sideColor  || '#8B5A2B';
                shelfColorSelect.value = config.shelfColor || pattern.shelfColor || '#8B5A2B';
                updateSwatchDisplay('sideColor',  'sideColorSwatchDisplay');
                updateSwatchDisplay('shelfColor', 'shelfColorSwatchDisplay');
                lastValidConfig = {};
                updatePreview(true);
                updateOrderSummary();
                return;
            }
            // POCZĄTEK SEKCJI DLA PÓŁKI MODUŁOWEJ
            if (galleryIndex === 3) {
                shelfTypeSelect.value = 'modular';
                handleShelfTypeChange(true);
                moduleWidthSelect.value = '44';
                moduleHeightSelect.value = '40';
                connectingShelfWidthSelect.value = '40';
                sideColorSelect.value = '#8B5A2B';
                shelfColorSelect.value = '#8B5A2B';
                updateSwatchDisplay('sideColor', 'sideColorSwatchDisplay');
                updateSwatchDisplay('shelfColor', 'shelfColorSwatchDisplay');
                
                // ZMIANA: Dodaj tę linię, aby wymusić pełną animację
                lastValidConfig = {};
                
                updatePreview(true);
                updateOrderSummary();
                return;
            }

            // Fallback gdy brak konkretnego wpisu — użyj domyślnego dla zakładki
            const _fallbackByTab = [
                { type: 'hanging',   sideColor: '#8B5A2B', shelfColor: '#8B5A2B', height: '80', width: '44', depth: '10', shelfCount: '5' },
                { type: 'standing',  sideColor: '#8B5A2B', shelfColor: '#8B5A2B', height: '40', width: '60', depth: '10', shelfCount: '2' },
                { type: 'mug_shelf', mount: 'standing', sideColor: '#8B5A2B', shelfColor: '#8B5A2B', height: '40', width: '44', depth: '10', dividers: { top: true, middle: true, bottom: true } },
            ];
            const config = predefinedShelfConfigurations[galleryIndex]?.[imageIndex] || _fallbackByTab[galleryIndex];
            if (!config) {
                console.warn('Configuration not found for galleryIndex:', galleryIndex, 'imageIndex:', imageIndex);
                return;
            }
            // Zapamiętaj konfigurację galerii (może zawierać shelves/dividers z editor2)
            activeGalleryConfig = config;
            shelfTypeSelect.value = config.type;
            handleShelfTypeChange(true);
            if (config.type === 'mug_shelf') {
                if (Array.from(widthSelect.options).some(opt => opt.value === String(config.width))) { widthSelect.value = String(config.width); } else if (widthSelect.options.length > 0) { widthSelect.value = widthSelect.options[0].value; }
                if (Array.from(heightSelect.options).some(opt => opt.value === String(config.height))) { heightSelect.value = String(config.height); } else if (heightSelect.options.length > 0) { heightSelect.value = heightSelect.options[0].value; }
                handleMugShelfHeightChange(true);
            } else {
                const widthValueString = String(config.width);
                const widthOptionExists = Array.from(widthSelect.options).some(opt => opt.value === widthValueString);
                if (widthOptionExists) { widthSelect.value = widthValueString; } else if (parseInt(widthValueString) >= 35 && parseInt(widthValueString) <= 59 && Array.from(widthSelect.options).some(opt => opt.value === 'custom')) { widthSelect.value = 'custom'; }
                checkCustomWidth();
                if (widthSelect.value === 'custom' && customWidthInput && parseInt(widthValueString) >= 35 && parseInt(widthValueString) <= 59) {
                     customWidthInput.value = widthValueString;
                     if(customWidthDisplay) customWidthDisplay.textContent = widthValueString + ' cm';
                }
                heightSelect.value = config.height;
                handleDimensionChange();
                if (Array.from(depthSelect.options).some(opt => opt.value === String(config.depth))) { depthSelect.value = String(config.depth);
                } else {
                     console.warn(`Depth ${config.depth} not available for current selections. Clearing or defaulting.`);
                     if(depthSelect.options.length > 0) depthSelect.value = depthSelect.options[0].value;
                }
                if (Array.from(shelfCountSelect.options).some(opt => opt.value === String(config.shelfCount))) { shelfCountSelect.value = String(config.shelfCount);
                } else {
                    console.warn(`Shelf count ${config.shelfCount} not available for height ${config.height}. Defaulting or clearing.`);
                    if (shelfCountSelect.options.length > 0) shelfCountSelect.value = shelfCountSelect.options[0].value;
                }
                if (typeof showOrHideCustomShelfToggle === 'function') showOrHideCustomShelfToggle();
            }
            sideColorSelect.value = config.sideColor;
            shelfColorSelect.value = config.shelfColor;
            updateSwatchDisplay('sideColor', 'sideColorSwatchDisplay');
            updateSwatchDisplay('shelfColor', 'shelfColorSwatchDisplay');
            if (config.type === 'hanging' || config.type === 'standing') {
                const noTopShelfCheckboxElem = document.getElementById('noTopShelf');
                if (noTopShelfCheckboxElem) noTopShelfCheckboxElem.checked = !!config.noTopShelf;
                if (config.type === 'standing') {
                    const noBottomShelfCheckboxElem = document.getElementById('noBottomShelf');
                    if (noBottomShelfCheckboxElem) noBottomShelfCheckboxElem.checked = !!config.noBottomShelf;
                }
                if (typeof updateHsIconActiveStates === 'function') updateHsIconActiveStates();
            } else if (config.type === 'mug_shelf') {
                const mountRadio = document.querySelector(`input[name="mugShelfMount"][value="${config.mount}"]`);
                if (mountRadio) mountRadio.checked = true;
                if (dividersTopCheckbox) dividersTopCheckbox.checked = !!config.dividers?.top;
                if (dividersMiddleCheckbox) dividersMiddleCheckbox.checked = !!config.dividers?.middle;
                if (dividersBottomCheckbox) dividersBottomCheckbox.checked = !!config.dividers?.bottom;
                updateDividerIconActiveStates();
                if (typeof updateMobileMountStripStates === "function") updateMobileMountStripStates();
                // ── FIX: wymuś pełną przebudowę sceny 3D (inaczej płynna aktualizacja pomija przegródki i wymiary)
                lastValidConfig = {};
            }
            // Wymuś pełny rebuild sceny 3D przy każdym załadowaniu z galerii
            lastValidConfig = {};
            if (typeof updateMobileShelfCountWidget === "function") updateMobileShelfCountWidget();
            updatePreview(true);
            updateOrderSummary();
        }
        

function pulseShelfElements(which) {
    if (!shelfGroup) return;
    const isSides = which === 'sides';
    const green = new THREE.Color(0x16a34a);
    const off = new THREE.Color(0x000000);

    const targets = [];
    shelfGroup.traverse(c => {
        if (!c.isMesh || !c.material) return;
        if (isSides && (c.name === 'leftSide' || c.name === 'rightSide')) targets.push(c);
        if (!isSides && (c.name === 'topPanel' || c.name === 'bottomPanel' ||
            c.name.startsWith('internalShelf_') || c.name.startsWith('divider_') ||
            c.name.startsWith('connecting_shelf_'))) targets.push(c);
    });
    if (!targets.length) return;

    // Remove old pulse canvas
    const old = document.getElementById('_pulseCanvas2d');
    if (old) old.remove();

    let count = 0;
    function pulse() {
        if (count >= 3) return;
        count++;
        targets.forEach(m => { m.material.emissive.set(0x0a5c1e); m.material.emissiveIntensity = 0.8; m.material.needsUpdate = true; });
        setTimeout(() => {
            targets.forEach(m => { m.material.emissive.set(0x000000); m.material.emissiveIntensity = 0; m.material.needsUpdate = true; });
            setTimeout(pulse, 100);
        }, 200);
    }
    pulse();
}

function toggleMdcPanel(cardId, fabId) {
    const card = document.getElementById(cardId);
    const fab = document.getElementById(fabId);
    if (!card || !fab) return;
    const isOpen = card.classList.contains('open');
    // Zamknij wszystkie inne karty
    document.querySelectorAll('.mdc-card').forEach(c => c.classList.remove('open'));
    document.querySelectorAll('.mdc-fab').forEach(f => f.classList.remove('open'));
    // Przełącz klikniętą
    if (!isOpen) {
        card.classList.add('open');
        fab.classList.add('open');
    }
}
function updateDividerIconsVisibility() { if (!shelfContainer || !shelfTypeSelect || !mugShelfDividerIconsContainer || !mobileMugShelfMountPanel || !dividerTooltip) return; const isMobile = window.innerWidth < 768; const isMugShelf = shelfTypeSelect.value === 'mug_shelf'; const is3dPanelActive = shelfContainer.classList.contains('active'); if (isMobile && isMugShelf && is3dPanelActive) { mugShelfDividerIconsContainer.classList.add('visible'); mobileMugShelfMountPanel.classList.add('visible'); if (!dividerTooltip.dataset.shown) { dividerTooltip.classList.add('visible'); dividerTooltip.dataset.shown = 'true'; setTimeout(() => { dividerTooltip.classList.remove('visible'); }, 5000); } if (typeof updateMobileMountStripStates === "function") updateMobileMountStripStates(); } else { mugShelfDividerIconsContainer.classList.remove('visible'); mobileMugShelfMountPanel.classList.remove('visible'); }
    const _dimLabel = document.getElementById('mugDimCanvas3d');
    if (_dimLabel) {
        if (isMobile && isMugShelf && is3dPanelActive) {
            const _hv = heightSelect ? heightSelect.value : '';
            _dimLabel.textContent = _hv === '60' ? 'Komora: 12,5 × 10,9 cm | wnęka dolna: 18 cm' : 'Komora: 12,5 × 10,9 cm';
            _dimLabel.style.display = 'block';
        } else {
            _dimLabel.style.display = 'none';
        }
    }
}
        function updateDividerIconActiveStates() { if (addTopDividerBtn && dividersTopCheckbox) addTopDividerBtn.classList.toggle('active-divider-icon', dividersTopCheckbox.checked); if (addMiddleDividerBtn && dividersMiddleCheckbox) addMiddleDividerBtn.classList.toggle('active-divider-icon', dividersMiddleCheckbox.checked); if (addBottomDividerBtn && dividersBottomCheckbox) addBottomDividerBtn.classList.toggle('active-divider-icon', dividersBottomCheckbox.checked); }
        function updateMobileMountStripStates() { if (!mobileMountHangingStripBtn || !mobileMountStandingStripBtn || !mugShelfMountOptionsDiv) return; const currentMountValue = mugShelfMountOptionsDiv.querySelector('input[name="mugShelfMount"]:checked')?.value; mobileMountHangingStripBtn.classList.toggle('active-mount-strip', currentMountValue === 'hanging'); mobileMountStandingStripBtn.classList.toggle('active-mount-strip', currentMountValue === 'standing'); }

        // ── Animacja potwierdzenia wyboru montażu (bounce na osi Y) ──
        function playMountBounceAnimation(mountType) {
            if (!shelfGroup || typeof gsap === 'undefined') return;
            const baseY = shelfGroup.position.y;
            // hanging → unieś w górę; standing → opuść w dół
            const peakOffset = mountType === 'hanging' ? 0.38 : -0.30;
            gsap.killTweensOf(shelfGroup.position);
            gsap.timeline()
                .to(shelfGroup.position, {
                    y: baseY + peakOffset,
                    duration: 0.22,
                    ease: 'power2.out'
                })
                .to(shelfGroup.position, {
                    y: baseY + peakOffset * 0.18,
                    duration: 0.18,
                    ease: 'power2.in'
                })
                .to(shelfGroup.position, {
                    y: baseY,
                    duration: 0.20,
                    ease: 'power2.out'
                });
        }
        function updateDividerDimensionVisibility() { if (!desktopDividerDimensionsInfo || !shelfTypeSelect || !heightSelect || !dividersTopCheckbox || !dividersMiddleCheckbox || !dividersBottomCheckbox) { if(desktopDividerDimensionsInfo) desktopDividerDimensionsInfo.style.display = 'none'; return; } const isMugShelfType = shelfTypeSelect.value === 'mug_shelf'; const shouldShow = isMugShelfType; try { if (shouldShow) { const heightVal = heightSelect.value; let dimensionsText; if (heightVal === '60') { dimensionsText = "Wymiar komory: szer. 12,5 cm, wys. 10,9 cm | wnęka dolna: 18 cm"; } else { dimensionsText = "Wymiar komory: szer. 12,5 cm, wys. 10,9 cm"; } desktopDividerDimensionsInfo.textContent = dimensionsText; } desktopDividerDimensionsInfo.style.display = shouldShow ? 'flex' : 'none'; } catch (e) { console.error("Błąd podczas ustawiania wyświetlania dla desktopDividerDimensionsInfo:", e); if(desktopDividerDimensionsInfo) desktopDividerDimensionsInfo.style.display = 'none'; } }
        function updateMobileShelfInfo() {
            const mobileInfoContainer = document.getElementById('mobileShelfInfo');
            if (!mobileInfoContainer) return;

            const shelfType = shelfTypeSelect.value;
            let infoHtml = '';
            let showContainer = false;

            if (shelfType === 'modular') {
                const moduleW = parseInt(moduleWidthSelect.value);
                const moduleH = parseInt(moduleHeightSelect.value);
                const connectW = parseInt(connectingShelfWidthSelect.value);
                const depth = parseInt(depthSelect.value);
                const thickness = 1.8;
                let shelfNum = 3;
                if (moduleH === 40) shelfNum = 2;
                if (moduleH === 80) shelfNum = 5;
                const totalWidth = moduleW * 2 + connectW;
                const availableHeight = moduleH - 2 * thickness;
                const gap = (availableHeight - shelfNum * thickness) / (shelfNum + 1);
                infoHtml = `<p>Szer: ${totalWidth}cm &bull; Wys: ${moduleH}cm &bull; Gł: ${depth}cm &bull; Odstęp: ${parseFloat(gap.toFixed(1))}cm</p>`;
                showContainer = true;
            } else if (shelfType === 'mug_shelf') {
                infoHtml = `<p>Wymiar przegródek: <strong class="font-semibold text-stone-600">12,5cm szer. x 10,9cm wys.</strong></p>`;
                showContainer = true;
            } else {
                const gapText = document.getElementById('gapSummaryDisplay').textContent;
                if (gapText && gapText.includes('cm')) {
                    infoHtml = `<p>Odległość między półkami: <strong class="font-semibold text-stone-600">${gapText}</strong></p>`;
                    showContainer = true;
                }
            }

            mobileInfoContainer.innerHTML = infoHtml;
            mobileInfoContainer.style.display = showContainer ? 'block' : 'none';
        }
        
        function updateModularInfoText() {
            const mobileInfoContainer = document.getElementById('mobileShelfInfo');

            if (!modularInfoText || !viewerInfoText || !mobileInfoContainer || shelfTypeSelect.value !== 'modular') {
                if(viewerInfoText) viewerInfoText.style.display = 'block';
                if(modularInfoText) modularInfoText.style.display = 'none';
                if(mobileInfoContainer) mobileInfoContainer.style.display = 'none';
                return;
            }

            const moduleW = parseInt(moduleWidthSelect.value);
            const moduleH = parseInt(moduleHeightSelect.value);
            const connectW = parseInt(connectingShelfWidthSelect.value);
            const depth = parseInt(depthSelect.value);
            const thickness = 1.8; 

            let shelfNum = 3;
            if (moduleH === 40) shelfNum = 2;
            if (moduleH === 80) shelfNum = 5;

            const totalWidth = moduleW * 2 + connectW;
            const availableHeight = moduleH - 2 * thickness;
            const gap = (availableHeight - shelfNum * thickness) / (shelfNum + 1);

            const desktopText = `
                <span class="font-semibold">Szer. całkowita:</span> ${totalWidth} cm |
                <span class="font-semibold">Wysokość:</span> ${moduleH} cm |
                <span class="font-semibold">Głębokość:</span> ${depth} cm |
                <span class="font-semibold">Odstęp między półkami:</span> ${parseFloat(gap.toFixed(1))} cm
            `;
            const mobileText = `Szer: ${totalWidth}cm &bull; Wys: ${moduleH}cm &bull; Gł: ${depth}cm &bull; Odstęp: ${parseFloat(gap.toFixed(1))}cm`;

            modularInfoText.innerHTML = desktopText;
            mobileInfoContainer.innerHTML = `<p>${mobileText}</p>`;
            
            if(viewerInfoText) viewerInfoText.style.display = 'none';
            if(modularInfoText) modularInfoText.style.display = 'block';
            if(mobileInfoContainer) mobileInfoContainer.style.display = 'block';
        }


        function getCurrentWidth() { const widthOption = widthSelect.value; if (widthOption === 'custom') { if (customWidthInput) { return parseInt(customWidthInput.value) || 35; } else { return 35; } } else if (widthOption && widthOption !== "") { return parseInt(widthOption); } return NaN; }
        function updateDepthOptions() { const width = getCurrentWidth(); const height = heightSelect.value; const currentDepth = depthSelect.value; let availableDepths = ['10']; const widthValue = widthSelect.value; let allow15 = false; if (isNaN(width) || !height || height === "") { depthSelect.innerHTML = '<option value="">-- Wybierz --</option>'; depthSelect.value = ""; return; } if (widthValue === "custom") { const customWidth = width; const standardWidthKey = customWidth < 39 ? "34" : customWidth < 47 ? "44" : customWidth < 54 ? "50" : "60"; if (pricing[standardWidthKey]?.[height]?.['15'] && Object.keys(pricing[standardWidthKey]?.[height]?.['15']).length > 0) { allow15 = true; } } else { const standardWidthKey = String(width); if (pricing[standardWidthKey]?.[height]?.['15'] && Object.keys(pricing[standardWidthKey]?.[height]?.['15']).length > 0) { allow15 = true; } } if (allow15) availableDepths.push('15'); depthSelect.innerHTML = '<option value="">-- Wybierz --</option>'; availableDepths.forEach(depth => { const option = document.createElement('option'); option.value = depth; option.textContent = `${depth} cm`; depthSelect.appendChild(option); }); if (availableDepths.includes(currentDepth)) { depthSelect.value = currentDepth; } else { depthSelect.value = ""; } }
        function updateShelfCountOptions() { const height = heightSelect.value; const shelfType = shelfTypeSelect.value; const currentValue = shelfCountSelect.value; let options = { '0': 'brak półek' }; if (!height || height === "" || shelfType === 'mug_shelf' || shelfType === 'modular') { shelfCountSelect.innerHTML = ''; if (!height || height === "") { const option = document.createElement('option'); option.value = '0'; option.textContent = 'brak półek'; shelfCountSelect.appendChild(option); shelfCountSelect.value = '0'; } return; } if (height === "40") { options['1'] = '1 półka'; options['2'] = '2 półki'; } else if (height === "60") { options['1'] = '1 półka'; options['2'] = '2 półki'; options['3'] = '3 półki'; } else if (height === "80") { options['1'] = '1 półka'; options['2'] = '2 półki'; options['3'] = '3 półki'; options['4'] = '4 półki'; options['5'] = '5 półki'; } shelfCountSelect.innerHTML = ''; for (const value in options) { const option = document.createElement('option'); option.value = value; option.textContent = options[value]; shelfCountSelect.appendChild(option); } if (options.hasOwnProperty(currentValue)) { shelfCountSelect.value = currentValue; } else { shelfCountSelect.value = '0'; } if (typeof showOrHideCustomShelfToggle === 'function') showOrHideCustomShelfToggle(); }
        function checkCustomWidth() { const isCustom = widthSelect.value === 'custom'; if(customWidthInput && customWidthDisplay && customWidthFee) { customWidthInput.style.display = isCustom ? 'block' : 'none'; customWidthDisplay.style.display = isCustom ? 'inline' : 'none'; customWidthFee.style.display = isCustom ? 'inline' : 'none'; if (isCustom) { customWidthDisplay.textContent = customWidthInput.value + ' cm'; } } handleDimensionChange(); }
        function handleDimensionChange() { activeGalleryConfig = null; if (shelfTypeSelect.value !== 'mug_shelf') { updateDepthOptions(); updateShelfCountOptions(); } else { if(dividersTopCheckbox) dividersTopCheckbox.checked = false; if(dividersMiddleCheckbox) dividersMiddleCheckbox.checked = false; if(dividersBottomCheckbox) dividersBottomCheckbox.checked = false; const _dh = document.getElementById('mugDividerHint'); if (_dh) _dh.style.display = ''; if (typeof updateDividerIconActiveStates === 'function') updateDividerIconActiveStates(); } if (typeof showOrHideCustomShelfToggle === 'function') showOrHideCustomShelfToggle(); if (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled) { disableCustomPositions(); } updatePreview(); updateOrderSummary(); }
        function handleMugShelfHeightChange(isLoading = false) { const height = heightSelect.value; if (shelfCountSelect && mugShelfDividersOptionsDiv) { if (height === '60') { shelfCountSelect.innerHTML = '<option value="3">3 półki (stałe)</option>'; shelfCountSelect.value = '3'; mugShelfDividersOptionsDiv.style.display = 'block'; } else if (height === '40') { shelfCountSelect.innerHTML = '<option value="2">2 półki (stałe)</option>'; shelfCountSelect.value = '2'; mugShelfDividersOptionsDiv.style.display = 'block'; } else { shelfCountSelect.innerHTML = '<option value="">-- Wybierz --</option>'; shelfCountSelect.value = ''; mugShelfDividersOptionsDiv.style.display = 'none'; } if (!isLoading) { if(dividersTopCheckbox) dividersTopCheckbox.checked = false; if(dividersMiddleCheckbox) dividersMiddleCheckbox.checked = false; if(dividersBottomCheckbox) dividersBottomCheckbox.checked = false; if (typeof updateDividerIconActiveStates === 'function') updateDividerIconActiveStates(); } } if (!isLoading) { updatePreview(); updateOrderSummary(); } }
        
      function handleShelfTypeChange(isLoading = false) {
             const shelfType = shelfTypeSelect.value;
             // Przełącz zakładkę galerii odpowiednio do wybranego typu
             (function() {
                 const _map = { hanging:0, standing:1, mug_shelf:2, modular:3 };
                 const _idx = (_map[shelfType] !== undefined) ? _map[shelfType] : 4;
                 const _tabs = document.querySelectorAll('#galleryTabsContainer .gallery-tab');
                 if (_tabs.length > _idx) {
                     _tabs.forEach(t => t.classList.remove('active'));
                     _tabs[_idx].classList.add('active');
                     _tabs[_idx].scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
                     if (window._galleryDisplayImages) window._galleryDisplayImages(_idx);
                 }
             })();
             const _isCustomType = SHELF_TYPES.find(t => t.id === shelfType && t.isCustomLayout);
             if (!_isCustomType) { _customShelves = null; _customDividers = null; }
             // Kasuj custom shelves/dividers gdy wybrano standardowy typ
             const _isCustom = SHELF_TYPES.find(t => t.id === shelfType && t.isCustomLayout);
             if (!_isCustom) { _customShelves = null; _customDividers = null; }
             
             shelfTypeOptionsDiv.style.display = 'none';
             shelfTypeOptionsDiv.innerHTML = '';
             
             mugShelfSpecificOptionsContainer.style.display = 'none';
             modularShelfOptionsContainer.style.display = 'none';
             standardDimensionsContainer.style.display = 'block';
             shelfCountSection.style.display = 'block';
             if(viewerInfoText) viewerInfoText.style.display = 'block';
             if(modularInfoText) modularInfoText.style.display = 'none';
             
             restoreDimensionControls();
             autoRotateEnabled = false;
             
             if (!isLoading) {
                sideColorSelect.value = '';
                shelfColorSelect.value = '';
                updateSwatchDisplay('sideColor', 'sideColorSwatchDisplay');
                updateSwatchDisplay('shelfColor', 'shelfColorSwatchDisplay');
             }
             
             heightSelect.removeEventListener('change', handleMugShelfHeightChange);
             widthSelect.removeEventListener('change', handleMugShelfWidthChange);
             heightSelect.addEventListener('change', handleDimensionChange);

            if (shelfType !== 'mug_shelf') {
                if(dividersTopCheckbox) dividersTopCheckbox.checked = false;
                if(dividersMiddleCheckbox) dividersMiddleCheckbox.checked = false;
                if(dividersBottomCheckbox) dividersBottomCheckbox.checked = false;
            }

             if (shelfType === 'standing' || shelfType === 'hanging') {
                shelfTypeOptionsDiv.style.display = 'block';
                shelfTypeOptionsDiv.innerHTML = `
                    <div class="flex gap-2 flex-wrap">
                        <label class="divider-toggle-chip">
                            <input type="checkbox" id="noTopShelf" class="sr-only" onchange="updatePreview(); updateOrderSummary();">
                            <span>Bez górnej półki</span>
                        </label>
                        ${shelfType === 'standing' ? `<label class="divider-toggle-chip">
                            <input type="checkbox" id="noBottomShelf" class="sr-only" onchange="updatePreview(); updateOrderSummary();">
                            <span>Bez dołu</span>
                        </label>` : ''}
                    </div>`;
                // Ukryj opcję 84 cm — dostępna tylko dla półki na kubki
                Array.from(widthSelect.options).forEach(opt => { if (opt.value === '84') opt.style.display = 'none'; });
                if (!isLoading) {
                    widthSelect.value = '44';
                    heightSelect.value = '60';
                    handleDimensionChange(); 
                    depthSelect.value = '10';
                    shelfCountSelect.value = '2';
                    if (typeof showOrHideCustomShelfToggle === 'function') showOrHideCustomShelfToggle();
                }
             } else if (shelfType === 'mug_shelf') {
                 if (typeof disableCustomPositions === 'function') disableCustomPositions();
                 autoRotateEnabled = false;
                 const _mugCfg = SHELF_TYPES.find(t => t.id === 'mug_shelf');
                 widthSelect.innerHTML = _mugCfg.widths.map(w => `<option value="${w}">${w} cm</option>`).join('');
                 heightSelect.innerHTML = _mugCfg.heights.map(h => `<option value="${h}">${h} cm</option>`).join('');
                 widthSelect.value = '44'; heightSelect.value = '40';
                 widthSelect.removeEventListener('change', checkCustomWidth);
                 widthSelect.addEventListener('change', handleMugShelfWidthChange);
                 heightSelect.removeEventListener('change', handleDimensionChange);
                 heightSelect.addEventListener('change', handleMugShelfHeightChange);
                 depthSelect.innerHTML = '<option value="10">10 cm (stała)</option>'; depthSelect.value = '10'; depthSelect.disabled = true;
                 mugShelfSpecificOptionsContainer.style.display = 'block';
                 if (mugShelfMountOptionsDiv) {
                     mugShelfMountOptionsDiv.style.display = 'block';
                     mugShelfMountOptionsDiv.innerHTML = `
                        <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Montaż</p>
                        <div class="flex gap-2">
                            <label class="divider-toggle-chip">
                                <input type="radio" name="mugShelfMount" value="hanging" class="sr-only" onchange="updateOrderSummary(); updateMobileMountStripStates(); playMountBounceAnimation('hanging');">
                                <span>Wisząca</span>
                            </label>
                            <label class="divider-toggle-chip">
                                <input type="radio" name="mugShelfMount" value="standing" class="sr-only" onchange="updateOrderSummary(); updateMobileMountStripStates(); playMountBounceAnimation('standing');" checked>
                                <span>Stojąca</span>
                            </label>
                        </div>`;
                 }
                 handleMugShelfHeightChange(isLoading);
                 if (!isLoading) {
                     const _hint = document.getElementById('mugDividerHint');
                     if (_hint) _hint.style.display = 'block';
                 }
             } else if (shelfType === 'modular') {
                autoRotateEnabled = false;
                standardDimensionsContainer.style.display = 'none';
                shelfCountSection.style.display = 'none';
                modularShelfOptionsContainer.style.display = 'block';
                
                shelfTypeOptionsDiv.style.display = 'block';
                shelfTypeOptionsDiv.innerHTML = `
                    <div class="space-y-3">
                        <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Montaż</p>
                        <div class="flex gap-2">
                            <label class="divider-toggle-chip">
                                <input type="checkbox" id="modularHanging" class="sr-only" checked>
                                <span>Wisząca</span>
                            </label>
                            <label class="divider-toggle-chip">
                                <input type="checkbox" id="modularStanding" class="sr-only">
                                <span>Stojąca</span>
                            </label>
                        </div>
                        <div class="pt-2 border-t border-dashed border-stone-100">
                            <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Opcje</p>
                            <div class="flex gap-2">
                                <label class="divider-toggle-chip">
                                    <input type="checkbox" id="modularNoTopShelf" class="sr-only">
                                    <span>Bez góry</span>
                                </label>
                                <label class="divider-toggle-chip">
                                    <input type="checkbox" id="modularNoBottomShelf" class="sr-only">
                                    <span>Bez dołu</span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
                
                const hangingCheck = document.getElementById('modularHanging');
                const standingCheck = document.getElementById('modularStanding');
                const noTopCheck = document.getElementById('modularNoTopShelf');
                const noBottomCheck = document.getElementById('modularNoBottomShelf');

                function triggerUpdate() {
                    updatePreview();
                    updateOrderSummary();
                }
                
                hangingCheck.addEventListener('change', () => {
                    if (hangingCheck.checked) {
                        standingCheck.checked = false;
                    }
                    triggerUpdate();
                });

                standingCheck.addEventListener('change', () => {
                    if (standingCheck.checked) {
                        hangingCheck.checked = false;
                    }
                    triggerUpdate();
                });

                noTopCheck.addEventListener('change', triggerUpdate);
                noBottomCheck.addEventListener('change', triggerUpdate);

                if (!isLoading) {
                    moduleWidthSelect.value = '34'; 
                    moduleHeightSelect.value = '40'; 
                    connectingShelfWidthSelect.value = '30';
                }
                depthSelect.innerHTML = '<option value="10">10 cm (stała)</option>'; 
                depthSelect.value = '10'; 
                depthSelect.disabled = true;
            } else {
                // ── isCustomLayout: wzór z edytora półek ──────────────────────
                const customType = SHELF_TYPES.find(t => t.id === shelfType && t.isCustomLayout);
                if (customType) {
                    standardDimensionsContainer.style.display = 'none';
                    shelfCountSection.style.display = 'none';
                    shelfTypeOptionsDiv.style.display = 'block';

                    const bo = customType.buyerOptions || {};
                    const allowedW = (bo.allowedWidths && bo.allowedWidths.length > 1) ? bo.allowedWidths : null;
                    const allowD15 = !!(bo.allowDepth15);
                    const allowNoTop = !!(bo.allowNoTopShelf);
                    const allowNoBot = !!(bo.allowNoBottomShelf);
                    const allowTypeChoice = !!(bo.allowTypeChoice);

                    // Załaduj shelves/dividers + zapamiętaj bazową szerokość
                    _customShelves   = customType.shelves  ? JSON.parse(JSON.stringify(customType.shelves))  : null;
                    _customDividers  = customType.dividers ? JSON.parse(JSON.stringify(customType.dividers)) : null;
                    _baseCustomWidth = customType.width;
                    // Domyślny typ montażu: z wzoru lub 'hanging'
                    _custMountType = customType.type || 'hanging';

                    const hasAnyOption = allowedW || allowD15 || allowNoTop || allowNoBot || allowTypeChoice;
                    // Buduj panel opcji kupującego
                    let html = ``;

                    if (allowedW) {
                        html += `<div style="margin-bottom:10px">
                            <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:6px">Szerokość</div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap" id="cust-width-btns">` +
                            allowedW.map(w => `<button onclick="setCustomWidth(${w},${customType.width})" data-cw="${w}"
                                style="padding:6px 14px;border-radius:8px;border:1.5px solid ${w===customType.width?'#16a34a':'#d1d5db'};
                                background:${w===customType.width?'#f0fdf4':'#fff'};font-size:13px;font-weight:600;
                                color:${w===customType.width?'#15803d':'#374151'};cursor:pointer;transition:all .15s;"
                                class="cust-w-btn${w===customType.width?' active-cw-btn':''}">${w} cm</button>`).join('') +
                            `</div></div>`;
                    }

                    if (allowD15) {
                        html += `<div style="margin-bottom:10px">
                            <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:6px">Głębokość</div>
                            <div style="display:flex;gap:6px">
                              <button onclick="setCustDepth(10,this)" data-cd="10" class="cust-d-btn active-cd-btn"
                                style="padding:6px 14px;border-radius:8px;border:1.5px solid #16a34a;background:#f0fdf4;font-size:13px;font-weight:600;color:#15803d;cursor:pointer;transition:all .15s;">10 cm</button>
                              <button onclick="setCustDepth(15,this)" data-cd="15" class="cust-d-btn"
                                style="padding:6px 14px;border-radius:8px;border:1.5px solid #d1d5db;background:#fff;font-size:13px;font-weight:600;color:#374151;cursor:pointer;transition:all .15s;">15 cm</button>
                            </div></div>`;
                    }

                    if (allowNoTop || allowNoBot) {
                        html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">`;
                        if (allowNoTop) html += `<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;padding:6px 10px;border:1.5px solid #d1d5db;border-radius:8px;background:#fff;transition:all .15s" id="cust-notop-lbl">
                            <input type="checkbox" id="cust-notop" onchange="onCustNoTop(this)" style="accent-color:#16a34a;width:14px;height:14px"> Bez górnej półki</label>`;
                        if (allowNoBot) html += `<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;padding:6px 10px;border:1.5px solid #d1d5db;border-radius:8px;background:#fff;transition:all .15s" id="cust-nobot-lbl">
                            <input type="checkbox" id="cust-nobot" onchange="onCustNoBot(this)" style="accent-color:#16a34a;width:14px;height:14px"> Bez dolnej półki</label>`;
                        html += `</div>`;
                    }

                    if (allowTypeChoice) {
                        const isH = (_custMountType !== 'standing');
                        html += `<div style="margin-bottom:4px">
                            <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:6px">Montaż</div>
                            <div style="display:flex;gap:6px">
                                <button onclick="setCustMountType('hanging')" data-mt="hanging"
                                    style="padding:6px 14px;border-radius:8px;border:1.5px solid ${isH?'#16a34a':'#d1d5db'};
                                    background:${isH?'#f0fdf4':'#fff'};font-size:13px;font-weight:600;
                                    color:${isH?'#15803d':'#374151'};cursor:pointer;transition:all .15s;"
                                    class="cust-mt-btn${isH?' active-mt-btn':''}">Wisząca</button>
                                <button onclick="setCustMountType('standing')" data-mt="standing"
                                    style="padding:6px 14px;border-radius:8px;border:1.5px solid ${!isH?'#16a34a':'#d1d5db'};
                                    background:${!isH?'#f0fdf4':'#fff'};font-size:13px;font-weight:600;
                                    color:${!isH?'#15803d':'#374151'};cursor:pointer;transition:all .15s;"
                                    class="cust-mt-btn${!isH?' active-mt-btn':''}">Stojąca</button>
                            </div></div>`;
                    }

                    shelfTypeOptionsDiv.innerHTML = html;

                    // Ustaw wymiary bazowe
                    const _w = String(customType.width);
                    const _wOpt = Array.from(widthSelect.options).find(o => o.value === _w);
                    if (_wOpt) { widthSelect.value = _w; } else { widthSelect.value = 'custom'; if (customWidthInput) customWidthInput.value = customType.width; }
                    heightSelect.value = String(customType.height);
                    depthSelect.innerHTML = allowD15
                        ? `<option value="10">10 cm</option><option value="15">15 cm</option>`
                        : `<option value="${customType.depth}">${customType.depth} cm</option>`;
                    depthSelect.value = String(customType.depth);
                    depthSelect.disabled = !allowD15;
                    shelfCountSelect.innerHTML = `<option value="${customType.shelfCount}">${customType.shelfCount} półek</option>`;
                    shelfCountSelect.value = String(customType.shelfCount);
                    if (customType.sideColor  && !isLoading) { sideColorSelect.value  = customType.sideColor;  updateSwatchDisplay('sideColor',  'sideColorSwatchDisplay'); }
                    if (customType.shelfColor && !isLoading) { shelfColorSelect.value = customType.shelfColor; updateSwatchDisplay('shelfColor', 'shelfColorSwatchDisplay'); }
                }
            }
             
             updateDividerIconsVisibility();
             updateModularIconsVisibility();
             if (!isLoading) {
                updatePreview(true);
                updateOrderSummary();
             }
        }
// ── Buyer options helpers for isCustomLayout ─────────────────────────────
function _scaleCustomToWidth(newW) {
    if(!_baseCustomWidth || !newW) return;
    const shelfType = shelfTypeSelect ? shelfTypeSelect.value : '';
    const customType = SHELF_TYPES.find(t => t.id === shelfType && t.isCustomLayout);
    if(!customType) return;
    // Powrót do bazowej szerokości — resetuj do oryginalnych wartości wzoru
    if(newW === _baseCustomWidth) {
        _customShelves  = customType.shelves  ? JSON.parse(JSON.stringify(customType.shelves))  : null;
        _customDividers = customType.dividers ? JSON.parse(JSON.stringify(customType.dividers)) : null;
        return;
    }
    const t = 0.18 * 10; // thickness in cm = 1.8cm
    const oldInner = _baseCustomWidth - 2 * t;
    const newInner = newW - 2 * t;
    if(oldInner <= 0 || newInner <= 0) return;
    const ratio = newInner / oldInner;
    // Scale shelves
    _customShelves = (customType.shelves || []).map(s => ({
        ...s,
        width:   parseFloat((s.width   * ratio).toFixed(2)),
        offsetX: parseFloat((s.offsetX * ratio).toFixed(2)),
    }));
    // Scale dividers (x position only, height stays)
    _customDividers = (customType.dividers || []).map(d => ({
        ...d,
        x: parseFloat((d.x * ratio).toFixed(2)),
    }));
}

function setCustomWidth(w, baseW) {
    // Update button styles
    document.querySelectorAll('.cust-w-btn').forEach(btn => {
        const isActive = parseInt(btn.dataset.cw) === w;
        btn.style.borderColor = isActive ? '#16a34a' : '#d1d5db';
        btn.style.background  = isActive ? '#f0fdf4' : '#fff';
        btn.style.color       = isActive ? '#15803d' : '#374151';
        btn.classList.toggle('active-cw-btn', isActive);
    });
    // Set width select
    const wStr = String(w);
    const opt = Array.from(widthSelect.options).find(o => o.value === wStr);
    if(opt) { widthSelect.value = wStr; }
    else { widthSelect.value = 'custom'; if(customWidthInput) customWidthInput.value = w; }
    // Proportional rescale of shelves/dividers
    _scaleCustomToWidth(w);
    updatePreview(true);
    updateOrderSummary();
}

function setCustMountType(type) {
    _custMountType = type;
    document.querySelectorAll('.cust-mt-btn').forEach(btn => {
        const isActive = btn.dataset.mt === type;
        btn.style.borderColor = isActive ? '#16a34a' : '#d1d5db';
        btn.style.background  = isActive ? '#f0fdf4' : '#fff';
        btn.style.color       = isActive ? '#15803d' : '#374151';
        btn.classList.toggle('active-mt-btn', isActive);
    });
    updateOrderSummary();
}

function setCustDepth(d, btn) {
    document.querySelectorAll('.cust-d-btn').forEach(b => {
        const isActive = parseInt(b.dataset.cd) === d;
        b.style.borderColor = isActive ? '#16a34a' : '#d1d5db';
        b.style.background  = isActive ? '#f0fdf4' : '#fff';
        b.style.color       = isActive ? '#15803d' : '#374151';
        b.classList.toggle('active-cd-btn', isActive);
    });
    depthSelect.value = String(d);
    updatePreview(true);
    updateOrderSummary();
}

function onCustNoTop(cb) {
    const lbl = document.getElementById('cust-notop-lbl');
    if(lbl) { lbl.style.borderColor = cb.checked ? '#16a34a' : '#d1d5db'; lbl.style.background = cb.checked ? '#f0fdf4' : '#fff'; }
    const nt = document.getElementById('noTopShelf');
    if(nt) { nt.checked = cb.checked; }
    updatePreview(true); updateOrderSummary();
}

function onCustNoBot(cb) {
    const lbl = document.getElementById('cust-nobot-lbl');
    if(lbl) { lbl.style.borderColor = cb.checked ? '#16a34a' : '#d1d5db'; lbl.style.background = cb.checked ? '#f0fdf4' : '#fff'; }
    const nb = document.getElementById('noBottomShelf');
    if(nb) { nb.checked = cb.checked; }
    updatePreview(true); updateOrderSummary();
}
// ─────────────────────────────────────────────────────────────────────────

function updateModularIconActiveStates() {
            if(!modularShelfIconsContainer) return;
            const isHanging = document.getElementById('modularHanging')?.checked;
            const isStanding = document.getElementById('modularStanding')?.checked;
            const noTop = document.getElementById('modularNoTopShelf')?.checked;
            const noBottom = document.getElementById('modularNoBottomShelf')?.checked;

            if(mobileModularHangingBtn) mobileModularHangingBtn.classList.toggle('active-modular-icon', !!isHanging);
            if(mobileModularStandingBtn) mobileModularStandingBtn.classList.toggle('active-modular-icon', !!isStanding);
            if(mobileModularNoTopBtn) mobileModularNoTopBtn.classList.toggle('active-modular-icon', !!noTop);
            if(mobileModularNoBottomBtn) mobileModularNoBottomBtn.classList.toggle('active-modular-icon', !!noBottom);
        }

        function updateModularIconsVisibility() {
            if (!shelfContainer || !shelfTypeSelect || !modularShelfIconsContainer) return;
            const isMobile = window.innerWidth < 768;
            const isModularShelf = shelfTypeSelect.value === 'modular';
            const isMugShelf = shelfTypeSelect.value === 'mug_shelf';
            const is3dPanelActive = shelfContainer.classList.contains('active');

            if (isMobile && isModularShelf && is3dPanelActive) {
                modularShelfIconsContainer.classList.add('visible');
            } else {
                modularShelfIconsContainer.classList.remove('visible');
            }

            // ── PASEK dla WISZĄCA / STOJĄCA ──
            const hsContainer = document.getElementById('hangingStandingShelfIconsContainer');
            const hsNoBottomBtn = document.getElementById('mobileHsNoBottomBtn');
            if (hsContainer) {
                const shelfType = shelfTypeSelect.value;
                const isHangingOrStanding = (shelfType === 'hanging' || shelfType === 'standing');
                if (isMobile && isHangingOrStanding && is3dPanelActive) {
                    hsContainer.classList.add('visible');
                    // "Bez dołu" pokazujemy tylko przy stojącej
                    if (hsNoBottomBtn) hsNoBottomBtn.style.display = (shelfType === 'standing') ? '' : 'none';
                    if (typeof updateHsIconActiveStates === 'function') updateHsIconActiveStates();
                } else {
                    hsContainer.classList.remove('visible');
                }
            }

            // Panel własnego rozmieszczenia — widoczny gdy NIE ma półki na kubki/modular/wzory niestandardowe i panel 3D aktywny
            const cspPanel = document.getElementById('mobileCustomShelfPanel');
            if (cspPanel) {
                const wrapper = document.getElementById('customShelfPositionWrapper');
                const isShown = wrapper && wrapper.style.display !== 'none';
                const _isCustomLayout = typeof SHELF_TYPES !== 'undefined' && SHELF_TYPES.some(t => t.id === shelfTypeSelect.value && t.isCustomLayout);
                if (isMobile && is3dPanelActive && !isMugShelf && !isModularShelf && !_isCustomLayout && isShown) {
                    cspPanel.classList.add('visible');
                } else {
                    cspPanel.classList.remove('visible');
                }
                // sync active state
                if (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled) {
                    cspPanel.classList.add('csp-active');
                } else {
                    cspPanel.classList.remove('csp-active');
                }
            }
        }

        // ── Aktualizacja stanu aktywności ikon "Bez góry" / "Bez dołu" w pasku hanging/standing ──
        function updateHsIconActiveStates() {
            const hsNoTopBtn = document.getElementById('mobileHsNoTopBtn');
            const hsNoBottomBtn = document.getElementById('mobileHsNoBottomBtn');
            const noTopCheckbox = document.getElementById('noTopShelf');
            const noBottomCheckbox = document.getElementById('noBottomShelf');
            if (hsNoTopBtn) hsNoTopBtn.classList.toggle('active-hs-icon', !!(noTopCheckbox && noTopCheckbox.checked));
            if (hsNoBottomBtn) hsNoBottomBtn.classList.toggle('active-hs-icon', !!(noBottomCheckbox && noBottomCheckbox.checked));
        }
        
       function handleMugShelfWidthChange() { const currentMugShelfWidth = widthSelect.value; let heightChangedProgrammatically = false; if (shelfTypeSelect && shelfTypeSelect.value === 'mug_shelf' && widthSelect && heightSelect) { const sixtyCmHeightOption = Array.from(heightSelect.options).find(opt => opt.value === '60'); const fortyCmHeightOption = Array.from(heightSelect.options).find(opt => opt.value === '40'); if (currentMugShelfWidth === '84') { if (sixtyCmHeightOption) { sixtyCmHeightOption.disabled = true; sixtyCmHeightOption.style.textDecoration = 'line-through'; sixtyCmHeightOption.style.color = '#999'; } if (heightSelect.value === '60' && sixtyCmHeightOption && sixtyCmHeightOption.disabled) { if (fortyCmHeightOption && !fortyCmHeightOption.disabled) { heightSelect.value = '40'; heightChangedProgrammatically = true; } } } else { if (sixtyCmHeightOption) { sixtyCmHeightOption.disabled = false; sixtyCmHeightOption.style.textDecoration = ''; sixtyCmHeightOption.style.color = ''; } } } if(dividersTopCheckbox) dividersTopCheckbox.checked = false; if(dividersMiddleCheckbox) dividersMiddleCheckbox.checked = false; if(dividersBottomCheckbox) dividersBottomCheckbox.checked = false; if (heightChangedProgrammatically && typeof handleMugShelfHeightChange === "function") { /* handleMugShelfHeightChange wywołuje updatePreview — nie wywołuj ponownie */ handleMugShelfHeightChange(); updateOrderSummary(); } else { updatePreview(true); updateOrderSummary(); } }
        function restoreDimensionControls() { widthSelect.innerHTML = '<option value="">-- Wybierz --</option>'; originalWidthOptions.forEach(opt => widthSelect.add(new Option(opt.text, opt.value))); widthSelect.value = ""; widthSelect.removeEventListener('change', handleMugShelfWidthChange); widthSelect.removeEventListener('change', checkCustomWidth); widthSelect.addEventListener('change', checkCustomWidth); if(customWidthInput && customWidthDisplay && customWidthFee) { customWidthInput.style.display = 'none'; customWidthDisplay.style.display = 'none'; customWidthFee.style.display = 'none'; } heightSelect.innerHTML = '<option value="">-- Wybierz --</option>'; originalHeightOptions.forEach(opt => heightSelect.add(new Option(opt.text, opt.value))); heightSelect.value = ""; heightSelect.disabled = false; if(heightLabel) heightLabel.classList.remove('text-stone-400'); depthSelect.innerHTML = '<option value="">-- Wybierz --</option>'; depthSelect.value = ""; depthSelect.disabled = false; if(depthLabel) depthLabel.classList.remove('text-stone-400'); shelfCountSelect.innerHTML = '<option value="">-- Wybierz --</option>'; shelfCountSelect.value = ""; shelfCountSelect.disabled = false; heightSelect.removeEventListener('change', handleMugShelfHeightChange); heightSelect.removeEventListener('change', handleDimensionChange); heightSelect.addEventListener('change', handleDimensionChange); }
        function init3D() { const container = threeJsCanvasWrapper; if (!container) { console.error("Three.js canvas wrapper (#threeJsCanvasWrapper) not found."); return; } scene = new THREE.Scene(); scene.background = new THREE.Color(0xf0f0f0); camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000); camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z); renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); renderer.setSize(container.clientWidth, container.clientHeight); container.innerHTML = ''; renderer.domElement.style.borderRadius = '0'; container.appendChild(renderer.domElement); const _rBtn = document.createElement('button'); _rBtn.id = 'rotateToggleBtn'; _rBtn.style.cssText = 'position:absolute;bottom:10px;right:10px;z-index:20;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.92);border:1.5px solid #d1d5db;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 6px rgba(0,0,0,0.18);padding:0;'; _rBtn.title = 'Zatrzymaj/wznów obracanie'; _rBtn.onclick = function() { autoRotateEnabled = !autoRotateEnabled; const ip = document.getElementById('rotateIconPause'); const ipl = document.getElementById('rotateIconPlay'); if(ip && ipl) { if(autoRotateEnabled) { ip.style.display=''; ipl.style.display='none'; } else { ip.style.display='none'; ipl.style.display=''; } } }; _rBtn.innerHTML = '<svg id="rotateIconPause" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" style="width:15px;height:15px"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg><svg id="rotateIconPlay" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="display:none;width:15px;height:15px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3l14 9-14 9V3z"/></svg>'; container.style.position = 'relative'; container.appendChild(_rBtn); scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1)); const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); directionalLight.position.set(4, 8, 3); scene.add(directionalLight); controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.target.set(0, -2.0, 0);
        // Zablokuj obrót pionowy — tylko lewo/prawo
        const _lockedPolar = Math.PI / 2.5;
        controls.minPolarAngle = _lockedPolar;
        controls.maxPolarAngle = _lockedPolar; if (controls) { controls.addEventListener('start', () => { autoRotateEnabled = false; }); controls.addEventListener('end', () => { /* nie wznawiaj obrotu po kliknięciu */ }); } window.addEventListener('resize', onWindowResize, false); updatePreview(true); animate(); }
        function onWindowResize() { const container = threeJsCanvasWrapper; if (!camera || !renderer || !container) return; camera.clearViewOffset(); if (renderer && renderer.domElement) renderer.domElement.style.transform = ''; shiftCanvasForHeight(); const width = container.clientWidth; const height = container.clientHeight; if (width > 0 && height > 0) { camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); } else { console.warn("Skipping resize for 3D canvas wrapper with zero dimensions."); } updateDividerIconsVisibility(); updateModularIconsVisibility(); }
        let _lastFrameDataUrl = null;
        let _lastFrameCounter = 0;
        function animate() {
            requestAnimationFrame(animate);
            // Bezpiecznik: dla półki 84 cm na mobile — wymuś widok frontalny,
            // nawet jeśli coś innego spróbuje obrócić shelfGroup.
            if (shelfGroup && window.innerWidth < 768) {
                const _wNow = parseInt(widthSelect && (widthSelect.value === 'custom' ? (customWidthInput && customWidthInput.value) : widthSelect.value)) || 0;
                if (_wNow === 84) {
                    if (shelfGroup.rotation.y !== 0) shelfGroup.rotation.y = 0;
                    if (shelfGroup.rotation.x !== 0) shelfGroup.rotation.x = 0;
                    if (shelfGroup.rotation.z !== 0) shelfGroup.rotation.z = 0;
                }
            }
            if (autoRotateEnabled && shelfGroup) {
                // Dla 84 cm nie obracaj — widok frontalny
                const _wCheck = parseInt(widthSelect && (widthSelect.value === 'custom' ? (customWidthInput && customWidthInput.value) : widthSelect.value)) || 0;
                if (!(window.innerWidth < 768 && _wCheck === 84)) {
                    shelfGroup.rotation.y -= 0.003; // ZMIANA: Zmniejszona wartość dla wolniejszego obrotu
                }
            }
            if(controls) controls.update();
            if(renderer && scene && camera) {
                renderer.render(scene, camera);
                // Co 30 klatek zapisz obraz (dla snapshotu koszyka)
                _lastFrameCounter++;
                if (_lastFrameCounter % 30 === 0) {
                    try { _lastFrameDataUrl = renderer.domElement.toDataURL('image/png'); } catch(e) {}
                }
            }
        }
        
        function clearScene() {
            if (shelfGroup) {
                shelfGroup.traverse(child => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else if (child.material) {
                            child.material.dispose();
                        }
                    }
                });
                scene.remove(shelfGroup);
                shelfGroup = null;
            }
        }
        


function shiftCanvasForHeight() {
    // Usunięto translateY — powodowało zjazd półki w dół na mobile.
    // Centrowanie obsługuje kamera (controls.target + camera.position).
    if (!renderer) return;
    const canvas = renderer.domElement;
    if (!canvas) return;
    canvas.style.transform = '';
}
function fitCameraToShelf() {
    // Wyłączone — setViewOffset z ujemnym offsetY powodował wizualne zsunięcie modelu w dół.
    // Centrowanie odbywa się przez ustawienie controls.target i camera.position.
    if (!camera || !renderer) return;
    camera.clearViewOffset();
}
   function rebuildAndAnimateIn(config, withRotationAnimation = true) {

      // +++ POCZĄTEK PRZENIESIONEGO KODU +++
      // 1. Natychmiast po wywołaniu funkcji, ustawiamy kamerę w docelowej pozycji.
      if (camera && controls) {
          const _isMobile = window.innerWidth < 768;
          const _h = parseInt(config && config.height) || 60;
          const _w = parseInt(config && config.width) || 0;
          // Dla półki 84 cm (tylko mug_shelf) na mobile — widok całkowicie frontalny
          const _isWide84 = _isMobile && _w === 84;
          const _cz = _isWide84 ? 9.5 : (_isMobile ? (_h >= 80 ? 11 : 9) : (_h >= 80 ? 10 : 7));
          const _cx = _isWide84 ? 0.0001 : -4;
          const _cy = 0.5;
          const _ct = 0; // środek modelu (model jest przy y=0)
          gsap.to(camera.position, {
              x: _cx, y: _cy, z: _cz,
              duration: 0.4,
              ease: "power1.inOut",
              onUpdate: function() { controls.update(); }
          });
          controls.target.set(0, _ct, 0);
          if (_isWide84) autoRotateEnabled = false;
      }
      // +++ KONIEC PRZENIESIONEGO KODU +++

      return new Promise(resolve => {
            if (currentAnimationTimeline) {
                currentAnimationTimeline.kill();
            }

            const shelfType = config.shelfType;

            const masterTimeline = gsap.timeline({
                onComplete: () => {
                    controls.enabled = true;
                    if (shelfType !== 'mug_shelf' && shelfType !== 'modular') {
                        autoRotateEnabled = false; // ZMIANA: Wznowienie automatycznego obracania
                    }
                    
                    // Upewniamy się, że po wszystkim półka jest wyzerowana
                    if (shelfGroup) {
                       shelfGroup.rotation.set(0, 0, 0);
                    }

                    updateOrderSummary();
                    lastValidConfig = { ...config };
                    controls.update();
                    // Na mobile: model jest przy y=0, wyśrodkuj kamerę
                    if (window.innerWidth < 768 && shelfGroup && camera && controls) {
                        const _h = parseInt(heightSelect && heightSelect.value) || 60;
                        const _wCur = parseInt(config && config.width) || 0;
                        const _isWide84 = _wCur === 84;
                        const _z = _isWide84 ? 9.5 : (_h >= 80 ? 11 : _h >= 60 ? 9 : 8);
                        const _x = _isWide84 ? 0.0001 : -3;
                        controls.target.set(0, 0, 0);
                        camera.position.set(_x, 0.5, _z);
                        controls.update();
                        if (_isWide84) {
                            autoRotateEnabled = false;
                            // Dodatkowe zabezpieczenie: upewnij się że shelfGroup ma rotation = 0
                            if (shelfGroup) shelfGroup.rotation.set(0, 0, 0);
                        }
                    }
                    if (typeof shiftCanvasForHeight === 'function') shiftCanvasForHeight();
                    // Dodaj strzalki wymiarow po animacji
                    if (typeof refreshDimensionArrows === 'function') {
                        // Strzałki pojawiają się DOPIERO po animacji — z opóźnieniem i fade-in
                        setTimeout(() => {
                            refreshDimensionArrows();
                            // Fade-in strzałek: ustaw opacity=0 na wszystkich materiałach strzałek/sprite'ów,
                            // potem animuj do 1 przez GSAP
                            if (shelfGroup) {
                                const arrowObjects = shelfGroup.children.filter(c =>
                                    c.isLine ||
                                    (c.isSprite && c.name?.startsWith('dimensionLabel_')) ||
                                    (c.isMesh && c.name && (c.name.startsWith('mugHeightArrow_') || c.name.startsWith('mugWidthArrow_')))
                                );
                                arrowObjects.forEach(obj => {
                                    if (obj.material) {
                                        obj.material.transparent = true;
                                        obj.material.opacity = 0;
                                    }
                                });
                                if (arrowObjects.length > 0 && typeof gsap !== 'undefined') {
                                    gsap.to(
                                        arrowObjects.map(o => o.material).filter(Boolean),
                                        { opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.04 }
                                    );
                                }
                            }
                        }, 120);
                    }
                    resolve();
                }
            });

            currentAnimationTimeline = masterTimeline;
            controls.enabled = false;
            autoRotateEnabled = false;

            if (shelfGroup && shelfGroup.children.length > 0) {
                if (config.shelfType === 'mug_shelf') {
                    // Schowaj strzałki razem z animacją wyjścia półki
                    const _exitArrows = shelfGroup.children.filter(c =>
                        c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_'))
                    );
                    if (_exitArrows.length > 0 && typeof gsap !== 'undefined') {
                        gsap.to(_exitArrows.map(o=>o.material).filter(Boolean), { opacity: 0, duration: 0.2, ease: 'power1.in' });
                    }
                    // Uporządkowany fly-out zamiast chaotycznego scatter
                    masterTimeline.to(shelfGroup.children.map(p => p.position), {
                        y: "+=12",
                        duration: 0.45,
                        ease: 'power2.in',
                        stagger: 0.02
                    }, 0);
                    const _mugMaterialsToFade = [];
                    shelfGroup.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.transparent = true;
                            _mugMaterialsToFade.push(child.material);
                        }
                    });
                    if (_mugMaterialsToFade.length > 0) {
                        masterTimeline.to(_mugMaterialsToFade, { opacity: 0, duration: 0.35 }, "-=0.25");
                    }
                } else {
                    // Schowaj strzałki razem z animacją wyjścia półki
                    const _exitArrows2 = shelfGroup.children.filter(c =>
                        c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_'))
                    );
                    if (_exitArrows2.length > 0 && typeof gsap !== 'undefined') {
                        gsap.to(_exitArrows2.map(o=>o.material).filter(Boolean), { opacity: 0, duration: 0.18, ease: 'power1.in' });
                    }
                    masterTimeline.to(shelfGroup.children.map(p => p.position), {
                        y: "-=10",
                        duration: 0.5,
                        ease: 'power2.inOut',
                        stagger: 0.02
                    }, 0);
                    const materialsToFade = [];
                    shelfGroup.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.transparent = true;
                            materialsToFade.push(child.material);
                        }
                    });
                    if (materialsToFade.length > 0) {
                        masterTimeline.to(materialsToFade, { opacity: 0, duration: 0.4 }, "-=0.3");
                    }
                }
                masterTimeline.add(() => {
                    clearScene();
                });
            }

            if (shelfType === 'modular') {
                masterTimeline.add(() => {
                    shelfGroup = buildModularShelf(config);
                    if (!shelfGroup || shelfGroup.children.length === 0) { masterTimeline.progress(1); return; }
                    const box = new THREE.Box3().setFromObject(shelfGroup);
                    const center = box.getCenter(new THREE.Vector3());
                    shelfGroup.children.forEach(child => child.position.sub(center));
                    const finalPositions = new Map();
                    shelfGroup.traverse(child => { if (child.isMesh) { finalPositions.set(child, child.position.clone()); } });
                    
                    const leftModule = shelfGroup.getObjectByName("leftModule");
                    const rightModule = shelfGroup.getObjectByName("rightModule");
                    const connectingShelves = shelfGroup.children.filter(c => c.name.startsWith("connecting_shelf_")).sort((a, b) => b.position.y - a.position.y);
                    
                    const lm_left = leftModule.getObjectByName("leftSide");
                    const lm_right = leftModule.getObjectByName("rightSide");
                    const lm_top = leftModule.getObjectByName("topPanel");
                    const lm_bottom = leftModule.getObjectByName("bottomPanel");
                    const lm_shelves = leftModule.children.filter(c => c.name.startsWith("internalShelf_")).sort((a, b) => b.position.y - a.position.y);
                    
                    const rm_left = rightModule.getObjectByName("leftSide");
                    const rm_right = rightModule.getObjectByName("rightSide");
                    const rm_top = rightModule.getObjectByName("topPanel");
                    const rm_bottom = rightModule.getObjectByName("bottomPanel");
                    const rm_shelves = rightModule.children.filter(c => c.name.startsWith("internalShelf_")).sort((a, b) => b.position.y - a.position.y);

                    const startY = 25;
                    shelfGroup.traverse(child => {
                        if (child.isMesh) {
                            gsap.set(child.position, { y: child.position.y + startY });
                        }
                    });
                    
                    if(lm_bottom) gsap.set(lm_bottom.position, { x: lm_bottom.position.x - 15 });
                    if(rm_bottom) gsap.set(rm_bottom.position, { x: rm_bottom.position.x + 15 });
                    
                    const modelBox = new THREE.Box3().setFromObject(shelfGroup);
                    const modelSize = modelBox.getSize(new THREE.Vector3());
                    const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);
                    
                    const desiredViewSize = 14;
                    let targetScale = (desiredViewSize / maxDimension) * 1.9;
                    targetScale = Math.min(Math.max(targetScale, 0.5), 3.0);
                    shelfGroup.scale.set(targetScale, targetScale, targetScale);
                    
                    const _mobOff = 0;
                    shelfGroup.position.y = _mobOff;
                    scene.add(shelfGroup);
                    
                    const assemblyStartTime = ">+0.1";
                    const dropDuration = 0.5;
                    const slideDuration = 0.4;
                    
                    if(lm_left && rm_right) masterTimeline.to([lm_left.position, rm_right.position], { y: (i) => finalPositions.get(i === 0 ? lm_left : rm_right).y, duration: dropDuration, ease: 'back.out(1.3)' }, assemblyStartTime);
                    if(lm_bottom && rm_bottom) masterTimeline.to([lm_bottom.position, rm_bottom.position], { x: (i) => finalPositions.get(i === 0 ? lm_bottom : rm_bottom).x, y: finalPositions.get(lm_bottom).y, duration: slideDuration, ease: 'back.out(1.4)' }, `${assemblyStartTime}+=0.1`);
                    if(lm_right && rm_left) masterTimeline.to([lm_right.position, rm_left.position], { y: (i) => finalPositions.get(i === 0 ? lm_right : rm_left).y, duration: dropDuration, ease: 'back.out(1.3)' }, `${assemblyStartTime}+=0.2`);

                    const allModuleShelves = [...lm_shelves, ...rm_shelves];
                    if(allModuleShelves.length > 0) masterTimeline.to(allModuleShelves.map(s => s.position), { y: (i) => finalPositions.get(allModuleShelves[i]).y, duration: dropDuration * 0.8, ease: 'back.out(1.5)', stagger: 0.05 }, `${assemblyStartTime}+=0.3`);
                    if(connectingShelves.length > 0) masterTimeline.to(connectingShelves.map(s => s.position), { y: (i) => finalPositions.get(connectingShelves[i]).y, duration: dropDuration * 0.8, ease: 'back.out(1.5)', stagger: 0.06 }, `${assemblyStartTime}+=0.5`);
                    if(lm_top && rm_top) masterTimeline.to([lm_top.position, rm_top.position], { y: (i) => finalPositions.get(i === 0 ? lm_top : rm_top).y, duration: dropDuration, ease: 'back.out(1.25)' }, `${assemblyStartTime}+=0.7`);

                });
            } else if (shelfType === 'mug_shelf') {
                masterTimeline.add(() => {
                    shelfGroup = buildShelfModel(config);
                    if (!shelfGroup || shelfGroup.children.length === 0) {
                        masterTimeline.progress(1);
                        return;
                    }
                    // Centruj tylko po Y — geometria jest symetryczna w X/Z
                    const box = new THREE.Box3().setFromObject(shelfGroup);
                    const centerY = box.getCenter(new THREE.Vector3()).y;
                    shelfGroup.children.forEach(child => { child.position.y -= centerY; });
                    shelfGroup.position.set(0, 0, 0);
                    shelfGroup.scale.set(1.1, 1.1, 1.1);

                    // ===== ENFORCE COMPLETE DIVIDERS (fix dla galerii) =====
                    // buildShelfModel z shelf3d.js bywa niespójny przy tworzeniu przegródek
                    // (np. brak środkowego rzędu po wybraniu wzoru z galerii).
                    // Zawsze odtwarzamy je tutaj na podstawie addDividersTop/Middle/Bottom.
                    try {
                        const _mWidth = parseFloat(config.width) / 10;
                        const _mDepth = parseFloat(config.depth) / 10;
                        const _mThk   = 0.18;
                        const _hVal   = String(config.height);

                        // 1) Wyrzuć wszystkie istniejące przegródki – odbudujemy je od zera
                        const _oldDivs = shelfGroup.children.filter(c => c.name && (
                            c.name.startsWith('divider_')
                        ));
                        _oldDivs.forEach(c => shelfGroup.remove(c));

                        const _tp = shelfGroup.getObjectByName('topPanel');
                        const _bp = shelfGroup.getObjectByName('bottomPanel');
                        const _shelvesSorted = shelfGroup.children
                            .filter(c => c.name && c.name.startsWith('internalShelf_'))
                            .sort((a, b) => a.position.y - b.position.y);

                        let _levels = [];
                        if (_tp && _bp) {
                            if (_hVal === '60' && _shelvesSorted.length >= 3) {
                                _levels = [
                                    { top: _tp.position.y - _mThk/2,                bottom: _shelvesSorted[2].position.y + _mThk/2 },
                                    { top: _shelvesSorted[2].position.y - _mThk/2,  bottom: _shelvesSorted[1].position.y + _mThk/2 },
                                    { top: _shelvesSorted[1].position.y - _mThk/2,  bottom: _shelvesSorted[0].position.y + _mThk/2 },
                                    { top: _shelvesSorted[0].position.y - _mThk/2,  bottom: _bp.position.y + _mThk/2 }
                                ];
                            } else if (_hVal === '40' && _shelvesSorted.length >= 2) {
                                _levels = [
                                    { top: _tp.position.y - _mThk/2,                bottom: _shelvesSorted[1].position.y + _mThk/2 },
                                    { top: _shelvesSorted[1].position.y - _mThk/2,  bottom: _shelvesSorted[0].position.y + _mThk/2 },
                                    { top: _shelvesSorted[0].position.y - _mThk/2,  bottom: _bp.position.y + _mThk/2 }
                                ];
                            }
                        }

                        if (_levels.length > 0 && (config.addDividersTop || config.addDividersMiddle || config.addDividersBottom)) {
                            const _innerW = _mWidth - 2 * _mThk;
                            const _baseMat = new THREE.MeshStandardMaterial(originalPreviewMaterialParams);

                            const _createDivAt = (lvl, name) => {
                                const lvlH = Math.max(0.01, lvl.top - lvl.bottom);
                                if (lvlH <= 0.01) return;
                                const yC = lvl.bottom + lvlH/2;
                                const geo = new THREE.BoxGeometry(_mThk, lvlH, _mDepth);
                                if (parseInt(config.width) === 84) {
                                    const numPhysicalDividers = 3;
                                    const singleCompartmentWidth = 1.25;
                                    let xPos = -_innerW / 2;
                                    for (let i = 0; i < numPhysicalDividers; i++) {
                                        xPos += singleCompartmentWidth;
                                        const cx = xPos + (_mThk / 2);
                                        const m = new THREE.Mesh(geo.clone(), _baseMat.clone());
                                        m.position.set(cx, yC, 0);
                                        m.name = `divider_${name}_${i}`;
                                        shelfGroup.add(m);
                                        xPos += _mThk;
                                    }
                                } else {
                                    const n = (parseInt(config.width) === 60) ? 3 : (parseInt(config.width) === 44) ? 2 : 0;
                                    if (n > 0) {
                                        const sp = _innerW / (n + 1);
                                        for (let i = 1; i <= n; i++) {
                                            const m = new THREE.Mesh(geo.clone(), _baseMat.clone());
                                            m.position.set(-_innerW/2 + i*sp, yC, 0);
                                            m.name = `divider_${name}_${i}`;
                                            shelfGroup.add(m);
                                        }
                                    }
                                }
                            };

                            if (config.addDividersTop    && _levels[0]) _createDivAt(_levels[0], 'top');
                            if (config.addDividersMiddle && _levels[1]) _createDivAt(_levels[1], 'middle');
                            if (config.addDividersBottom && _levels[2]) _createDivAt(_levels[2], 'bottom');
                        }
                    } catch(_eDiv) { /* fallback: zostaw to co zwrócił buildShelfModel */ }

                    // ===== PREMIUM MUG-SHELF DROP ASSEMBLY =====
                    const finalPositions = new Map();
                    shelfGroup.children.forEach(c => finalPositions.set(c.name, {x:c.position.x, y:c.position.y, z:c.position.z}));

                    const ms_left   = shelfGroup.getObjectByName("leftSide");
                    const ms_right  = shelfGroup.getObjectByName("rightSide");
                    const ms_top    = shelfGroup.getObjectByName("topPanel");
                    const ms_bottom = shelfGroup.getObjectByName("bottomPanel");
                    const ms_internals = shelfGroup.children
                        .filter(c => c.name && c.name.startsWith("internalShelf_"))
                        .sort((a,b)=> (finalPositions.get(a.name)?.y||0) - (finalPositions.get(b.name)?.y||0));
                    const ms_dividers = shelfGroup.children
                        .filter(c => c.name && (c.name.startsWith("divider_") || c.name.startsWith("divider_editor_")));

                    // Ustaw startowe pozycje (poza sceną)
                    shelfGroup.children.forEach(c => {
                        const f = finalPositions.get(c.name);
                        if (!f) return;
                        if (c === ms_left)        gsap.set(c.position, { x: f.x - 9,  y: f.y,       z: f.z });
                        else if (c === ms_right)  gsap.set(c.position, { x: f.x + 9,  y: f.y,       z: f.z });
                        else if (c === ms_top)    gsap.set(c.position, { x: f.x,      y: f.y + 12,  z: f.z });
                        else if (c === ms_bottom) gsap.set(c.position, { x: f.x,      y: f.y - 12,  z: f.z });
                        else                      gsap.set(c.position, { x: f.x,      y: f.y + 16,  z: f.z });
                    });

                    scene.add(shelfGroup);

                    const startAt = ">+0.1";
                    const springEase = 'back.out(1.5)';

                    if (ms_bottom) {
                        masterTimeline.to(ms_bottom.position,
                            { y: finalPositions.get("bottomPanel").y, duration: 0.45, ease: 'back.out(1.2)' }, startAt);
                    }
                    if (ms_left && ms_right) {
                        masterTimeline.to([ms_left.position, ms_right.position],
                            { x: (i)=> finalPositions.get(i===0?"leftSide":"rightSide").x,
                              duration: 0.5, ease: 'back.out(1.3)' },
                            `${startAt}+=0.12`);
                    }
                    if (ms_internals.length > 0) {
                        masterTimeline.to(ms_internals.map(s => s.position),
                            { y: (i)=> finalPositions.get(ms_internals[i].name).y,
                              duration: 0.45, ease: springEase, stagger: 0.06 },
                            `${startAt}+=0.3`);
                    }
                    if (ms_dividers.length > 0) {
                        masterTimeline.to(ms_dividers.map(d => d.position),
                            { y: (i)=> finalPositions.get(ms_dividers[i].name).y,
                              duration: 0.4, ease: springEase, stagger: 0.03 },
                            `${startAt}+=0.45`);
                    }
                    if (ms_top) {
                        masterTimeline.to(ms_top.position,
                            { y: finalPositions.get("topPanel").y, duration: 0.45, ease: 'back.out(1.2)' },
                            `${startAt}+=0.6`);
                    }
                });
            } else {
                masterTimeline.add(() => {
                    shelfGroup = buildShelfModel(config);
                    if (!shelfGroup || shelfGroup.children.length === 0) { masterTimeline.progress(1); return; };
                    const box = new THREE.Box3().setFromObject(shelfGroup);
                    const center = box.getCenter(new THREE.Vector3());
                    shelfGroup.children.forEach(child => { child.position.sub(center); });
                    const finalPositions = new Map();
                    shelfGroup.children.forEach(child => finalPositions.set(child.name, child.position.clone()));
                    const leftSide = shelfGroup.getObjectByName("leftSide");
                    const rightSide = shelfGroup.getObjectByName("rightSide");
                    const topPanel = shelfGroup.getObjectByName("topPanel");
                    const bottomPanel = shelfGroup.getObjectByName("bottomPanel");
                    const internalShelves = shelfGroup.children.filter(c => c.name.startsWith("internalShelf_")).sort((a, b) => finalPositions.get(a.name).y - finalPositions.get(b.name).y);
                    // Przegródki — sortowane po X (lewo -> prawo) dla naturalnego staggera
                    const dividers = shelfGroup.children.filter(c => c.name.startsWith("divider_"))
                        .sort((a, b) => (finalPositions.get(a.name)?.x || 0) - (finalPositions.get(b.name)?.x || 0));
                    const startY = 15;
                    shelfGroup.children.forEach((child, i) => {
                        const finalPos = finalPositions.get(child.name);
                        gsap.set(child.position, { x: finalPos.x, z: finalPos.z, y: startY + i * 0.05 });
                    });
                    const _mobOff = 0;
                    shelfGroup.position.y = _mobOff;
                    shelfGroup.scale.set(1.1, 1.1, 1.1);
                    scene.add(shelfGroup);
                    const assemblyStartTime = ">+0.1";
                    const dropDuration = 0.55;
                    if (bottomPanel) { masterTimeline.to(bottomPanel.position, { y: finalPositions.get("bottomPanel").y, duration: dropDuration, ease: 'back.out(1.25)' }, assemblyStartTime); }
                    if (leftSide && rightSide) { masterTimeline.to([leftSide.position, rightSide.position], { y: finalPositions.get("leftSide").y, duration: dropDuration, ease: 'back.out(1.35)' }, `${assemblyStartTime}+=0.08`); }
                    if (internalShelves.length > 0) { masterTimeline.to(internalShelves.map(s => s.position), { y: (i) => finalPositions.get(internalShelves[i].name).y, duration: dropDuration * 0.75, ease: 'back.out(1.6)', stagger: 0.06 }, `${assemblyStartTime}+=0.2`); }
                    if (dividers.length > 0) {
                        // Fade-in z lekkim scale-bounce + sprężysty drop, stagger lewo→prawo
                        dividers.forEach(d => {
                            if (d.material) { d.material.transparent = true; d.material.opacity = 0; }
                            d.scale.y = 0.85;
                        });
                        masterTimeline.to(dividers.map(d => d.position), { y: (i) => finalPositions.get(dividers[i].name).y, duration: dropDuration * 0.8, ease: 'back.out(1.7)', stagger: 0.055 }, `${assemblyStartTime}+=0.28`);
                        masterTimeline.to(dividers.filter(d=>d.material).map(d => d.material), { opacity: 1, duration: 0.32, stagger: 0.055, ease: 'power2.out' }, `${assemblyStartTime}+=0.28`);
                        masterTimeline.to(dividers.map(d => d.scale), { y: 1, duration: 0.4, stagger: 0.055, ease: 'back.out(2.2)' }, `${assemblyStartTime}+=0.33`);
                        // Dźwięk klocka dla każdej przegródki zsynchronizowany ze staggerem
                        dividers.forEach((d, i) => {
                            masterTimeline.call(() => {
                                if (typeof window.PFX_effects !== 'undefined' && window.PFX_effects.playDividerBlock) {
                                    window.PFX_effects.playDividerBlock(i, dividers.length);
                                }
                            }, null, `${assemblyStartTime}+=${(0.28 + i * 0.055).toFixed(3)}`);
                        });
                    }
                    if (topPanel) { masterTimeline.to(topPanel.position, { y: finalPositions.get("topPanel").y, duration: dropDuration, ease: 'back.out(1.25)' }, `${assemblyStartTime}+=0.38`); }
                    
                });
            }
        });
    }


        async function updatePreview(animateChanges = true) {
            updateDividerIconActiveStates();
            updateModularIconActiveStates();
            if (!scene) return;
             if (currentAnimationTimeline) {
                currentAnimationTimeline.kill();
            }

            const shelfType = shelfTypeSelect.value;
            let config;
            
            if (shelfType === 'modular') {
                config = { 
                    shelfType: 'modular', 
                    moduleWidth: moduleWidthSelect.value, 
                    moduleHeight: moduleHeightSelect.value, 
                    connectingShelfWidth: connectingShelfWidthSelect.value, 
                    depth: depthSelect.value,
                    modularNoTopShelf: document.getElementById("modularNoTopShelf")?.checked,
                    modularNoBottomShelf: document.getElementById("modularNoBottomShelf")?.checked
                };
            } else {
                config = { width: getCurrentWidth(), height: heightSelect.value, depth: depthSelect.value, shelfCount: shelfCountSelect.value, shelfType: shelfType, noTopShelf: document.getElementById("noTopShelf")?.checked, noBottomShelf: shelfType === "standing" && document.getElementById("noBottomShelf")?.checked, addDividersTop: shelfType === 'mug_shelf' && dividersTopCheckbox?.checked, addDividersMiddle: shelfType === 'mug_shelf' && dividersMiddleCheckbox?.checked, addDividersBottom: shelfType === 'mug_shelf' && dividersBottomCheckbox?.checked, customPositions: (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled && customShelfPositions.length > 0 && shelfType !== 'mug_shelf') ? [...customShelfPositions] : null,
                    shelves:  _customShelves  || null,
                    dividers: _customDividers || null,
                };
            }

            const isConfigValid = (shelfType === 'modular') 
                ? (config.moduleWidth && config.moduleHeight && config.connectingShelfWidth && config.depth)
                : (config.width && config.height && config.depth && config.shelfCount && config.shelfType);

            if (!isConfigValid) {
                clearScene();
                lastValidConfig = {};
                return;
            }
            
            if (shelfType !== lastValidConfig.shelfType || !animateChanges) {
                await rebuildAndAnimateIn(config, animateChanges);
                lastValidConfig = { ...config };
                return;
            }

            // Wzory z edytora — płynna aktualizacja przy zmianie szerokości/głębokości
            if (config.shelves && config.shelves.length > 0) {
                // Sprawdź czy możemy płynnie zaktualizować (ta sama liczba półek I przegródek, rama istnieje)
                const _exCustomSh = shelfGroup ?
                    shelfGroup.children.filter(c => c.name && c.name.startsWith('internalShelf_')) : [];
                const _exEditorDiv = shelfGroup ?
                    shelfGroup.children.filter(c => c.name && c.name.startsWith('divider_editor_')) : [];
                const _wantDividersCount = (config.dividers || []).length;
                const _canSmooth = shelfGroup &&
                    _exCustomSh.length === config.shelves.length &&
                    _exEditorDiv.length === _wantDividersCount &&
                    shelfGroup.getObjectByName('leftSide') &&
                    shelfGroup.getObjectByName('rightSide');

                if (!_canSmooth) {
                    await rebuildAndAnimateIn(config, true);
                    lastValidConfig = { ...config };
                    return;
                }

                // ── Płynna animacja wzoru z edytora ──
                const _aDur = 0.45;
                const _tk   = 0.18;
                const _tW   = config.width / 10;
                const _tD   = config.depth / 10;

                const _la = gsap.timeline({ onComplete: () => {
                    updateOrderSummary();
                    if (typeof refreshDimensionArrows === 'function') {
                        setTimeout(() => {
                            refreshDimensionArrows();
                            // Fade-in strzałek po animacji płynnej zmiany
                            if (shelfGroup) {
                                const arrowObjs = shelfGroup.children.filter(c =>
                                    c.isLine ||
                                    (c.isSprite && c.name?.startsWith('dimensionLabel_')) ||
                                    (c.isMesh && c.name && (c.name.startsWith('mugHeightArrow_') || c.name.startsWith('mugWidthArrow_')))
                                );
                                arrowObjs.forEach(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 0; } });
                                if (arrowObjs.length > 0) gsap.to(arrowObjs.map(o=>o.material).filter(Boolean), { opacity:1, duration:0.4, ease:'power2.out', stagger:0.04 });
                            }
                        }, 60);
                    }
                }});
                currentAnimationTimeline = _la;

                const _lS = shelfGroup.getObjectByName('leftSide');
                const _rS = shelfGroup.getObjectByName('rightSide');
                const _tP = shelfGroup.getObjectByName('topPanel');
                const _bP = shelfGroup.getObjectByName('bottomPanel');

                // Boki ramy — przesunięcie X + głębokość Z
                _la.to(_lS.position, { x: -_tW / 2 + _tk / 2, duration: _aDur, ease: 'power2.out' }, 0);
                _la.to(_rS.position, { x:  _tW / 2 - _tk / 2, duration: _aDur, ease: 'power2.out' }, 0);
                _la.to([_lS.scale, _rS.scale], { z: _tD / _lS.geometry.parameters.depth, duration: _aDur, ease: 'power2.out' }, 0);

                // Górna i dolna deska (obsługa dodawania/usuwania)
                const _tH  = parseFloat(config.height) / 10;
                const _topExists = !config.noTopShelf;
                const _botExists = !config.noBottomShelf;
                const _defMat = new THREE.MeshStandardMaterial(originalPreviewMaterialParams);

                if (_topExists) {
                    if (!_tP) {
                        const _newTP = new THREE.Mesh(new THREE.BoxGeometry(_tW - 2*_tk, _tk, _tD), _defMat);
                        _newTP.name = 'topPanel'; _newTP.position.set(0, _tH/2 - _tk/2, 0); _newTP.scale.set(1, 0.01, 1);
                        shelfGroup.add(_newTP);
                        _la.to(_newTP.scale, { y: 1, duration: _aDur, ease: 'power2.out' }, 0);
                    } else {
                        _la.to(_tP.scale, { x: (_tW - 2*_tk) / _tP.geometry.parameters.width, y: 1, z: _tD / _tP.geometry.parameters.depth, duration: _aDur, ease: 'power2.out' }, 0);
                    }
                } else if (_tP) {
                    _la.to(_tP.scale, { y: 0.01, duration: _aDur / 2, onComplete: () => shelfGroup.remove(_tP) }, 0);
                }

                if (_botExists) {
                    if (!_bP) {
                        const _newBP = new THREE.Mesh(new THREE.BoxGeometry(_tW - 2*_tk, _tk, _tD), _defMat);
                        _newBP.name = 'bottomPanel'; _newBP.position.set(0, -_tH/2 + _tk/2, 0); _newBP.scale.set(1, 0.01, 1);
                        shelfGroup.add(_newBP);
                        _la.to(_newBP.scale, { y: 1, duration: _aDur, ease: 'power2.out' }, 0);
                    } else {
                        _la.to(_bP.scale, { x: (_tW - 2*_tk) / _bP.geometry.parameters.width, y: 1, z: _tD / _bP.geometry.parameters.depth, duration: _aDur, ease: 'power2.out' }, 0);
                    }
                } else if (_bP) {
                    _la.to(_bP.scale, { y: 0.01, duration: _aDur / 2, onComplete: () => shelfGroup.remove(_bP) }, 0);
                }

                // Półki (niestandardowe pozycje i szerokości z wzoru)
                config.shelves.forEach((s, i) => {
                    const _m = shelfGroup.getObjectByName(`internalShelf_${i}`);
                    if (!_m) return;
                    const _sw = parseFloat(s.width)   / 10;
                    const _sx = parseFloat(s.offsetX) / 10;
                    _la.to(_m.position, { x: _sx, duration: _aDur, ease: 'power2.out' }, 0);
                    _la.to(_m.scale, { x: _sw / _m.geometry.parameters.width, z: _tD / _m.geometry.parameters.depth, duration: _aDur, ease: 'power2.out' }, 0);
                });

                // Przegródki pionowe z wzoru
                if (config.dividers) {
                    config.dividers.forEach((dv, i) => {
                        const _m = shelfGroup.getObjectByName(`divider_editor_${i}`);
                        if (!_m) return;
                        _la.to(_m.position, { x: parseFloat(dv.x) / 10, duration: _aDur, ease: 'power2.out' }, 0);
                        _la.to(_m.scale, { z: _tD / _m.geometry.parameters.depth, duration: _aDur, ease: 'power2.out' }, 0);
                    });
                }

                lastValidConfig = { ...config };
                return;
            }

            currentAnimationTimeline = gsap.timeline();
            const animDuration = 0.5;
            const thickness = 0.18;

            if (!shelfGroup) {
                await rebuildAndAnimateIn(config, animateChanges);
                lastValidConfig = { ...config };
                return;
            }

            if (shelfType === 'modular') {
                const noTopShelfChanged = lastValidConfig.modularNoTopShelf !== config.modularNoTopShelf;
                const noBottomShelfChanged = lastValidConfig.modularNoBottomShelf !== config.modularNoBottomShelf;
                const onlyOptionsChanged = (noTopShelfChanged || noBottomShelfChanged) && 
                                           lastValidConfig.moduleWidth === config.moduleWidth &&
                                           lastValidConfig.moduleHeight === config.moduleHeight &&
                                           lastValidConfig.connectingShelfWidth === config.connectingShelfWidth;

                if (onlyOptionsChanged) {
                    const topParts = [
                        shelfGroup.getObjectByName("leftModule")?.getObjectByName("topPanel"),
                        shelfGroup.getObjectByName("rightModule")?.getObjectByName("topPanel")
                    ].filter(p => p);

                    const bottomParts = [
                        shelfGroup.getObjectByName("leftModule")?.getObjectByName("bottomPanel"),
                        shelfGroup.getObjectByName("rightModule")?.getObjectByName("bottomPanel")
                    ].filter(p => p);
                    
                    const shortAnimDuration = 0.3;

                    if (noTopShelfChanged) {
                        if (config.modularNoTopShelf) {
                            gsap.to(topParts.map(p => p.scale), { 
                                y: 0.001,
                                duration: shortAnimDuration, 
                                ease: 'power2.in',
                                onComplete: () => {
                                    topParts.forEach(p => p.visible = false);
                                }
                            });
                        } else {
                            topParts.forEach(p => p.visible = true);
                            gsap.to(topParts.map(p => p.scale), { 
                                y: 1, 
                                duration: shortAnimDuration, 
                                ease: 'power2.out'
                            });
                        }
                    }

                    if (noBottomShelfChanged) {
                         if (config.modularNoBottomShelf) {
                            gsap.to(bottomParts.map(p => p.scale), { 
                                y: 0.001, 
                                duration: shortAnimDuration, 
                                ease: 'power2.in',
                                onComplete: () => {
                                    bottomParts.forEach(p => p.visible = false);
                                }
                            });
                        } else {
                            bottomParts.forEach(p => p.visible = true);
                            gsap.to(bottomParts.map(p => p.scale), { 
                                y: 1, 
                                duration: shortAnimDuration, 
                                ease: 'power2.out'
                            });
                        }
                    }
                    
                    lastValidConfig = { ...config };
                    return; 
                }

                const targetModuleW = parseFloat(config.moduleWidth) / 10;
                const targetModuleH = parseFloat(config.moduleHeight) / 10;
                const targetConnectW = parseFloat(config.connectingShelfWidth) / 10;
                const targetDepth = parseFloat(config.depth) / 10;
                const defaultMaterial = new THREE.MeshStandardMaterial(originalPreviewMaterialParams);
            
                const leftModule = shelfGroup.getObjectByName("leftModule");
                const rightModule = shelfGroup.getObjectByName("rightModule");
            
                if (!leftModule || !rightModule) {
                    await rebuildAndAnimateIn(config, animateChanges); lastValidConfig = { ...config }; return;
                }
            
                currentAnimationTimeline.to(leftModule.position, { x: -(targetConnectW / 2 + targetModuleW / 2), duration: animDuration, ease: 'power2.out' }, 0);
                currentAnimationTimeline.to(rightModule.position, { x: (targetConnectW / 2 + targetModuleW / 2), duration: animDuration, ease: 'power2.out' }, 0);
            
                const animateModule = (module) => {
                    const leftSide = module.getObjectByName("leftSide");
                    const rightSide = module.getObjectByName("rightSide");
                    const topPanel = module.getObjectByName("topPanel");
                    const bottomPanel = module.getObjectByName("bottomPanel");
            
                    if(leftSide && rightSide && topPanel && bottomPanel) {
                        currentAnimationTimeline.to(leftSide.scale, { y: targetModuleH / leftSide.geometry.parameters.height, duration: animDuration, ease: 'power2.out' }, 0);
                        currentAnimationTimeline.to(rightSide.scale, { y: targetModuleH / rightSide.geometry.parameters.height, duration: animDuration, ease: 'power2.out' }, 0);
                        currentAnimationTimeline.to(leftSide.position, { x: -targetModuleW / 2 + thickness / 2, duration: animDuration, ease: 'power2.out' }, 0);
                        currentAnimationTimeline.to(rightSide.position, { x: targetModuleW / 2 - thickness / 2, duration: animDuration, ease: 'power2.out' }, 0);
                        
                        currentAnimationTimeline.to(topPanel.scale, { x: (targetModuleW - 2*thickness) / topPanel.geometry.parameters.width, duration: animDuration, ease: 'power2.out' }, 0);
                        currentAnimationTimeline.to(bottomPanel.scale, { x: (targetModuleW - 2*thickness) / bottomPanel.geometry.parameters.width, duration: animDuration, ease: 'power2.out' }, 0);
                        currentAnimationTimeline.to(topPanel.position, { y: targetModuleH / 2 - thickness / 2, duration: animDuration, ease: 'power2.out' }, 0);
                        currentAnimationTimeline.to(bottomPanel.position, { y: -targetModuleH / 2 + thickness / 2, duration: animDuration, ease: 'power2.out' }, 0);
                    }

                    const existingShelves = module.children.filter(c => c.name.startsWith("internalShelf_"));
                    if (existingShelves.length > 0) {
                        currentAnimationTimeline.to(existingShelves.map(s => s.scale), { x: 0.01, duration: 0.2, onComplete: () => {
                            existingShelves.forEach(s => module.remove(s));
                        }}, 0);
                    }
            
                    let newShelfCount = 3;
                    if (config.moduleHeight == '40') newShelfCount = 2;
                    if (config.moduleHeight == '80') newShelfCount = 5;
            
                    const availableHeight = targetModuleH - 2 * thickness;
                    const gap = (availableHeight - newShelfCount * thickness) / (newShelfCount + 1);
                    const newShelves = [];
                    for (let i = 0; i < newShelfCount; i++) {
                        const shelfGeo = new THREE.BoxGeometry(targetModuleW - 2 * thickness, thickness, targetDepth);
                        const shelf = new THREE.Mesh(shelfGeo, defaultMaterial);
                        shelf.name = `internalShelf_${i}`;
                        shelf.position.y = (-targetModuleH / 2) + thickness + gap * (i + 1) + thickness * i;
                        shelf.scale.x = 0.01;
                        module.add(shelf);
                        newShelves.push(shelf);
                    }
            
                    if (newShelves.length > 0) {
                        currentAnimationTimeline.to(newShelves.map(s => s.scale), { x: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, 0.2);
                    }
                };
            
                animateModule(leftModule);
                animateModule(rightModule);
            
                const oldConnectingShelves = shelfGroup.children.filter(c => c.name.startsWith("connecting_shelf_"));
                if (oldConnectingShelves.length > 0) {
                     currentAnimationTimeline.to(oldConnectingShelves.map(s => s.scale), { x: 0.01, duration: 0.2, onComplete: () => {
                        oldConnectingShelves.forEach(s => shelfGroup.remove(s));
                    }}, 0);
                }
            
                const newConnectingShelvesYPositions = [];
                let finalModuleShelvesCount = 3;
                if (config.moduleHeight == '40') finalModuleShelvesCount = 2;
                if (config.moduleHeight == '80') finalModuleShelvesCount = 5;
                const finalAvailableHeight = targetModuleH - 2 * thickness;
                const finalGap = (finalAvailableHeight - finalModuleShelvesCount * thickness) / (finalModuleShelvesCount + 1);
                
                newConnectingShelvesYPositions.push(targetModuleH / 2 - thickness / 2);
                for (let i = 0; i < finalModuleShelvesCount; i++) {
                    newConnectingShelvesYPositions.push((-targetModuleH / 2) + thickness + finalGap * (i + 1) + thickness * i);
                }
                newConnectingShelvesYPositions.push(-targetModuleH / 2 + thickness / 2);

                newConnectingShelvesYPositions.sort((a, b) => b - a);
            
                const newConnectingShelves = [];
                for (let i = 0; i < newConnectingShelvesYPositions.length - 1; i++) {
                    const middleOfGapY = (newConnectingShelvesYPositions[i] + newConnectingShelvesYPositions[i+1]) / 2;
                    const shelfGeo = new THREE.BoxGeometry(targetConnectW, thickness, targetDepth);
                    const shelf = new THREE.Mesh(shelfGeo, defaultMaterial);
                    shelf.name = `connecting_shelf_${i}`;
                    shelf.position.y = middleOfGapY;
                    shelf.scale.x = 0.01;
                    shelfGroup.add(shelf);
                    newConnectingShelves.push(shelf);
                }

                if (newConnectingShelves.length > 0) {
                     currentAnimationTimeline.to(newConnectingShelves.map(s => s.scale), { x: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, 0.2);
                }

                // Remove old dimension arrows immediately, re-add after animation
                const _oldModDimLines = shelfGroup.children.filter(c => c.isLine || (c.isSprite && c.name && c.name.startsWith('dimensionLabel_')));
                _oldModDimLines.forEach(c => shelfGroup.remove(c));
                ['leftModule','rightModule'].forEach(mn => {
                    const _m = shelfGroup.getObjectByName(mn);
                    if (!_m) return;
                    const _toRem = _m.children.filter(c => c.isLine || (c.isSprite && c.name && c.name.startsWith('dimensionLabel_')));
                    _toRem.forEach(c => _m.remove(c));
                });
                currentAnimationTimeline.add(() => {
                    if (typeof addModularDimensionArrows === 'function') {
                        addModularDimensionArrows(shelfGroup);
                        // Fade-in strzałek modularnych po animacji
                        const _allMods = ['leftModule','rightModule'].map(mn => shelfGroup.getObjectByName(mn)).filter(Boolean);
                        const _modArrows = [];
                        _allMods.forEach(mod => {
                            mod.children.filter(c => c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_')))
                               .forEach(c => _modArrows.push(c));
                        });
                        shelfGroup.children.filter(c => c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_')))
                           .forEach(c => _modArrows.push(c));
                        _modArrows.forEach(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 0; } });
                        if (_modArrows.length > 0) gsap.to(_modArrows.map(o=>o.material).filter(Boolean), { opacity:1, duration:0.45, ease:'power2.out', stagger:0.04 });
                    }
                }, animDuration + 0.08);

            } else {
                const targetWidth = config.width / 10;
                const targetHeight = parseFloat(config.height) / 10;
                const targetDepth = config.depth / 10;
                const targetShelfCount = parseInt(config.shelfCount);
                
                let leftSide = shelfGroup.getObjectByName("leftSide");
                let rightSide = shelfGroup.getObjectByName("rightSide");
                let topPanel = shelfGroup.getObjectByName("topPanel");
                let bottomPanel = shelfGroup.getObjectByName("bottomPanel");
                const defaultMaterial = new THREE.MeshStandardMaterial(originalPreviewMaterialParams);

            if (!leftSide || !rightSide) { 
                    await rebuildAndAnimateIn(config, animateChanges);
                    lastValidConfig = { ...config };
                    return;
                }
                
                currentAnimationTimeline.to(leftSide.scale, { y: targetHeight / leftSide.geometry.parameters.height, z: targetDepth / leftSide.geometry.parameters.depth, duration: animDuration }, 0);
                currentAnimationTimeline.to(rightSide.scale, { y: targetHeight / rightSide.geometry.parameters.height, z: targetDepth / rightSide.geometry.parameters.depth, duration: animDuration }, 0);
                currentAnimationTimeline.to(leftSide.position, { x: -targetWidth / 2 + thickness / 2, duration: animDuration }, 0);
                currentAnimationTimeline.to(rightSide.position, { x: targetWidth / 2 - thickness / 2, duration: animDuration }, 0);

                // Dźwięk zsynchronizowany z animacją szerokości — odpala razem z GSAP
                currentAnimationTimeline.call(() => {
                    if (typeof window.PFX_effects !== 'undefined' && window.PFX_effects.playWidthSound) {
                        const _prevW = (typeof window._widthPrevForSound !== 'undefined') ? window._widthPrevForSound : null;
                        window.PFX_effects.playWidthSound(parseFloat(config.width), _prevW);
                    }
                }, null, 0);

                const topExists = !config.noTopShelf;
                if (topExists) {
                    if (!topPanel) {
                        topPanel = new THREE.Mesh(new THREE.BoxGeometry(targetWidth - 2 * thickness, thickness, targetDepth), defaultMaterial);
                        topPanel.name = "topPanel"; topPanel.scale.set(1,0.01,1); shelfGroup.add(topPanel);
                    }
                    currentAnimationTimeline.to(topPanel.scale, { x: (targetWidth - 2*thickness) / topPanel.geometry.parameters.width, y: 1, z: targetDepth / topPanel.geometry.parameters.depth, duration: animDuration }, 0);
                    currentAnimationTimeline.to(topPanel.position, { y: targetHeight / 2 - thickness / 2, duration: animDuration }, 0);
                } else if (topPanel) {
                     currentAnimationTimeline.to(topPanel.scale, { y: 0.01, duration: animDuration / 2, onComplete: () => shelfGroup.remove(topPanel) }, 0);
                }

                const bottomExists = !config.noBottomShelf;
                if (bottomExists) {
                    if (!bottomPanel) {
                        bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(targetWidth - 2 * thickness, thickness, targetDepth), defaultMaterial);
                        bottomPanel.name = "bottomPanel"; bottomPanel.scale.set(1,0.01,1); shelfGroup.add(bottomPanel);
                    }
                    currentAnimationTimeline.to(bottomPanel.scale, { x: (targetWidth - 2*thickness) / bottomPanel.geometry.parameters.width, y:1, z: targetDepth / bottomPanel.geometry.parameters.depth, duration: animDuration }, 0);
                    currentAnimationTimeline.to(bottomPanel.position, { y: -targetHeight / 2 + thickness / 2, duration: animDuration }, 0);
                } else if (bottomPanel) {
                    currentAnimationTimeline.to(bottomPanel.scale, { y: 0.01, duration: animDuration / 2, onComplete: () => shelfGroup.remove(bottomPanel) }, 0);
                }
                
                const existingShelves = shelfGroup.children.filter(child => child.name.startsWith("internalShelf_"));
                const shelvesToRemove = existingShelves.slice(targetShelfCount);
                if (shelvesToRemove.length > 0) {
                     currentAnimationTimeline.to(shelvesToRemove.map(s => s.scale), { x: 0.01, duration: animDuration / 2, onComplete: () => {
                         shelvesToRemove.forEach(s => shelfGroup.remove(s));
                     }}, 0);
                }

                if (shelfType === 'mug_shelf' && config.height === '60') {
                    const fixedGap = 1.09;
                    const topPanelTargetY = targetHeight / 2 - thickness / 2;
                    let lastShelfY = topPanelTargetY - thickness / 2; // bottom of topPanel
                    
                    for (let i = 0; i < targetShelfCount; i++) {
                        const shelfName = `internalShelf_${i}`;
                        let shelf = shelfGroup.getObjectByName(shelfName);
                        const targetY = lastShelfY - fixedGap - thickness / 2;
                        
                        if (!shelf) {
                             shelf = new THREE.Mesh(new THREE.BoxGeometry(targetWidth - 2 * thickness, thickness, targetDepth), defaultMaterial);
                             shelf.name = shelfName; shelf.position.y = targetY; shelf.scale.set(0.01, 1, 1); shelfGroup.add(shelf);
                             currentAnimationTimeline.to(shelf.scale, { x: 1, duration: animDuration, delay: (i * 0.1) }, 0);
                        } else {
                             currentAnimationTimeline.to(shelf.position, { y: targetY, duration: animDuration }, 0);
                             currentAnimationTimeline.to(shelf.scale, { x: (targetWidth - 2 * thickness) / shelf.geometry.parameters.width, z: targetDepth / shelf.geometry.parameters.depth, duration: animDuration }, 0);
                        }
                        lastShelfY = targetY - thickness / 2;
                    }
                } else {
                    const topThicknessActual = topExists ? thickness : 0;
                    const bottomThicknessActual = bottomExists ? thickness : 0;
                    const totalAvailableHeight = targetHeight - topThicknessActual - bottomThicknessActual;
                    const gap = (totalAvailableHeight - targetShelfCount * thickness) / (targetShelfCount + 1);
                    let startY = bottomExists ? (-targetHeight / 2 + bottomThicknessActual) : (-targetHeight / 2);
                    
                    const useCustomPos = config.customPositions && config.customPositions.length === targetShelfCount;
                    // Stały punkt odniesienia – zawsze spód wnętrza (jak w syncPositionsFromModel),
                    // niezależnie od tego czy dolna półka istnieje.
                    const bottomRef = -targetHeight / 2 + thickness;

                    // Wykryj czy zmieniono tylko górną/dolną ścianę (bez zmiany ilości/rozmiaru półek)
                    const onlyPanelToggled = lastValidConfig &&
                        String(lastValidConfig.shelfCount) === String(config.shelfCount) &&
                        String(lastValidConfig.height)     === String(config.height) &&
                        String(lastValidConfig.width)      === String(config.width) &&
                        (lastValidConfig.noTopShelf !== config.noTopShelf ||
                         lastValidConfig.noBottomShelf !== config.noBottomShelf);

                    for (let i = 0; i < targetShelfCount; i++) {
                        const shelfName = `internalShelf_${i}`;
                        let shelf = shelfGroup.getObjectByName(shelfName);
                        let targetY;
                        if (useCustomPos) {
                            // customPositions są mierzone od bottomRef – pozycja półek się nie zmienia
                            targetY = bottomRef + config.customPositions[i] / 10;
                        } else if (shelf && onlyPanelToggled) {
                            // Tylko zdjęto/dodano ścianę – półki zostają na miejscu,
                            // zmienia się wyłącznie przerwa przy tej ścianie
                            targetY = shelf.position.y;
                        } else {
                            targetY = startY + (i + 1) * gap + (i + 0.5) * thickness;
                        }

                        if (!shelf) {
                            shelf = new THREE.Mesh(new THREE.BoxGeometry(targetWidth - 2 * thickness, thickness, targetDepth), defaultMaterial);
                            shelf.name = shelfName; shelf.position.y = targetY; shelf.scale.set(0.01, 1, 1); shelfGroup.add(shelf);
                            currentAnimationTimeline.to(shelf.scale, { x: 1, duration: animDuration, delay: (i * 0.1) }, 0);
                        } else {
                            currentAnimationTimeline.to(shelf.position, { y: targetY, duration: animDuration }, 0);
                            currentAnimationTimeline.to(shelf.scale, { x: (targetWidth - 2 * thickness) / shelf.geometry.parameters.width, z: targetDepth / shelf.geometry.parameters.depth, duration: animDuration }, 0);
                        }
                    }

                    // Remove old dimension arrows and add new ones after animation
                    const oldArrows = shelfGroup.children.filter(c => c.name && c.name.startsWith('dimensionLabel_'));
                    const oldLines = shelfGroup.children.filter(c => c.isLine || (c.isSprite && c.name && c.name.startsWith('dimensionLabel_')));
                    
                    if (useCustomPos) {
                        // Ukryj stare strzałki natychmiast (animacja trwa)
                        const _hideOld = shelfGroup.children.filter(c =>
                            c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_'))
                        );
                        _hideOld.forEach(c => { if (c.material) { c.material.transparent = true; c.material.opacity = 0; } });

                        setTimeout(() => {
                            // Remove old dimension elements
                            const toRemove = shelfGroup.children.filter(c => 
                                (c.isLine) || (c.isSprite && c.name && c.name.startsWith('dimensionLabel_'))
                            );
                            toRemove.forEach(c => shelfGroup.remove(c));
                            
                            // Re-add arrows with current positions
                            const internalShelves = shelfGroup.children.filter(c => c.name && c.name.startsWith('internalShelf_'));
                            const tp = shelfGroup.getObjectByName('topPanel');
                            const bp = shelfGroup.getObjectByName('bottomPanel');
                            if (internalShelves.length > 0 && shelfType !== 'mug_shelf' && typeof addShelfDimensionArrows === 'function') {
                                addShelfDimensionArrows(shelfGroup, internalShelves, bp, tp, thickness, targetWidth, targetHeight, targetDepth);
                                // Fade-in nowych strzałek
                                const newArrows = shelfGroup.children.filter(c =>
                                    c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_'))
                                );
                                newArrows.forEach(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 0; } });
                                if (newArrows.length > 0) gsap.to(newArrows.map(o=>o.material).filter(Boolean), { opacity:1, duration:0.45, ease:'power2.out', stagger:0.05 });
                            }
                        }, animDuration * 1000 + 80);
                    } else {
                        // Ukryj stare strzałki natychmiast (animacja trwa)
                        const _hideOld2 = shelfGroup.children.filter(c =>
                            c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_'))
                        );
                        _hideOld2.forEach(c => { if (c.material) { c.material.transparent = true; c.material.opacity = 0; } });

                        // Strzalki rowniez przy standardowym rozmieszczeniu
                        setTimeout(() => {
                            const toRemove = shelfGroup.children.filter(c => 
                                (c.isLine) || (c.isSprite && c.name && c.name.startsWith('dimensionLabel_'))
                            );
                            toRemove.forEach(c => shelfGroup.remove(c));
                            const internalShelves = shelfGroup.children.filter(c => c.name && c.name.startsWith('internalShelf_'));
                            const tp = shelfGroup.getObjectByName('topPanel');
                            const bp = shelfGroup.getObjectByName('bottomPanel');
                            if (internalShelves.length > 0 && shelfType !== 'mug_shelf' && typeof addShelfDimensionArrows === 'function') {
                                addShelfDimensionArrows(shelfGroup, internalShelves, bp, tp, thickness, targetWidth, targetHeight, targetDepth);
                                // Fade-in nowych strzałek
                                const newArrows = shelfGroup.children.filter(c =>
                                    c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_'))
                                );
                                newArrows.forEach(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 0; } });
                                if (newArrows.length > 0) gsap.to(newArrows.map(o=>o.material).filter(Boolean), { opacity:1, duration:0.45, ease:'power2.out', stagger:0.05 });
                            }
                        }, animDuration * 1000 + 80);
                    }
                }
            }

            if (shelfType === 'mug_shelf') {
                // Poczekaj na zakończenie animacji korpusu, potem przelicz i wstaw przegródki
                const { width: widthNum, height: heightVal, depth: depthVal, addDividersTop, addDividersMiddle, addDividersBottom } = config;
                const mugWidth = widthNum / 10;
                const mugDepth = parseFloat(depthVal) / 10;
                const mugThickness = thickness;

                currentAnimationTimeline.call(() => {
                    // Usuń stare przegródki i strzałki (z krótką animacją fade-out zamiast natychmiastowego znikania)
                    const toRemove = shelfGroup.children.filter(c => c.name && (
                        c.name.startsWith('divider_') ||
                        c.name.startsWith('mugWidthArrow_') ||
                        c.name.startsWith('mugHeightArrow_')
                    ));
                    if (toRemove.length > 0) {
                        toRemove.forEach(c => {
                            if (c.material) {
                                c.material.transparent = true;
                            }
                        });
                        const _oldDivMats = toRemove.filter(c => c.material).map(c => c.material);
                        if (_oldDivMats.length > 0) {
                            gsap.to(_oldDivMats, { opacity: 0, duration: 0.18, ease: 'power1.in',
                                onComplete: () => toRemove.forEach(c => shelfGroup.remove(c)) });
                        } else {
                            toRemove.forEach(c => shelfGroup.remove(c));
                        }
                    }

                    if (!addDividersTop && !addDividersMiddle && !addDividersBottom) return;

                    const tp = shelfGroup.getObjectByName('topPanel');
                    const bp = shelfGroup.getObjectByName('bottomPanel');
                    const shelves = shelfGroup.children
                        .filter(c => c.name && c.name.startsWith('internalShelf_'))
                        .sort((a, b) => a.position.y - b.position.y); // [0]=najniższa

                    if (!tp || !bp || shelves.length === 0) return;

                    let levels = [];
                    if (heightVal === '60' && shelves.length >= 3) {
                        levels = [
                            { top: tp.position.y - mugThickness/2, bottom: shelves[2].position.y + mugThickness/2 },
                            { top: shelves[2].position.y - mugThickness/2, bottom: shelves[1].position.y + mugThickness/2 },
                            { top: shelves[1].position.y - mugThickness/2, bottom: shelves[0].position.y + mugThickness/2 },
                            { top: shelves[0].position.y - mugThickness/2, bottom: bp.position.y + mugThickness/2 }
                        ];
                    } else if (heightVal === '40' && shelves.length >= 2) {
                        levels = [
                            { top: tp.position.y - mugThickness/2, bottom: shelves[1].position.y + mugThickness/2 },
                            { top: shelves[1].position.y - mugThickness/2, bottom: shelves[0].position.y + mugThickness/2 },
                            { top: shelves[0].position.y - mugThickness/2, bottom: bp.position.y + mugThickness/2 }
                        ];
                    }
                    if (levels.length === 0) return;

                    const innerW = mugWidth - 2 * mugThickness;
                    const mat = new THREE.MeshStandardMaterial(originalPreviewMaterialParams);

                    // Zbiera świeżo utworzone przegródki do wspólnej animacji wejścia
                    const _freshDividers = [];
                    const createDividers = (levelData, levelName) => {
                        const levelH = Math.max(0.01, levelData.top - levelData.bottom);
                        if (levelH <= 0.01) return;
                        const yCenter = levelData.bottom + levelH / 2;
                        const geo = new THREE.BoxGeometry(mugThickness, levelH, mugDepth);
                        if (widthNum == 84) {
                            const numPhysicalDividers = 3;
                            const singleCompartmentWidth = 1.25;
                            let currentXPos = -innerW / 2;
                            for (let i = 0; i < numPhysicalDividers; i++) {
                                currentXPos += singleCompartmentWidth;
                                const dividerXCenter = currentXPos + (mugThickness / 2);
                                const dMat = mat.clone();
                                dMat.transparent = true;
                                dMat.opacity = 0;
                                const m = new THREE.Mesh(geo.clone(), dMat);
                                m.position.set(dividerXCenter, yCenter + levelH * 0.6, 0);
                                m.userData._pfxFinalY = yCenter;
                                m.name = `divider_${levelName}_${i}`;
                                shelfGroup.add(m);
                                _freshDividers.push(m);
                                currentXPos += mugThickness;
                            }
                        } else {
                            const n = (widthNum == 60) ? 3 : (widthNum == 44) ? 2 : 0;
                            if (n > 0) {
                                const spacing = innerW / (n + 1);
                                for (let i = 1; i <= n; i++) {
                                    const dMat = mat.clone();
                                    dMat.transparent = true;
                                    dMat.opacity = 0;
                                    const m = new THREE.Mesh(geo.clone(), dMat);
                                    m.position.set(-innerW/2 + i*spacing, yCenter + levelH * 0.6, 0);
                                    m.userData._pfxFinalY = yCenter;
                                    m.name = `divider_${levelName}_${i}`;
                                    shelfGroup.add(m);
                                    _freshDividers.push(m);
                                }
                            }
                        }
                    };

                    if (addDividersTop && levels[0]) createDividers(levels[0], 'top');
                    if (addDividersMiddle && levels[1]) createDividers(levels[1], 'middle');
                    if (addDividersBottom && levels[2]) createDividers(levels[2], 'bottom');

                    // ===== PROFESJONALNA ANIMACJA WEJŚCIA PRZEGRÓDEK =====
                    // Stagger od lewej do prawej, lekki drop + fade-in + sprężyste osiadanie.
                    if (_freshDividers.length > 0) {
                        // Posortuj po pozycji X (lewo -> prawo) dla naturalnego stagger
                        const _ordered = _freshDividers.slice().sort((a, b) => a.position.x - b.position.x);
                        const _delayBetween = 0.055;
                        _ordered.forEach((d, idx) => {
                            const finalY = d.userData._pfxFinalY;
                            const delay = idx * _delayBetween;
                            // Drop do finalY ze sprężynką
                            gsap.to(d.position, {
                                y: finalY,
                                duration: 0.55,
                                delay: delay,
                                ease: 'back.out(1.7)'
                            });
                            // Fade in
                            gsap.to(d.material, {
                                opacity: 1,
                                duration: 0.35,
                                delay: delay,
                                ease: 'power2.out'
                            });
                            // Subtelny scale-bounce (lekkie ściśnięcie i rozprężenie)
                            d.scale.set(1, 0.85, 1);
                            gsap.to(d.scale, {
                                y: 1,
                                duration: 0.45,
                                delay: delay + 0.05,
                                ease: 'back.out(2.2)'
                            });
                        });

                        // Po zakończonej animacji odpal mikro-efekty z pakietu PFX (jeśli dostępne)
                        const _totalDur = (_ordered.length - 1) * _delayBetween + 0.6;
                        setTimeout(() => {
                            try {
                                if (window.PFX_effects) {
                                    window.PFX_effects.playTuk && window.PFX_effects.playTuk();
                                    window.PFX_effects.fireLightSweep && window.PFX_effects.fireLightSweep();
                                }
                                if (navigator.vibrate) navigator.vibrate([6, 20, 10]);
                            } catch(e){}
                        }, _totalDur * 1000);
                    }

                    // Strzałki wymiarów
                    const selLevels = [];
                    if (addDividersTop && levels[0]) selLevels.push(levels[0]);
                    if (addDividersMiddle && levels[1]) selLevels.push(levels[1]);
                    if (addDividersBottom && levels[2]) selLevels.push(levels[2]);
                    if (heightVal === '60' && levels[3]) selLevels.push(levels[3]);
                    selLevels.forEach(lvl => {
                        if (typeof addMugShelfCompartmentHeightArrow === 'function')
                            addMugShelfCompartmentHeightArrow(shelfGroup, widthNum, mugWidth, mugDepth, mugThickness, lvl);
                    });
                    const wLvl = (addDividersTop && levels[0]) ? levels[0]
                               : (addDividersMiddle && levels[1]) ? levels[1]
                               : (addDividersBottom && levels[2]) ? levels[2] : null;
                    if (wLvl && typeof addMugShelfCompartmentWidthArrow === 'function') {
                        const fb = { position: { y: wLvl.bottom - mugThickness/2 } };
                        const ft = { position: { y: wLvl.top + mugThickness/2 } };
                        addMugShelfCompartmentWidthArrow(shelfGroup, widthNum, mugWidth, mugDepth, mugThickness, fb, ft);
                    }
                });
            }
            lastValidConfig = { ...config };
        }
        
        function createSingleModule(config, material) {
            const { width, height, depth, shelfCount, thickness, noTopShelf, noBottomShelf } = config;
            const moduleGroup = new THREE.Group();
            let topPanel, bottomPanel;

            if (!noBottomShelf) {
                const bottomGeo = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth);
                bottomPanel = new THREE.Mesh(bottomGeo, material.clone());
                bottomPanel.position.y = -height / 2 + thickness / 2;
                bottomPanel.name = "bottomPanel";
                moduleGroup.add(bottomPanel);
            }

            if (!noTopShelf) {
                const topGeo = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth);
                topPanel = new THREE.Mesh(topGeo, material.clone());
                topPanel.position.y = height / 2 - thickness / 2;
                topPanel.name = "topPanel";
                moduleGroup.add(topPanel);
            }

            const sideGeo = new THREE.BoxGeometry(thickness, height, depth);
            const leftSide = new THREE.Mesh(sideGeo, material.clone());
            leftSide.position.x = -width / 2 + thickness / 2;
            leftSide.name = "leftSide";
            moduleGroup.add(leftSide);
            const rightSide = new THREE.Mesh(sideGeo, material.clone());
            rightSide.position.x = width / 2 - thickness / 2;
            rightSide.name = "rightSide";
            moduleGroup.add(rightSide);

            const topExists = !noTopShelf;
            const bottomExists = !noBottomShelf;
            const topThicknessActual = topExists ? thickness : 0;
            const bottomThicknessActual = bottomExists ? thickness : 0;
            const availableHeight = height - topThicknessActual - bottomThicknessActual;
            let startY = bottomExists ? (-height / 2 + bottomThicknessActual) : (-height / 2);

            if (shelfCount > 0) {
                const gap = (availableHeight - shelfCount * thickness) / (shelfCount + 1);
                const innerShelfGeo = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth);
                for(let i = 0; i < shelfCount; i++) {
                    const shelf = new THREE.Mesh(innerShelfGeo.clone(), material.clone());
                    const yPos = startY + (i + 1) * gap + (i + 0.5) * thickness;
                    shelf.position.y = yPos;
                    shelf.name = `internalShelf_${i}`;
                    moduleGroup.add(shelf);
                }
            }
            return moduleGroup;
        }
        function buildModularShelf(config) { 
            const mainGroup = new THREE.Group(); 
            if (!config.moduleWidth || !config.moduleHeight || !config.connectingShelfWidth || !config.depth) return mainGroup; 
            const defaultMaterial = new THREE.MeshStandardMaterial(originalPreviewMaterialParams); 
            const thickness = 0.18; 
            const moduleH = parseInt(config.moduleHeight); 
            let shelfNum = 3; 
            if (moduleH === 40) shelfNum = 2; 
            if (moduleH === 80) shelfNum = 5; 
            
            const moduleConfig = { 
                width: config.moduleWidth / 10, 
                height: config.moduleHeight / 10, 
                depth: config.depth / 10, 
                shelfCount: shelfNum, 
                thickness: thickness,
                noTopShelf: config.modularNoTopShelf,
                noBottomShelf: config.modularNoBottomShelf
            };
            const connectingShelfWidth = config.connectingShelfWidth / 10; 
            
            const leftModule = createSingleModule(moduleConfig, defaultMaterial);
            leftModule.name = "leftModule";
            leftModule.position.x = -(connectingShelfWidth/2 + moduleConfig.width/2);
            
            const rightModule = createSingleModule(moduleConfig, defaultMaterial);
            rightModule.name = "rightModule";
            rightModule.position.x = (connectingShelfWidth/2 + moduleConfig.width/2);

            mainGroup.add(leftModule, rightModule); 
            
            const connectingShelfGeometry = new THREE.BoxGeometry(connectingShelfWidth, thickness, moduleConfig.depth);
            
            const sideYPositions = [];
            const leftTopPanel = leftModule.getObjectByName("topPanel");
            const leftBottomPanel = leftModule.getObjectByName("bottomPanel");

            if (leftTopPanel) sideYPositions.push(leftTopPanel.position.y);
            sideYPositions.push(...Array.from(leftModule.children).filter(c => c.name.startsWith("internalShelf_")).sort((a,b) => b.position.y - a.position.y).map(s => s.position.y));
            if (leftBottomPanel) sideYPositions.push(leftBottomPanel.position.y);
            
            for (let i = 0; i < sideYPositions.length - 1; i++) {
                const middleOfGapY = (sideYPositions[i] + sideYPositions[i + 1]) / 2;
                const shelf = new THREE.Mesh(connectingShelfGeometry.clone(), defaultMaterial.clone());
                shelf.position.y = middleOfGapY;
                if (i === 0 && leftTopPanel) {
                    shelf.name = `connecting_shelf_top`;
                } else if (i === sideYPositions.length - 2 && leftBottomPanel) {
                    shelf.name = `connecting_shelf_bottom`;
                } else {
                    shelf.name = `connecting_shelf_${i}`;
                }
                shelf.scale.x = 1;
                mainGroup.add(shelf);
            } 
            return mainGroup; 
        }
        function buildShelfModel(config) { const group = new THREE.Group(); const { width: widthNum, height: heightVal, depth: depthVal, shelfCount: shelfCountVal, shelfType, noTopShelf, noBottomShelf, addDividersTop, addDividersMiddle, addDividersBottom } = config; if (!widthNum || !heightVal || !depthVal || shelfCountVal === undefined) return group; const defaultMaterial = new THREE.MeshStandardMaterial(originalPreviewMaterialParams); const mkMat = () => defaultMaterial.clone(); const thickness = 0.18; const width = widthNum / 10; const height = parseFloat(heightVal) / 10; const depth = parseFloat(depthVal) / 10; const shelfCount = parseInt(shelfCountVal); if (isNaN(width) || isNaN(height) || isNaN(depth) || width <= 0 || height <= 0 || depth <= 0) return group; let topPanel, bottomPanel; if (!noBottomShelf) { const bottomGeometry = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth); bottomPanel = new THREE.Mesh(bottomGeometry, mkMat()); bottomPanel.position.set(0, -height / 2 + thickness / 2, 0); bottomPanel.name = "bottomPanel"; group.add(bottomPanel); } if (!noTopShelf) { const topGeometry = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth); topPanel = new THREE.Mesh(topGeometry, mkMat()); topPanel.position.set(0, height / 2 - thickness / 2, 0); topPanel.name = "topPanel"; group.add(topPanel); } const sideGeometry = new THREE.BoxGeometry(thickness, height, depth); const leftSideMesh = new THREE.Mesh(sideGeometry, mkMat()); leftSideMesh.position.set(-width / 2 + thickness / 2, 0, 0); leftSideMesh.name = "leftSide"; group.add(leftSideMesh); const rightSideMesh = new THREE.Mesh(sideGeometry, mkMat()); rightSideMesh.position.set(width / 2 - thickness / 2, 0, 0); rightSideMesh.name = "rightSide"; group.add(rightSideMesh); const internalShelves = []; if (!isNaN(shelfCount) && shelfCount > 0) { if (shelfType === 'mug_shelf' && heightVal === '60' && topPanel) { const fixedGap = 1.09; const topPanelBottomY = topPanel.position.y - thickness / 2; let lastShelfY = topPanelBottomY; const mugShelfCount60 = 3; for (let i = 0; i < mugShelfCount60; i++) { const shelfY = lastShelfY - fixedGap - thickness / 2; const shelfGeometry = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth); const shelfMesh = new THREE.Mesh(shelfGeometry, mkMat()); shelfMesh.position.set(0, shelfY, 0); shelfMesh.name = `internalShelf_${i}`; group.add(shelfMesh); internalShelves.push(shelfMesh); lastShelfY = shelfY - thickness / 2; } } else { const topExists = !!topPanel; const bottomExists = !!bottomPanel; const topThicknessActual = topExists ? thickness : 0; const bottomThicknessActual = bottomExists ? thickness : 0; const totalAvailableHeight = height - topThicknessActual - bottomThicknessActual; if (totalAvailableHeight >= shelfCount * thickness && (shelfCount + 1) > 0) { const useCustom = config.customPositions && config.customPositions.length === shelfCount; if (useCustom) { const bottomY = -height / 2 + thickness; for (let i = 0; i < shelfCount; i++) { const posFromBottom = config.customPositions[i] / 10; const shelfY = bottomY + posFromBottom; const shelfGeometry = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth); const shelfMesh = new THREE.Mesh(shelfGeometry, mkMat()); shelfMesh.position.set(0, shelfY, 0); shelfMesh.name = `internalShelf_${i}`; group.add(shelfMesh); internalShelves.push(shelfMesh); } } else { const gap = (height - 2*thickness - shelfCount * thickness) / (shelfCount + 1); let startY = -height / 2 + thickness; for (let i = 1; i <= shelfCount; i++) { const shelfY = startY + i * gap + (i - 0.5) * thickness; const shelfGeometry = new THREE.BoxGeometry(width - 2 * thickness, thickness, depth); const shelfMesh = new THREE.Mesh(shelfGeometry, mkMat()); shelfMesh.position.set(0, shelfY, 0); shelfMesh.name = `internalShelf_${i-1}`; group.add(shelfMesh); internalShelves.push(shelfMesh); } } } } } if (config.customPositions && internalShelves.length > 0) { if (typeof addShelfDimensionArrows === 'function') addShelfDimensionArrows(group, internalShelves, bottomPanel, topPanel, thickness, width, height, depth); } if (shelfType === 'mug_shelf' && topPanel && bottomPanel && internalShelves.length > 0) { if (addDividersTop || addDividersMiddle || addDividersBottom) { const innerWidthForDividers = width - 2 * thickness; const dividerThicknessThreeJs = thickness; let levels = []; internalShelves.sort((a, b) => a.position.y - b.position.y); if (heightVal === '60' && internalShelves.length === 3) { levels = [ { top: topPanel.position.y - thickness / 2, bottom: internalShelves[2].position.y + thickness/2 }, { top: internalShelves[2].position.y - thickness/2, bottom: internalShelves[1].position.y + thickness/2 }, { top: internalShelves[1].position.y - thickness/2, bottom: internalShelves[0].position.y + thickness/2 }, { top: internalShelves[0].position.y - thickness/2, bottom: bottomPanel.position.y + thickness / 2 } ]; } else if (heightVal === '40' && internalShelves.length === 2) { levels = [ { top: topPanel.position.y - thickness / 2, bottom: internalShelves[1].position.y + thickness/2 }, { top: internalShelves[1].position.y - thickness/2, bottom: internalShelves[0].position.y + thickness/2 }, { top: internalShelves[0].position.y - thickness/2, bottom: bottomPanel.position.y + thickness / 2 } ]; } const drawDividersForLevel = (levelData) => { const levelH = Math.max(0.01, levelData.top - levelData.bottom); if (levelH <= 0.01) return; const yCenter = levelData.bottom + levelH / 2; const dividerGeometry = new THREE.BoxGeometry(dividerThicknessThreeJs, levelH, depth); if (widthNum == 84) { const numPhysicalDividers = 3; const singleCompartmentWidth = 1.25; let currentXPos = -innerWidthForDividers / 2; for (let i = 0; i < numPhysicalDividers; i++) { currentXPos += singleCompartmentWidth; const dividerXCenter = currentXPos + (dividerThicknessThreeJs / 2); const dividerMesh = new THREE.Mesh(dividerGeometry.clone(), mkMat()); dividerMesh.position.set(dividerXCenter, yCenter, 0); dividerMesh.name = `divider_h84_${i}`; group.add(dividerMesh); currentXPos += dividerThicknessThreeJs; } } else { const numDividersOriginal = (widthNum == 60) ? 3 : ((widthNum == 44) ? 2 : 0); if (numDividersOriginal > 0) { const dividerSpacing = innerWidthForDividers / (numDividersOriginal + 1); for (let i = 1; i <= numDividersOriginal; i++) { const xPos = (-innerWidthForDividers / 2) + i * dividerSpacing; const dividerMesh = new THREE.Mesh(dividerGeometry.clone(), mkMat()); dividerMesh.position.set(xPos, yCenter, 0); dividerMesh.name = `divider_${i}`; group.add(dividerMesh); } } } }; if (addDividersTop && levels[0]) drawDividersForLevel(levels[0]); if (addDividersMiddle && levels[1]) drawDividersForLevel(levels[1]); if (addDividersBottom && levels[2]) drawDividersForLevel(levels[2]); // --- Wymiary przegródek kubkowych ---
            // Wysokość: na każdej zaznaczonej przegródce + dolna wnęka (tylko h=60, levels[3])
            const selectedLevelsForHeight = [];
            if (addDividersTop && levels[0]) selectedLevelsForHeight.push(levels[0]);
            if (addDividersMiddle && levels[1]) selectedLevelsForHeight.push(levels[1]);
            if (addDividersBottom && levels[2]) selectedLevelsForHeight.push(levels[2]);
            // Dolna duża wnęka dla h=60 — zawsze pokazuj wymiar wysokości
            if (heightVal === '60' && levels[3]) selectedLevelsForHeight.push(levels[3]);
            selectedLevelsForHeight.forEach(function(lvl) {
                if (typeof addMugShelfCompartmentHeightArrow === 'function') {
                    addMugShelfCompartmentHeightArrow(group, widthNum, width, depth, thickness, lvl);
                }
            });
            // Szerokość: tylko na pierwszej (najwyższej) zaznaczonej przegródce
            let widthLevelData = null;
            if (addDividersTop && levels[0]) widthLevelData = levels[0];
            else if (addDividersMiddle && levels[1]) widthLevelData = levels[1];
            else if (addDividersBottom && levels[2]) widthLevelData = levels[2];
            if (widthLevelData && typeof addMugShelfCompartmentWidthArrow === 'function') {
                const _fakeBottom = { position: { y: widthLevelData.bottom - thickness / 2 } };
                const _fakeTop = { position: { y: widthLevelData.top + thickness / 2 } };
                addMugShelfCompartmentWidthArrow(group, widthNum, width, depth, thickness, _fakeBottom, _fakeTop);
            }
          } }

            // ── EDITOR2: custom shelves (variable width, offsetX) ──────────────
            // config.shelves = [{width, offsetX, y}, ...] — values in cm from editor2
            if (config.shelves && config.shelves.length > 0 && shelfType !== 'mug_shelf') {
                // Remove auto-generated internalShelves (already in group) and replace
                const toRemove = [];
                group.traverse(child => { if (child.isMesh && child.name && child.name.startsWith('internalShelf_')) toRemove.push(child); });
                toRemove.forEach(m => group.remove(m));

                config.shelves.forEach((s, i) => {
                    const sw  = parseFloat(s.width)   / 10;
                    const sox = parseFloat(s.offsetX)  / 10;
                    const sy  = parseFloat(s.y)        / 10;
                    if (isNaN(sw) || sw <= 0) return;
                    const geo  = new THREE.BoxGeometry(sw, thickness, depth);
                    const mesh = new THREE.Mesh(geo, mkMat());
                    mesh.position.set(sox, sy, 0);
                    mesh.name = `internalShelf_${i}`;
                    group.add(mesh);
                });
            }

            // ── EDITOR2: custom dividers (x, fromY, toY) ──────────────────────
            // config.dividers = [{x, fromY, toY}, ...] — values in cm from editor2
            // Only applied for non-mug shelves (mug dividers handled above)
            if (config.dividers && config.dividers.length > 0 && shelfType !== 'mug_shelf') {
                config.dividers.forEach((dv, i) => {
                    const dx    = parseFloat(dv.x)     / 10;
                    const dfrom = parseFloat(dv.fromY)  / 10;
                    const dto   = parseFloat(dv.toY)    / 10;
                    if (isNaN(dx) || isNaN(dfrom) || isNaN(dto)) return;
                    const dh   = Math.abs(dto - dfrom);
                    const dcy  = (dfrom + dto) / 2;
                    if (dh <= 0) return;
                    const geo  = new THREE.BoxGeometry(thickness, dh, depth);
                    const mesh = new THREE.Mesh(geo, mkMat());
                    mesh.position.set(dx, dcy, 0);
                    mesh.name = `divider_editor_${i}`;
                    group.add(mesh);
                });
            }

            return group; }
        function generate3dSnapshotFromCurrentModel() {
            return new Promise((resolve, reject) => {
                const shelfType = shelfTypeSelect ? shelfTypeSelect.value : '';
                let freshConfig;
                if (shelfType === 'modular') {
                    freshConfig = { shelfType: 'modular', moduleWidth: moduleWidthSelect.value, moduleHeight: moduleHeightSelect.value, connectingShelfWidth: connectingShelfWidthSelect.value, depth: depthSelect.value, modularNoTopShelf: document.getElementById("modularNoTopShelf")?.checked, modularNoBottomShelf: document.getElementById("modularNoBottomShelf")?.checked };
                } else {
                    freshConfig = { width: getCurrentWidth(), height: heightSelect.value, depth: depthSelect.value, shelfCount: shelfCountSelect.value, shelfType: shelfType, noTopShelf: document.getElementById("noTopShelf")?.checked, noBottomShelf: shelfType === "standing" && document.getElementById("noBottomShelf")?.checked, addDividersTop: shelfType === 'mug_shelf' && dividersTopCheckbox?.checked, addDividersMiddle: shelfType === 'mug_shelf' && dividersMiddleCheckbox?.checked, addDividersBottom: shelfType === 'mug_shelf' && dividersBottomCheckbox?.checked, customPositions: (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled && customShelfPositions.length > 0 && shelfType !== 'mug_shelf') ? [...customShelfPositions] : null,
                        shelves:  _customShelves  || null,
                        dividers: _customDividers || null,
                    };
                }

                let freshGroup;
                if (shelfType === 'modular' && typeof buildModularShelf === 'function') {
                    freshGroup = buildModularShelf(freshConfig);
                } else {
                    // FIX: zawsze buduj świeży model z freshConfig zamiast klonować aktualny shelfGroup.
                    // Klonowanie łapało stan sceny z poprzedniej półki (np. modularnej) zanim
                    // animacja przebudowy się zakończyła, albo z nieaktualnymi strzałkami wymiarów.
                    freshGroup = buildShelfModel(freshConfig);
                }

                if (!freshGroup || freshGroup.children.length === 0) {
                    if (shelfGroup) { freshGroup = shelfGroup.clone(true); }
                    else { return reject(new Error("Nie można zbudować modelu.")); }
                }

                const snapshotScene = new THREE.Scene();
                snapshotScene.background = new THREE.Color(0xffffff);
                const snapshotCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);

                snapshotScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
                const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                dirLight.position.set(5, 10, 7.5);
                snapshotScene.add(dirLight);

                freshGroup.rotation.set(0, 0, 0);
                freshGroup.scale.set(1, 1, 1);

                const box = new THREE.Box3().setFromObject(freshGroup);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                freshGroup.position.sub(center);
                snapshotScene.add(freshGroup);

                // Add dimension arrows to snapshot
                const _snapThickness = 0.18;
                if (shelfType === 'modular') {
                    if (typeof addModularDimensionArrows === 'function') {
                        addModularDimensionArrows(freshGroup);
                    }
                } else if (shelfType === 'mug_shelf') {
                    // Wymiary dla półki na kubki rysowane są już wewnątrz buildShelfModel (gdy zaznaczone przegródki),
                    // więc nie dodajemy ich ponownie tutaj — tylko upewniamy się, że nie dorzucamy zwykłych strzałek.
                } else {
                    const _snapShelves = freshGroup.children.filter(ch => ch.isMesh && ch.name && ch.name.startsWith('internalShelf_'));
                    if (_snapShelves.length > 0 && typeof addShelfDimensionArrows === 'function') {
                        const _snapTp = freshGroup.getObjectByName('topPanel');
                        const _snapBp = freshGroup.getObjectByName('bottomPanel');
                        const _snapW = parseFloat(freshConfig.width) / 10;
                        const _snapH = parseFloat(freshConfig.height) / 10;
                        const _snapD = parseFloat(freshConfig.depth) / 10;
                        addShelfDimensionArrows(freshGroup, _snapShelves, _snapBp, _snapTp, _snapThickness, _snapW, _snapH, _snapD);
                    }
                }

                // Przelicz bounding box PO dodaniu strzałek wymiarowych (żeby były w kadrze) i wycentruj kamerę na rzeczywistej geometrii
                const boxWithArrows = new THREE.Box3().setFromObject(freshGroup);
                const sizeWithArrows = boxWithArrows.getSize(new THREE.Vector3());
                const centerWithArrows = boxWithArrows.getCenter(new THREE.Vector3());

                const maxDim = Math.max(sizeWithArrows.x, sizeWithArrows.y, sizeWithArrows.z);
                const fov = snapshotCamera.fov * (Math.PI / 180);
                let distance = maxDim / (2 * Math.tan(fov / 2));
                distance *= 1.25; // trochę mniej zapasu niż wcześniej — dzięki temu małe półki (np. kubki) nie są w miniaturce zbyt małe
                const finalDistance = Math.max(distance, 3.5); // niższe minimum — dla małych półek jak kubki (44×40)

                const viewVector = new THREE.Vector3(-7, 1.5, 6).normalize();
                snapshotCamera.position.copy(viewVector).multiplyScalar(finalDistance).add(centerWithArrows);
                snapshotCamera.lookAt(centerWithArrows);

                const snapshotRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
                snapshotRenderer.setPixelRatio(window.devicePixelRatio);
                snapshotRenderer.setSize(512, 512);

                setTimeout(() => {
                    try {
                        snapshotRenderer.render(snapshotScene, snapshotCamera);
                        const dataUrl = snapshotRenderer.domElement.toDataURL('image/png');
                        snapshotScene.traverse(object => {
                            if (!object.isMesh) return;
                            if (object.geometry) object.geometry.dispose();
                            if (object.material) {
                                if (Array.isArray(object.material)) { object.material.forEach(m => m.dispose()); }
                                else { object.material.dispose(); }
                            }
                        });
                        snapshotRenderer.dispose();
                        resolve(dataUrl);
                    } catch (e) {
                        snapshotRenderer.dispose();
                        reject(e);
                    }
                }, 50);
            });
        }

        function reset3DView() { if (controls && camera) { controls.reset(); const _isMob = window.innerWidth < 768; const _hh = parseInt(heightSelect && heightSelect.value) || 60; const _t = (_isMob && _hh >= 80) ? -3.2 : (_isMob && _hh >= 60) ? -2.5 : -2.0; camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z); controls.target.set(0, _t, 0); controls.update(); setActiveMobileIcon(null); if (shelfTypeSelect && shelfTypeSelect.value !== 'mug_shelf' && shelfTypeSelect.value !== 'modular') { autoRotateEnabled = false; } } }
        function computePriceDetailed() {
            const shelfType = shelfTypeSelect.value;
            // ── isCustomLayout: wzór z edytora półek ──────────────────────
            const _customLayoutType = SHELF_TYPES.find(t => t.id === shelfType && t.isCustomLayout);
            if (_customLayoutType) {
                const basePrice = (typeof customPrices !== 'undefined' && customPrices[shelfType] !== undefined)
                    ? customPrices[shelfType]
                    : null;
                if (basePrice === null) return null;
                return { base: basePrice, extra: 0, divider: 0, customFee: 0, deduction: 0, total: Math.max(FEES.minPrice, basePrice) };
            }
            if (shelfType === 'modular') {
                const moduleW = parseInt(moduleWidthSelect.value);
                const moduleH = parseInt(moduleHeightSelect.value);
                const connectingW = parseInt(connectingShelfWidthSelect.value);
                if (isNaN(moduleW) || isNaN(moduleH) || isNaN(connectingW)) return null;
                let shelfNum;
                if (moduleH === 40) { shelfNum = 2; } else if (moduleH === 60) { shelfNum = 3; } else if (moduleH === 80) { shelfNum = 5; } else { return null; }
                const baseShelfPrice = pricing[String(moduleW)]?.[String(moduleH)]?.['10']?.[String(shelfNum)];
                if (!baseShelfPrice) return null;
                const connectingShelfCount = shelfNum + 1;
                let connectingPrice = 0;
                if (connectingW === 30) { connectingPrice = connectingShelfCount * FEES.modularConnector[30]; } else if (connectingW === 40) { connectingPrice = connectingShelfCount * FEES.modularConnector[40]; } else { return null; }
                
                let deduction = 0;
                const noTop = document.getElementById('modularNoTopShelf')?.checked;
                const noBottom = document.getElementById('modularNoBottomShelf')?.checked;

                if (noTop) deduction += FEES.modularNoTop;
                if (noBottom) deduction += FEES.modularNoBottom;

                const total = (baseShelfPrice * 2) + connectingPrice - deduction;
                return { base: (baseShelfPrice * 2) + connectingPrice, extra: 0, divider: 0, deduction: deduction, total: Math.max(FEES.modularMinPrice, total) };
            }
            const widthVal = getCurrentWidth(); const heightVal = heightSelect.value; const depthVal = depthSelect.value; const shelfCountVal = shelfCountSelect.value; if (!shelfType || isNaN(widthVal) || !heightVal || !depthVal || !shelfCountVal || widthVal === "" || heightVal === "" || depthVal === "" || shelfCountVal === "" || (shelfType !== 'mug_shelf' && shelfCountVal === "0")) { return null; } let basePrice = null; let extraFee = 0; let deduction = 0; let dividerFee = 0; if (shelfType === 'mug_shelf') { const selectedMountRadio = document.querySelector('input[name="mugShelfMount"]:checked'); if (!selectedMountRadio) return null; if (mugShelfPricing[String(widthVal)]?.[heightVal] !== undefined) { basePrice = mugShelfPricing[String(widthVal)][heightVal]; } else { return null; } 
        const dividersTopChecked = dividersTopCheckbox?.checked; 
        const dividersMiddleChecked = dividersMiddleCheckbox?.checked; 
        const dividersBottomChecked = dividersBottomCheckbox?.checked; 
        if (!dividersTopChecked && !dividersMiddleChecked && !dividersBottomChecked) {
            return null;
        }
        if (widthVal == 84) { if (dividersTopChecked) dividerFee += 33; if (dividersMiddleChecked) dividerFee += 33; if (dividersBottomChecked) dividerFee += 33; } else { let feePerDividerRow = 0; if (widthVal == 44) feePerDividerRow = 27; else if (widthVal == 60) feePerDividerRow = 40; if (feePerDividerRow > 0) { if (dividersTopChecked) dividerFee += feePerDividerRow; if (dividersMiddleChecked) dividerFee += feePerDividerRow; if (dividersBottomChecked) dividerFee += feePerDividerRow; } } 
    } else { let baseWidthKey; const isCustomWidth = widthSelect.value === 'custom'; if (isCustomWidth) { if (isNaN(widthVal) || widthVal < 35 || widthVal > 59) return null; baseWidthKey = widthVal < 39 ? "34" : widthVal < 47 ? "44" : widthVal < 54 ? "50" : "60"; extraFee = FEES.customWidth; } else { baseWidthKey = String(widthVal); } if (pricing[baseWidthKey]?.[heightVal]?.[depthVal]?.[shelfCountVal] !== undefined) { basePrice = pricing[baseWidthKey][heightVal][depthVal][shelfCountVal]; } else { return null; } if (document.getElementById('noTopShelf')?.checked) deduction += FEES.noTopShelf; if (shelfType === 'standing' && document.getElementById('noBottomShelf')?.checked) deduction += FEES.noBottomShelf; } if (basePrice === null) return null; const customFee = (typeof customPositionsModified !== 'undefined' && customPositionsModified) ? FEES.customPositions : 0; const totalPrice = basePrice + extraFee + dividerFee + customFee - deduction; return { base: basePrice, extra: extraFee, divider: dividerFee, customFee: customFee, deduction: deduction, total: Math.max(FEES.minPrice, totalPrice) }; }
        function updateSectionHighlights() {
            const sections = [shelfTypeSectionAnchor, dimensionSectionAnchor, colorSectionAnchor, shelfCountSection];
            const mugParent = mugShelfSpecificOptionsContainer ? mugShelfSpecificOptionsContainer.closest('.p-6.shadow.rounded-lg') : null;
            if(mugParent && !sections.includes(mugParent)) sections.push(mugParent);

            sections.forEach(sec => {
                if (sec) sec.classList.remove('requires-attention');
            });

            /* --- Mobile: helper do kropki "wymaga uwagi" na ikonce --- */
            const _setIconNeedsAction = (queryStr, needs) => {
                const btn = document.querySelector(`#mobilePanelIcons button[onclick*="${queryStr}"]`);
                if (btn) {
                    if (needs) btn.classList.add('mobile-icon-needs-action');
                    else btn.classList.remove('mobile-icon-needs-action');
                }
            };

            // Krok 1: Sprawdź rodzaj półki
            if (!shelfTypeSelect.value) {
                shelfTypeSectionAnchor.classList.add('requires-attention');
                _setIconNeedsAction('shelfTypeSectionAnchor', true);
                return;
            }
            _setIconNeedsAction('shelfTypeSectionAnchor', false);

            const shelfType = shelfTypeSelect.value;

            // Krok 2: Sprawdź wymiary
            let dimensionsComplete = false;
            if (shelfType === 'modular') {
                if (moduleWidthSelect.value && moduleHeightSelect.value && connectingShelfWidthSelect.value) {
                    dimensionsComplete = true;
                }
            } else if (shelfType === 'mug_shelf') {
                if (widthSelect.value && heightSelect.value) {
                    dimensionsComplete = true;
                }
            } else {
                if (!isNaN(getCurrentWidth()) && heightSelect.value && depthSelect.value) {
                    dimensionsComplete = true;
                }
            }

            if (!dimensionsComplete) {
                dimensionSectionAnchor.classList.add('requires-attention');
                _setIconNeedsAction('dimensionSectionAnchor', true);
                return;
            }
            _setIconNeedsAction('dimensionSectionAnchor', false);

            // Krok 3: Sprawdź opcje specyficzne dla danego typu (przegródki lub liczba półek)
            if (shelfType === 'mug_shelf') {
                const dividersSelected = dividersTopCheckbox?.checked || dividersMiddleCheckbox?.checked || dividersBottomCheckbox?.checked;
                if (!dividersSelected) {
                    shelfTypeSectionAnchor.classList.add('requires-attention');
                    _setIconNeedsAction('shelfTypeSectionAnchor', true);
                    return;
                }
            } else if (shelfType === 'standing' || shelfType === 'hanging') {
                if (!shelfCountSelect.value || shelfCountSelect.value === "0") {
                    shelfCountSection.classList.add('requires-attention');
                    _setIconNeedsAction('shelfCountSection', true);
                    return;
                }
            }
            _setIconNeedsAction('shelfCountSection', false);

            // Krok 4: Sprawdź kolory
            if (!sideColorSelect.value || !shelfColorSelect.value) {
                colorSectionAnchor.classList.add('requires-attention');
                _setIconNeedsAction('colorSectionAnchor', true);
                return;
            }
            _setIconNeedsAction('colorSectionAnchor', false);
        }


        function updateOrderSummary() {
    const mobileShelvesButton = document.querySelector('#mobilePanelIcons button[onclick*="shelfCountSection"]');
    const currentShelfType = shelfTypeSelect.value;
    if (mobileShelvesButton) {
        if (currentShelfType === 'modular') {
            mobileShelvesButton.style.display = 'none';
        } else {
            mobileShelvesButton.style.display = 'flex';
        }
    }

    const orderSummarySection = document.getElementById('orderSummarySection');
    if (orderSummarySection) {
        orderSummarySection.classList.remove('summary-highlight');
    }

    const shelfColorSummaryLabel = document.getElementById('shelfColorSummaryLabel');
    if (shelfColorSummaryLabel) {
        if (currentShelfType === 'mug_shelf') shelfColorSummaryLabel.textContent = 'Kolor półek i przegródek:';
        else shelfColorSummaryLabel.textContent = 'Kolor półek i podstaw:';
    }
    // Nazwa typu — dla custom layoutów z wyborem montażu dołącz info o montażu
    const _isCustomSt = currentShelfType && SHELF_TYPES.find(t => t.id === currentShelfType && t.isCustomLayout);
    const _custBo = _isCustomSt ? (_isCustomSt.buyerOptions || {}) : null;
    if (_isCustomSt && _custBo && _custBo.allowTypeChoice && _custMountType) {
        const _mtLabel = _custMountType === 'standing' ? 'Stojąca' : 'Wisząca';
        const _typeName = shelfTypeSelect.selectedIndex > 0 ? shelfTypeSelect.options[shelfTypeSelect.selectedIndex].text : '';
        document.getElementById("shelfTypeSummary").textContent = _typeName ? `${_typeName} · ${_mtLabel}` : _mtLabel;
    } else {
        document.getElementById("shelfTypeSummary").textContent = currentShelfType && shelfTypeSelect.selectedIndex > 0 ? shelfTypeSelect.options[shelfTypeSelect.selectedIndex].text : "-- Wybierz --";
    }
    const mugShelfMountItem = document.getElementById("mugShelfMountSummaryItem");
    const mugShelfMountSummary = document.getElementById("mugShelfMountSummary");
    if (currentShelfType === 'mug_shelf') {
        const selectedMountRadio = document.querySelector('input[name="mugShelfMount"]:checked');
        mugShelfMountSummary.textContent = selectedMountRadio ? (selectedMountRadio.value === 'hanging' ? 'Wisząca' : 'Stojąca') : 'nie wybrano';
        mugShelfMountItem.style.display = 'flex';
    } else {
        mugShelfMountItem.style.display = 'none';
    }
    const widthSummaryLabel = document.getElementById('widthSummaryLabel');
    const heightSummaryLabel = document.getElementById('heightSummaryLabel');
    const connectingWidthSummaryLabel = document.getElementById('connectingWidthSummaryLabel').parentElement;
    const shelfCountSummaryLabel = document.getElementById('shelfCountSummaryLabel');
    if (currentShelfType === 'modular') {
        const moduleW = parseInt(moduleWidthSelect.value);
        const moduleH = parseInt(moduleHeightSelect.value);
        const connectW = parseInt(connectingShelfWidthSelect.value);
        const depth = parseInt(depthSelect.value);
        let totalWidth = null;
        let totalShelves = null;
        if (!isNaN(moduleW) && !isNaN(moduleH) && !isNaN(connectW)) {
            let shelfNum = 3;
            if (moduleH === 40) shelfNum = 2;
            if (moduleH === 80) shelfNum = 5;
            totalShelves = (2 * (shelfNum + 2)) + (shelfNum + 1);
            totalWidth = (moduleW * 2) + connectW;
        }
        widthSummaryLabel.textContent = "Szer. całkowita:";
        document.getElementById("widthSummary").textContent = totalWidth ? `${totalWidth} cm` : "--";
        heightSummaryLabel.textContent = "Wysokość:";
        document.getElementById("heightSummary").textContent = moduleH ? `${moduleH} cm` : "--";
        document.getElementById("depthSummary").parentElement.style.display = 'flex';
        document.getElementById("depthSummary").textContent = depth ? `${depth} cm` : "--";
        connectingWidthSummaryLabel.style.display = 'flex';
        const connectingLabelSpan = document.getElementById("connectingWidthSummaryLabel");
        if (connectingLabelSpan) connectingLabelSpan.textContent = "Komponenty (Szer.):";
        document.getElementById("connectingWidthSummary").textContent = (moduleW && connectW) ? `${moduleW}cm + ${connectW}cm + ${moduleW}cm` : "--";
        shelfCountSummaryLabel.textContent = "Ilość półek (łącznie):";
        document.getElementById("shelfCountSummary").textContent = totalShelves ? `${totalShelves} szt.` : "--";
        updateModularInfoText();
    } else {
        widthSummaryLabel.textContent = "Szerokość:";
        heightSummaryLabel.textContent = "Wysokość:";
        shelfCountSummaryLabel.textContent = "Ilość półek wewn.:";
        connectingWidthSummaryLabel.style.display = 'none';
        document.getElementById("depthSummary").parentElement.style.display = 'flex';
        document.getElementById("widthSummary").textContent = !isNaN(getCurrentWidth()) ? getCurrentWidth() + " cm" : "--";
        // Oznacz dopłatę za niestandardową szerokość
        const widthSummaryEl = document.getElementById("widthSummary");
        const widthCustomBadge = document.getElementById("widthCustomBadge");
        if (widthSummaryEl) {
            widthSummaryEl.textContent = !isNaN(getCurrentWidth()) ? getCurrentWidth() + " cm" : "--";
        }
        if (widthCustomBadge) {
            widthCustomBadge.style.display = widthSelect.value === 'custom' ? 'inline-flex' : 'none';
        }
        document.getElementById("heightSummary").textContent = heightSelect.value && heightSelect.value !== "" ? heightSelect.value + " cm" : "--";
        document.getElementById("shelfCountSummary").textContent = shelfCountSelect.value !== "" ? (shelfCountSelect.options[shelfCountSelect.selectedIndex]?.text || '--') : '-- Wybierz --';
        if (viewerInfoText) viewerInfoText.style.display = 'block';
        if (modularInfoText) modularInfoText.style.display = 'none';
    }
    document.getElementById("depthSummary").textContent = depthSelect.value && depthSelect.value !== "" ? depthSelect.value + " cm" : "--";
    document.getElementById("sideColorSummary").textContent = sideColorSelect.value && sideColorSelect.selectedIndex > 0 ? sideColorSelect.options[sideColorSelect.selectedIndex].text : "nie wybrano";
    document.getElementById("shelfColorSummary").textContent = shelfColorSelect.value && shelfColorSelect.selectedIndex > 0 ? shelfColorSelect.options[shelfColorSelect.selectedIndex].text : "nie wybrano";
    const h = parseFloat(heightSelect.value);
    const sc = parseInt(shelfCountSelect.value);
    const t = 1.8;
    let gT = "n/d";
    if (currentShelfType === 'modular') {
        const moduleH = parseInt(moduleHeightSelect.value);
        if (!isNaN(moduleH)) {
            let shelfNum = 3;
            if (moduleH === 40) shelfNum = 2;
            if (moduleH === 80) shelfNum = 5;
            const availableHeight = moduleH - 2 * t;
            const gap = (availableHeight - shelfNum * t) / (shelfNum + 1);
            gT = `${parseFloat(gap.toFixed(1))} cm`;
        }
    } else if (!isNaN(h) && h > 0 && !isNaN(sc) && sc >= 0) {
        if (currentShelfType === 'mug_shelf') {
            const mugGapHeight = h - 2 * t;
            const mugGapFreeSpace = mugGapHeight - sc * t;
            const mugGapsCount = sc + 1;
            if (mugGapFreeSpace >= 0 && mugGapsCount > 0) {
                const calculatedGap = mugGapFreeSpace / mugGapsCount;
                gT = `ok. ${calculatedGap > 0 ? parseFloat(calculatedGap.toFixed(1)) : 0} cm`;
            } else {
                gT = "za mało miejsca";
            }
        } else {
            const isTopShelf = !document.getElementById('noTopShelf')?.checked;
            const isBottomShelf = currentShelfType !== 'standing' || !document.getElementById('noBottomShelf')?.checked;
            const panelCount = (isTopShelf ? 1 : 0) + (isBottomShelf ? 1 : 0);
            const availableHeight = h - panelCount * t;
            const totalShelvesThickness = sc * t;
            if (availableHeight >= totalShelvesThickness && (sc + 1) > 0) {
                const freeSpace = availableHeight - totalShelvesThickness;
                const gapsCount = sc + 1;
                const calculatedGap = freeSpace / gapsCount;
                gT = `${parseFloat(calculatedGap.toFixed(1))} cm`;
            } else {
                gT = "za mało miejsca";
            }
        }
    }
    document.getElementById("gapSummary").textContent = gT; const gapSummaryLi2 = document.getElementById("gapSummary")?.parentElement; const gapDisplayP2 = document.getElementById("gapDisplay"); if (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled) { if (gapSummaryLi2) gapSummaryLi2.style.display = 'none'; if (gapDisplayP2) gapDisplayP2.style.display = 'none'; } const customPosRow = document.getElementById('customPosSummaryRow'); const customPosSummaryEl = document.getElementById('customPosSummary'); if (customPosRow && customPosSummaryEl) { const cps2 = typeof getCustomPositionSummary === 'function' ? getCustomPositionSummary() : null; if (cps2) { const d2 = cps2.distances; const isCharged = (typeof customPositionsModified !== 'undefined' && customPositionsModified); let h2 = '<div style="display:flex;flex-direction:column;gap:4px">'; h2 += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'; h2 += '<span style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Rozmieszczenie</span>'; if (isCharged) { h2 += '<span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700">+50 zł</span>'; } h2 += '</div>'; h2 += '<div style="display:flex;flex-wrap:wrap;gap:4px">'; for (let ii = 0; ii < d2.length; ii++) { h2 += '<span style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">' + (Number.isInteger(d2[ii]) ? d2[ii] : d2[ii].toFixed(1)) + ' cm</span>'; } h2 += '</div></div>'; customPosSummaryEl.innerHTML = h2; customPosRow.style.display = 'flex'; } else { customPosRow.style.display = 'none'; } }
    document.getElementById("gapSummaryDisplay").textContent = gT;
    const gapSummaryLi = document.getElementById("gapSummary")?.parentElement;
    const gapDisplayP = document.getElementById("gapDisplay");
    if (gapSummaryLi) gapSummaryLi.style.display = 'none';
    if (gapDisplayP) gapDisplayP.style.display = 'none';
    const o = [];
    if (currentShelfType === 'mug_shelf') {
        const selectedMount = document.querySelector('input[name="mugShelfMount"]:checked');
        if (selectedMount) o.push(selectedMount.value === 'hanging' ? 'Montaż wiszący' : 'Montaż stojący');
        const dividersSelected = [];
        if (dividersTopCheckbox?.checked) dividersSelected.push("góra");
        if (dividersMiddleCheckbox?.checked) dividersSelected.push("środek");
        if (dividersBottomCheckbox?.checked) dividersSelected.push("dół");
        if (dividersSelected.length > 0) o.push("Przegródki: " + dividersSelected.join(", "));
    } else if (currentShelfType === 'modular') {
        if (document.getElementById('modularHanging')?.checked) o.push("Wersja wisząca");
        if (document.getElementById('modularStanding')?.checked) o.push("Wersja stojąca");
        if (document.getElementById('modularNoTopShelf')?.checked) o.push("bez górnej półki");
        if (document.getElementById('modularNoBottomShelf')?.checked) o.push("bez dolnej podstawy");
    } else {
        if (document.getElementById("noTopShelf")?.checked) o.push("bez górnej półki");
        const isStandingType = (currentShelfType === "standing");
        if (isStandingType && document.getElementById("noBottomShelf")?.checked) o.push("bez dolnej półki (podstawy)");
    }
    document.getElementById("extraOptionsSummary").textContent = o.length ? o.join(" / ") : "standardowa";
    if (mobileIconDetailsType) {
        if (shelfTypeSelect.selectedIndex > 0) {
            mobileIconDetailsType.textContent = shelfTypeSelect.options[shelfTypeSelect.selectedIndex].text.split(' ')[0];
            mobileIconDetailsType.classList.remove('mobile-icon-prompt');
        } else {
            mobileIconDetailsType.textContent = 'nie wybrano';
            mobileIconDetailsType.classList.add('mobile-icon-prompt');
        }
    }
    if (mobileIconDetailsDimensions) {
        if (currentShelfType === 'modular') {
            const modW = parseInt(moduleWidthSelect.value);
            const modH = parseInt(moduleHeightSelect.value);
            const connW = parseInt(connectingShelfWidthSelect.value);
            if (!isNaN(modW) && !isNaN(modH) && !isNaN(connW)) {
                 mobileIconDetailsDimensions.textContent = `${modW*2+connW}x${modH}x10`;
                 mobileIconDetailsDimensions.classList.remove('mobile-icon-prompt');
            } else {
                mobileIconDetailsDimensions.textContent = 'nie wybrano';
                mobileIconDetailsDimensions.classList.add('mobile-icon-prompt');
            }
        }
        else if (!isNaN(getCurrentWidth()) && heightSelect.value && depthSelect.value) {
            mobileIconDetailsDimensions.textContent = `${getCurrentWidth()}x${heightSelect.value}x${depthSelect.value}`;
            mobileIconDetailsDimensions.classList.remove('mobile-icon-prompt');
        } else {
            mobileIconDetailsDimensions.textContent = 'nie wybrano';
            mobileIconDetailsDimensions.classList.add('mobile-icon-prompt');
        }
    }
    if (mobileIconDetailsColors) {
        mobileIconDetailsColors.innerHTML = '';
        const sideColorOption = sideColorSelect.options[sideColorSelect.selectedIndex];
        const shelfColorOption = shelfColorSelect.options[shelfColorSelect.selectedIndex];
        if (sideColorOption && sideColorOption.value && shelfColorOption && shelfColorOption.value) {
            const sideSwatch = document.createElement('span');
            sideSwatch.className = 'mobile-color-swatch';
            sideSwatch.style.backgroundColor = sideColorOption.dataset.color || '#ccc';
            const shelfSwatch = document.createElement('span');
            shelfSwatch.className = 'mobile-color-swatch';
            shelfSwatch.style.backgroundColor = shelfColorOption.dataset.color || '#ccc';
            mobileIconDetailsColors.appendChild(sideSwatch);
            mobileIconDetailsColors.appendChild(shelfSwatch);
            mobileIconDetailsColors.classList.remove('mobile-icon-prompt');
        } else {
            mobileIconDetailsColors.textContent = 'nie wybrano';
            mobileIconDetailsColors.classList.add('mobile-icon-prompt');
        }
    }
    if (mobileIconDetailsShelves) {
        if (shelfCountSelect.value !== "" && shelfCountSelect.options[shelfCountSelect.selectedIndex]) {
            const selectedText = shelfCountSelect.options[shelfCountSelect.selectedIndex].text;
            mobileIconDetailsShelves.textContent = selectedText;
            if (shelfCountSelect.value === '0') {
                mobileIconDetailsShelves.classList.add('mobile-icon-prompt');
            } else {
                mobileIconDetailsShelves.classList.remove('mobile-icon-prompt');
            }
        } else {
            mobileIconDetailsShelves.textContent = 'nie wybrano';
            mobileIconDetailsShelves.classList.add('mobile-icon-prompt');
        }
    }
    const orderCode = generateOrderCode();
    const isComplete = !!orderCode;

    // Pobierz elementy cenowe
    const originalPriceSummary = document.getElementById('originalPriceSummary');
    const priceSummary = document.getElementById('priceSummary');
    const mainPageDiscountHint = document.getElementById('mainPageDiscountHint');

    if (isComplete) {
        const pD = computePriceDetailed();
        if (pD !== null) {
            priceAndActionsContainer.style.display = 'block';
            priceHint.style.display = 'none';

            const originalPrice = pD.total;
            const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);
            
            // Logika rabatu na stronie głównej
            if (totalItemsInCart === 0) {
                // Jeśli koszyk jest pusty, pokaż rabat -10% na pierwszy produkt
                const discountedPrice = originalPrice * (1 - DISCOUNTS.discount1item);
                originalPriceSummary.textContent = originalPrice.toFixed(2) + " zł";
                priceSummary.textContent = discountedPrice.toFixed(2) + " zł";
                originalPriceSummary.style.display = 'block';
                mainPageDiscountHint.textContent = "Otrzymujesz 10% rabatu!";
                mainPageDiscountHint.classList.add('visible');
                
            } else if (totalItemsInCart === 1) {
                // Jeśli w koszyku jest jeden produkt, pokaż rabat -25% na drugi (tańszy)
                const discountedPrice = originalPrice * (1 - DISCOUNTS.discountCheap);
                originalPriceSummary.textContent = originalPrice.toFixed(2) + " zł";
                priceSummary.textContent = discountedPrice.toFixed(2) + " zł";
                originalPriceSummary.style.display = 'block';
                mainPageDiscountHint.textContent = "Brawo! Na tę półkę otrzymasz aż 25% zniżki!";
                mainPageDiscountHint.classList.add('visible');

            } else {
                // Jeśli w koszyku są 2 lub więcej produkty, po prostu pokaż cenę bazową
                priceSummary.textContent = originalPrice.toFixed(2) + " zł";
                originalPriceSummary.style.display = 'none';
                mainPageDiscountHint.classList.remove('visible');
            }
            
            if (desktopCartContainer) {
                desktopCartContainer.classList.remove('animate-pulse-bg');
                void desktopCartContainer.offsetWidth;
                desktopCartContainer.classList.add('animate-pulse-bg');
            }
            if (mobile3dActionsContainer) mobile3dActionsContainer.style.display = 'flex'; const _mbra = document.getElementById('mobileBottomRightActions'); if (_mbra) _mbra.style.display = 'flex';
            // Synchronizuj mobilną kartę ceny
            const _mpo = document.getElementById('mobilePriceOriginal');
            const _mdh = document.getElementById('mobileDiscountHint');
            const _mdb = document.getElementById('mobileDalej3dBtn');
            const _topDalej = document.getElementById('topBarDalej');
            if (mobilePriceValue) mobilePriceValue.textContent = priceSummary.textContent;
            if (_mpo) {
                _mpo.textContent = originalPriceSummary.style.display !== 'none' ? originalPriceSummary.textContent : '';
                _mpo.style.display = originalPriceSummary.style.display !== 'none' ? 'block' : 'none';
            }
            if (_mdh) {
                const hintVisible = mainPageDiscountHint.classList.contains('visible');
                const _wrap = document.getElementById('mobilePriceIconWrap');
                if (hintVisible) {
                    _mdh.textContent = '✓ ' + mainPageDiscountHint.textContent;
                    _mdh.classList.remove('show');
                    if (_wrap) _wrap.classList.add('hint-open');
                    void _mdh.offsetWidth;
                    _mdh.classList.add('show');
                    clearTimeout(_mdh._hideTimer);
                    _mdh._hideTimer = setTimeout(() => {
                        _mdh.classList.remove('show');
                        if (_wrap) _wrap.classList.remove('hint-open');
                    }, 3700);
                } else {
                    _mdh.classList.remove('show');
                    if (_wrap) _wrap.classList.remove('hint-open');
                    _mdh.textContent = '';
                }
            }
            // Synchronizuj chipsy parametrów
            if (typeof syncMobilePriceChips === 'function') syncMobilePriceChips();
            // Przycisk Dalej — pokaż po wyborze wszystkich parametrów
            if (_mdb) _mdb.classList.add('visible');
            if (_topDalej) _topDalej.classList.add('visible');
            if (orderSummarySection) {
                orderSummarySection.classList.add('summary-highlight');
            }
        } else {
            priceAndActionsContainer.style.display = 'none';
            priceHint.textContent = "Błąd obliczania ceny. Sprawdź opcje.";
            priceHint.style.display = 'block';
            if (mobile3dActionsContainer) mobile3dActionsContainer.style.display = 'flex'; { const _mbra = document.getElementById('mobileBottomRightActions'); if (_mbra) _mbra.style.display = 'flex'; }
            if (mobilePriceValue) mobilePriceValue.textContent = '';
            const _mdb2 = document.getElementById('mobileDalej3dBtn'); if (_mdb2) _mdb2.classList.remove('visible'); const _topDalej2 = document.getElementById('topBarDalej'); if (_topDalej2) _topDalej2.classList.remove('visible');
        }
    } else {
        priceAndActionsContainer.style.display = 'none';
        priceHint.textContent = "Wybierz wszystkie parametry, aby zobaczyć cenę.";
        priceHint.style.display = 'block';
        if (mobile3dActionsContainer) mobile3dActionsContainer.style.display = 'flex'; { const _mbra = document.getElementById('mobileBottomRightActions'); if (_mbra) _mbra.style.display = 'flex'; }
        if (mobilePriceValue) mobilePriceValue.textContent = '—';
        const _mpo2 = document.getElementById('mobilePriceOriginal'); if (_mpo2) { _mpo2.style.display = 'none'; _mpo2.textContent = ''; }
        const _mdh2 = document.getElementById('mobileDiscountHint'); if (_mdh2) { _mdh2.style.display = 'none'; _mdh2.textContent = ''; }
        const _mdb3 = document.getElementById('mobileDalej3dBtn'); if (_mdb3) _mdb3.classList.remove('visible'); const _topDalej3 = document.getElementById('topBarDalej'); if (_topDalej3) _topDalej3.classList.remove('visible');
    }
    updateDividerDimensionVisibility();
    updateMobileShelfInfo();
    updateSectionHighlights();
    // Zawsze synchronizuj chipsy po zmianie parametrów
    if (typeof syncMobilePriceChips === 'function') syncMobilePriceChips();
}
function generateOrderCode() { const shelfTypeVal = shelfTypeSelect.value; const sideColorVal = sideColorSelect.value || ''; const shelfColorVal = shelfColorSelect.value || ''; if (!shelfTypeVal || !sideColorVal || !shelfColorVal) return null;
            // ── isCustomLayout: wzór z edytora półek ──────────────────────────────────────────────
            const _custLayoutType = SHELF_TYPES.find(t => t.id === shelfTypeVal && t.isCustomLayout);
            if (_custLayoutType) {
                const sideColorCode = valueToCode.color[sideColorVal];
                const shelfColorCode = valueToCode.color[shelfColorVal];
                if (sideColorCode === undefined || shelfColorCode === undefined) return null;
                // Suffix = ostatnie 4 znaki ID wzoru (np. "4z48" z "custom_wzo777_4z48")
                const _idParts = shelfTypeVal.split('_');
                const _suffix = _idParts[_idParts.length - 1];
                const _ct = _custLayoutType;
                // Dołącz typ montażu tylko gdy kupujący miał wybór
                const _bo = _ct.buyerOptions || {};
                const _mountSuffix = _bo.allowTypeChoice
                    ? (_custMountType === 'standing' ? '-s' : '-h')
                    : '';
                // Uwzględnij aktualną szerokość/głębokość (mogły być zmienione przez kupującego)
                const _curW = parseInt(widthSelect.value === 'custom' ? (customWidthInput ? customWidthInput.value : _ct.width) : widthSelect.value) || _ct.width;
                const _curD = parseInt(depthSelect.value) || _ct.depth;
                return `c-${_suffix}-W${_curW}-H${_ct.height}-D${_curD}-${sideColorCode}${shelfColorCode}${_mountSuffix}`;
            }
            const typeCode = valueToCode.type[shelfTypeVal]; const sideColorCode = valueToCode.color[sideColorVal]; const shelfColorCode = valueToCode.color[shelfColorVal]; if (!typeCode || sideColorCode === undefined || shelfColorCode === undefined) return null; 
            if (shelfTypeVal === 'modular') {
                const moduleW = moduleWidthSelect.value;
                const moduleH = moduleHeightSelect.value;
                const connectW = connectingShelfWidthSelect.value;
                const depth = depthSelect.value;
                if (!moduleW || !moduleH || !connectW || !depth) return null;
                
                let optionsCode = '';
                const noTop = document.getElementById("modularNoTopShelf")?.checked;
                const noBottom = document.getElementById("modularNoBottomShelf")?.checked;

                if (noTop && noBottom) optionsCode = 'tb';
                else if (noTop) optionsCode = 't';
                else if (noBottom) optionsCode = 'b';
                else optionsCode = 's';

                return `${typeCode}-W${moduleW}-H${moduleH}-C${connectW}-D${depth}-${sideColorCode}${shelfColorCode}-${optionsCode}`;
            }
        const widthNum = getCurrentWidth(); const heightVal = heightSelect.value; const depthVal = depthSelect.value; const shelfCountVal = shelfCountSelect.value; const isMugShelf = shelfTypeVal === 'mug_shelf'; if (isNaN(widthNum) || !heightVal || !depthVal || shelfCountVal === "") return null; const shelfCountNum = parseInt(shelfCountVal); if (isNaN(shelfCountNum) || shelfCountNum < 0 || (!isMugShelf && shelfCountNum === 0)) return null; let optionsCode = ''; if (isMugShelf) { const mountCode = document.querySelector('input[name="mugShelfMount"]:checked')?.value === 'hanging' ? 'h' : 's'; 
        let dividerCode = ''; 
        if (dividersTopCheckbox?.checked) dividerCode += 'g'; 
        if (dividersMiddleCheckbox?.checked) dividerCode += 'm'; 
        if (dividersBottomCheckbox?.checked) dividerCode += 'd'; 
        if (dividerCode === '') {
            return null;
        }
        optionsCode = `${mountCode}${dividerCode}`; 
    } else { const noTop = document.getElementById("noTopShelf")?.checked; const noBottom = (shelfTypeVal === "standing" && document.getElementById("noBottomShelf")?.checked); if (noTop && noBottom) optionsCode = 'tb'; else if (noTop) optionsCode = 't'; else if (noBottom) optionsCode = 'b'; else optionsCode = 's'; } let codeParts = [typeCode, String(widthNum), heightVal, depthVal, String(shelfCountNum), sideColorCode, shelfColorCode, optionsCode]; if (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled && customShelfPositions.length > 0) { const sorted = [...customShelfPositions].sort((a, b) => a - b); codeParts.push('cp' + sorted.join('.')); } return codeParts.join('-'); }
        
        // NOWA, ZINTEGROWANA FUNKCJA PARSOWANIA KODU
        function parseOrderCode(code) {
            if (!code) return { error: "Kod jest pusty." };
            code = code.trim().toLowerCase();
            const parts = code.split('-');

            // ── isCustomLayout: wzór z edytora (format: c-{suffix4}-W{w}-H{h}-D{d}-{kolory} lub c-{suffix4}-W{w}-H{h}-D{d}-{kolory}-{montaż}) ──
            if (parts[0] === 'c' && (parts.length === 6 || parts.length === 7)) {
                const [, suffix, wPart, hPart, dPart, colorPart, mountPart] = parts;
                const width  = parseInt(wPart.substring(1));
                const height = parseInt(hPart.substring(1));
                const depth  = parseInt(dPart.substring(1));
                const sideColorValue  = codeToValue.color[colorPart[0]];
                const shelfColorValue = codeToValue.color[colorPart[1]];
                if (isNaN(width) || isNaN(height) || isNaN(depth) || !sideColorValue || !shelfColorValue)
                    return { error: 'Nieprawidłowe wartości w kodzie wzoru.' };
                // Znajdź wzór po suffix ID
                const custType = (typeof SHELF_TYPES !== 'undefined')
                    ? SHELF_TYPES.find(t => t.isCustomLayout && t.id.endsWith('_' + suffix))
                    : null;
                if (!custType) return { error: `Nie znaleziono wzoru o ID kończącym się na "${suffix}". Sprawdź czy plik wzory.js jest aktualny.` };
                const price = (typeof customPrices !== 'undefined' && customPrices[custType.id] !== undefined)
                    ? customPrices[custType.id] + ' zł' : 'brak ceny';
                const mountType = mountPart === 's' ? 'Stojąca' : 'Wisząca';
                const optionsText = mountPart ? mountType : 'Standardowa';
                return {
                    error: null,
                    code: code.toUpperCase(),
                    isCustomLayout: true,
                    shelfTypeValue: custType.id,
                    shelfType: custType.name,
                    width, height, depth,
                    shelfCount: custType.shelfCount,
                    sideColorValue,
                    sideColor:  sideColorSelect.querySelector(`option[value="${sideColorValue}"]`)?.textContent  || sideColorValue,
                    shelfColorValue,
                    shelfColor: shelfColorSelect.querySelector(`option[value="${shelfColorValue}"]`)?.textContent || shelfColorValue,
                    options: optionsText,
                    mountType: mountPart || null,
                    gapInfo: 'wg wzoru',
                    price,
                    raw: { mountType: mountPart || null }
                };
            }

            // Logika dla półek modułowych (M)
            if (parts[0] === 'm' && (parts.length === 6 || parts.length === 7)) { 
                const [_, widthPart, heightPart, connectPart, depthPart, colorPart, optionsPart] = parts;
                const moduleW = parseInt(widthPart.substring(1));
                const moduleH = parseInt(heightPart.substring(1));
                const connectW = parseInt(connectPart.substring(1));
                const depth = parseInt(depthPart.substring(1));
                const sideColorValue = codeToValue.color[colorPart[0]];
                const shelfColorValue = codeToValue.color[colorPart[1]];

                if(!moduleW || !moduleH || !connectW || !depth || !sideColorValue || !shelfColorValue) return { error: 'Nieprawidłowe wartości w kodzie półki modułowej.'};
                
                const totalWidth = (moduleW * 2) + connectW;
                let shelfNum = 3; 
                if (moduleH === 40) shelfNum = 2;
                if (moduleH === 80) shelfNum = 5;
                const totalShelves = (2 * (shelfNum + 2)) + (shelfNum + 1);
                const gap = ((moduleH - 2 * 1.8) - shelfNum * 1.8) / (shelfNum + 1);
                
                let optionsText = [];
                let rawOptions = {};
                if (optionsPart) {
                    if (optionsPart.includes('t')) { optionsText.push("Bez górnej półki"); rawOptions.noTopShelf = true; }
                    if (optionsPart.includes('b')) { optionsText.push("Bez dolnej podstawy (wersja wisząca)"); rawOptions.noBottomShelf = true; }
                }
                 if (optionsText.length === 0) optionsText.push("Standardowa");

                return {
                    error: null,
                    code: code.toUpperCase(),
                    isModular: true,
                    shelfTypeValue: 'modular',
                    shelfType: 'Półka modułowa',
                    moduleWidth: moduleW,
                    moduleHeight: moduleH,
                    connectingWidth: connectW,
                    depth: depth,
                    height: moduleH,
                    totalWidth: `${totalWidth} cm`,
                    totalShelves: `${totalShelves} szt.`,
                    komponenty: `${moduleW}cm + ${connectW}cm + ${moduleW}cm`,
                    gap: `${parseFloat(gap.toFixed(1))} cm`,
                    sideColorValue,
                    sideColor: sideColorSelect.querySelector(`option[value="${sideColorValue}"]`)?.textContent || 'Nieznany',
                    shelfColorValue,
                    shelfColor: shelfColorSelect.querySelector(`option[value="${shelfColorValue}"]`)?.textContent || 'Nieznany',
                    options: optionsText.join(' / '),
                    raw: rawOptions
                };
            }

            // Logika dla standardowych półek
            if (parts.length !== 8 && parts.length !== 9) return { error: `Nieprawidłowy format kodu (oczekiwano 8-9 części, znaleziono ${parts.length}).` };
            const [typeCode, widthStr, heightStr, depthStr, shelfCountStr, sideColorCode, shelfColorCode, optionsCode, customPosPart] = parts;

            const shelfTypeValue = codeToValue.type[typeCode];
            const sideColorValue = codeToValue.color[sideColorCode];
            const shelfColorValue = codeToValue.color[shelfColorCode];

            if (!shelfTypeValue || !sideColorValue || !shelfColorValue) return { error: "Nieprawidłowe podstawowe wartości w kodzie (typ lub kolory)." };
            
            const shelfType = shelfTypeSelect.querySelector(`option[value="${shelfTypeValue}"]`)?.textContent || 'Nieznany typ';
            const sideColor = sideColorSelect.querySelector(`option[value="${sideColorValue}"]`)?.textContent || 'Nieznany kolor';
            const shelfColor = shelfColorSelect.querySelector(`option[value="${shelfColorValue}"]`)?.textContent || 'Nieznany kolor';

            const width = parseInt(widthStr);
            const height = parseInt(heightStr);
            const depth = parseInt(depthStr);
            const shelfCount = parseInt(shelfCountStr);

            if (isNaN(width) || isNaN(height) || isNaN(depth) || isNaN(shelfCount)) return { error: "Nieprawidłowe wartości liczbowe w kodzie (wymiary lub liczba półek)." };

            let optionsText = [];
            let gapInfo = 'n/d';
            let rawOptions = {};

            if (shelfTypeValue === 'mug_shelf') {
                const mountCode = optionsCode.charAt(0);
                const dividerCode = optionsCode.substring(1);
                const mountType = codeToValue.mugMount[mountCode];
                if (!mountType) return { error: `Nieprawidłowy kod montażu kubka: ${mountCode}.` };
                
                optionsText.push(`Montaż: ${mountType === 'hanging' ? 'Wisząca' : 'Stojąca'}`);
                rawOptions.mount = mountType;
                
                const dividers = [];
                if (dividerCode.includes('g')) { dividers.push("góra"); rawOptions.dividersTop = true; }
                if (dividerCode.includes('m')) { dividers.push("środek"); rawOptions.dividersMiddle = true; }
                if (dividerCode.includes('d')) { dividers.push("dół"); rawOptions.dividersBottom = true; }
                if (dividerCode.length > 0 && dividers.length === 0 && dividerCode !== 'n') return { error: `Nieprawidłowy kod przegródek: ${dividerCode}.`};
                if (dividers.length > 0) optionsText.push(`Przegródki: ${dividers.join(', ')}`);
                
                gapInfo = "ok. 10.9 cm";
            } else {
                // Wykrywanie opcji "Bez góry/dołu"
                if (optionsCode.includes('t')) { optionsText.push("Bez górnej półki"); rawOptions.noTopShelf = true; }
                if (optionsCode.includes('b') && shelfTypeValue === 'standing') { optionsText.push("Bez dolnej półki (podstawy)"); rawOptions.noBottomShelf = true; }
                
                const t = 1.8;
                // Identyczna formuła jak w buildShelfModel (3D)
                const topThickness = rawOptions.noTopShelf ? 0 : t;
                const bottomThickness = rawOptions.noBottomShelf ? 0 : t;
                const availableHeight = height - topThickness - bottomThickness;
                const totalShelvesThickness = shelfCount * t;
                const gaps = shelfCount + 1;
                if (availableHeight >= totalShelvesThickness && gaps > 0) {
                    gapInfo = `${parseFloat(((availableHeight - totalShelvesThickness) / gaps).toFixed(1))} cm`;
                }
            }
            if (optionsText.length === 0) optionsText.push("Standardowa");

            // Parse custom shelf positions
            let customPositions = null;
            let customPosDistances = null;
            if (customPosPart && customPosPart.startsWith('cp')) {
                const posStr = customPosPart.substring(2);
                customPositions = posStr.split('.').map(Number).filter(n => !isNaN(n));
                if (customPositions.length > 0) {
                    const sorted = [...customPositions].sort((a, b) => a - b);
                    const t = 1.8;
                    const innerH = height - 2 * t;
                    const dists = [];
                    dists.push(Math.round((sorted[0] - t / 2) * 10) / 10);
                    for (let ci = 0; ci < sorted.length - 1; ci++) {
                        dists.push(Math.round((sorted[ci + 1] - sorted[ci] - t) * 10) / 10);
                    }
                    dists.push(Math.round((innerH - sorted[sorted.length - 1] - t / 2) * 10) / 10);
                    customPosDistances = dists;
                    gapInfo = dists.join(' · ') + ' cm';
                }
            }

            return {
                error: null,
                code: code.toUpperCase(),
                shelfTypeValue,
                shelfType,
                width,
                height,
                depth,
                sideColorValue,
                sideColor,
                shelfColorValue,
                shelfColor,
                shelfCount,
                options: optionsText.join(' / '),
                gapInfo,
                raw: rawOptions,
                customPositions,
                customPosDistances
            };
        }

        // NOWE FUNKCJE
        async function reconfigureFromDetails(details) {
            if (!details || details.error) return;
            
            shelfTypeSelect.value = details.shelfTypeValue;
            handleShelfTypeChange(true); 
            
            await new Promise(resolve => setTimeout(resolve, 50));

            if (details.isCustomLayout) {
                // Wzór z edytora — handleShelfTypeChange już ustawił wymiary i shelves
                // Ustaw typ montażu jeśli był zakodowany w kodzie zamówienia
                if (details.raw && details.raw.mountType) {
                    if (typeof setCustMountType === 'function') setCustMountType(details.raw.mountType === 's' ? 'standing' : 'hanging');
                }
                // Ustaw szerokość jeśli różni się od bazowej szerokości wzoru
                const _custT = SHELF_TYPES.find(t => t.id === details.shelfTypeValue && t.isCustomLayout);
                if (_custT && details.width && details.width !== _custT.width) {
                    if (typeof setCustomWidth === 'function') setCustomWidth(details.width, _custT.width);
                }

            } else if (details.isModular) {
                 moduleWidthSelect.value = String(details.moduleWidth);
                 moduleHeightSelect.value = String(details.moduleHeight);
                 connectingShelfWidthSelect.value = String(details.connectingWidth);
                 
                 const noTopCheckbox = document.getElementById('modularNoTopShelf');
                 if (noTopCheckbox) noTopCheckbox.checked = !!details.raw.noTopShelf;

                 const noBottomCheckbox = document.getElementById('modularNoBottomShelf');
                 if (noBottomCheckbox) noBottomCheckbox.checked = !!details.raw.noBottomShelf;
                 
                 const hangingCheckbox = document.getElementById('modularHanging');
                 const standingCheckbox = document.getElementById('modularStanding');

                 if (details.raw.noBottomShelf) {
                    if (hangingCheckbox) hangingCheckbox.checked = true;
                    if (standingCheckbox) standingCheckbox.checked = false;
                 } else {
                    if (hangingCheckbox) hangingCheckbox.checked = false;
                    if (standingCheckbox) standingCheckbox.checked = true;
                 }
                 
                 // Ręczne wywołanie logiki synchronizacji, która jest w handleShelfTypeChange
                 if(noBottomCheckbox && hangingCheckbox.checked) {
                    noBottomCheckbox.disabled = true;
                 }


            } else if (details.shelfTypeValue === 'mug_shelf') {
                widthSelect.value = String(details.width);
                heightSelect.value = String(details.height);
                handleMugShelfHeightChange();
                
                const mountRadio = document.querySelector(`input[name="mugShelfMount"][value="${details.raw.mount}"]`);
                if (mountRadio) mountRadio.checked = true;

                if (dividersTopCheckbox) dividersTopCheckbox.checked = !!details.raw.dividersTop;
                if (dividersMiddleCheckbox) dividersMiddleCheckbox.checked = !!details.raw.dividersMiddle;
                if (dividersBottomCheckbox) dividersBottomCheckbox.checked = !!details.raw.dividersBottom;
                
            } else {
                const widthValueStr = String(details.width);
                const isStandardWidth = Array.from(originalWidthOptions).some(opt => opt.value === widthValueStr && opt.value !== 'custom');
                if (isStandardWidth) {
                    widthSelect.value = widthValueStr;
                } else {
                    widthSelect.value = 'custom';
                }
                checkCustomWidth();
                if (widthSelect.value === 'custom' && customWidthInput) {
                    customWidthInput.value = details.width;
                    if (customWidthDisplay) customWidthDisplay.textContent = details.width + ' cm';
                }
                
                heightSelect.value = String(details.height);
                handleDimensionChange(); 
                
                depthSelect.value = String(details.depth);
                shelfCountSelect.value = String(details.shelfCount);

                const noTopShelfCheckbox = document.getElementById('noTopShelf');
                if (noTopShelfCheckbox) noTopShelfCheckbox.checked = !!details.raw.noTopShelf;

                if (details.shelfTypeValue === 'standing') {
                    const noBottomShelfCheckbox = document.getElementById('noBottomShelf');
                    if (noBottomShelfCheckbox) noBottomShelfCheckbox.checked = !!details.raw.noBottomShelf;
                }

                // Restore custom shelf positions
                if (details.customPositions && details.customPositions.length > 0) {
                    customShelfPositionEnabled = true;
                    customPositionsModified = true; // nalicz opłatę za własne rozmieszczenie
                    customShelfPositions = [...details.customPositions];
                    const sw = document.getElementById('customShelfSwitch');
                    const spPanel = document.getElementById('shelfCountSection');
                    const wrapper = document.getElementById('customShelfPositionWrapper');
                    if (wrapper) wrapper.style.display = 'block';
                    if (sw) sw.classList.add('on');
                    if (spPanel) spPanel.classList.add('sp-custom-active');
                    buildCustomShelfInputs();
                    // Override with saved positions
                    customShelfPositions = [...details.customPositions];
                    for (let pi = 0; pi < details.customPositions.length; pi++) {
                        const inp = document.getElementById('shelfPos-' + pi);
                        if (inp) inp.value = details.customPositions[pi];
                    }
                    if (typeof updateCustomShelfStatusUI === 'function') updateCustomShelfStatusUI('saved');
                }
            }

            sideColorSelect.value = details.sideColorValue;
            shelfColorSelect.value = details.shelfColorValue;

            await new Promise(resolve => setTimeout(resolve, 50)); 
            
            await updatePreview(false);
            updateOrderSummary(); 
        }

        async function showVisualDetailsForCode(code) {
            if (!code) return;
            visualDetailsModalOverlay.classList.add('visible');
            visualDetailsContent.style.display = 'none';
            visualDetailsError.style.display = 'none';
            visualDetailsLoader.style.display = 'block';
            printVisualDetailsBtn.disabled = true;

            const details = parseOrderCode(code);
            
            if (details.error) {
                visualDetailsLoader.style.display = 'none';
                visualDetailsError.style.display = 'block';
                visualDetailsError.querySelector('p').textContent = details.error;
                return;
            }

            currentDetailsForVisualModal = details;

            try {
                await reconfigureFromDetails(details);
                
                const [snapshotDataUrl, priceDetails] = await Promise.all([
                    generate3dSnapshotFromCurrentModel(),
                    computePriceDetailed()
                ]);
                
                visualDetailsOrderCode.textContent = `Kod zamówienia: ${details.code}`;
                visualDetailsSnapshot.src = snapshotDataUrl;
                
                const specsList = visualDetailsSpecsList;
                specsList.innerHTML = '';
                
                const specsData = details.isModular ? {
                    "Rodzaj półki": details.shelfType,
                    "Wymiary (całkowite)": `${details.totalWidth} x ${details.height} cm x ${details.depth} cm`,
                    "Komponenty (Szer.)": details.komponenty,
                    "Kolor boków": details.sideColor,
                    "Kolor półek": details.shelfColor,
                    "Liczba półek (łącznie)": details.totalShelves,
                    "Odstęp": details.gap,
                    "Opcje dodatkowe": details.options
                } : {
                    "Rodzaj półki": details.shelfType,
                    "Wymiary": `${details.width} x ${details.height} x ${details.depth} cm`,
                    "Kolor boków": details.sideColor,
                    "Kolor półek": details.shelfColor,
                    "Półki wewn.": `${details.shelfCount} szt.`,
                    "Odstęp": details.gapInfo,
                    "Opcje": details.options
                };

                if (details.customPositions) {
                    specsData["Rozmieszczenie"] = "Własne (+50 zł)";
                }
                
                for(const [key, value] of Object.entries(specsData)) {
                    if (value && value !== 'n/d' && value.trim() !== "" && value.trim() !== "Standardowa") {
                        const row = document.createElement('div');
                        row.className = 'spec-row';
                        const dt = document.createElement('dt');
                        dt.textContent = key;
                        const dd = document.createElement('dd');
                        dd.textContent = value;
                        row.appendChild(dt);
                        row.appendChild(dd);
                        specsList.appendChild(row);
                    }
                }

                if (priceDetails) {
                     const discountedPrice = priceDetails.total * (1 - DISCOUNTS.discount1item);
                     const row = document.createElement('div');
                     row.className = 'spec-row border-t-2 border-stone-200 mt-2 pt-2';
                     const dt = document.createElement('dt');
                     dt.className = 'font-semibold text-stone-800 text-base';
                     dt.textContent = 'Cena:';
                     const dd = document.createElement('dd');
                     dd.className = 'font-bold text-xl text-red-600 text-right';
                     
                     const priceSpan = document.createElement('span');
                     priceSpan.textContent = `${discountedPrice.toFixed(2)} zł `;
                     
                     const discountLabel = document.createElement('small');
                     discountLabel.className = 'text-sm font-normal text-green-600 block';
                     discountLabel.textContent = '(z rabatem -10%)';

                     dd.appendChild(priceSpan);
                     dd.appendChild(discountLabel);
                     row.appendChild(dt);
                     row.appendChild(dd);
                     specsList.appendChild(row);
                }

                visualDetailsLoader.style.display = 'none';
                visualDetailsError.style.display = 'none';
                visualDetailsContent.style.display = 'block';
                printVisualDetailsBtn.disabled = false;
                const _ab = document.getElementById('downloadAllegroJpgBtn');
                if (_ab) _ab.disabled = false;

            } catch (error) {
                console.error("Błąd podczas wczytywania projektu z kodu:", error);
                visualDetailsLoader.style.display = 'none';
                visualDetailsError.style.display = 'block';
                visualDetailsError.querySelector('p').textContent = "Wystąpił nieoczekiwany błąd podczas wczytywania projektu.";
            }
        }

        function closeVisualDetailsModal() {
            if (!visualDetailsModalOverlay) return;
            visualDetailsModalOverlay.classList.remove('visible');
            if (viewOrderCodeInput) viewOrderCodeInput.value = '';
            currentDetailsForVisualModal = null;
        }

        async function handlePrintProject(details) {
            if (!details || details.error) {
                alert("Brak danych do wydruku. Wczytaj poprawny kod.");
                return;
            }
            
            const printButton = document.getElementById('printVisualDetailsBtn');
            if(printButton) {
                printButton.disabled = true;
                const span = printButton.querySelector('span');
                if(span) span.textContent = 'Przygotowuję...';
            }

            try {
                await reconfigureFromDetails(details);
                await new Promise(resolve => setTimeout(resolve, 200));

                const [snapshotDataUrl, priceDetails] = await Promise.all([
                    generate3dSnapshotFromCurrentModel(),
                    computePriceDetailed()
                ]);
                
                document.getElementById('print-order-code').textContent = `Kod zamówienia: ${details.code}`;
                document.getElementById('print-snapshot-img').src = snapshotDataUrl;
                
                const specsList = document.getElementById('print-specs-list');
                specsList.innerHTML = '';
                
                const specs = details.isModular ? {
                    "Rodzaj półki": details.shelfType,
                    "Wymiary (całkowite)": `${details.totalWidth} x ${details.height} x ${details.depth}`,
                    "Komponenty (Szer.)": details.komponenty,
                    "Kolor boków": details.sideColor,
                    "Kolor półek": details.shelfColor,
                    "Liczba półek (łącznie)": details.totalShelves,
                    "Odstęp między półkami": details.gap,
                } : {
                    "Rodzaj półki": details.shelfType,
                    "Wymiary (szer. x wys. x gł.)": `${details.width} cm x ${details.height} cm x ${details.depth} cm`,
                    "Kolor boków": details.sideColor,
                    "Kolor półek": details.shelfColor,
                    "Liczba półek wewn.": `${details.shelfCount} szt.`,
                    "Odstęp między półkami": details.gapInfo,
                    "Opcje dodatkowe": details.options
                };;

                for (const [key, value] of Object.entries(specs)) {
                    if (value && value !== 'n/d' && value.trim() !== "") {
                        const dt = document.createElement('dt');
                        dt.textContent = key;
                        const dd = document.createElement('dd');
                        dd.textContent = value;
                        const item = document.createElement('div');
                        item.className = 'spec-item';
                        item.appendChild(dt);
                        item.appendChild(dd);
                        specsList.appendChild(item);
                    }
                }

                if (priceDetails) {
                    const discountedPrice = priceDetails.total * (1 - DISCOUNTS.discount1item);
                    const dt = document.createElement('dt');
                    dt.textContent = 'Cena';
                    const dd = document.createElement('dd');
                    dd.innerHTML = `${discountedPrice.toFixed(2)} zł <small style="display: block; font-weight: normal; color: #15803d; font-size: 0.9em;">(z rabatem -10%)</small>`;
                    const item = document.createElement('div');
                    item.className = 'spec-item price-spec';
                    item.appendChild(dt);
                    item.appendChild(dd);
                    specsList.appendChild(item);
                }
                
                // === Generuj PDF ===
                await generateProjectPDF(details, snapshotDataUrl, priceDetails);

            } catch (error) {
                console.error("Błąd podczas przygotowywania wydruku:", error);
                alert("Wystąpił błąd podczas generowania PDF. Spróbuj ponownie.");
            } finally {
                if(printButton) {
                    printButton.disabled = false;
                    const span = printButton.querySelector('span');
                    if(span) span.textContent = 'Pobierz PDF';
                }
            }
        }



        // Mapa kolor → plik próbki
        const colorSwatchMap = {
            '#8B5A2B': 'img/dabduze.jpg',
            '#FFFFFF':  'img/bialyduze.jpg',
            '#000000':  'img/czarnyduze.jpg',
        };

        // Załaduj próbkę jako Image (z cache)
        const _swatchCache = {};
        async function loadSwatch(hex) {
            const src = colorSwatchMap[hex ? hex.toUpperCase() : ''] || colorSwatchMap[hex] || null;
            if (!src) return null;
            if (_swatchCache[src]) return _swatchCache[src];
            try {
                const resp = await fetch(src);
                const blob = await resp.blob();
                const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
                return await new Promise(res => { const img = new Image(); img.onload = () => { _swatchCache[src] = img; res(img); }; img.onerror = () => res(null); img.src = b64; });
            } catch(e) { return null; }
        }

        async function generateAllegroJPG(details, snapshotDataUrl, priceDetails) {
            // Format B: render lewy 65% + bialy panel prawy 35% — wersja Allegro
            const W = 1400, H = 1000;
            const PANEL_W = 420;       // bialy panel po prawej
            const RENDER_W = W - PANEL_W;
            const PAD = 36;

            // === SNAPSHOT Z AKTUALNEJ SCENY — kamera dopasowana do modelu ===
            const snap3d = await new Promise((res, rej) => {
                if (!renderer || !scene || !camera) return rej(new Error("brak renderera"));
                const prevBg = scene.background ? scene.background.clone() : null;
                scene.background = new THREE.Color(0xffffff);
                const prevW = renderer.domElement.width / (window.devicePixelRatio||1);
                const prevH = renderer.domElement.height / (window.devicePixelRatio||1);
                const prevPos = camera.position.clone();
                const prevTarget = controls ? controls.target.clone() : new THREE.Vector3(0,-1,0);

                // Dopasuj kamerę do faktycznego bounding box modelu
                if (shelfGroup) {
                    const box = new THREE.Box3().setFromObject(shelfGroup);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    camera.aspect = RENDER_W / H;
                    camera.updateProjectionMatrix();
                    const fovRad = camera.fov * Math.PI / 180;
                    const fovH = 2 * Math.atan(Math.tan(fovRad/2) * camera.aspect);
                    const dY = (size.y/2) / Math.tan(fovRad/2);
                    const dX = (size.x/2) / Math.tan(fovH/2);
                    const dist = Math.max(dY, dX, size.z) * 1.5;
                    camera.position.set(center.x - dist*0.5, center.y + dist*0.2, center.z + dist);
                    camera.lookAt(center);
                    if (controls) { controls.target.copy(center); controls.update(); }
                }

                renderer.setSize(RENDER_W, H);
                renderer.render(scene, camera);
                const dataUrl = renderer.domElement.toDataURL('image/png');

                // Przywróć
                if (prevBg) scene.background = prevBg;
                renderer.setSize(prevW||400, prevH||500);
                camera.aspect = (prevW||400)/(prevH||500);
                camera.updateProjectionMatrix();
                camera.position.copy(prevPos);
                if (controls) { controls.target.copy(prevTarget); controls.update(); }
                res(dataUrl);
            });

            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d');

            // === TLO ===
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // === RENDER 3D — lewa czesc ===
            const rImg = await new Promise((res,rej) => { const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=snap3d; });
            ctx.drawImage(rImg, 0, 0, RENDER_W, H);

            // === BIALY PANEL PRAWY ===
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(RENDER_W, 0, PANEL_W, H);

            // Pionowy separator
            ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(RENDER_W, 0); ctx.lineTo(RENDER_W, H); ctx.stroke();

            // Parametry
            const paramList = details.isModular ? [
                ['RODZAJ', details.shelfType],
                ['WYMIARY', (details.totalWidth||'')+'×'+(details.height||'')+'×'+(details.depth||'')+' cm'],
                ['KOLOR BOKOW', details.sideColor],
                ['KOLOR POLEK', details.shelfColor],
                ['POLKI', String(details.totalShelves||'')],
            ] : [
                ['RODZAJ', details.shelfType],
                ['WYMIARY', (details.width||'')+'×'+(details.height||'')+'×'+(details.depth||'')+' cm'],
                ['KOLOR BOKOW', details.sideColor],
                ['KOLOR POLEK', details.shelfColor],
                ['POLKI WEWN.', (details.shelfCount||'')+' szt.'],
                details.gapInfo && details.gapInfo !== 'n/d' ? ['ODSTEP', details.gapInfo] : null,
            ].filter(Boolean).filter(([,v]) => v && v !== 'n/d' && !v.startsWith('undefined'));

            const code = details.code||'—';
            const disc = priceDetails ? (priceDetails.total * (1 - DISCOUNTS.discount1item)).toFixed(2) : null;
            const orig = priceDetails ? priceDetails.total.toFixed(2) : null;

            // Montaż — z kodu półki
            const mountText = (details.shelfType||'').toLowerCase().includes('wisz') ? 'Wisząca' :
                              (details.shelfType||'').toLowerCase().includes('stoj') ? 'Stojąca na blacie' : details.shelfType || '—';

            const px = RENDER_W + PAD;
            const maxTextW = PANEL_W - PAD * 2;

            // Ile miejsca na parametry vs cena na dole
            const PRICE_H = disc ? 120 : 0;
            const CODE_H = 72; // więcej miejsca na kod i montaż
            const PARAMS_H = H - PAD - PRICE_H - CODE_H - PAD;
            const paramRowH = Math.floor(PARAMS_H / paramList.length);

            // Próbki rysowane bezpośrednio

            paramList.forEach(([label, value], i) => {
                const py = PAD + i * paramRowH;

                // Separator poziomy miedzy parametrami (nie przed pierwszym)
                if (i > 0) {
                    ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + maxTextW, py); ctx.stroke();
                }

                // Etykieta — szara uppercase
                ctx.fillStyle = '#aaaaaa';
                ctx.font = '600 14px Arial, sans-serif';
                ctx.fillText(label, px, py + 18);

                // Próbka koloru dla wierszy kolorów
                const isColorRow = label === 'KOLOR BOKOW' || label === 'KOLOR POLEK';
                const swatchSize = 80;
                const swatchX = px + maxTextW - swatchSize;
                const swatchY = py + 26;

                if (isColorRow) {
                    const swatchHex = label === 'KOLOR BOKOW' ? (details.sideColorValue || '#888') : (details.shelfColorValue || '#888');
                    const swH = (swatchHex||'').toUpperCase();
                    const swImg2 = _preloadedSwatches ? (_preloadedSwatches[swH]||_preloadedSwatches[swatchHex]) : null;
                    ctx.save();
                    ctx.beginPath(); ctx.roundRect(swatchX, swatchY, swatchSize, swatchSize, 5); ctx.clip();
                    if (swImg2) { ctx.drawImage(swImg2, swatchX, swatchY, swatchSize, swatchSize); }
                    else { ctx.fillStyle = swatchHex||'#888'; ctx.fillRect(swatchX, swatchY, swatchSize, swatchSize); }
                    ctx.restore();
                    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.roundRect(swatchX, swatchY, swatchSize, swatchSize, 5); ctx.stroke();
                }

                // Wartosc — duza czarna, auto-shrink (zostaw miejsce na próbkę)
                ctx.fillStyle = '#111111';
                let fs = 26;
                const maxW = isColorRow ? maxTextW - swatchSize - 10 : maxTextW;
                ctx.font = 'bold '+fs+'px Arial, sans-serif';
                while (ctx.measureText(value||'—').width > maxW && fs > 14) {
                    fs--;
                    ctx.font = 'bold '+fs+'px Arial, sans-serif';
                }
                ctx.fillText(value||'—', px, py + 52);
            });

            // === CENA — na dole panelu ===
            if (disc) {
                const priceY = H - CODE_H - PRICE_H;

                // Linia nad cena
                ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(px, priceY); ctx.lineTo(px + maxTextW, priceY); ctx.stroke();

                ctx.fillStyle = '#aaaaaa'; ctx.font = '600 14px Arial, sans-serif';
                ctx.fillText('CENA Z RABATEM', px, priceY + 20);

                // Stara cena przekreślona
                ctx.fillStyle = '#cccccc'; ctx.font = '500 18px Arial, sans-serif';
                ctx.fillText(orig+' zl', px, priceY + 46);
                const ow = ctx.measureText(orig+' zl').width;
                ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(px, priceY+40); ctx.lineTo(px+ow, priceY+40); ctx.stroke();

                // Nowa cena — zielona
                ctx.fillStyle = '#16a34a'; ctx.font = 'bold 42px Arial, sans-serif';
                ctx.fillText(disc+' zl', px, priceY + 96);
            }

            // === KOD + MONTAZ na samym dole ===
            const bottomY = H - CODE_H + 8;

            // Separator
            ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px, bottomY - 4); ctx.lineTo(px + maxTextW, bottomY - 4); ctx.stroke();

            // Montaż
            ctx.fillStyle = '#aaaaaa'; ctx.font = '600 12px Arial, sans-serif';
            ctx.fillText('MONTAŻ', px, bottomY + 12);
            ctx.fillStyle = '#111111'; ctx.font = 'bold 18px Arial, sans-serif';
            ctx.fillText(mountText, px, bottomY + 34);

            // Kod konfiguracyjny
            ctx.fillStyle = '#aaaaaa'; ctx.font = '600 12px Arial, sans-serif';
            ctx.fillText('KOD KONFIGURACYJNY', px, bottomY + 52);
            ctx.fillStyle = '#16a34a'; ctx.font = 'bold 13px "Courier New", monospace';
            let displayCode = code;
            while (ctx.measureText(displayCode).width > maxTextW && displayCode.length > 8) displayCode = displayCode.slice(0,-2)+'…';
            ctx.fillText(displayCode, px, bottomY + 68);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'polka-allegro-'+code.substring(0,12)+'.jpg'; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 2000);
            }, 'image/jpeg', 0.95);
        }

                async function generateProjectPDF(details, snapshotDataUrl, priceDetails) {
            function pl(str) {
                if (!str) return '—';
                return String(str)
                    .replace(/ą/g,'a').replace(/Ą/g,'A')
                    .replace(/ć/g,'c').replace(/Ć/g,'C')
                    .replace(/ę/g,'e').replace(/Ę/g,'E')
                    .replace(/ł/g,'l').replace(/Ł/g,'L')
                    .replace(/ń/g,'n').replace(/Ń/g,'N')
                    .replace(/ó/g,'o').replace(/Ó/g,'O')
                    .replace(/ś/g,'s').replace(/Ś/g,'S')
                    .replace(/ź/g,'z').replace(/Ź/g,'Z')
                    .replace(/ż/g,'z').replace(/Ż/g,'Z');
            }
            if (!window.jspdf) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    s.onload = resolve; s.onerror = reject;
                    document.head.appendChild(s);
                });
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210, H = 297;
            const margin = 16;
            const contentW = W - margin * 2;
            let y = margin;

            // ---- Kolory ----
            const green = [22, 163, 74];
            const dark  = [17, 24, 39];
            const gray  = [107, 114, 128];
            const light = [249, 250, 251];
            const border = [229, 231, 235];

            // ---- Nagłówek ----
            doc.setFillColor(...green);
            doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Podsumowanie projektu polki', margin + 6, y + 7.5);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
            doc.text(dateStr, W - margin - 6, y + 7.5, { align: 'right' });
            doc.setFontSize(7.5);
            doc.text(`Kod: ${pl(details.code) || '—'}`, margin + 6, y + 13.5);
            y += 24;

            // ---- Wizualizacja 3D ----
            if (snapshotDataUrl) {
                const imgH = 72;
                doc.setFillColor(...light);
                doc.setDrawColor(...border);
                doc.roundedRect(margin, y, contentW, imgH + 4, 3, 3, 'FD');
                try {
                    doc.addImage(snapshotDataUrl, 'PNG', margin + (contentW - 90) / 2, y + 2, 90, imgH);
                } catch(e) {}
                y += imgH + 10;
            }

            // ---- Sekcja Parametry ----
            doc.setFillColor(...light);
            doc.setDrawColor(...border);
            doc.roundedRect(margin, y, contentW, 7, 2, 2, 'FD');
            doc.setTextColor(...dark);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.text('PARAMETRY POLKI', margin + 4, y + 4.8);
            y += 10;

            // Parametry
            const specs = details.isModular ? [
                ['Rodzaj', pl(details.shelfType)],
                ['Wymiary (calkowite)', `${pl(details.totalWidth)} x ${pl(details.height)} x ${pl(details.depth)} cm`],
                ['Komponenty', pl(details.komponenty)],
                ['Kolor bokow', pl(details.sideColor)],
                ['Kolor polek', pl(details.shelfColor)],
                ['Liczba polek', String(details.totalShelves)],
                ['Odstep miedzy polkami', pl(details.gap)],
            ] : [
                ['Rodzaj', pl(details.shelfType)],
                ['Szerokosc', `${pl(details.width)} cm`],
                ['Wysokosc', `${pl(details.height)} cm`],
                ['Glebokosc', `${pl(details.depth)} cm`],
                ['Kolor bokow', pl(details.sideColor)],
                ['Kolor polek', pl(details.shelfColor)],
                ['Ilosc polek wewn.', `${pl(details.shelfCount)} szt.`],
                ['Odstep miedzy polkami', pl(details.gapInfo) || '—'],
                ['Opcje dodatkowe', pl(details.options) || 'standardowa'],
            ].filter(([,v]) => v && v !== 'n/d');

            // Dwukolumnowy grid parametrów
            const colW = (contentW - 6) / 2;
            const rowH = 8.5;
            specs.forEach(([key, val], i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const px = margin + col * (colW + 6);
                const py = y + row * rowH;
                // Zebra
                if (Math.floor(i / 2) % 2 === 0) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(px, py, colW, rowH, 'F');
                }
                doc.setTextColor(...gray);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text(pl(key), px + 2.5, py + 3.2);
                doc.setTextColor(...dark);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                const maxChars = 32;
                const displayVal = val && val.length > maxChars ? val.substring(0, maxChars) + '...' : (val || '—');
                doc.text(displayVal, px + 2.5, py + 7);
            });
            const rows = Math.ceil(specs.length / 2);
            y += rows * rowH + 8;

            // ---- Odleglosci miedzy polkami (osobna sekcja) ----
            const _distances = details.customPosDistances || (
                details.gapInfo && details.gapInfo !== 'n/d' && details.gapInfo !== '—'
                    ? (() => {
                        // gapInfo moze byc "24 cm" lub "15 · 20 cm" — parsujemy
                        const parts = details.gapInfo.replace(/cm/g,'').split('·').map(s => s.trim()).filter(Boolean);
                        return parts.length > 1 ? parts : null;
                    })()
                    : null
            );
            if (_distances && _distances.length > 1) {
                doc.setFillColor(...light);
                doc.setDrawColor(...border);
                doc.roundedRect(margin, y, contentW, 7, 2, 2, 'FD');
                doc.setTextColor(...dark);
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'bold');
                doc.text('ODLEGLOSCI MIEDZY POLKAMI', margin + 4, y + 4.8);
                y += 10;

                const _gapH = 9;
                const _gapColW = contentW / _distances.length;
                _distances.forEach((dist, idx) => {
                    const _gx = margin + idx * _gapColW;
                    if (idx % 2 === 0) {
                        doc.setFillColor(248, 250, 252);
                        doc.rect(_gx, y, _gapColW, _gapH, 'F');
                    }
                    doc.setTextColor(...gray);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Przestrzen ${idx + 1}`, _gx + 2.5, y + 3.2);
                    doc.setTextColor(...dark);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${dist} cm`, _gx + 2.5, y + 7.5);
                });
                y += _gapH + 8;
            }

            // ---- Cena ----
            if (priceDetails) {
                const discountedPrice = (priceDetails.total * (1 - DISCOUNTS.discount1item)).toFixed(2);
                const originalPrice = priceDetails.total.toFixed(2);
                doc.setFillColor(...green);
                doc.roundedRect(margin, y, contentW, 20, 3, 3, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Cena z rabatem -10%', margin + 6, y + 6.5);
                doc.setFontSize(7);
                doc.setTextColor(200, 255, 200);
                doc.text(`Cena bazowa: ${originalPrice} zl`, margin + 6, y + 11.5);
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(`${discountedPrice} zl`, W - margin - 6, y + 13, { align: 'right' });
                y += 26;
            }

            // ---- Stopka ----
            doc.setDrawColor(...border);
            doc.setLineWidth(0.3);
            doc.line(margin, H - 18, W - margin, H - 18);
            doc.setTextColor(...gray);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text('Wygenerowano z Konfiguratora Polek', margin, H - 12);
            doc.text('Strona 1 z 1', W - margin, H - 12, { align: 'right' });

            // ---- Pobierz ----
            const filename = `projekt-polki-${(details.code || 'pdf').substring(0, 12)}.pdf`;
            doc.save(filename);
        }

        function updateSwatchDisplay(selectElementId, swatchDisplayId) { const selectElement = document.getElementById(selectElementId); const swatchDisplay = document.getElementById(swatchDisplayId); if (!selectElement || !swatchDisplay) return; const selectedOption = selectElement.options[selectElement.selectedIndex]; const color = selectedOption ? selectedOption.dataset.color : null; if (color) { swatchDisplay.style.backgroundColor = color; swatchDisplay.style.display = 'inline-block'; if (color.toUpperCase() === '#FFFFFF') { swatchDisplay.classList.add('swatch-white-display'); } else { swatchDisplay.classList.remove('swatch-white-display'); } } else { swatchDisplay.style.backgroundColor = '#E5E7EB'; swatchDisplay.classList.remove('swatch-white-display'); } }
        function closeDetailsPanelIfNeeded() { const detailsPanel = document.getElementById('materialSamplesDetails'); if (detailsPanel && detailsPanel.open) { detailsPanel.open = false; } }
        function setActiveMobileIcon(clickedButton) { const mobileIconsContainer = document.getElementById('mobilePanelIcons'); if (!mobileIconsContainer) return; const buttons = mobileIconsContainer.querySelectorAll('button'); buttons.forEach(button => { button.classList.remove('mobile-icon-active'); }); if (clickedButton && buttons.length > 0) { clickedButton.classList.add('mobile-icon-active'); } }
        function scrollToElementAndHighlight(elementId, blockPosition = 'start', clickedButton = null, inlinePosition = 'nearest') {
            const element = document.getElementById(elementId);
            if (!element) { console.error('Nie znaleziono elementu:', elementId); return; }

            let highlightTarget = element.closest('.p-6.shadow.rounded-lg');
            if (!highlightTarget) highlightTarget = element.closest('.w-full.max-w-lg') || element;

            /* --- usuń poprzednie podświetlenia --- */
            document.querySelectorAll('.section-highlight-persistent').forEach(el => {
                if (el !== highlightTarget) el.classList.remove('section-highlight-persistent');
            });
            if (clickedButton) setActiveMobileIcon(clickedButton);

            /* --- przewiń --- */
            if (window.innerWidth < 768) {
                /* Na mobile 3D zajmuje dolne 52vh → górna część to ~48vh.
                   Chcemy, żeby sekcja była wyśrodkowana w tej górnej połowie. */
                const visibleTopHeight = window.innerHeight * 0.48;
                const elRect   = highlightTarget.getBoundingClientRect();
                const elHeight = elRect.height;
                const targetScrollY = window.scrollY + elRect.top
                                    - (visibleTopHeight / 2)
                                    + (elHeight / 2);
                window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
            } else {
                highlightTarget.scrollIntoView({ behavior: 'smooth', block: blockPosition, inline: inlinePosition });
            }

            /* --- flash + persistent --- */
            highlightTarget.classList.remove('section-highlight-flash');
            void highlightTarget.offsetWidth;
            highlightTarget.classList.add('section-highlight-flash');
            highlightTarget.classList.add('section-highlight-persistent');
            setTimeout(() => highlightTarget.classList.remove('section-highlight-flash'), 750);

            /* --- MOBILE: pulsująca ramka, zniknie po wyborze --- */
            if (window.innerWidth < 768) {
                document.querySelectorAll('.mobile-section-active').forEach(el => el.classList.remove('mobile-section-active'));
                highlightTarget.classList.add('mobile-section-active');

                const inputs = highlightTarget.querySelectorAll('select, input[type="range"], input[type="radio"], input[type="checkbox"]');
                const onInteract = () => {
                    highlightTarget.classList.remove('mobile-section-active');
                    inputs.forEach(i => {
                        i.removeEventListener('change', onInteract);
                        i.removeEventListener('input',  onInteract);
                    });
                };
                inputs.forEach(i => {
                    i.addEventListener('change', onInteract);
                    i.addEventListener('input',  onInteract);
                });
            }
        }
        function scrollToElement(elementId, blockPosition = 'start', clickedButton = null, inlinePosition = 'nearest') { const element = document.getElementById(elementId); if (element) { let targetElement = element.closest('.p-6.shadow.rounded-lg') || element.closest('.w-full.max-w-lg') || element; targetElement.scrollIntoView({ behavior: 'smooth', block: blockPosition, inline: inlinePosition }); } else { console.error('Nie znaleziono elementu o ID (scrollToElement):', elementId); } }
        function scrollToBottom() { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
        /* ══════════════════════════════════════════════
           LIGHTBOX — slider z swipe + momentum
        ══════════════════════════════════════════════ */
        let _lb = {
            photos: [], idx: 0,
            track: null, viewport: null,
            strip: null, counter: null,
            prevBtn: null, nextBtn: null,
            slideW: 0,
            counterTimer: null,
            scrollTimer: null,
            preventScroll: null   // touchmove handler ref
        };

        function _lbSlideW() {
            const w = _lb.viewport ? _lb.viewport.offsetWidth : 0;
            return w > 10 ? w : Math.min(window.innerWidth * 0.92, 820);
        }

        function _lbUpdateUI(idx) {
            if (!_lb.strip) return;
            _lb.strip.querySelectorAll('.lb-thumb').forEach((t, ti) => t.classList.toggle('active', ti === idx));
            _lb.prevBtn.classList.toggle('lb-hidden', idx === 0);
            _lb.nextBtn.classList.toggle('lb-hidden', idx === _lb.photos.length - 1);
            if (_lb.photos.length > 1) {
                _lb.counter.textContent = `${idx + 1} / ${_lb.photos.length}`;
                _lb.counter.classList.add('lb-visible');
                clearTimeout(_lb.counterTimer);
                _lb.counterTimer = setTimeout(() => _lb.counter.classList.remove('lb-visible'), 1800);
            }
        }

        function _lbGoTo(idx, animated) {
            if (!_lb.photos.length) return;
            idx = Math.max(0, Math.min(_lb.photos.length - 1, idx));
            _lb.idx = idx;
            const w = _lbSlideW();
            if (animated) {
                _lb.track.scrollTo({ left: idx * w, behavior: 'smooth' });
            } else {
                // Natychmiastowe — bez animacji (iOS safe)
                const prev = _lb.track.style.scrollBehavior;
                _lb.track.style.scrollBehavior = 'auto';
                _lb.track.scrollLeft = idx * w;
                _lb.track.style.scrollBehavior = prev;
            }
            _lbUpdateUI(idx);
        }

        function _lbBuild(photos, startIdx) {
            const track = document.getElementById('lb-track');
            track.innerHTML = '';
            const w = _lbSlideW();
            photos.forEach(src => {
                const slide = document.createElement('div');
                slide.className = 'lb-slide';
                slide.style.width = w + 'px';
                const img = document.createElement('img');
                img.src = src; img.loading = 'lazy';
                img.draggable = false;
                slide.appendChild(img);
                track.appendChild(slide);
            });
            _lb.track = track;
            _lb.slideW = w;

            // Aktualizuj idx po natywnym swipe (iOS scroll-snap)
            const _onScrollDone = () => {
                const newIdx = Math.round(track.scrollLeft / w);
                if (newIdx !== _lb.idx) {
                    _lb.idx = newIdx;
                    _lbUpdateUI(newIdx);
                }
            };
            if ('onscrollend' in window) {
                track.addEventListener('scrollend', _onScrollDone, { passive: true });
            } else {
                track.addEventListener('scroll', () => {
                    clearTimeout(_lb.scrollTimer);
                    _lb.scrollTimer = setTimeout(_onScrollDone, 80);
                }, { passive: true });
            }
        }

        function _lbSetupStrip(photos, startIdx) {
            const strip = document.getElementById('lb-strip');
            strip.innerHTML = '';
            if (photos.length > 1) {
                photos.forEach((src, i) => {
                    const th = document.createElement('button');
                    th.className = 'lb-thumb' + (i === startIdx ? ' active' : '');
                    th.setAttribute('aria-label', 'Zdjęcie ' + (i + 1));
                    th.addEventListener('click', () => _lbGoTo(i, true));
                    strip.appendChild(th);
                });
            }
            _lb.strip = strip;
        }

        function openLightbox(imageSrc, allPhotos) {
            if (!imageLightbox) return;
            const photos = (allPhotos && allPhotos.length) ? allPhotos : [imageSrc];
            const startIdx = Math.max(0, photos.indexOf(imageSrc));

            _lb.photos   = photos;
            _lb.idx      = startIdx;
            _lb.viewport = document.getElementById('lb-viewport');
            _lb.counter  = document.getElementById('lb-counter');
            _lb.prevBtn  = document.getElementById('lb-prev');
            _lb.nextBtn  = document.getElementById('lb-next');

            // Efekt "odsunięcia sąsiadów" — aktywny kafel powiększa się, reszta cofa
            const _srcTile = typeof imageSrc === 'string'
                ? Array.from(document.querySelectorAll('.gallery-image-container img')).find(im => im.src.includes(imageSrc.split('/').pop()))?.closest('.gallery-tile')
                : null;
            document.querySelectorAll('.gallery-tile').forEach(t => {
                t.style.transition = 'transform 0.32s cubic-bezier(0.34,1.38,0.64,1), opacity 0.32s ease';
                if (t === _srcTile) {
                    t.style.transform = 'scale(1.04)';
                } else {
                    t.style.transform = 'scale(0.95)';
                    t.style.opacity = '0.7';
                }
            });

            // pokaż lightbox z animacją
            imageLightbox.classList.remove('hidden');
            imageLightbox.classList.remove('opacity-0');
            imageLightbox.classList.remove('lb-opening');
            void imageLightbox.offsetWidth; // reflow
            imageLightbox.classList.add('lb-opening');
            setTimeout(() => imageLightbox.classList.remove('lb-opening'), 400);

            // Blokuj scroll tła (iOS-safe: position fixed + zapamiętaj pozycję)
            const _savedScrollY = window.scrollY || window.pageYOffset;
            document.body.dataset.lbScrollY = _savedScrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${_savedScrollY}px`;

            // Zapobiegaj pionowemu scrollowi strony podczas swipe w lightboxie
            if (_lb.preventScroll) imageLightbox.removeEventListener('touchmove', _lb.preventScroll);
            _lb.preventScroll = e => {
                // Pozwól natywny poziomy scroll na lb-track, blokuj resztę
                if (!e.target.closest('#lb-track')) e.preventDefault();
            };
            imageLightbox.addEventListener('touchmove', _lb.preventScroll, { passive: false });

            // po 1 klatce viewport ma już wymiary — buduj slajdy
            requestAnimationFrame(() => {
                _lbBuild(photos, startIdx);
                _lbSetupStrip(photos, startIdx);
                _lbGoTo(startIdx, false);
            });
        }

        /* ── Swipe / drag handlers ── */
        function _lbOnPointerDown(e) {
            if (e.button && e.button !== 0) return;
            _lb.dragging  = true;
            _lb.dirLocked = null;
            _lb.startX    = e.touches ? e.touches[0].clientX : e.clientX;
            _lb.startY    = e.touches ? e.touches[0].clientY : e.clientY;
            _lb.currentX  = 0;
            _lb.lastX     = _lb.startX;
            _lb.lastT     = Date.now();
            _lb.velX      = 0;
            _lb.track.classList.add('lb-no-transition');
        }
        function _lbOnPointerMove(e) {
            if (!_lb.dragging) return;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = cx - _lb.startX;
            const dy = cy - _lb.startY;
            // lock direction on first move
            if (!_lb.dirLocked) {
                _lb.dirLocked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
            }
            if (_lb.dirLocked === 'v') { _lb.dragging = false; return; }
            e.preventDefault();
            const now = Date.now();
            const dt  = Math.max(now - _lb.lastT, 1);
            _lb.velX  = (cx - _lb.lastX) / dt;
            _lb.lastX = cx; _lb.lastT = now;
            _lb.currentX = dx;
            // rubber-band na kraocach
            let offset = dx;
            if ((_lb.idx === 0 && dx > 0) || (_lb.idx === _lb.photos.length - 1 && dx < 0)) {
                offset = dx * 0.22;
            }
            const base = -_lb.idx * _lbSlideW();
            _lb.track.style.transform = `translateX(${base + offset}px)`;
        }
        function _lbOnPointerUp() {
            if (!_lb.dragging) return;
            _lb.dragging = false;
            _lb.track.classList.remove('lb-no-transition');
            const w = _lbSlideW();
            const threshold = w * 0.22;
            const velThresh = 0.35; // px/ms
            let next = _lb.idx;
            if (_lb.currentX < -threshold || _lb.velX < -velThresh) next++;
            else if (_lb.currentX > threshold || _lb.velX > velThresh) next--;
            _lbGoTo(next, true);
        }

        /* ── Klawiatura ── */
        function _lbOnKey(e) {
            if (imageLightbox.classList.contains('hidden')) return;
            if (e.key === 'ArrowRight') _lbGoTo(_lb.idx + 1, true);
            if (e.key === 'ArrowLeft')  _lbGoTo(_lb.idx - 1, true);
            if (e.key === 'Escape')     closeLightbox();
        }

        function closeLightbox() {
            if (imageLightbox) {
                imageLightbox.classList.add('hidden');
                imageLightbox.classList.add('opacity-0');
                imageLightbox.classList.remove('lb-opening');
                // Przywróć kafle galerii
                document.querySelectorAll('.gallery-tile').forEach(t => {
                    t.style.transform = '';
                    t.style.opacity = '';
                    setTimeout(() => { t.style.transition = ''; }, 320);
                });
                // Przywróć scroll tła i pozycję strony
                const _restoreY = parseInt(document.body.dataset.lbScrollY || '0');
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.body.style.top = '';
                window.scrollTo(0, _restoreY);
                // Usuń touchmove blokadę
                if (_lb.preventScroll) {
                    imageLightbox.removeEventListener('touchmove', _lb.preventScroll);
                    _lb.preventScroll = null;
                }
            }
        }
        function initializeTabbedGallery() {
    if (!galleryTabsContainer || !galleryGridContainer || !galleryImageArea || !configuratorSection || !galleryPrevArrow || !galleryNextArrow) {
        console.error("Nie znaleziono wszystkich elementów galerii potrzebnych do inicjalizacji.");
        return;
    }

    // --- FINAŁOWA WERSJA ANIMACJI v2.3 Z BLOKADĄ PRZEWIJANIA ---
    const animateAndConfigure = (imgElement, galleryIndex, imageIndex) => {
        // --- ANIMACJA MOBILNA ---
        if (window.innerWidth < 768) {
            const startRect = imgElement.getBoundingClientRect();
            const actionBar = imgElement.closest('.gallery-image-container')?.querySelector('.gal-overlay');
            if (actionBar) actionBar.style.opacity = '0';

            // 1. Otwórz pusty panel 3D
            open3dPanel();

            // 2. Poczekaj aż panel wyjedzie, potem animuj
            setTimeout(() => {
                const canvasWrapper = document.getElementById('threeJsCanvasWrapper');
                if (!canvasWrapper) { if (actionBar) actionBar.style.opacity = '1'; return; }
                const endRect = canvasWrapper.getBoundingClientRect();

                const explodeContainer = document.createElement('div');
                explodeContainer.className = 'image-explode-container';
                document.body.appendChild(explodeContainer);

                const positions = [
                    { top: '0',   left: '0',   bgPos: '0% 0%' },
                    { top: '0',   left: '50%', bgPos: '100% 0%' },
                    { top: '50%', left: '0',   bgPos: '0% 100%' },
                    { top: '50%', left: '50%', bgPos: '100% 100%' }
                ];

                const pieces = positions.map(pos => {
                    const piece = document.createElement('div');
                    piece.className = 'image-explode-piece';
                    piece.style.top = pos.top;
                    piece.style.left = pos.left;
                    piece.style.backgroundImage = `url(${imgElement.src})`;
                    piece.style.backgroundPosition = pos.bgPos;
                    explodeContainer.appendChild(piece);
                    return piece;
                });

                gsap.set(explodeContainer, {
                    left:   startRect.left,
                    top:    startRect.top,
                    width:  startRect.width,
                    height: startRect.height
                });

                const tl = gsap.timeline({
                    onComplete: () => {
                        explodeContainer.remove();
                        if (actionBar) actionBar.style.opacity = '1';
                    }
                });

                // 3. Zdjęcie spada płynnie na cały obszar canvasa
                tl.to(explodeContainer, {
                    left:   endRect.left,
                    top:    endRect.top,
                    width:  endRect.width,
                    height: endRect.height,
                    borderRadius: '0',
                    duration: 0.85,
                    ease: 'power3.inOut'
                });

                // 4. Krótka pauza — zdjęcie "siedzi" na canvasie
                tl.to({}, { duration: 0.15 });

                // 5. Fragmenty implodują DO CENTRUM — każdy z rogu wciąga się do środka
                tl.to(pieces, {
                    xPercent: (i) => (i % 2 === 0 ? 50 : -50),   // lewe → prawo, prawe → lewo
                    yPercent: (i) => (i < 2 ? 50 : -50),           // górne → dół, dolne → góra
                    scale: 0,
                    opacity: 0,
                    rotation: (i) => (i % 2 === 0 ? -45 : 45),    // skręt do środka
                    duration: 0.65,
                    ease: 'power2.in',
                    stagger: 0.07                                   // szybki stagger — wciągają się po sobie
                });

                // 6. Gdy ostatni fragment znika — buduj półkę z centrum
                tl.call(() => {
                    applyShelfConfigurationFromGallery(galleryIndex, imageIndex);
                }, [], '>-0.1');

            }, 400);

            return;
        }
        // --- ANIMACJA DESKTOPOWA — implozja do centrum jak na mobile ---
        const startRect = imgElement.getBoundingClientRect();
        const endTarget = document.getElementById('threeJsCanvasWrapper');
        if (!endTarget) {
            applyShelfConfigurationFromGallery(galleryIndex, imageIndex);
            configuratorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        const actionBar = imgElement.closest('.gallery-image-container')?.querySelector('.gal-overlay');
        if (actionBar) actionBar.style.opacity = '0';

        // Scroll natychmiast — żeby canvas był widoczny gdy zdjęcie tam doleci
        configuratorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Poczekaj aż scroll się ustabilizuje, potem pobierz aktualny rect canvasa
        setTimeout(() => {
            const endRect = endTarget.getBoundingClientRect();

            const explodeContainer = document.createElement('div');
            explodeContainer.className = 'image-explode-container';
            document.body.appendChild(explodeContainer);

            const positions = [
                { top: '0',   left: '0',   bgPos: '0% 0%' },
                { top: '0',   left: '50%', bgPos: '100% 0%' },
                { top: '50%', left: '0',   bgPos: '0% 100%' },
                { top: '50%', left: '50%', bgPos: '100% 100%' }
            ];

            const pieces = positions.map(pos => {
                const piece = document.createElement('div');
                piece.className = 'image-explode-piece';
                piece.style.top = pos.top;
                piece.style.left = pos.left;
                piece.style.backgroundImage = `url(${imgElement.src})`;
                piece.style.backgroundPosition = pos.bgPos;
                explodeContainer.appendChild(piece);
                return piece;
            });

            const freshStartRect = imgElement.getBoundingClientRect();
            gsap.set(explodeContainer, {
                left:   freshStartRect.left,
                top:    freshStartRect.top,
                width:  freshStartRect.width,
                height: freshStartRect.height
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    explodeContainer.remove();
                    if (actionBar) actionBar.style.opacity = '1';
                }
            });

            tl.to(explodeContainer, {
                left:   endRect.left,
                top:    endRect.top,
                width:  endRect.width,
                height: endRect.height,
                borderRadius: '0.5rem',
                duration: 1.0,
                ease: 'power3.inOut'
            });

            tl.to({}, { duration: 0.15 });

            tl.to(pieces, {
                xPercent: (i) => (i % 2 === 0 ? 50 : -50),
                yPercent: (i) => (i < 2 ? 50 : -50),
                scale: 0,
                opacity: 0,
                rotation: (i) => (i % 2 === 0 ? -45 : 45),
                duration: 0.65,
                ease: 'power2.in',
                stagger: 0.07
            });

            tl.call(() => {
                applyShelfConfigurationFromGallery(galleryIndex, imageIndex);
            }, [], '>-0.1');

        }, 650);
    };

    const displayImages = (galleryIndex) => {
        if (gallerySwiperInstance) { gallerySwiperInstance.destroy(true, true); gallerySwiperInstance = null; }
        galleryGridContainer.innerHTML = '';
        const images = galleryData[galleryIndex].imgs;
        const extrasAll = galleryData[galleryIndex].extras || [];
        const fragment = document.createDocumentFragment();

        images.forEach((imgDataOrSrc, i) => {
            // Obsługa nowej struktury: tablica zdjęć na produkt ["img/1/1.jpg","img/1/2.jpg",...]
            // lub stara: string / obiekt {src}
            let allPhotos;
            if (Array.isArray(imgDataOrSrc)) {
                allPhotos = imgDataOrSrc.filter(Boolean);
            } else {
                const mainSrc = typeof imgDataOrSrc === 'string' ? imgDataOrSrc : imgDataOrSrc.src;
                const extras  = (extrasAll[i] || []).filter(Boolean);
                allPhotos = [mainSrc, ...extras];
            }
            if (allPhotos.length === 0) return;
            const mainSrc = allPhotos[0];
            let currentPhotoIdx = 0;

            const tileDiv = document.createElement('div');
            tileDiv.className = 'gallery-tile';

            // ── kontener zdjęcia ──
            const imgContainer = document.createElement('div');
            imgContainer.className = 'gallery-image-container';

            // intro tile — pokazuj tylko RAZ (sessionStorage)
            if (galleryIndex === 0 && i === 0 && !sessionStorage.getItem('gal-intro-shown')) {
                sessionStorage.setItem('gal-intro-shown', '1');
                const introTileDiv = document.createElement('div');
                introTileDiv.id = 'galleryIntroTile';
                introTileDiv.className = 'gallery-intro-tile';
                introTileDiv.style.pointerEvents = 'none';
                introTileDiv.innerHTML = `<p><strong>Kliknij w zdjęcie</strong>, by przerobić gotową półkę, lub <strong>zaprojektuj własną</strong> od nowa.</p>`;
                imgContainer.appendChild(introTileDiv);
                setTimeout(() => { introTileDiv.classList.add('is-animating'); }, 100);
                setTimeout(() => { introTileDiv.classList.add('fade-out'); }, 3500);
            }

            // główne zdjęcie
            const img = document.createElement('img');
            img.src = mainSrc;
            img.alt = `${galleryData[galleryIndex].title} - zdjęcie ${i + 1}`;
            img.loading = 'lazy';
            img.style.cursor = 'pointer';
            imgContainer.appendChild(img);

            // odznaka "📷 1/3" — tylko jeśli ma extras
            if (allPhotos.length > 1) {
                const badge = document.createElement('div');
                badge.className = 'gallery-photo-badge';
                badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12" r="3.5"/></svg><span>1 / ${allPhotos.length}</span>`;
                imgContainer.appendChild(badge);

                // ── funkcja przełączania zdjęcia ──
                const setPhoto = (idx) => {
                    currentPhotoIdx = idx;
                    img.classList.remove('photo-fade');
                    void img.offsetWidth; // reflow
                    img.classList.add('photo-fade');
                    img.src = allPhotos[idx];
                    // aktualizuj odznakę
                    badge.querySelector('span').textContent = `${idx + 1} / ${allPhotos.length}`;
                    // aktualizuj kropki
                    tileDiv.querySelectorAll('.gallery-dot').forEach((d, di) => d.classList.toggle('active', di === idx));
                    // aktualizuj miniatury
                    tileDiv.querySelectorAll('.gallery-mini-thumb').forEach((t, ti) => t.classList.toggle('gmt-active', ti === idx));
                };

                // ── swipe wewnątrz kafelka (zmiana zdjęcia w pod-galerii) ──
                // Śledzimy też pozycję scroll galerii — jeśli galeria się przesunęła, to NIE przełączamy zdjęcia
                let _tx = 0, _ty = 0, _tt = 0, _tscroll = 0;
                imgContainer.addEventListener('touchstart', e => {
                    _tx = e.touches[0].clientX;
                    _ty = e.touches[0].clientY;
                    _tt = Date.now();
                    _tscroll = galleryImageArea ? galleryImageArea.scrollLeft : 0;
                }, { passive: true });
                imgContainer.addEventListener('touchend', e => {
                    const dx = e.changedTouches[0].clientX - _tx;
                    const dy = e.changedTouches[0].clientY - _ty;
                    const dt = Date.now() - _tt;
                    const scrollDelta = galleryImageArea ? Math.abs(galleryImageArea.scrollLeft - _tscroll) : 0;
                    // Jeśli galeria się przewinęła o więcej niż 8px — to był scroll galerii, nie swipe zdjęcia
                    if (scrollDelta > 8) return;
                    // Swipe: minimum 75px poziomo, 2x bardziej poziomy niż pionowy, szybki gest
                    if (Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 75 && dt < 400) {
                        const next = Math.max(0, Math.min(allPhotos.length - 1, currentPhotoIdx + (dx < 0 ? 1 : -1)));
                        if (next !== currentPhotoIdx) setPhoto(next);
                    }
                }, { passive: true });

                // expose dla ikon akcji (zoom pokazuje aktualnie wyświetlane zdjęcie)
                img._getActiveSrc = () => allPhotos[currentPhotoIdx];
                img._setPhoto = setPhoto;
            }

            // ── overlay (kółka C) ──
            const overlayHTML = `<div class="gal-overlay" aria-hidden="true">
              <button class="gal-overlay-btn gal-btn-gallery">
                <span class="gal-btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/>
                    <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/>
                  </svg>
                </span>
                <span class="gal-btn-label">Galeria</span>
              </button>
              <button class="gal-overlay-btn gal-btn-configure">
                <span class="gal-btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .905c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.906c.007-.378-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"/>
                    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  </svg>
                </span>
                <span class="gal-btn-label">Ustaw</span>
              </button>
            </div>`;
            imgContainer.insertAdjacentHTML('beforeend', overlayHTML);

            tileDiv.appendChild(imgContainer);

            // ── kropki (tylko gdy są extras) ──
            if (allPhotos.length > 1) {
                const dotsRow = document.createElement('div');
                dotsRow.className = 'gallery-dots';
                allPhotos.forEach((_, di) => {
                    const dot = document.createElement('button');
                    dot.className = 'gallery-dot' + (di === 0 ? ' active' : '');
                    dot.addEventListener('click', e => { e.stopPropagation(); img._setPhoto(di); });
                    dotsRow.appendChild(dot);
                });
                tileDiv.appendChild(dotsRow);
            }
            // zachowaj referencję do allPhotos dla lightboxa
            img._allPhotos = allPhotos;

            // ── Auto-probe dodatkowych zdjęć (2.jpg, 3.jpg...) z tego samego folderu ──
            // Działa gdy ścieżka ma format: img/kategoria/N/1.jpg
            (function probeExtraPhotos() {
                const m = (allPhotos[0] || '').match(/^(.+\/)(\d+)(\.jpg|\.jpeg|\.png)$/i);
                if (!m) return;
                const folderBase = m[1]; // np. "img/stojace/1/"
                const ext = m[3];        // ".jpg"
                let nextIdx = allPhotos.length + 1;
                const tryNext = () => {
                    const probeSrc = folderBase + nextIdx + ext;
                    const probe = new Image();
                    probe.onload = () => {
                        allPhotos.push(probeSrc);
                        img._allPhotos = allPhotos;
                        nextIdx++;
                        // Aktualizuj odznakę i kropki
                        if (allPhotos.length === 2) {
                            // Pierwsza extra — musieliśmy zbudować badge od zera; odśwież kafelek
                            const bd = imgContainer.querySelector('.gallery-photo-badge');
                            if (!bd) {
                                const newBadge = document.createElement('div');
                                newBadge.className = 'gallery-photo-badge';
                                newBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12" r="3.5"/></svg><span>1 / 2</span>`;
                                imgContainer.appendChild(newBadge);
                                // Podpięcie setPhoto do nowego badge
                                img._setPhoto = (idx) => {
                                    currentPhotoIdx = idx;
                                    img.classList.remove('photo-fade'); void img.offsetWidth; img.classList.add('photo-fade');
                                    img.src = allPhotos[idx];
                                    tileDiv.querySelectorAll('.gallery-photo-badge span').forEach(s => s.textContent = `${idx+1} / ${allPhotos.length}`);
                                    tileDiv.querySelectorAll('.gallery-dot').forEach((d,di) => d.classList.toggle('active', di===idx));
                                };
                            }
                        }
                        const badgeSpan = imgContainer.querySelector('.gallery-photo-badge span');
                        if (badgeSpan) badgeSpan.textContent = `1 / ${allPhotos.length}`;
                        tryNext();
                    };
                    probe.onerror = () => {}; // brak pliku — stop
                    probe.src = probeSrc;
                };
                tryNext();
            })();

            // ── podpis ──
            const captionDiv = document.createElement('div');
            captionDiv.className = 'gallery-caption';
            captionDiv.textContent = '';
            tileDiv.appendChild(captionDiv);

            // ── B3 overlay — zdarzenia ──
            const overlay   = imgContainer.querySelector('.gal-overlay');
            const galBtn    = imgContainer.querySelector('.gal-btn-gallery');
            const cfgBtn    = imgContainer.querySelector('.gal-btn-configure');
            let _overlayTimer = null;

            const showOverlay = () => {
                overlay.classList.add('gal-overlay--visible');
                clearTimeout(_overlayTimer);
                _overlayTimer = setTimeout(() => overlay.classList.remove('gal-overlay--visible'), 2500);
            };
            const hideOverlay = () => {
                overlay.classList.remove('gal-overlay--visible');
                clearTimeout(_overlayTimer);
            };

            // JS hover — niezawodny na wszystkich przeglądarkach/urządzeniach
            imgContainer.addEventListener('mouseenter', () => {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
            });
            imgContainer.addEventListener('mouseleave', () => {
                overlay.style.opacity = '';
                overlay.style.pointerEvents = '';
                overlay.classList.remove('gal-overlay--visible');
            });

            const doConfigure = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.gallery-tile').forEach(t => t.classList.remove('gallery-tile--active'));
                tileDiv.classList.add('gallery-tile--active');
                animateAndConfigure(img, galleryIndex, i);
            };

            // Przycisk Galeria
            galBtn.addEventListener('click', e => {
                e.stopPropagation();
                hideOverlay();
                openLightbox(img._getActiveSrc ? img._getActiveSrc() : mainSrc, img._allPhotos);
            });

            // Przycisk Konfiguruj
            cfgBtn.addEventListener('click', e => {
                e.stopPropagation();
                hideOverlay();
                doConfigure(e);
            });

            // Klik w tło overlay (nie w przycisk) — zawsze tylko chowa overlay
            overlay.addEventListener('click', e => {
                if (e.target.closest('.gal-overlay-btn')) return;
                hideOverlay();
            });

            // Klik w zdjęcie
            img.addEventListener('click', e => {
                const isTouch = window.matchMedia('(hover: none)').matches;
                if (isTouch) {
                    // mobile: pierwszy tap pokazuje overlay
                    if (!overlay.classList.contains('gal-overlay--visible')) {
                        e.stopPropagation();
                        showOverlay();
                    }
                }
                // desktop: klik w zdjęcie nic nie robi — akcje tylko przez przyciski overlay
            });

            fragment.appendChild(tileDiv);
        });

        galleryGridContainer.appendChild(fragment);
        // reset natychmiastowy — przed scroll-snap i layout przeglądarki
        galleryImageArea.scrollLeft = 0;
        gallerySwiperInstance = null; // native scroll-snap — Swiper nie potrzebny

        // ── Strzałki i scroll ──
        const _galWrapper = galleryImageArea.closest('.gallery-content-wrapper');
        const _galTileStep = () => {
            const tile = galleryGridContainer.querySelector('.gallery-tile');
            if (!tile) return 300;
            const gap = parseInt(getComputedStyle(galleryGridContainer).gap) || 14;
            return tile.offsetWidth + gap;
        };
        const _galUpdateArrows = () => {
            if (!galleryPrevArrow || !galleryNextArrow) return;
            const sl  = galleryImageArea.scrollLeft;
            const max = galleryImageArea.scrollWidth - galleryImageArea.clientWidth;
            galleryPrevArrow.classList.toggle('swiper-button-disabled', sl < 4);
            galleryNextArrow.classList.toggle('swiper-button-disabled', sl > max - 4);
        };

        // ── Auto-show/hide arrows on touch (iOS-like) ──
        let _arrowHideTimer = null;
        const _showArrows = () => {
            if (!_galWrapper) return;
            _galWrapper.classList.add('arrows-visible');
            clearTimeout(_arrowHideTimer);
            _arrowHideTimer = setTimeout(() => _galWrapper.classList.remove('arrows-visible'), 2000);
        };

        if (!galleryImageArea._snapInit) {
            galleryImageArea._snapInit = true;

            // scroll → update arrows + show them
            galleryImageArea.addEventListener('scroll', () => { _galUpdateArrows(); _showArrows(); }, { passive: true });

            // Strzałki klikalne
            galleryPrevArrow.addEventListener('click', () => {
                galleryImageArea.scrollBy({ left: -_galTileStep(), behavior: 'smooth' });
            });
            galleryNextArrow.addEventListener('click', () => {
                galleryImageArea.scrollBy({ left: _galTileStep(), behavior: 'smooth' });
            });

            // ── iPhone-style momentum drag (desktop) ──
            let _drag = { active: false, startX: 0, scrollStart: 0, velX: 0, lastX: 0, lastT: 0, rafId: null };

            const _stopMomentum = () => { if (_drag.rafId) { cancelAnimationFrame(_drag.rafId); _drag.rafId = null; } };

            const _applyMomentum = () => {
                _drag.velX *= 0.92;                          // deceleration (iPhone feel)
                if (Math.abs(_drag.velX) < 0.5) {
                    _stopMomentum();
                    // snap to nearest tile after momentum
                    const step = _galTileStep();
                    const nearest = Math.round(galleryImageArea.scrollLeft / step) * step;
                    galleryImageArea.scrollTo({ left: nearest, behavior: 'smooth' });
                    return;
                }
                galleryImageArea.scrollLeft -= _drag.velX;
                _drag.rafId = requestAnimationFrame(_applyMomentum);
            };

            galleryImageArea.addEventListener('pointerdown', e => {
                if (e.pointerType === 'touch') return;       // mobile handles own scroll
                if (e.target.closest('.gal-overlay-btn')) return; // nie przechwytuj kliknięć w przyciski overlay
                _stopMomentum();
                _drag.active = true;
                _drag.startX = e.clientX;
                _drag.scrollStart = galleryImageArea.scrollLeft;
                _drag.lastX = e.clientX;
                _drag.lastT = Date.now();
                _drag.velX = 0;
                galleryImageArea.setPointerCapture(e.pointerId);
                galleryImageArea.classList.add('is-dragging');
            });

            galleryImageArea.addEventListener('pointermove', e => {
                if (!_drag.active || e.pointerType === 'touch') return;
                const now = Date.now();
                const dt = Math.max(now - _drag.lastT, 1);
                _drag.velX = (e.clientX - _drag.lastX) / dt * 16; // px per frame @60fps
                _drag.lastX = e.clientX; _drag.lastT = now;
                galleryImageArea.scrollLeft = _drag.scrollStart - (e.clientX - _drag.startX);
                _showArrows();
            });

            const _endDrag = e => {
                if (!_drag.active || e.pointerType === 'touch') return;
                _drag.active = false;
                galleryImageArea.classList.remove('is-dragging');
                _drag.rafId = requestAnimationFrame(_applyMomentum);
            };
            galleryImageArea.addEventListener('pointerup',     _endDrag);
            galleryImageArea.addEventListener('pointercancel', _endDrag);

            // Tap shows arrows on mobile
            galleryImageArea.addEventListener('touchstart', _showArrows, { passive: true });
        }

        // reset scroll — podwójny żeby iOS Safari nie przywracał starej pozycji
        galleryImageArea.scrollLeft = 0;
        requestAnimationFrame(() => {
            galleryImageArea.scrollLeft = 0;
            _galUpdateArrows();
        });

        // ── Pasek miniaturek (mobile/tablet) ──
        (function buildThumbStrip() {
            if (window.innerWidth > 1023) return; // tylko mobile/tablet
            const strip = document.getElementById('galleryThumbStrip');
            const track = document.getElementById('galleryThumbTrack');
            if (!strip || !track) return;
            track.innerHTML = '';

            const tiles = galleryGridContainer.querySelectorAll('.gallery-tile');
            if (tiles.length < 2) { strip.style.display = 'none'; return; }

            // reset paska do początku przy każdej inicjalizacji
            strip.scrollLeft = 0;

            const step = _galTileStep();

            tiles.forEach((tile, idx) => {
                const imgEl = tile.querySelector('img');
                if (!imgEl) return;
                const btn = document.createElement('button');
                btn.className = 'gts-thumb' + (idx === 0 ? ' gts-active' : '');
                btn.setAttribute('aria-label', 'Przejdź do zdjęcia ' + (idx + 1));
                const tImg = document.createElement('img');
                tImg.src = imgEl.src;
                tImg.alt = '';
                // eager zamiast lazy — miniatury muszą być widoczne od razu
                tImg.loading = 'eager';
                btn.appendChild(tImg);
                btn.addEventListener('click', () => {
                    galleryImageArea.scrollTo({ left: idx * step, behavior: 'smooth' });
                });
                track.appendChild(btn);
            });

            // upewnij się że scroll paska jest na początku po wyrenderowaniu
            requestAnimationFrame(() => { strip.scrollLeft = 0; });

            // Synchronizuj aktywną miniaturkę ze scrollem galerii — RAF throttle, bez jitter
            let _lastThumbIdx = 0;  // reset przy każdej zakładce
            let _thumbRafPending = false;

            const updateActive = () => {
                if (_thumbRafPending) return;
                _thumbRafPending = true;
                requestAnimationFrame(() => {
                    _thumbRafPending = false;
                    const step2 = _galTileStep();
                    if (!step2) return;
                    const raw = galleryImageArea.scrollLeft / step2;
                    const idx = Math.round(raw);
                    const clampedIdx = Math.max(0, Math.min(idx, track.children.length - 1));

                    if (clampedIdx !== _lastThumbIdx) {
                        _lastThumbIdx = clampedIdx;
                        Array.from(track.children).forEach((b, bi) => {
                            b.classList.toggle('gts-active', bi === clampedIdx);
                        });
                        // centruj aktywną w pasku przez scrollTo — bez scrollIntoView (powoduje jitter)
                        const activeBtn = track.children[clampedIdx];
                        if (activeBtn) {
                            const stripEl = document.getElementById('galleryThumbStrip');
                            if (stripEl) {
                                const btnCenter = activeBtn.offsetLeft + activeBtn.offsetWidth / 2;
                                const stripCenter = stripEl.offsetWidth / 2;
                                stripEl.scrollTo({ left: btnCenter - stripCenter, behavior: 'smooth' });
                            }
                        }
                    }
                });
            };

            if (!galleryImageArea._thumbStripListener) {
                galleryImageArea._thumbStripListener = true;
                galleryImageArea.addEventListener('scroll', updateActive, { passive: true });
            }
        })();
    };

    // SVG ikony dla każdej kategorii półek (liniowe, 16×16 viewport)
    const _tabIcons = [
        // 0 — Wisząca: haki + dwie półki
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="2" y1="3" x2="22" y2="3"/>
            <line x1="7" y1="3" x2="7" y2="7"/>
            <line x1="17" y1="3" x2="17" y2="7"/>
            <rect x="3" y="7" width="18" height="2.5" rx="0.5"/>
            <line x1="3" y1="9.5" x2="3" y2="18"/>
            <line x1="21" y1="9.5" x2="21" y2="18"/>
            <line x1="3" y1="13.5" x2="21" y2="13.5"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>`,
        // 1 — Stojąca: szafka z nóżkami
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="2" width="18" height="19" rx="1"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="7" y1="21" x2="6" y2="24"/>
            <line x1="17" y1="21" x2="18" y2="24"/>
        </svg>`,
        // 2 — Na kubki: pionowe przegrody
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="16" rx="1"/>
            <line x1="8" y1="6" x2="8" y2="22"/>
            <line x1="14" y1="6" x2="14" y2="22"/>
            <line x1="5" y1="3" x2="19" y2="3"/>
            <line x1="8" y1="3" x2="8" y2="6"/>
            <line x1="16" y1="3" x2="16" y2="6"/>
        </svg>`,
        // 3 — Modułowa: dwa moduły z łącznikami
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="8" height="16" rx="1"/>
            <line x1="1" y1="10" x2="9" y2="10"/>
            <line x1="1" y1="15" x2="9" y2="15"/>
            <rect x="15" y="4" width="8" height="16" rx="1"/>
            <line x1="15" y1="10" x2="23" y2="10"/>
            <line x1="15" y1="15" x2="23" y2="15"/>
            <line x1="9" y1="8" x2="15" y2="8"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
        </svg>`,
        // 4 — Pozostałe: siatka 2×2
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="8" height="8" rx="1.5"/>
            <rect x="14" y="2" width="8" height="8" rx="1.5"/>
            <rect x="2" y="14" width="8" height="8" rx="1.5"/>
            <rect x="14" y="14" width="8" height="8" rx="1.5"/>
        </svg>`
    ];

    galleryData.forEach((gallery, index) => {
        const tab = document.createElement('button');
        tab.className = 'gallery-tab';
        tab.dataset.index = index;
        tab.innerHTML =
            `<span class="tab-icon">${_tabIcons[index] || _tabIcons[4]}</span>` +
            `<span class="tab-label">${gallery.title}</span>`;
        if (index === 0) { tab.classList.add('active'); }
        tab.addEventListener('click', () => {
            galleryTabsContainer.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // płynne przewinięcie aktywnej zakładki do widoku
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            displayImages(index);
        });
        galleryTabsContainer.appendChild(tab);
    });

    window._galleryDisplayImages = displayImages;
    if (galleryData.length > 0) {
        displayImages(0);
    }
}
        function initializeReviews() { const reviews = [ '"Fantastyczna półeczka, przyszła od razu zmontowana i idealnie pasuje w wielu miejscach. Serdecznie polecam!"', '"Piękna, zgrabna półka. Solidnie wykonana, bez żadnych wad. Polecam!"', '"Bardzo ładna i funkcjonalna półka, świetnie zapakowana na czas transportu. Polecam!"', '"Super produkt – pięknie wykonany, idealnie pasuje do małych słoiczków z przyprawami w kuchni. Polecam!"', '"Ładna i solidna półka, starannie wykonana. Kolor świetnie wpasował się w meble. Polecam!"' ]; let currentReviewIndex = 0; const reviewDisplay = document.getElementById('customerReview'); function showNextReview() { if (!reviewDisplay) return; reviewDisplay.classList.remove('review-fade-enter-active'); setTimeout(() => { const reviewData = reviews[currentReviewIndex]; reviewDisplay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-lime-500 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> ${reviewData}`; reviewDisplay.classList.add('review-fade-enter-active'); currentReviewIndex = (currentReviewIndex + 1) % reviews.length; }, 700); } if (reviewDisplay) { showNextReview(); setInterval(showNextReview, 6000); } }
        function open3dPanel() { if (shelfContainer) { 
            // ── ANIMACJA: pokaż backdrop najpierw (fade-in), panel slajduje z delay dopiero po paru ms — wygląda bardziej "profesjonalnie"
            const _backdrop = document.getElementById('shelf3dBackdrop');
            if (_backdrop && window.innerWidth < 768) _backdrop.classList.add('active');
            // Haptic feedback (delikatna wibracja) na mobile — jeśli urządzenie wspiera
            if (window.innerWidth < 768 && typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(10); } catch(_e) {}
            }
            // NIE blokujemy scroll body — formularz z selectami powyżej panelu 3D
            // musi pozostać dostępny dla kupującego na mobile
            // (panel 3D zajmuje tylko dolne 52vh, strona z selectami jest powyżej)
            shelfContainer.classList.add('active'); setTimeout(onWindowResize, 50); updateDividerIconsVisibility(); updateMobileMountStripStates(); updateModularIconsVisibility();
    // Po otwarciu panelu dopasuj kamerę do modelu (bez ruszania modelem)
    if (window.innerWidth < 768) {
        setTimeout(() => {
            if (shelfGroup && camera && controls) {
                const h = parseInt(heightSelect && heightSelect.value) || 60;
                const w = parseInt(widthSelect && (widthSelect.value === 'custom' ? (customWidthInput && customWidthInput.value) : widthSelect.value)) || 0;
                const isWide84 = w === 84;
                const camZ = isWide84 ? 9.5 : (h >= 80 ? 11 : h >= 60 ? 9 : 8);
                const camX = isWide84 ? 0.0001 : -3;
                controls.target.set(0, 0, 0);
                camera.position.set(camX, 0.5, camZ);
                controls.update();
                if (isWide84) {
                    autoRotateEnabled = false;
                    if (shelfGroup) shelfGroup.rotation.set(0, 0, 0);
                }
            }
        }, 100);
    }
} else { console.error("Nie można otworzyć panelu 3D - brak elementu #shelfContainer"); } }
        function close3dPanel() { if (shelfContainer) { 
            shelfContainer.classList.remove('active');
            // ── ANIMACJA: backdrop znika razem z panelem (transition ma takie samo timing)
            const _backdrop = document.getElementById('shelf3dBackdrop');
            if (_backdrop) _backdrop.classList.remove('active');
            // Odblokuj scroll body
            document.body.classList.remove('no-scroll');
            // Haptic feedback — krótka wibracja na zwinięcie
            if (window.innerWidth < 768 && typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(8); } catch(_e) {}
            }
            setActiveMobileIcon(null); updateDividerIconsVisibility(); updateModularIconsVisibility(); closeMobileParamsDrawer();
        } }

        function syncMobileParamsDrawer() {
            const set = (id, val) => {
                const el = document.getElementById(id);
                if (!el) return;
                const empty = !val || val.trim() === '' || val === 'nie wybrano' || val === '—';
                el.textContent = empty ? 'nie wybrano' : val;
                el.classList.toggle('not-set', empty);
            };
            set('mdp-type',       shelfTypeSelect ? shelfTypeSelect.options[shelfTypeSelect.selectedIndex]?.text : '');
            set('mdp-width',      document.getElementById('widthSummary')?.textContent);
            set('mdp-height',     document.getElementById('heightSummary')?.textContent);
            set('mdp-depth',      document.getElementById('depthSummary')?.textContent);
            set('mdp-sidecolor',  document.getElementById('sideColorSummary')?.textContent);
            set('mdp-shelfcolor', document.getElementById('shelfColorSummary')?.textContent);
            set('mdp-shelfcount', document.getElementById('shelfCountSummary')?.textContent);
            const gapEl = document.getElementById('mdp-gap');
            if (gapEl) {
                const gapVal = document.getElementById('gapSummary')?.textContent?.trim();
                const isCustom = typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled;
                if (isCustom) { gapEl.textContent = 'własne rozmieszczenie'; gapEl.classList.remove('not-set'); }
                else if (gapVal && gapVal !== '' && gapVal !== 'nie wybrano') { gapEl.textContent = gapVal; gapEl.classList.remove('not-set'); }
                else { gapEl.textContent = '—'; gapEl.classList.add('not-set'); }
            }
            const surchargeRow = document.getElementById('mdp-custompos-surcharge-row');
            if (surchargeRow) {
                const isCustomPos = typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled;
                surchargeRow.style.display = isCustomPos ? 'flex' : 'none';
            }
            const extras = document.getElementById('extraOptionsSummary')?.textContent;
            set('mdp-extras', extras && extras !== 'standardowa' ? extras : 'standardowa');
            const el = document.getElementById('mdp-extras'); if (el) el.classList.remove('not-set');
            const divDimRow = document.getElementById('mdp-divdim-row');
            const divDimEl = document.getElementById('mdp-divdim');
            if (divDimRow && divDimEl) {
                const isMug = shelfTypeSelect && shelfTypeSelect.value === 'mug_shelf';
                if (isMug) {
                    const hVal = heightSelect ? heightSelect.value : '';
                    divDimEl.textContent = hVal === '60' ? '12,5 × 10,9 cm | dół: 18 cm' : '12,5 × 10,9 cm';
                    divDimRow.style.display = 'flex';
                } else {
                    divDimRow.style.display = 'none';
                }
            }
        }

        function syncMobilePriceChips() {
    // Sync new top bar price
    const tbVal = document.getElementById('topBarPriceValue');
    const tbOrig = document.getElementById('topBarPriceOrig');
    const srcVal = document.getElementById('mobilePriceValue');
    const srcOrig = document.getElementById('mobilePriceOriginal');
    if (tbVal && srcVal) tbVal.textContent = srcVal.textContent || '—';
    if (tbOrig && srcOrig) {
        tbOrig.textContent = srcOrig.textContent || '';
        tbOrig.style.display = srcOrig.style.display;
    }
    // Sync Dalej visibility
    const topDalej = document.getElementById('topBarDalej');
    const oldDalej = document.getElementById('mobileDalej3dBtn');
    if (topDalej) {
        const isVisible = oldDalej && oldDalej.classList.contains('visible');
        topDalej.classList.toggle('visible', isVisible);
    }
    // Sync params drawer open state
    const topParams = document.getElementById('topBarParams');
    const oldToggle = document.getElementById('mobileParamsDrawerToggle');
    if (topParams && oldToggle) {
        topParams.classList.toggle('open', oldToggle.classList.contains('open'));
    }
            const setChip = (chipId, valId, value) => {
                const chip = document.getElementById(chipId);
                const val = document.getElementById(valId);
                if (!chip || !val) return;
                const empty = !value || value.trim() === '' || value === 'nie wybrano';
                val.textContent = empty ? 'nie wybrano' : value;
                chip.classList.toggle('mpc-chip--set', !empty);
            };
            // Rodzaj — pełna nazwa
            const typeText = shelfTypeSelect?.options[shelfTypeSelect?.selectedIndex]?.text || '';
            setChip('mpc-type', 'mpc-type-val', typeText === '-- Wybierz --' ? '' : typeText);
            // Wymiary — np. 44×80×10
            const w = document.getElementById('widthSummary')?.textContent?.replace(' cm','').trim() || '';
            const h = document.getElementById('heightSummary')?.textContent?.replace(' cm','').trim() || '';
            const d = document.getElementById('depthSummary')?.textContent?.replace(' cm','').trim() || '';
            const dims = (w && h && d) ? `${w}×${h}×${d} cm` : (w && h ? `${w}×${h} cm` : '');
            setChip('mpc-dims', 'mpc-dims-val', dims);
            // Kolor boku (pierwsze słowo) + kolor półki (pierwsze słowo)
            const sc = document.getElementById('sideColorSummary')?.textContent?.split(' ')[0] || '';
            const shc = document.getElementById('shelfColorSummary')?.textContent?.split(' ')[0] || '';
            const colorStr = (sc && shc && sc !== 'nie' && shc !== 'nie') ? (sc === shc ? sc : `${sc} / ${shc}`) : (sc && sc !== 'nie' ? sc : '');
            setChip('mpc-color', 'mpc-color-val', colorStr);
            // Półki wewnętrzne
            const shelves = document.getElementById('shelfCountSummary')?.textContent?.trim() || '';
            setChip('mpc-shelves', 'mpc-shelves-val', shelves);
            // Odstęp — tylko gdy dostępny
            const gapChip = document.getElementById('mpc-gap');
            const gapVal = document.getElementById('gapSummary')?.textContent?.trim() || '';
            const isCustom = typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled;
            if (gapChip) {
                const showGap = (gapVal && gapVal !== '' && gapVal !== 'nie wybrano') || isCustom;
                gapChip.style.display = showGap ? 'flex' : 'none';
                setChip('mpc-gap', 'mpc-gap-val', isCustom ? 'własne' : gapVal);
            }
        }

        function openMobileParamsDrawer() {
            const d = document.getElementById('mobileParamsDrawer');
            const t = document.getElementById('mobileParamsDrawerToggle');
            if (!d) return;
            syncMobileParamsDrawer();
            d.style.display = 'flex';
            d.style.flexDirection = 'column';
            if (t) t.classList.add('open');
            requestAnimationFrame(() => { requestAnimationFrame(() => { d.classList.add('open'); }); });
        }

        function closeMobileParamsDrawer() {
            const d = document.getElementById('mobileParamsDrawer');
            const t = document.getElementById('mobileParamsDrawerToggle');
            if (!d) return;
            d.classList.remove('open');
            if (t) t.classList.remove('open');
            setTimeout(() => { if (!d.classList.contains('open')) d.style.display = 'none'; }, 340);
        }

        function toggleMobileParamsDrawer() {
    // Sync topBarParams open state after toggle
    setTimeout(() => {
        const tp = document.getElementById('topBarParams');
        const old = document.getElementById('mobileParamsDrawerToggle');
        if (tp && old) tp.classList.toggle('open', old.classList.contains('open'));
    }, 10);
            const d = document.getElementById('mobileParamsDrawer');
            if (!d) return;
            if (d.classList.contains('open')) closeMobileParamsDrawer();
            else openMobileParamsDrawer();
        }
        function initialize3dPanel() { show3dButton = document.getElementById('show3dButton'); collapse3dPanelButton = document.getElementById('collapse3dPanelButton'); if (show3dButton && collapse3dPanelButton && shelfContainer) { show3dButton.addEventListener('click', open3dPanel); const tooltip3d = document.getElementById('tooltip3dBubble'); if (tooltip3d) { show3dButton.addEventListener('click', function() { tooltip3d.classList.add('hidden'); }, { once: true }); } 
            // ── GEST SWIPE-DOWN-TO-CLOSE na mobile: przeciągnij górną część panelu w dół, żeby go zamknąć ──
            if (window.innerWidth < 768) {
                let _swipeStartY = 0;
                let _swipeCurrentY = 0;
                let _swipeActive = false;
                let _swipeStartTs = 0;
                // Strefa detekcji: górne 38px panelu (obszar pull-handle), żeby nie interferowało z obrotem modelu
                shelfContainer.addEventListener('touchstart', function(e) {
                    if (!shelfContainer.classList.contains('active')) return;
                    const t = e.touches[0];
                    const rect = shelfContainer.getBoundingClientRect();
                    if (t.clientY - rect.top > 38) return; // tylko obszar "handle"
                    _swipeStartY = t.clientY;
                    _swipeCurrentY = t.clientY;
                    _swipeActive = true;
                    _swipeStartTs = Date.now();
                    // Wyłącz chwilowo transitions, żeby palec ciągnął panel 1:1
                    shelfContainer.style.transition = 'none';
                }, { passive: true });
                shelfContainer.addEventListener('touchmove', function(e) {
                    if (!_swipeActive) return;
                    const t = e.touches[0];
                    _swipeCurrentY = t.clientY;
                    const delta = Math.max(0, _swipeCurrentY - _swipeStartY);
                    // Zastosuj translate do palca 1:1 (max 40% wysokości panelu, żeby nie wypadał poniżej)
                    const maxPanelH = shelfContainer.offsetHeight * 0.8;
                    const clampedDelta = Math.min(delta, maxPanelH);
                    shelfContainer.style.transform = 'translateY(' + clampedDelta + 'px)';
                    // Backdrop też przygaszaj proporcjonalnie
                    const _bd = document.getElementById('shelf3dBackdrop');
                    if (_bd) _bd.style.opacity = String(Math.max(0.15, 1 - (clampedDelta / maxPanelH)));
                }, { passive: true });
                const _endSwipe = function() {
                    if (!_swipeActive) return;
                    _swipeActive = false;
                    const delta = _swipeCurrentY - _swipeStartY;
                    const elapsed = Date.now() - _swipeStartTs;
                    const velocity = delta / Math.max(elapsed, 1); // px/ms
                    // Usuń inline transition-override
                    shelfContainer.style.transition = '';
                    shelfContainer.style.transform = '';
                    const _bd = document.getElementById('shelf3dBackdrop');
                    if (_bd) _bd.style.opacity = '';
                    // Jeżeli ciągnięto o >20% wysokości panelu ALBO z szybkim velocity → zamknij
                    const threshold = shelfContainer.offsetHeight * 0.20;
                    if (delta > threshold || velocity > 0.6) {
                        close3dPanel();
                    }
                };
                shelfContainer.addEventListener('touchend', _endSwipe, { passive: true });
                shelfContainer.addEventListener('touchcancel', _endSwipe, { passive: true });
            }
            console.log("Panel 3D zainicjalizowany."); } else { let missing = []; if (!show3dButton) missing.push("show3dButton"); if (!collapse3dPanelButton) missing.push("collapse3dPanelButton (lub jego odpowiednik)"); if (!shelfContainer) missing.push("shelfContainer"); console.warn(`Nie znaleziono elementów panelu 3D: ${missing.join(', ')}. Funkcjonalność może nie działać poprawnie.`); } }

        document.addEventListener('DOMContentLoaded', () => {
            shelfContainer = document.getElementById('shelfContainer'); threeJsCanvasWrapper = document.getElementById('threeJsCanvasWrapper'); shelfTypeSelect = document.getElementById('shelfType'); widthSelect = document.getElementById('width'); heightSelect = document.getElementById('height'); depthSelect = document.getElementById('depth'); shelfCountSelect = document.getElementById('shelfCount'); customWidthInput = document.getElementById('customWidthInput'); customWidthDisplay = document.getElementById('customWidthDisplay'); customWidthFee = document.getElementById('customWidthFee'); shelfTypeOptionsDiv = document.getElementById('shelfTypeOptions'); widthSelectionArea = document.getElementById('widthSelectionArea'); dimensionSectionAnchor = document.getElementById('dimensionSectionAnchor'); colorSectionAnchor = document.getElementById('colorSectionAnchor'); shelfTypeSectionAnchor = document.getElementById('shelfTypeSectionAnchor');
            standardDimensionsContainer = document.getElementById('standardDimensionsContainer');
            modularShelfOptionsContainer = document.getElementById('modularShelfOptionsContainer');
            moduleWidthSelect = document.getElementById('moduleWidth');
            moduleHeightSelect = document.getElementById('moduleHeight');
            connectingShelfWidthSelect = document.getElementById('connectingShelfWidth');
            viewerInfoText = document.getElementById('viewerInfoText');
            modularInfoText = document.getElementById('modularInfoText');
            heightLabel = document.getElementById('heightLabel'); depthLabel = document.getElementById('depthLabel'); sideColorSelect = document.getElementById('sideColor'); shelfColorSelect = document.getElementById('shelfColor'); mugShelfSpecificOptionsContainer = document.getElementById('mugShelfSpecificOptionsContainer'); mugShelfMountOptionsDiv = document.getElementById('mugShelfMountOptions'); mugShelfDividersOptionsDiv = document.getElementById('mugShelfDividersOptions'); dividersTopCheckbox = document.getElementById('dividersTop'); dividersMiddleCheckbox = document.getElementById('dividersMiddle'); dividersBottomCheckbox = document.getElementById('dividersBottom'); configuratorSection = document.getElementById('configuratorSection'); shelfCountSection = document.getElementById('shelfCountSection'); galleryTabsContainer = document.getElementById('galleryTabsContainer'); galleryGridContainer = document.getElementById('galleryGridContainer'); galleryImageArea = document.getElementById('galleryImageArea'); galleryPrevArrow = document.querySelector('.gallery-prev-arrow'); galleryNextArrow = document.querySelector('.gallery-next-arrow');
            mugShelfDividerIconsContainer = document.getElementById('mugShelfDividerIconsContainer'); dividerTooltip = document.getElementById('dividerTooltip'); addTopDividerBtn = document.getElementById('addTopDividerBtn'); addMiddleDividerBtn = document.getElementById('addMiddleDividerBtn'); addBottomDividerBtn = document.getElementById('addBottomDividerBtn'); mobileMugShelfMountPanel = document.getElementById('mobileMugShelfMountPanel'); mobileMountHangingStripBtn = document.getElementById('mobileMountHangingStripBtn'); mobileMountStandingStripBtn = document.getElementById('mobileMountStandingStripBtn');
            desktopDividerDimensionsInfo = document.getElementById('desktopDividerDimensionsInfo');
            viewOrderCodeInput = null; // input usuniety 
            imageLightbox = document.getElementById('imageLightbox'); lightboxImage = null; lightboxCloseBtn = document.getElementById('lightboxClose');
            priceAndActionsContainer = document.getElementById('priceAndActionsContainer');
            priceHint = document.getElementById('priceHint');
            addToCartBtn = document.getElementById('addToCartBtn');
            mobileIconDetailsType = document.getElementById('mobileIconDetailsType');
            mobileIconDetailsDimensions = document.getElementById('mobileIconDetailsDimensions');
            mobileIconDetailsColors = document.getElementById('mobileIconDetailsColors');
            mobileIconDetailsShelves = document.getElementById('mobileIconDetailsShelves');
            mobile3dActionsContainer = document.getElementById('mobile3dActionsContainer');
            mobilePriceValue = document.getElementById('mobilePriceValue');
            mobileGoToSummaryBtn = document.getElementById('mobileGoToSummaryBtn');
            desktopCartContainer = document.getElementById('desktopCartContainer');
            cartPanel = document.getElementById('cartPanel');
            cartPanelOverlay = document.getElementById('cartPanelOverlay');
            cartPanelCloseBtn = document.getElementById('cartPanelCloseBtn');
            cartItemsContainer = document.getElementById('cartItemsContainer');
            cartEmptyMessage = document.getElementById('cartEmptyMessage');
            cartTotalPrice = document.getElementById('cartTotalPrice');
            cartCheckoutButton = document.getElementById('cartCheckoutButton');
            cartBadges = document.querySelectorAll('.cart-badge');
            mobileCartButton = document.getElementById('mobileCartButton');
            cartDiscountReminder = document.getElementById('cartDiscountReminder');
            cartSubtotalLine = document.getElementById('cartSubtotalLine');
            cartSubtotalPrice = document.getElementById('cartSubtotalPrice');
            cartDiscountLine10 = document.getElementById('cartDiscountLine10');
            cartDiscountAmount10 = document.getElementById('cartDiscountAmount10');
            cartDiscountLine25 = document.getElementById('cartDiscountLine25');
            cartDiscountAmount25 = document.getElementById('cartDiscountAmount25');
            cartSummaryModalOverlay = document.getElementById('cartSummaryModalOverlay');
            cartSummaryItemsContainer = document.getElementById('cartSummaryItemsContainer');
            cartSummaryTotalPrice = document.getElementById('cartSummaryTotalPrice');
            cartSummaryAllCodes = document.getElementById('cartSummaryAllCodes');
            copyAllCodesBtn = document.getElementById('copyAllCodesBtn');
            cartSummaryInstructionUnits = document.getElementById('cartSummaryInstructionUnits');
            downloadCartSummaryBtn = document.getElementById('downloadCartSummaryBtn');
            cartSummaryGoToAllegroBtn = document.getElementById('cartSummaryGoToAllegroBtn');
            cartSummaryModalCloseBtnTop = document.getElementById('cartSummaryModalCloseBtnTop');
            cartSummarySubtotalLine = document.getElementById('cartSummarySubtotalLine');
            cartSummarySubtotalPrice = document.getElementById('cartSummarySubtotalPrice');
            cartSummaryDiscountLine10 = document.getElementById('cartSummaryDiscountLine10');
            cartSummaryDiscountAmount10 = document.getElementById('cartSummaryDiscountAmount10');
            cartSummaryDiscountLine25 = document.getElementById('cartSummaryDiscountLine25');
            cartSummaryDiscountAmount25 = document.getElementById('cartSummaryDiscountAmount25');
            // NOWE PRZYPISANIA
            visualDetailsModalOverlay = document.getElementById('visualDetailsModalOverlay');
            visualDetailsModal = document.getElementById('visualDetailsModal');
            visualDetailsModalCloseBtn = document.getElementById('visualDetailsModalCloseBtn');
            visualDetailsLoader = document.getElementById('visualDetailsLoader');
            visualDetailsContent = document.getElementById('visualDetailsContent');
            visualDetailsError = document.getElementById('visualDetailsError');
            visualDetailsOrderCode = document.getElementById('visualDetailsOrderCode');
            visualDetailsSnapshot = document.getElementById('visualDetailsSnapshot');
            visualDetailsSpecsList = document.getElementById('visualDetailsSpecsList');
            printVisualDetailsBtn = document.getElementById('printVisualDetailsBtn');
 modularShelfIconsContainer = document.getElementById('modularShelfIconsContainer');
            mobileModularHangingBtn = document.getElementById('mobileModularHangingBtn');
            mobileModularStandingBtn = document.getElementById('mobileModularStandingBtn');
            mobileModularNoTopBtn = document.getElementById('mobileModularNoTopBtn');
            mobileModularNoBottomBtn = document.getElementById('mobileModularNoBottomBtn');

             if (!shelfContainer || !threeJsCanvasWrapper) { console.error("BŁĄD KRYTYCZNY: Nie znaleziono wszystkich wymaganych elementów DOM. Inicjalizacja przerwana."); return; }

             // --- Buduj opcje z wzory.js ---
             // Typy półek
             if (shelfTypeSelect) {
                 // Kolejność: wisząca, stojąca, kubki, reszta
                 const _order = ['hanging','standing','mug_shelf'];
                 const _sorted = [
                     ..._order.map(id => SHELF_TYPES.find(t => t.id === id)).filter(Boolean),
                     ...SHELF_TYPES.filter(t => !_order.includes(t.id))
                 ];
                 _sorted.forEach(t => {
                     const o = document.createElement('option');
                     o.value = t.id; o.textContent = t.name;
                     shelfTypeSelect.appendChild(o);
                 });
             }
             // Kolory
             [document.getElementById('sideColor'), document.getElementById('shelfColor')].forEach(sel => {
                 if (!sel) return;
                 COLORS.forEach(c => { const o = document.createElement('option'); o.value = c.value; o.dataset.color = c.value; o.textContent = c.name; sel.appendChild(o); });
             });
             // Próbki materiałów (swiper)
             const _sw = document.getElementById('materialSwiperWrapper');
             if (_sw) { _sw.innerHTML = COLORS.map(c => `<div class="swiper-slide"><img src="${c.textureImg}" alt="${c.name}"><div class="material-name">${c.name}</div></div>`).join(''); }
             // --- Koniec budowania z wzory.js ---

             if(widthSelect) originalWidthOptions = Array.from(widthSelect.options).map(opt => ({value: opt.value, text: opt.text})).filter(opt => opt.value !== ""); if(heightSelect) originalHeightOptions = Array.from(heightSelect.options).map(opt => ({value: opt.value, text: opt.text})).filter(opt => opt.value !== "");

            try {
                if(typeof init3D === 'function') init3D(); else console.error("init3D is not defined");
                if(typeof updateSwatchDisplay === 'function') { updateSwatchDisplay('sideColor', 'sideColorSwatchDisplay'); updateSwatchDisplay('shelfColor', 'shelfColorSwatchDisplay'); } else console.error("updateSwatchDisplay is not defined");
              if(typeof initializeTabbedGallery === 'function') initializeTabbedGallery(); else console.error("initializeTabbedGallery is not defined");
                // Domyślnie: Wisząca + galeria tab 0
                if (shelfTypeSelect) {
                    shelfTypeSelect.value = 'hanging';
                    setTimeout(function() { handleShelfTypeChange(false); }, 50);
                }
                if(typeof initialize3dPanel === 'function') initialize3dPanel(); else console.error("initialize3dPanel is not defined");
                if(typeof initializeReviews === 'function') initializeReviews(); else console.error("initializeReviews is not defined");
                
                if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
                if (mobileGoToSummaryBtn) mobileGoToSummaryBtn.addEventListener('click', () => scrollToElementAndHighlight('priceAndActionsContainer', 'center'));
                if (desktopCartContainer) desktopCartContainer.addEventListener('click', openCart);
                if (mobileCartButton) mobileCartButton.addEventListener('click', openCart);
                if (cartPanelCloseBtn) cartPanelCloseBtn.addEventListener('click', closeCart);
                if (cartPanelOverlay) cartPanelOverlay.addEventListener('click', closeCart);
                if (cartCheckoutButton) cartCheckoutButton.addEventListener('click', handleCheckout);
                updateCartDisplay(); 
                
                if (cartSummaryModalOverlay) {
                    cartSummaryModalOverlay.addEventListener('click', (event) => { if (event.target === cartSummaryModalOverlay) closeCartSummaryModal(); });
                    if(cartSummaryModalCloseBtnTop) cartSummaryModalCloseBtnTop.addEventListener('click', closeCartSummaryModal);
                    if(downloadCartSummaryBtn) downloadCartSummaryBtn.addEventListener('click', downloadFullCartSummary);
                    
                    if(copyAllCodesBtn) copyAllCodesBtn.addEventListener('click', () => {
                        cartSummaryAllCodes.select();
                        navigator.clipboard.writeText(cartSummaryAllCodes.value);
                    });

                    const codeBoxCopyBtn = document.getElementById('codeBoxCopyBtn');
                    if(codeBoxCopyBtn) codeBoxCopyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(cartSummaryAllCodes.value);
                        const origHTML = codeBoxCopyBtn.innerHTML;
                        codeBoxCopyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
                        setTimeout(() => { codeBoxCopyBtn.innerHTML = origHTML; }, 2000);
                    });

                    if(cartSummaryGoToAllegroBtn) cartSummaryGoToAllegroBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(cartSummaryAllCodes.value).then(() => {
    // ZMIANA: Podaj tutaj link do swojego profilu sprzedawcy na Allegro, gdzie klient może zadać pytanie.
    window.open("https://allegro.pl/oferta/zaprojektuj-wlasna-polke-podaj-wymiar-i-wybierz-kolory-do-kuchni-pokoju-17253898746#ask-question", "_blank");
    closeCartSummaryModal();
    }).catch(err => {
        alert('Nie udało się skopiować kodów. Spróbuj ręcznie, używając przycisku obok pola z kodami.');
    });
});
                } else { console.error("Nie znaleziono elementów nowego modala podsumowania koszyka."); }

                if (shelfTypeSelect) { shelfTypeSelect.value = 'hanging'; shelfTypeSelect.dispatchEvent(new Event('change', { bubbles: true })); }
                let _dividerPreviewTimer = null; const setupDividerButton = (btn, checkbox) => { if (!btn || !checkbox) { return; } btn.addEventListener('click', () => { checkbox.checked = !checkbox.checked; updateDividerIconActiveStates(); updateOrderSummary(); const _dh2 = document.getElementById('mugDividerHint'); if (_dh2) { const _any = dividersTopCheckbox?.checked || dividersMiddleCheckbox?.checked || dividersBottomCheckbox?.checked; if (_any) _dh2.style.display = 'none'; } clearTimeout(_dividerPreviewTimer); _dividerPreviewTimer = setTimeout(() => updatePreview(), 180); }); checkbox.addEventListener('change', () => { updateDividerIconActiveStates(); }); };
                setupDividerButton(addTopDividerBtn, dividersTopCheckbox);
                setupDividerButton(addMiddleDividerBtn, dividersMiddleCheckbox);
                setupDividerButton(addBottomDividerBtn, dividersBottomCheckbox);
                const setupMobileMountStrip = (stripBtn, mountValue) => { if (!stripBtn || !mugShelfMountOptionsDiv) { return; } stripBtn.addEventListener('click', () => { const radioToSelect = mugShelfMountOptionsDiv.querySelector(`input[name="mugShelfMount"][value="${mountValue}"]`); if (radioToSelect && !radioToSelect.checked) { radioToSelect.checked = true; radioToSelect.dispatchEvent(new Event('change', { bubbles: true })); } }); };
                setupMobileMountStrip(mobileMountHangingStripBtn, 'hanging');
                setupMobileMountStrip(mobileMountStandingStripBtn, 'standing');
                window.addEventListener('resize', updateDividerIconsVisibility);

                // Drawer parametrów — swipe w dół zamyka
                const _drawer = document.getElementById('mobileParamsDrawer');
                if (_drawer) {
                    let _ts = 0, _ty = 0;
                    _drawer.addEventListener('touchstart', e => { _ts = e.touches[0].clientY; }, { passive: true });
                    _drawer.addEventListener('touchend', e => {
                        _ty = e.changedTouches[0].clientY;
                        if (_ty - _ts > 60) closeMobileParamsDrawer();
                    }, { passive: true });
                    // Tap na overlay (poza body drawera) zamyka
                    _drawer.addEventListener('click', e => {
                        if (e.target === _drawer) closeMobileParamsDrawer();
                    });
                }
                window.addEventListener('resize', updateModularIconsVisibility);
                updateDividerIconsVisibility(); updateDividerIconActiveStates(); updateMobileMountStripStates(); updateDividerDimensionVisibility();

                // Przycisk własnego rozmieszczenia na panelu 3D
                const mobileCustomShelfBtn = document.getElementById('mobileCustomShelfBtn');
                if (mobileCustomShelfBtn) {
                    mobileCustomShelfBtn.addEventListener('click', function() {
                        const wrapper = document.getElementById('customShelfPositionWrapper');
                        if (wrapper && wrapper.style.display !== 'none') {
                            toggleCustomShelfPosition();
                            updateModularIconsVisibility();
                        } else {
                            // Scroll do sekcji jeśli własne rozmieszczenie nie jest dostępne
                            close3dPanel && close3dPanel();
                            setTimeout(() => scrollToElementAndHighlight('customShelfPositionWrapper', 'center'), 350);
                        }
                    });
                }
                const detailsPanel = document.getElementById('materialSamplesDetails'); if (detailsPanel) { detailsPanel.addEventListener('toggle', function initMaterialSwiperOnToggle() { if (detailsPanel.open && !materialSwiperInstance) { if (typeof Swiper === 'undefined') { console.error("Swiper library not loaded!"); return; } try { materialSwiperInstance = new Swiper('#materialSwiper', { slidesPerView: 1, spaceBetween: 10, navigation: { nextEl: '.material-swiper-button-next', prevEl: '.material-swiper-button-prev' }, observer: true, observeParents: true }); } catch (swiperError) { console.error("Błąd inicjalizacji Swipera:", swiperError); } } else if (detailsPanel.open && materialSwiperInstance) { materialSwiperInstance.update(); } }); document.addEventListener('click', function(event) { if (detailsPanel.open && !detailsPanel.contains(event.target)) { detailsPanel.open = false; } }); } else { console.warn("Element panelu próbek (#materialSamplesDetails) nie znaleziony."); }
                // Resetuj własne rozmieszczenie przy zmianie ilości półek lub wysokości
        document.getElementById('shelfCount')?.addEventListener('change', () => {
            if (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled) {
                disableCustomPositions();
            }
        });
        document.getElementById('height')?.addEventListener('change', () => {
            if (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled) {
                disableCustomPositions();
            }
        });
        const formElementsToMonitor = document.querySelectorAll('#shelfType, #width, #customWidthInput, #height, #depth, #shelfCount, #sideColor, #shelfColor, #moduleWidth, #moduleHeight, #connectingShelfWidth'); formElementsToMonitor.forEach(element => { const eventType = (element.type === 'range') ? 'input' : 'change'; element.addEventListener(eventType, closeDetailsPanelIfNeeded); }); const configPanelContainer = document.querySelector('.w-full.md\\:w-1\\/3.space-y-8'); if (configPanelContainer) { configPanelContainer.addEventListener('change', function(event) { if (event.target.matches('#shelfTypeOptions input[type="checkbox"], #mugShelfSpecificOptionsContainer input[type="checkbox"], #mugShelfSpecificOptionsContainer input[type="radio"]')) { closeDetailsPanelIfNeeded(); } }); } else { document.body.addEventListener('change', function(event) { if (event.target.matches('#noTopShelf, #noBottomShelf, #dividersTop, #dividersMiddle, #dividersBottom, input[name="mugShelfMount"]')) { closeDetailsPanelIfNeeded(); } }); }
                
                // NOWE LISTENERY
                if (viewOrderCodeInput) { 
                    const handleCodeInput = (code) => { if (code && code.trim().length > 0) { setTimeout(() => { showVisualDetailsForCode(code); viewOrderCodeInput.blur(); }, 50); } };
                    // input kodu usuniety
                }

                if(visualDetailsModalOverlay) visualDetailsModalOverlay.addEventListener('click', (e) => { if (e.target === visualDetailsModalOverlay) closeVisualDetailsModal(); });
                if(visualDetailsModalCloseBtn) visualDetailsModalCloseBtn.addEventListener('click', closeVisualDetailsModal);
                if(printVisualDetailsBtn) printVisualDetailsBtn.addEventListener('click', () => { if (currentDetailsForVisualModal) { handlePrintProject(currentDetailsForVisualModal); }});
                const _allegroBtn = document.getElementById('downloadAllegroJpgBtn');
                if (_allegroBtn) _allegroBtn.addEventListener('click', async () => {
                    if (!currentDetailsForVisualModal) return;
                    _allegroBtn.disabled = true;
                    const span = _allegroBtn.querySelector('span');
                    if (span) span.textContent = 'Generuję...';
                    try {
                        await reconfigureFromDetails(currentDetailsForVisualModal);
                        await new Promise(r => setTimeout(r, 200));
                        const [snap, price] = await Promise.all([
                            generate3dSnapshotFromCurrentModel(),
                            computePriceDetailed()
                        ]);
                        await generateAllegroJPG(currentDetailsForVisualModal, snap, price);
                    } catch(e) {
                        alert('Blad generowania zdjecia: ' + e.message);
                    } finally {
                        _allegroBtn.disabled = false;
                        if (span) span.textContent = 'Zdjecie Allegro (JPG)';
                    }
                });

                if (window.innerWidth < 768) { const reviewBlock = document.getElementById('customerReview')?.parentElement; const summarySection = document.querySelector('.w-full.md\\:w-1\\/3.order-3'); if (reviewBlock && summarySection && reviewBlock.parentElement !== summarySection) { summarySection.appendChild(reviewBlock); } }
                const mainConfigSection = document.getElementById('configuratorSection'); if (mainConfigSection) { mainConfigSection.addEventListener('change', function(event) { if (event.target.tagName === 'SELECT' && event.target.closest('.p-6.shadow.rounded-lg, .w-full.max-w-lg')) { const parentSection = event.target.closest('.section-highlight-persistent'); if (parentSection) { parentSection.classList.remove('section-highlight-persistent'); } } }); } else { console.error("Nie znaleziono głównego kontenera konfiguracji (#configuratorSection) do nasłuchiwania zmian."); }
                if (lightboxCloseBtn) { lightboxCloseBtn.addEventListener('click', closeLightbox); }
                if (imageLightbox) {
                    // Kliknięcie w tło zamyka lightbox
                    imageLightbox.addEventListener('click', function(event) { if (event.target === imageLightbox) { closeLightbox(); } });
                    // Strzałki klawiatury
                    const lbPrev = document.getElementById('lb-prev');
                    const lbNext = document.getElementById('lb-next');
                    if (lbPrev) lbPrev.addEventListener('click', e => { e.stopPropagation(); _lbGoTo(_lb.idx - 1, true); });
                    if (lbNext) lbNext.addEventListener('click', e => { e.stopPropagation(); _lbGoTo(_lb.idx + 1, true); });
                    // Drag myszą (desktop) — natywny scroll track
                    const track = document.getElementById('lb-track');
                    if (track) {
                        let _md = { active: false, startX: 0, scrollStart: 0 };
                        track.addEventListener('mousedown', e => {
                            _md.active = true; _md.startX = e.clientX;
                            _md.scrollStart = track.scrollLeft;
                            track.style.cursor = 'grabbing'; e.preventDefault();
                        });
                        window.addEventListener('mousemove', e => {
                            if (!_md.active) return;
                            track.scrollLeft = _md.scrollStart - (e.clientX - _md.startX);
                        });
                        window.addEventListener('mouseup', () => {
                            if (!_md.active) return;
                            _md.active = false; track.style.cursor = 'grab';
                        });
                        track.style.cursor = 'grab';
                    }
                }
                document.addEventListener('keydown', _lbOnKey);
                
                const scrollToCodesBtn = document.getElementById('scrollToCodesBtn');
                const codesSection = document.getElementById('codesSection');

                if (scrollToCodesBtn && codesSection) {
                    scrollToCodesBtn.addEventListener('click', () => {
                        codesSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        scrollToCodesBtn.classList.remove('pulse-glow-animation', 'visible');
                    });
                }
const setupMobileModularButton = (btn, checkboxId) => {
                    if (!btn) return;
                    btn.addEventListener('click', () => {
                        const checkbox = document.getElementById(checkboxId);
                        if (checkbox) {
                            checkbox.checked = !checkbox.checked;
                            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                };
                setupMobileModularButton(mobileModularHangingBtn, 'modularHanging');
                setupMobileModularButton(mobileModularStandingBtn, 'modularStanding');
                setupMobileModularButton(mobileModularNoTopBtn, 'modularNoTopShelf');
                setupMobileModularButton(mobileModularNoBottomBtn, 'modularNoBottomShelf');

                // ── Przyciski "Bez góry" / "Bez dołu" dla półki wiszącej i stojącej ──
                const _hsNoTopBtn = document.getElementById('mobileHsNoTopBtn');
                const _hsNoBottomBtn = document.getElementById('mobileHsNoBottomBtn');
                if (_hsNoTopBtn) {
                    _hsNoTopBtn.addEventListener('click', () => {
                        const cb = document.getElementById('noTopShelf');
                        if (cb) {
                            cb.checked = !cb.checked;
                            cb.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        if (typeof updateHsIconActiveStates === 'function') updateHsIconActiveStates();
                    });
                }
                if (_hsNoBottomBtn) {
                    _hsNoBottomBtn.addEventListener('click', () => {
                        const cb = document.getElementById('noBottomShelf');
                        if (cb) {
                            cb.checked = !cb.checked;
                            cb.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        if (typeof updateHsIconActiveStates === 'function') updateHsIconActiveStates();
                    });
                }
// +++ POCZĄTEK NOWEGO KODU +++
const show3dButtonForAnimation = document.getElementById('show3dButton');
if (show3dButtonForAnimation && window.innerWidth < 768) {
    // Włącz animację przyciągającą uwagę po załadowaniu strony
    show3dButtonForAnimation.classList.add('button-attention-glow');

    // Dodaj nasłuchiwanie na JEDNO kliknięcie, aby usunąć animację
    show3dButtonForAnimation.addEventListener('click', () => {
        show3dButtonForAnimation.classList.remove('button-attention-glow');
    }, { once: true });
}
// +++ KONIEC NOWEGO KODU +++
                
                // ===== MOBILE INTRO ANIMATION =====
                (function runMobileIntro() {
                    if (window.innerWidth >= 768) return;
                    if (sessionStorage.getItem('introPlayed')) return;
                    if (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2) return;
                    sessionStorage.setItem('introPlayed', '1');

                    const GALLERY_IDX = 0;
                    const IMAGE_IDX   = 0;

                    let aborted = false;
                    const abort = () => { aborted = true; };
                    document.addEventListener('touchstart', abort, { once: true, passive: true });
                    document.addEventListener('click', abort, { once: true });

                    const delay = ms => new Promise(r => setTimeout(r, ms));

                    async function intro() {
                        // 1. Poczekaj aż animacja kafelka "Kliknij w zdjęcie" się skończy
                        // Kafelek: pojawia się od razu, fade-out po 3500ms, transition 500ms
                        await delay(4200);
                        if (aborted) return;

                        // 2. Załaduj konfigurację i otwórz panel 3D
                        applyShelfConfigurationFromGallery(GALLERY_IDX, IMAGE_IDX);
                        await delay(100);
                        if (aborted) return;
                        open3dPanel();

                        // Od tego momentu nie przerywamy — użytkownik niech ogląda
                        document.removeEventListener('touchstart', abort);
                        document.removeEventListener('click', abort);

                        // 3. Poczekaj aż półka się zbuduje i pokręci
                        await delay(3500);

                        // 4. Zamknij panel płynnie
                        close3dPanel();
                    }

                    intro().catch(() => {});
                })();
                // ===== KONIEC MOBILE INTRO =====

                console.log("Inicjalizacja zakończona pomyślnie.");

             } catch (error) {
                 console.error("Błąd podczas inicjalizacji w DOMContentLoaded:", error);
                 const body = document.querySelector('body');
                 if (body) {
                     const errorMsg = document.createElement('p');
                     errorMsg.textContent = "Wystąpił błąd podczas ładowania konfiguratora. Spróbuj odświeżyć stronę.";
                     errorMsg.className = "text-red-600 font-bold text-center p-4 bg-red-100 fixed top-0 left-0 right-0 z-50";
                     body.prepend(errorMsg);
                 }
             }
        });
// ===== CUSTOM SHELF POSITIONING (from custom-shelf.js) =====
function updateDimensionOverlay() { /* stub - dimension overlay not needed in this version */ }
// ===== WŁASNE ROZMIESZCZENIE PÓŁEK — DRAG MODE =====
let customShelfPositionEnabled = false;
let customShelfPositions = [];
let customPositionsModified = false; // true dopiero gdy polka zostala faktycznie przesunięta i zatwierdzona
let _shelfWasMoved = false; // true tylko gdy onDragEnd wykrył faktyczne przeciągnięcie
let dragModeActive = false;
let draggedShelf = null;
let dragPlane = null;
let dragRaycaster = null;
let dragMouse = new THREE.Vector2();
let dragOffset = 0;
let originalEmissives = new Map();

function toggleCustomShelfPosition() {
    customShelfPositionEnabled = !customShelfPositionEnabled;
    const sw = document.getElementById('customShelfSwitch');
    const panel = document.getElementById('shelfCountSection');
    if (!sw) return;

    if (customShelfPositionEnabled) {
        sw.classList.add('on');
        if (panel) panel.classList.add('sp-custom-active');
        updateCustomShelfStatusUI('editing');
        enterDragMode();
    } else {
        disableCustomPositions();
    }
    updateOrderSummary();
}

function reenterDragMode() {
    if (!customShelfPositionEnabled) return;
    updateCustomShelfStatusUI('editing');
    enterDragMode();
}

function disableCustomPositions() {
    customShelfPositionEnabled = false;
    customPositionsModified = false;
    _shelfWasMoved = false;
    customShelfPositions = [];
    const sw = document.getElementById('customShelfSwitch');
    const panel = document.getElementById('shelfCountSection');
    if (sw) sw.classList.remove('on');
    if (panel) panel.classList.remove('sp-custom-active');
    if (dragModeActive) exitDragMode();
    updateCustomShelfStatusUI('hidden');
    updatePreview();
    updateOrderSummary();
}

function updateCustomShelfStatusUI(state) {
    const editingEl = document.getElementById('cspStatusEditing');
    const savedEl = document.getElementById('cspStatusSaved');
    if (!editingEl || !savedEl) return;

    if (state === 'editing') {
        editingEl.style.display = 'flex';
        savedEl.style.display = 'none';
    } else if (state === 'saved') {
        editingEl.style.display = 'none';
        savedEl.style.display = 'flex';
    } else {
        editingEl.style.display = 'none';
        savedEl.style.display = 'none';
    }
}

function initDefaultPositions() {
    const count = parseInt(shelfCountSelect.value) || 0;
    const height = parseInt(heightSelect.value) || 60;
    const innerHeight = height - 3.6;
    customShelfPositions = [];
    for (let i = 1; i <= count; i++) {
        customShelfPositions.push(Math.round((innerHeight / (count + 1)) * i));
    }
}

function _iconsHide() {
    const panel = document.getElementById('mobilePanelIcons');
    if (panel) {
        panel.classList.remove('icons-returning');
        panel.classList.add('icons-hidden');
    }
    const leftPanel = document.getElementById('mobileLeftPanel');
    if (leftPanel) leftPanel.classList.add('icons-hidden');
}
function _iconsShow() {
    const panel = document.getElementById('mobilePanelIcons');
    if (panel) {
        panel.classList.add('icons-returning');
        panel.classList.remove('icons-hidden');
        setTimeout(() => panel.classList.remove('icons-returning'), 500);
    }
    const leftPanel = document.getElementById('mobileLeftPanel');
    if (leftPanel) leftPanel.classList.remove('icons-hidden');
}

function enterDragMode() {
    if (!shelfGroup || !renderer || !camera) return;
    dragModeActive = true;
    _shelfWasMoved = false; // reset przy każdym wejściu w tryb edycji
    _iconsHide();

    if (customShelfPositions.length === 0) initDefaultPositions();
    // Synchronizuj pozycje z aktualnego modelu bez przebudowy
    syncPositionsFromModel();

    autoRotateEnabled = false;
    if (controls) controls.enabled = false;

    // Rotate to front
    gsap.to(shelfGroup.rotation, { x: 0, y: 0, z: 0, duration: 0.6, ease: 'power2.inOut' });

    // Przesuń model do y=0 żeby był na środku sceny, potem dopasuj kamerę
    const editHeight = parseInt(heightSelect && heightSelect.value) || 60;
    if (shelfGroup) shelfGroup.position.y = 0;

    if (camera && controls) {
        const camZ = editHeight >= 80 ? 8 : editHeight >= 60 ? 7 : 6;
        controls.target.set(0, 0, 0);
        gsap.to(camera.position, {
            x: -3, y: 0.5, z: camZ,
            duration: 0.5, ease: 'power2.inOut',
            onUpdate: function() { if (controls) controls.update(); }
        });
        controls.update();
    }

    dragRaycaster = new THREE.Raycaster();

    const canvas = renderer.domElement;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        // MOBILE: fullscreen overlay (existing behavior)
        const overlay = document.getElementById('dragModeOverlay');
        const dragArea = document.getElementById('dragModeCanvas');
        const originalParent = document.getElementById('threeJsCanvasWrapper');
        
        if (overlay && dragArea && canvas) {
            overlay._originalParent = originalParent;
            dragArea.appendChild(canvas);
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                const w = dragArea.clientWidth;
                const h = dragArea.clientHeight;
                if (w > 0 && h > 0) {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                    renderer.render(scene, camera);
                }
            }, 100);
        }

        // Show hint
        if (dragArea) {
            const hint = document.createElement('div');
            hint.className = 'drag-hint';
            hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M8 14l4-4 4 4"/><path d="M4 4h16"/></svg>Przesuń półki palcem';
            dragArea.appendChild(hint);
            setTimeout(() => { if (hint.parentNode) hint.parentNode.removeChild(hint); }, 3200);
        }
    } else {
        // DESKTOP: in-place overlay on 3D wrapper
        const wrapper = document.getElementById('threeJsCanvasWrapper');
        if (wrapper) {
            wrapper.style.position = 'relative';

            // Create desktop overlay — subtler green ring, no heavy box-shadow
            const dOverlay = document.createElement('div');
            dOverlay.id = 'desktopDragOverlay';
            dOverlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:20;pointer-events:none;border-radius:12px;overflow:hidden;border:1.5px solid rgba(22,163,74,0.55);box-shadow:inset 0 0 0 1px rgba(22,163,74,0.08);';

            // Top banner — flat green with subtle divider, compact typography
            const banner = document.createElement('div');
            banner.style.cssText = 'pointer-events:auto;position:absolute;top:0;left:0;right:0;z-index:10;background:rgba(22,163,74,0.96);color:white;padding:9px 14px;display:flex;align-items:center;justify-content:center;gap:10px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid rgba(21,128,61,0.5);animation:dragBannerIn 0.4s ease;';
            banner.innerHTML = '<div style="width:26px;height:26px;flex-shrink:0;border-radius:7px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M12 20V10"/><path d="M8 14l4-4 4 4"/><path d="M4 4h16"/></svg></div><div style="display:flex;flex-direction:column;min-width:0"><div style="font-size:12.5px;font-weight:700;letter-spacing:-0.01em;line-height:1.15">Tryb edycji półek</div><div style="font-size:10.5px;opacity:0.85;font-weight:500;margin-top:1px;letter-spacing:0.01em;line-height:1.2">Przesuń półki myszką w górę / w dół</div></div>';
            dOverlay.appendChild(banner);

            // Bottom bar with buttons — glassmorphic white, matching mug shelf bar style
            const bottomBar = document.createElement('div');
            bottomBar.style.cssText = 'pointer-events:auto;position:absolute;bottom:0;left:0;right:0;z-index:10;padding:10px 14px;background:rgba(255,255,255,0.93);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1.5px solid rgba(22,163,74,0.25);box-shadow:0 -2px 8px rgba(22,163,74,0.07);display:flex;gap:10px;justify-content:center;align-items:center;animation:dragBottomIn 0.4s ease 0.15s both;';
            bottomBar.innerHTML = '<button onclick="resetShelfPositions()" title="Przywróć domyślne rozmieszczenie" style="padding:9px 18px;border-radius:9px;border:1px solid #d1d5db;font-size:12.5px;font-weight:700;cursor:pointer;background:rgba(243,244,246,0.9);color:#4B5563;display:flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 0.15s ease;letter-spacing:-0.005em;line-height:1" onmouseover="this.style.background=\'#f3f4f6\';this.style.borderColor=\'#9ca3af\';this.style.color=\'#1f2937\';" onmouseout="this.style.background=\'rgba(243,244,246,0.9)\';this.style.borderColor=\'#d1d5db\';this.style.color=\'#4B5563\';"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Reset</button><button onclick="exitDragModeAndKeep()" title="Zakończ edycję i zachowaj zmiany" style="padding:9px 22px;border-radius:9px;border:1px solid #15803d;font-size:12.5px;font-weight:700;cursor:pointer;background:#16a34a;color:white;display:flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(22,163,74,0.28);transition:all 0.15s ease;letter-spacing:-0.005em;line-height:1" onmouseover="this.style.background=\'#15803d\';this.style.boxShadow=\'0 2px 8px rgba(22,163,74,0.4)\';" onmouseout="this.style.background=\'#16a34a\';this.style.boxShadow=\'0 2px 6px rgba(22,163,74,0.28)\';"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M5 13l4 4L19 7"/></svg>Gotowe</button>';
            dOverlay.appendChild(bottomBar);

            wrapper.appendChild(dOverlay);

            // Hint
            const hint = document.createElement('div');
            hint.className = 'drag-hint';
            hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M8 14l4-4 4 4"/><path d="M4 4h16"/></svg>Przesuń półki myszką';
            wrapper.appendChild(hint);
            setTimeout(() => { if (hint.parentNode) hint.parentNode.removeChild(hint); }, 3200);
        }
    }

    // Block config selects
    const selectsToBlock = [widthSelect, heightSelect, depthSelect, shelfCountSelect, shelfTypeSelect, sideColorSelect, shelfColorSelect];
    selectsToBlock.forEach(s => { if (s) { s.disabled = true; s.style.opacity = '0.4'; s.style.pointerEvents = 'none'; } });
    document.querySelectorAll('#shelfTypeOptions input[type="checkbox"], #noTopShelf, #noBottomShelf').forEach(cb => { cb.disabled = true; });

    highlightShelves(true);

    // Add event listeners
    canvas.addEventListener('pointerdown', onDragStart);
    canvas.addEventListener('pointermove', onDragMove);
    canvas.addEventListener('pointerup', onDragEnd);
    canvas.addEventListener('pointerleave', onDragEnd);
    canvas.style.touchAction = 'none';

    // Dimension arrows
    setTimeout(() => refreshDimensionArrows(), 700);
}

function exitDragMode() {
    dragModeActive = false;
    if (controls) controls.enabled = true;
    _iconsShow();
    
    const canvas = renderer?.domElement;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        // MOBILE: Move canvas back to original parent
        const overlay = document.getElementById('dragModeOverlay');
        const originalParent = overlay?._originalParent || document.getElementById('threeJsCanvasWrapper');
        
        if (overlay && canvas && originalParent) {
            overlay.classList.remove('active');
            originalParent.appendChild(canvas);
            document.body.style.overflow = '';
            
            setTimeout(() => {
                const w = originalParent.clientWidth;
                const h = originalParent.clientHeight;
                if (w > 0 && h > 0) {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                }
            }, 50);
        }
    } else {
        // DESKTOP: Remove in-place overlay
        const dOverlay = document.getElementById('desktopDragOverlay');
        if (dOverlay) dOverlay.remove();
        
        // Remove any lingering hints
        const wrapper = document.getElementById('threeJsCanvasWrapper');
        if (wrapper) {
            wrapper.querySelectorAll('.drag-hint').forEach(h => h.remove());
        }
    }

    // Unblock config selects
    const selectsToUnblock = [widthSelect, heightSelect, depthSelect, shelfCountSelect, shelfTypeSelect, sideColorSelect, shelfColorSelect];
    selectsToUnblock.forEach(s => { if (s) { s.disabled = false; s.style.opacity = ''; s.style.pointerEvents = ''; } });
    document.querySelectorAll('#shelfTypeOptions input[type="checkbox"], #noTopShelf, #noBottomShelf').forEach(cb => { cb.disabled = false; });

    highlightShelves(false);

    if (canvas) {
        canvas.removeEventListener('pointerdown', onDragStart);
        canvas.removeEventListener('pointermove', onDragMove);
        canvas.removeEventListener('pointerup', onDragEnd);
        canvas.removeEventListener('pointerleave', onDragEnd);
        canvas.style.touchAction = '';
        canvas.style.cursor = '';
    }

    // Remove dimension arrows
    if (shelfGroup) {
        const toRemove = shelfGroup.children.filter(c => c.isLine || (c.isSprite && c.name?.startsWith('dimensionLabel_')));
        toRemove.forEach(c => shelfGroup.remove(c));
    }

    // Przywroc kamerę — model jest przy y=0, kamera patrzy na (0,0,0)
    if (camera && controls) {
        const _hExit = parseInt(heightSelect && heightSelect.value) || 60;
        const _czExit = window.innerWidth < 768 ? (_hExit >= 80 ? 11 : 9) : (_hExit >= 80 ? 10 : 7);
        gsap.to(camera.position, { x: -4, y: 0.5, z: _czExit, duration: 0.5, ease: 'power2.inOut', onUpdate: function() { if (controls) controls.update(); } });
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

function exitDragModeAndKeep() {
    exitDragMode();
    _iconsShow();

    // Sprawdź czy pozycje różnią się od domyślnych o więcej niż 0.5 cm
    let isNonStandard = false;
    if (_shelfWasMoved) {
        const count = customShelfPositions.length;
        const h = parseInt(heightSelect.value) || 60;
        const t = 1.8;
        const innerH = h - 2 * t;
        const gap = (innerH - count * t) / (count + 1);
        isNonStandard = customShelfPositions.some((pos, i) => {
            const defaultPos = t + (i + 1) * gap + i * t;
            return Math.abs(pos - defaultPos) > 0.5;
        });
    }

    if (isNonStandard) {
        // Klient naprawdę zmienił pozycje — włącz tryb i nalicz opłatę
        customShelfPositionEnabled = true;
        customPositionsModified = true;
        updatePreview();
        updateOrderSummary();
        const sw = document.getElementById('customShelfSwitch');
        if (sw) sw.classList.add('on');
        const panel = document.getElementById('shelfCountSection');
        if (panel) panel.classList.add('sp-custom-active');
        updateCustomShelfStatusUI('saved');
    } else {
        // Nic nie zmieniono — wyłącz tryb jakby nie był włączony
        customShelfPositionEnabled = false;
        customPositionsModified = false;
        customShelfPositions = [];
        updatePreview();
        updateOrderSummary();
        const sw = document.getElementById('customShelfSwitch');
        if (sw) sw.classList.remove('on');
        const panel = document.getElementById('shelfCountSection');
        if (panel) panel.classList.remove('sp-custom-active');
        updateCustomShelfStatusUI('hidden');
    }
}

function resetShelfPositions() {
    customPositionsModified = false;
    _shelfWasMoved = false;
    initDefaultPositions();
    updatePreview();
    updateOrderSummary();
    // Re-add dimension arrows
    setTimeout(() => refreshDimensionArrows(), 600);
}

function highlightShelves(on) {
    if (!shelfGroup) return;
    shelfGroup.children.forEach(c => {
        if (c.isMesh && c.name?.startsWith('internalShelf_')) {
            if (on) {
                originalEmissives.set(c.uuid, c.material.emissive?.clone() || new THREE.Color(0));
                c.material = c.material.clone();
                c.material.emissive = new THREE.Color(0x16a34a);
                c.material.emissiveIntensity = 0.3;
            } else {
                const orig = originalEmissives.get(c.uuid);
                if (orig) {
                    c.material.emissive = orig;
                    c.material.emissiveIntensity = 0;
                }
            }
        }
    });
}

function getMouseNDC(event) {
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    return new THREE.Vector2(x, y);
}

function onDragStart(event) {
    if (!dragModeActive || !shelfGroup) return;
    event.preventDefault();
    
    const ndc = getMouseNDC(event);
    dragRaycaster.setFromCamera(ndc, camera);
    
    const shelves = shelfGroup.children.filter(c => c.isMesh && c.name?.startsWith('internalShelf_'));
    const intersects = dragRaycaster.intersectObjects(shelves);
    
    if (intersects.length > 0) {
        draggedShelf = intersects[0].object;
        draggedShelf.material = draggedShelf.material.clone();
        draggedShelf.material.emissive = new THREE.Color(0x16a34a);
        draggedShelf.material.emissiveIntensity = 0.6;
        
        // Calculate offset
        const worldPos = new THREE.Vector3();
        draggedShelf.getWorldPosition(worldPos);
        const planeIntersect = new THREE.Vector3();
        dragRaycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -worldPos.z), planeIntersect);
        dragOffset = worldPos.y - planeIntersect.y;
        
        renderer.domElement.style.cursor = 'grabbing';
    }
}

function onDragMove(event) {
    if (!dragModeActive || !shelfGroup) return;
    event.preventDefault();
    
    const ndc = getMouseNDC(event);
    
    if (draggedShelf) {
        dragRaycaster.setFromCamera(ndc, camera);
        
        const worldPos = new THREE.Vector3();
        draggedShelf.getWorldPosition(worldPos);
        const planeIntersect = new THREE.Vector3();
        dragRaycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -worldPos.z), planeIntersect);
        
        let newWorldY = planeIntersect.y + dragOffset;
        
        // Convert to local space
        const parentInverse = new THREE.Matrix4();
        if (draggedShelf.parent) parentInverse.copy(draggedShelf.parent.matrixWorld).invert();
        const localPos = new THREE.Vector3(0, newWorldY, 0).applyMatrix4(parentInverse);
        
        // Get bounds in local space
        const thickness = 0.18;
        const height = parseFloat(heightSelect.value) / 10;
        const bottomPanel = shelfGroup.getObjectByName('bottomPanel');
        const topPanel = shelfGroup.getObjectByName('topPanel');
        const minY = bottomPanel ? bottomPanel.position.y + thickness / 2 + 1.1 : -height / 2 + 1.1;
        const maxY = topPanel ? topPanel.position.y - thickness / 2 - 1.1 : height / 2 - 1.1;
        
        // Get neighbor constraints (11cm = 1.1 units)
        const MIN_GAP_UNITS = 1.1;
        const otherShelves = shelfGroup.children
            .filter(c => c.isMesh && c.name?.startsWith('internalShelf_') && c !== draggedShelf)
            .map(c => c.position.y)
            .sort((a, b) => a - b);

        // Wyznacz bezposrednich sasiadow na podstawie AKTUALNEJ pozycji polki
        // (nie pozycji myszki) – zapobiega przeskakiwaniu przy szybkim ruchu
        const currentY = draggedShelf.position.y;
        let lowerBound = minY;
        let upperBound = maxY;
        for (const sy of otherShelves) {
            if (sy < currentY) {
                lowerBound = Math.max(lowerBound, sy + MIN_GAP_UNITS + thickness);
            } else {
                upperBound = Math.min(upperBound, sy - MIN_GAP_UNITS - thickness);
            }
        }
        let clampedY = Math.max(lowerBound, Math.min(upperBound, localPos.y));
        
        // Zaokrąglaj do pełnych centymetrów (0.1 jednostki = 1 cm)
        clampedY = Math.round(clampedY * 10) / 10;
        clampedY = Math.max(lowerBound, Math.min(upperBound, clampedY));
        
        draggedShelf.position.y = clampedY;
        
        // Update customShelfPositions from current shelf positions
        syncPositionsFromModel();
        
        // Refresh dimension arrows in real-time
        refreshDimensionArrows();
        
    } else {
        // Hover effect
        dragRaycaster.setFromCamera(ndc, camera);
        const shelves = shelfGroup.children.filter(c => c.isMesh && c.name?.startsWith('internalShelf_'));
        const intersects = dragRaycaster.intersectObjects(shelves);
        renderer.domElement.style.cursor = intersects.length > 0 ? 'grab' : 'default';
    }
}

function onDragEnd(event) {
    if (!draggedShelf) return;
    
    _shelfWasMoved = true; // klient faktycznie przeciągnął półkę
    draggedShelf.material.emissiveIntensity = 0.3;
    draggedShelf = null;
    renderer.domElement.style.cursor = 'grab';
    
    syncPositionsFromModel();
    updateOrderSummary();
    refreshDimensionArrows();
}

function syncPositionsFromModel() {
    if (!shelfGroup) return;
    const thickness = 0.18;
    const height = parseFloat(heightSelect.value) / 10;
    const bottomPanel = shelfGroup.getObjectByName('bottomPanel');
    const bottomY = bottomPanel ? bottomPanel.position.y + thickness / 2 : -height / 2 + thickness;
    
    const shelves = shelfGroup.children
        .filter(c => c.isMesh && c.name?.startsWith('internalShelf_'))
        .sort((a, b) => a.position.y - b.position.y);
    
    customShelfPositions = shelves.map(s => {
        const cmFromBottom = (s.position.y - bottomY) * 10;
        return Math.round(cmFromBottom);
    });
}

function refreshDimensionArrows() {
    if (!shelfGroup) return;
    // Remove old arrows from main group (isLine/isSprite + mug shelf arrow meshes)
    const toRemove = shelfGroup.children.filter(c =>
        c.isLine ||
        (c.isSprite && c.name?.startsWith('dimensionLabel_')) ||
        (c.isMesh && c.name && (c.name.startsWith('mugHeightArrow_') || c.name.startsWith('mugWidthArrow_')))
    );
    toRemove.forEach(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); }
        shelfGroup.remove(c);
    });
    // Also clean from modular subgroups
    ['leftModule','rightModule'].forEach(mn => {
        const mod = shelfGroup.getObjectByName(mn);
        if (!mod) return;
        mod.children.filter(ch => ch.isLine || (ch.isSprite && ch.name?.startsWith('dimensionLabel_')))
            .forEach(ch => { if (ch.geometry) ch.geometry.dispose(); if (ch.material) { if(ch.material.map) ch.material.map.dispose(); ch.material.dispose(); } mod.remove(ch); });
    });

    // Modular shelf — draw arrows on each module
    if (shelfTypeSelect && shelfTypeSelect.value === 'modular') {
        addModularDimensionArrows(shelfGroup);
        return;
    }

    // Standard shelves
    const shelves = shelfGroup.children.filter(c => c.isMesh && c.name?.startsWith('internalShelf_'));
    if (shelves.length === 0) return;
    const tp = shelfGroup.getObjectByName('topPanel');
    const bp = shelfGroup.getObjectByName('bottomPanel');
    const thickness = 0.18;
    const width = parseFloat(getCurrentWidth()) / 10;
    const height = parseFloat(heightSelect.value) / 10;
    const depth = parseFloat(depthSelect.value) / 10;
    if (shelfTypeSelect && shelfTypeSelect.value !== 'mug_shelf') {
        // Jeśli własne rozmieszczenie aktywne — budujemy wirtualne obiekty do etykiet
        // bez zmiany rzeczywistych pozycji 3D (żeby półki nie skakały przy włączeniu)
        if (customShelfPositionEnabled && customShelfPositions.length === shelves.length) {
            const bottomY = bp ? bp.position.y + thickness / 2 : -height / 2 + thickness;
            const sorted = [...customShelfPositions].sort((a, b) => a - b);
            const virtualShelves = sorted.map((cmFromBottom, i) => ({
                isMesh: true,
                name: `internalShelf_${i}`,
                position: { y: bottomY + cmFromBottom / 10 },
                geometry: shelves[i] ? shelves[i].geometry : null,
                scale: shelves[i] ? shelves[i].scale : { x: 1 }
            }));
            addShelfDimensionArrows(shelfGroup, virtualShelves, bp, tp, thickness, width, height, depth);
        } else {
            addShelfDimensionArrows(shelfGroup, shelves, bp, tp, thickness, width, height, depth);
        }
    } else if (shelfTypeSelect && shelfTypeSelect.value === 'mug_shelf' && tp && bp) {
        // ── FIX: rysuj wymiary komór dla półki na kubki (było pominięte po animacji rebuildAndAnimateIn)
        const addTop    = dividersTopCheckbox    && dividersTopCheckbox.checked;
        const addMiddle = dividersMiddleCheckbox && dividersMiddleCheckbox.checked;
        const addBottom = dividersBottomCheckbox && dividersBottomCheckbox.checked;
        if (!addTop && !addMiddle && !addBottom && !(heightSelect.value === '60')) return;
        const widthNum = parseFloat(getCurrentWidth());
        const heightVal = heightSelect.value;
        const sortedShelves = [...shelves].sort((a, b) => a.position.y - b.position.y);
        let levels = [];
        if (heightVal === '60' && sortedShelves.length === 3) {
            levels = [
                { top: tp.position.y - thickness / 2,                  bottom: sortedShelves[2].position.y + thickness / 2 },
                { top: sortedShelves[2].position.y - thickness / 2,    bottom: sortedShelves[1].position.y + thickness / 2 },
                { top: sortedShelves[1].position.y - thickness / 2,    bottom: sortedShelves[0].position.y + thickness / 2 },
                { top: sortedShelves[0].position.y - thickness / 2,    bottom: bp.position.y + thickness / 2 }
            ];
        } else if (heightVal === '40' && sortedShelves.length === 2) {
            levels = [
                { top: tp.position.y - thickness / 2,                  bottom: sortedShelves[1].position.y + thickness / 2 },
                { top: sortedShelves[1].position.y - thickness / 2,    bottom: sortedShelves[0].position.y + thickness / 2 },
                { top: sortedShelves[0].position.y - thickness / 2,    bottom: bp.position.y + thickness / 2 }
            ];
        }
        // Wysokość: na każdej zaznaczonej przegródce + dolna wnęka (tylko h=60)
        const selectedForHeight = [];
        if (addTop    && levels[0]) selectedForHeight.push(levels[0]);
        if (addMiddle && levels[1]) selectedForHeight.push(levels[1]);
        if (addBottom && levels[2]) selectedForHeight.push(levels[2]);
        if (heightVal === '60' && levels[3]) selectedForHeight.push(levels[3]);
        selectedForHeight.forEach(lvl => {
            if (typeof addMugShelfCompartmentHeightArrow === 'function') {
                addMugShelfCompartmentHeightArrow(shelfGroup, widthNum, width, depth, thickness, lvl);
            }
        });
        // Szerokość: pierwsza zaznaczona przegródka
        let widthLevelData = null;
        if      (addTop    && levels[0]) widthLevelData = levels[0];
        else if (addMiddle && levels[1]) widthLevelData = levels[1];
        else if (addBottom && levels[2]) widthLevelData = levels[2];
        if (widthLevelData && typeof addMugShelfCompartmentWidthArrow === 'function') {
            const fb = { position: { y: widthLevelData.bottom - thickness / 2 } };
            const ft = { position: { y: widthLevelData.top    + thickness / 2 } };
            addMugShelfCompartmentWidthArrow(shelfGroup, widthNum, width, depth, thickness, fb, ft);
        }
    }
}

// Keep old functions for compatibility
function buildCustomShelfInputs() { initDefaultPositions(); }
function getShelfBounds(idx) { return { minVal: 11, maxVal: 99 }; }
function stepperChange() {}
function stepperInput() {}
function validateCustomShelfPositions() { return true; }
function isCustomShelfValid() { return !customShelfPositionEnabled || customShelfPositions.length > 0; }

function showOrHideCustomShelfToggle() {
    const wrapper = document.getElementById('customShelfPositionWrapper');
    if (!wrapper) return;
    const height = heightSelect ? parseInt(heightSelect.value) : 0;
    const shelfType = shelfTypeSelect ? shelfTypeSelect.value : '';
    const count = shelfCountSelect ? parseInt(shelfCountSelect.value) : 0;
    const show = (height >= 40) && shelfType !== 'mug_shelf' && shelfType !== 'modular' && count >= 1 && !(height === 80 && count === 5) && !(height === 40 && count >= 2);
    wrapper.style.display = show ? 'block' : 'none';

    // Show/hide gap display based on shelf count
    const gapDisplay = document.getElementById('gapDisplay');
    if (gapDisplay) gapDisplay.style.display = 'none';

    if (!show && customShelfPositionEnabled) {
        disableCustomPositions();
    }

    // Sync floating mobile button visibility
    if (typeof updateModularIconsVisibility === 'function') updateModularIconsVisibility();
}

function getCustomPositionSummary() {
    if (!customShelfPositionEnabled || customShelfPositions.length === 0) return null;
    // Zawsze obliczaj z customShelfPositions (tablica cm) — nigdy z pozycji 3D,
    // bo model moze byc w trakcie animacji GSAP i zwracac bledne wartosci posrednie.
    const sorted = [...customShelfPositions].sort((a, b) => a - b);
    const height = parseInt(heightSelect.value) || 60;
    const thickness = 1.8; // cm
    const noTop = document.getElementById('noTopShelf') && document.getElementById('noTopShelf').checked;
    const noBottom = document.getElementById('noBottomShelf') && document.getElementById('noBottomShelf').checked;
    const topT = noTop ? 0 : thickness;
    const botT = noBottom ? 0 : thickness;
    const innerHeight = height - topT - botT;
    // sorted[i] = pozycja srodka i-tej polki od gornej krawedzi dna (w cm)
    // przerwa = wolna przestrzen miedzy krawedziami (tak jak pokazuja zielone strzalki)
    const distances = [];
    distances.push(Math.round((sorted[0] - thickness / 2) * 10) / 10);
    for (let i = 0; i < sorted.length - 1; i++) {
        distances.push(Math.round((sorted[i + 1] - sorted[i] - thickness) * 10) / 10);
    }
    distances.push(Math.round((innerHeight - sorted[sorted.length - 1] - thickness / 2) * 10) / 10);
    return { distances, positions: sorted, fee: 50 };
}

function getCustomPosInfoString() {
    const cps = getCustomPositionSummary();
    if (!cps) return null;
    const d = cps.distances;
    const labels = d.map((v, i) => `${Number.isInteger(v) ? v : v.toFixed(1)}`);
    return labels.join(' · ') + ' cm';
}

function updateDimensionOverlay() { /* handled by refreshDimensionArrows */ }

function openBatchExportModal() {
    const el = document.getElementById('batchExportOverlay');
    if (el) { el.style.display = 'flex'; document.getElementById('batchResultsList').style.display = 'none'; document.getElementById('batchItemsContainer').innerHTML = ''; }
}
function closeBatchExportModal() {
    const el = document.getElementById('batchExportOverlay');
    if (el) el.style.display = 'none';
}

let _batchGeneratedBlobs = [];

async function startBatchExport() {
    const input = document.getElementById('batchCodesInput').value;
    const codes = input.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    if (!codes.length) { alert('Wklej co najmniej jeden kod.'); return; }

    const startBtn = document.getElementById('batchStartBtn');
    startBtn.disabled = true;
    startBtn.textContent = 'Generowanie...';

    const container = document.getElementById('batchItemsContainer');
    container.innerHTML = '';
    _batchGeneratedBlobs = [];
    document.getElementById('batchResultsList').style.display = 'block';
    document.getElementById('batchDownloadAllBtn').style.display = 'none';

    let successCount = 0;

    for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;background:#f9fafb;border:1.5px solid #e5e7eb;';
        row.innerHTML = `
            <div style="flex:1;min-width:0;">
                <div style="font-size:11px;font-weight:700;color:#9ca3af;margin-bottom:2px;">KOD #${i+1}</div>
                <div style="font-size:13px;font-weight:700;color:#111827;font-family:'Courier New',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${code}</div>
            </div>
            <div id="batchRow_${i}_status" style="font-size:12px;color:#9ca3af;white-space:nowrap;">⏳ Oczekuje...</div>
            <div id="batchRow_${i}_preview" style="width:60px;height:60px;border-radius:8px;background:#f3f4f6;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;"></div>
            <button id="batchRow_${i}_dl" style="display:none;padding:7px 14px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">↓ JPG</button>
        `;
        container.appendChild(row);

        const statusEl = document.getElementById(`batchRow_${i}_status`);
        const previewEl = document.getElementById(`batchRow_${i}_preview`);
        const dlBtn = document.getElementById(`batchRow_${i}_dl`);

        try {
            statusEl.textContent = '⚙️ Przetwarzam...';
            statusEl.style.color = '#f59e0b';

            const details = parseOrderCode(code);
            if (details.error) throw new Error(details.error);

            await reconfigureFromDetails(details);
            await new Promise(r => setTimeout(r, 400));

            const price = computePriceDetailed();

            const snap3d = await new Promise((res, rej) => {
                if (!renderer || !scene || !camera) return rej(new Error("brak renderera"));
                const prevBg = scene.background ? scene.background.clone() : null;
                const prevClearColor = new THREE.Color(); renderer.getClearColor(prevClearColor);
                const prevClearAlpha = renderer.getClearAlpha();
                scene.background = new THREE.Color(0xffffff);
                renderer.setClearColor(0xffffff, 1);
                const prevW = renderer.domElement.width / (window.devicePixelRatio||1);
                const prevH = renderer.domElement.height / (window.devicePixelRatio||1);
                renderer.setSize(900, 1100);
                camera.aspect = 900/1100; camera.updateProjectionMatrix();
                renderer.render(scene, camera);
                const dataUrl = renderer.domElement.toDataURL('image/png');
                if (prevBg) scene.background = prevBg; else scene.background = null;
                renderer.setClearColor(prevClearColor, prevClearAlpha);
                renderer.setSize(prevW||400, prevH||500);
                camera.aspect = (prevW||400)/(prevH||500); camera.updateProjectionMatrix();
                res(dataUrl);
            });

            const thumb = new Image(); thumb.src = snap3d;
            thumb.style.cssText = 'width:100%;height:100%;object-fit:contain;';
            previewEl.appendChild(thumb);

            const blob = await new Promise(async (resBlob) => {
                const W=1200, H=1400, BAR_H=160, RENDER_H=H-BAR_H;
                const c=document.createElement('canvas'); c.width=W; c.height=H;
                const cx=c.getContext('2d');
                cx.fillStyle='#ffffff'; cx.fillRect(0,0,W,RENDER_H);
                const ri=await new Promise((r2,rj)=>{const ii=new Image();ii.onload=()=>r2(ii);ii.onerror=rj;ii.src=snap3d;});
                cx.drawImage(ri,0,0,W,RENDER_H);
                cx.fillStyle='#ffffff'; cx.fillRect(0,RENDER_H,W,BAR_H);
                cx.fillStyle='#e5e7eb'; cx.fillRect(0,RENDER_H,W,1);
                const paramList = details.isModular ? [
                    ['RODZAJ',details.shelfType],['WYMIARY',(details.totalWidth||'')+'×'+(details.height||'')+'×'+(details.depth||'')+' cm'],['KOLOR BOKOW',details.sideColor],['KOLOR POLEK',details.shelfColor],['POLKI',String(details.totalShelves||'')],
                ] : [
                    ['RODZAJ',details.shelfType],['WYMIARY',(details.width||'')+'×'+(details.height||'')+'×'+(details.depth||'')+' cm'],['KOLOR BOKOW',details.sideColor],['KOLOR POLEK',details.shelfColor],['POLKI WEWN.',(details.shelfCount||'')+' szt.'],
                    details.gapInfo&&details.gapInfo!=='n/d'?['ODSTEP',details.gapInfo]:null,
                ].filter(Boolean).filter(([,v])=>v&&v!=='n/d'&&!v.startsWith('undefined'));
                const disc=price?(price.total*0.90).toFixed(2):null, orig=price?price.total.toFixed(2):null;
                const PRICE_COL_W=220, PARAM_COLS=2;
                const PARAM_COL_W=Math.floor((W-PRICE_COL_W-56)/PARAM_COLS);
                const ROW_H=74, TOP_PAD=16;
                paramList.forEach(([label,value],idx)=>{
                    const col=idx%PARAM_COLS, row=Math.floor(idx/PARAM_COLS);
                    const px=28+col*PARAM_COL_W, py=RENDER_H+TOP_PAD+row*ROW_H;
                    if(col>0){cx.strokeStyle='#f0f0f0';cx.lineWidth=1;cx.beginPath();cx.moveTo(px-14,py+4);cx.lineTo(px-14,py+ROW_H-8);cx.stroke();}
                    if(row===1&&col===0){cx.strokeStyle='#f0f0f0';cx.lineWidth=1;cx.beginPath();cx.moveTo(28,py-6);cx.lineTo(W-PRICE_COL_W-16,py-6);cx.stroke();}
                    cx.fillStyle='#aaaaaa';cx.font='600 13px Arial,sans-serif';cx.fillText(label,px,py+16);
                    cx.fillStyle='#111111';let fs=24;cx.font='bold '+fs+'px Arial,sans-serif';
                    while(cx.measureText(value||'—').width>PARAM_COL_W-20&&fs>13){fs--;cx.font='bold '+fs+'px Arial,sans-serif';}
                    cx.fillText(value||'—',px,py+50);
                });
                const cxS=W-PRICE_COL_W;cx.strokeStyle='#e5e7eb';cx.lineWidth=1;cx.beginPath();cx.moveTo(cxS,RENDER_H+10);cx.lineTo(cxS,RENDER_H+BAR_H-30);cx.stroke();
                if(disc){const midX=cxS+PRICE_COL_W/2,totalRows=Math.ceil(paramList.length/PARAM_COLS),areaH=TOP_PAD+totalRows*ROW_H,midY=RENDER_H+areaH/2;
                    cx.textAlign='center';cx.fillStyle='#aaaaaa';cx.font='600 13px Arial,sans-serif';cx.fillText('CENA -10%',midX,midY-24);
                    cx.fillStyle='#bbbbbb';cx.font='500 16px Arial,sans-serif';cx.fillText(orig+' zl',midX,midY-4);
                    const ow=cx.measureText(orig+' zl').width;cx.strokeStyle='#cccccc';cx.lineWidth=1.2;cx.beginPath();cx.moveTo(midX-ow/2,midY-11);cx.lineTo(midX+ow/2,midY-11);cx.stroke();
                    cx.fillStyle='#16a34a';cx.font='bold 34px Arial,sans-serif';cx.fillText(disc+' zl',midX,midY+30);cx.textAlign='left';}
                cx.fillStyle='#aaaaaa';cx.font='600 14px Arial,sans-serif';cx.fillText('Kod: ',28,H-12);
                cx.fillStyle='#333333';cx.font='bold 14px "Courier New",monospace';cx.fillText(details.code,28+cx.measureText('Kod: ').width+2,H-12);
                c.toBlob(b=>resBlob(b),'image/jpeg',0.95);
            });

            _batchGeneratedBlobs.push({ blob, code: details.code });
            dlBtn.style.display = 'block';
            dlBtn.onclick = () => { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='polka-'+details.code.substring(0,12)+'.jpg'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000); };
            row.style.borderColor = '#bbf7d0'; row.style.background = '#f0fdf4';
            statusEl.textContent = '✓ Gotowe'; statusEl.style.color = '#16a34a';
            successCount++;
        } catch(err) {
            row.style.borderColor = '#fca5a5'; row.style.background = '#fef2f2';
            statusEl.textContent = '✗ ' + err.message; statusEl.style.color = '#dc2626';
        }
    }

    document.getElementById('batchResultsTitle').textContent = `Wyniki: ${successCount}/${codes.length} gotowych`;
    if (successCount > 1) document.getElementById('batchDownloadAllBtn').style.display = 'flex';
    startBtn.disabled = false;
    startBtn.textContent = 'Generuj ponownie';
}

async function batchDownloadAll() {
    for (const item of _batchGeneratedBlobs) {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'polka-'+item.code.substring(0,12)+'.jpg'; a.click();
        await new Promise(r => setTimeout(r, 700));
        URL.revokeObjectURL(url);
    }
}

async function startCompositeExport() {
    const input = document.getElementById('batchCodesInput').value;
    const codes = input.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    if (!codes.length) { alert('Wklej co najmniej jeden kod.'); return; }
    if (codes.length > 4) { alert('Maksymalnie 4 półki na jednym zdjęciu.'); return; }

    const btn = document.getElementById('batchCompositeBtn');
    btn.disabled = true;
    btn.textContent = 'Generowanie...';

    document.getElementById('batchResultsList').style.display = 'block';
    document.getElementById('batchItemsContainer').innerHTML = '';

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'padding:16px;background:#f9fafb;border-radius:12px;border:1.5px solid #e5e7eb;font-size:13px;color:#6b7280;';
    statusDiv.textContent = '⚙️ Renderowanie półek...';
    document.getElementById('batchItemsContainer').appendChild(statusDiv);

    try {
        const shelves = []; // { snap, details, price }

        for (let i = 0; i < codes.length; i++) {
            statusDiv.textContent = `⚙️ Renderuję półkę ${i+1}/${codes.length}...`;
            const details = parseOrderCode(codes[i]);
            if (details.error) throw new Error(`Kod #${i+1}: ${details.error}`);

            await reconfigureFromDetails(details);
            await new Promise(r => setTimeout(r, 350));

            // Odśwież strzałki
            if (typeof refreshDimensionArrows === 'function') refreshDimensionArrows();
            await new Promise(r => setTimeout(r, 150));

            const price = computePriceDetailed();

            const snap = await new Promise((res, rej) => {
                if (!renderer || !scene || !camera) return rej(new Error("brak renderera"));
                const prevBg = scene.background ? scene.background.clone() : null;
                const prevClearColor = new THREE.Color(); renderer.getClearColor(prevClearColor);
                const prevClearAlpha = renderer.getClearAlpha();
                scene.background = new THREE.Color(0xffffff);
                renderer.setClearColor(0xffffff, 1);
                const prevW = renderer.domElement.width / (window.devicePixelRatio||1);
                const prevH = renderer.domElement.height / (window.devicePixelRatio||1);
                renderer.setSize(700, 800);
                camera.aspect = 700/800; camera.updateProjectionMatrix();
                renderer.render(scene, camera);
                const dataUrl = renderer.domElement.toDataURL('image/png');
                if (prevBg) scene.background = prevBg; else scene.background = null;
                renderer.setClearColor(prevClearColor, prevClearAlpha);
                renderer.setSize(prevW||400, prevH||500);
                camera.aspect = (prevW||400)/(prevH||500); camera.updateProjectionMatrix();
                res(dataUrl);
            });

            shelves.push({ snap, details, price });
        }

        statusDiv.textContent = '🎨 Składam zdjęcie zbiorcze...';

        await _printTemplateReady; // poczekaj na wczytanie print_template.json z serwera
        const blob = _printTemplate
            ? await generateCompositeFromTemplate(shelves, _printTemplate)
            : await generateCompositeImage(shelves);

        statusDiv.innerHTML = '';
        const successRow = document.createElement('div');
        successRow.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;background:#f0fdf4;border:1.5px solid #bbf7d0;';
        successRow.innerHTML = `
            <svg style="width:28px;height:28px;flex-shrink:0;color:#16a34a;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div style="flex:1"><div style="font-size:14px;font-weight:700;color:#15803d;">Zdjęcie zbiorcze gotowe!</div><div style="font-size:12px;color:#16a34a;margin-top:2px;">${codes.length} półk${codes.length===1?'a':codes.length<5?'i':'i'} · łącznie z rabatami</div></div>
            <button id="compositeDownloadBtn" style="padding:10px 20px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">↓ Pobierz JPG</button>
        `;
        document.getElementById('batchItemsContainer').appendChild(successRow);
        document.getElementById('compositeDownloadBtn').onclick = () => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'polki-zbiorcze-'+codes.length+'szt.jpg'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        };

    } catch(err) {
        statusDiv.style.background = '#fef2f2';
        statusDiv.style.borderColor = '#fca5a5';
        statusDiv.style.color = '#dc2626';
        statusDiv.textContent = '✗ Błąd: ' + err.message;
    }

    btn.disabled = false;
    btn.textContent = 'Jedno zdjęcie zbiorcze';
}

// ═══════════════════════════════════════════════════════
//  PRINT TEMPLATE — wbudowany szablon (print_template.json)
// ═══════════════════════════════════════════════════════
//  PRINT TEMPLATE — wbudowany domyślny + nadpisanie z localStorage/pliku
// ═══════════════════════════════════════════════════════
const _printTemplateDefault = {"version":1,"layouts":{"1":{"cards":[{"x":5,"y":5,"w":200,"h":200}],"elements":[{"id":"e2","type":"field","field":"index","x":6,"y":5,"w":22,"h":13,"fontSize":12,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e1","type":"image3d","field":null,"x":5,"y":20,"w":190,"h":120,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"transparent","align":"left","content":""},{"id":"e3","type":"field","field":"shelfType","x":5,"y":143,"w":190,"h":7,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#666","bg":"transparent","align":"left","content":""},{"id":"e4","type":"field","field":"dimensions","x":5,"y":153,"w":120,"h":11,"fontSize":13,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e9","type":"rect","field":null,"x":5,"y":168,"w":190,"h":0.5,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"#e5e7eb","align":"left","content":""},{"id":"e5","type":"text","field":null,"x":5,"y":172,"w":85,"h":5,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR BOKÓW"},{"id":"e6","type":"field","field":"sideColor","x":5,"y":179,"w":90,"h":8,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e7","type":"text","field":null,"x":108,"y":172,"w":87,"h":5,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR PÓŁEK"},{"id":"e8","type":"field","field":"shelfColor","x":108,"y":179,"w":87,"h":8,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e11","type":"field","field":"price","x":130,"y":183,"w":65,"h":14,"fontSize":16,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"right","content":""},{"id":"e10","type":"field","field":"code","x":5,"y":189,"w":120,"h":7,"fontSize":8,"fontWeight":"normal","fontFamily":"monospace","color":"#777","bg":"transparent","align":"left","content":""}]},"2":{"cards":[{"x":5,"y":5,"w":200,"h":138},{"x":5,"y":154,"w":200,"h":138}],"elements":[{"id":"e12","type":"image3d","field":null,"x":4,"y":16,"w":96,"h":90,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"transparent","align":"left","content":""},{"id":"e13","type":"field","field":"index","x":4,"y":4,"w":18,"h":10,"fontSize":10,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e14","type":"field","field":"shelfType","x":106,"y":18,"w":90,"h":7,"fontSize":8,"fontWeight":"normal","fontFamily":"sans-serif","color":"#777","bg":"transparent","align":"left","content":""},{"id":"e15","type":"field","field":"dimensions","x":97.9,"y":5.6,"w":102.1,"h":45.7,"fontSize":12,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e16","type":"text","field":null,"x":106,"y":42,"w":50,"h":6,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR BOKÓW"},{"id":"e17","type":"field","field":"sideColor","x":106,"y":49,"w":90,"h":8,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e18","type":"text","field":null,"x":106,"y":61,"w":50,"h":6,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR PÓŁEK"},{"id":"e19","type":"field","field":"shelfColor","x":106,"y":68,"w":90,"h":8,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e20","type":"rect","field":null,"x":4,"y":112,"w":192,"h":0.5,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"#e5e7eb","align":"left","content":""},{"id":"e21","type":"field","field":"code","x":4,"y":116,"w":120,"h":7,"fontSize":8,"fontWeight":"normal","fontFamily":"monospace","color":"#888","bg":"transparent","align":"left","content":""},{"id":"e22","type":"field","field":"price","x":130,"y":112,"w":66,"h":12,"fontSize":13,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"right","content":""}]},"3":{"cards":[{"x":5,"y":5,"w":200,"h":88},{"x":5,"y":103,"w":200,"h":88},{"x":5,"y":201,"w":200,"h":88}],"elements":[{"id":"e23","type":"image3d","field":null,"x":4,"y":10,"w":66,"h":62,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"transparent","align":"left","content":""},{"id":"e24","type":"field","field":"index","x":4,"y":2,"w":15,"h":8,"fontSize":9,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e25","type":"field","field":"shelfType","x":76,"y":12,"w":120,"h":6,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#777","bg":"transparent","align":"left","content":""},{"id":"e26","type":"field","field":"dimensions","x":76,"y":21,"w":120,"h":9,"fontSize":11,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e27","type":"text","field":null,"x":76,"y":34,"w":50,"h":5,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR BOKÓW"},{"id":"e28","type":"field","field":"sideColor","x":76,"y":40,"w":55,"h":7,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e29","type":"text","field":null,"x":136,"y":34,"w":50,"h":5,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR PÓŁEK"},{"id":"e30","type":"field","field":"shelfColor","x":136,"y":40,"w":60,"h":7,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e31","type":"rect","field":null,"x":4,"y":72,"w":192,"h":0.5,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"#e5e7eb","align":"left","content":""},{"id":"e32","type":"field","field":"code","x":4,"y":76,"w":120,"h":6,"fontSize":8,"fontWeight":"normal","fontFamily":"monospace","color":"#888","bg":"transparent","align":"left","content":""},{"id":"e33","type":"field","field":"price","x":130,"y":72,"w":66,"h":10,"fontSize":12,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"right","content":""}]},"4":{"cards":[{"x":5,"y":5,"w":97,"h":138},{"x":108,"y":5,"w":97,"h":138},{"x":5,"y":154,"w":97,"h":138},{"x":108,"y":154,"w":97,"h":138}],"elements":[{"id":"e34","type":"image3d","field":null,"x":4,"y":14,"w":89,"h":72,"fontSize":10,"fontWeight":"normal","fontFamily":"sans-serif","color":"#111111","bg":"transparent","align":"left","content":""},{"id":"e35","type":"field","field":"index","x":4,"y":3,"w":15,"h":9,"fontSize":9,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e36","type":"field","field":"dimensions","x":4,"y":90,"w":89,"h":9,"fontSize":10,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"left","content":""},{"id":"e37","type":"text","field":null,"x":4,"y":103,"w":44,"h":5,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR BOKÓW"},{"id":"e38","type":"field","field":"sideColor","x":4,"y":109,"w":89,"h":7,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e39","type":"text","field":null,"x":4,"y":120,"w":44,"h":5,"fontSize":7,"fontWeight":"normal","fontFamily":"sans-serif","color":"#999","bg":"transparent","align":"left","content":"KOLOR PÓŁEK"},{"id":"e40","type":"field","field":"shelfColor","x":4,"y":126,"w":89,"h":7,"fontSize":9,"fontWeight":"normal","fontFamily":"sans-serif","color":"#333","bg":"transparent","align":"left","content":""},{"id":"e41","type":"field","field":"price","x":4,"y":116,"w":89,"h":11,"fontSize":12,"fontWeight":"bold","fontFamily":"sans-serif","color":"#111","bg":"transparent","align":"right","content":""},{"id":"e42","type":"field","field":"code","x":4,"y":129,"w":89,"h":6,"fontSize":7,"fontWeight":"normal","fontFamily":"monospace","color":"#999","bg":"transparent","align":"left","content":""}]}}};

// Szablon z pliku print_template.js (wczytanego przez <script>) lub wbudowany domyślny
let _printTemplate = (typeof window._printTemplateData !== 'undefined')
    ? window._printTemplateData
    : _printTemplateDefault;

// Brak fetcha — Promise od razu gotowy
const _printTemplateReady = Promise.resolve();

// Generuje obraz zbiorcze z szablonu print_template.json
async function generateCompositeFromTemplate(shelves, tpl) {
    const N = shelves.length;
    const SC = 6; // px/mm — jakość ~150 DPI na A4
    const PW = 210, PH = 297;

    // Dobierz układ do liczby produktów
    let lay = tpl.layouts[N] || tpl.layouts[Math.min(N, 4)] || tpl.layouts[1];
    if (!lay) throw new Error('Brak układu dla ' + N + ' produktów w szablonie.');

    const W = Math.round(PW * SC);
    // Dla jednej karty: wysokość obrazu = karta + marginesy (np. kwadrat)
    // Dla wielu kart: pełne A4
    const pageH = (lay.cards.length === 1)
        ? lay.cards[0].y + lay.cards[0].h + lay.cards[0].y
        : PH;
    const H = Math.round(pageH * SC);

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Białe tło
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Wczytaj snapshoty 3D
    const snapImgs = await Promise.all(shelves.map(s => new Promise(res => {
        const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = s.snap;
    })));

    // Preładuj tekstury wzorników kolorów (z COLORS w wzory.js)
    const _swatchCache = {};
    async function getSwatchImg(colorName) {
        if (_swatchCache[colorName] !== undefined) return _swatchCache[colorName];
        const colorEntry = (typeof COLORS !== 'undefined') ? COLORS.find(c => c.name === colorName) : null;
        if (!colorEntry) { _swatchCache[colorName] = null; return null; }
        // Konwertuj teksturę do base64 przez fetch+FileReader — unika skażenia canvas (CORS)
        let imgSrc = null;
        try {
            const resp = await fetch(colorEntry.textureImg);
            const blob = await resp.blob();
            imgSrc = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        } catch(e) { /* brak CORS lub file:// — użyj koloru zastępczego */ }
        if (!imgSrc) { _swatchCache[colorName] = colorEntry.value || null; return _swatchCache[colorName]; }
        const img = await new Promise(res => {
            const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null);
            im.src = imgSrc;
        });
        _swatchCache[colorName] = img || colorEntry.value;
        return _swatchCache[colorName];
    }

    // Oblicz ceny z rabatem per produkt
    const disc = (typeof DISCOUNTS !== 'undefined') ? DISCOUNTS : {discount1item:0.10, discountBest:0.10, discountCheap:0.25};
    const rawPrices = shelves.map(s => s.price ? s.price.total : 0);
    const discPrices = [...rawPrices];

    if (N === 1 && rawPrices[0] > 0) {
        discPrices[0] = rawPrices[0] * (1 - disc.discount1item);
    } else if (N >= 2) {
        const valid = rawPrices.filter(p => p > 0);
        if (valid.length) {
            const maxP = Math.max(...valid), minP = Math.min(...valid);
            const maxI = rawPrices.indexOf(maxP), minI = rawPrices.indexOf(minP);
            if (maxI >= 0) discPrices[maxI] = rawPrices[maxI] * (1 - disc.discountBest);
            if (minI >= 0 && minI !== maxI) discPrices[minI] = rawPrices[minI] * (1 - disc.discountCheap);
        }
    }

    const c0 = lay.cards[0];
    // Nowy format v2: elementy mają absolutne pozycje + cardIndex
    // Stary format v1: elementy są względem card[0], stosujemy offset
    const isV2 = (tpl.version >= 2) || lay.elements.some(el => el.cardIndex > 0);

    // Rysuj elementy dla każdej półki
    for (let idx = 0; idx < N; idx++) {
        const shelf = shelves[idx];
        const card  = lay.cards[Math.min(idx, lay.cards.length - 1)];
        const d = shelf.details;

        const fieldData = {
            index:      '#' + (idx + 1),
            code:       d.code || '—',
            dimensions: (d.width||d.totalWidth||'') + '×' + (d.height||'') + '×' + (d.depth||'') + ' cm',
            price:      discPrices[idx] > 0 ? discPrices[idx].toFixed(2) + ' zł' : '—',
            shelfType:  d.shelfType || '—',
            sideColor:  d.sideColor || '—',
            shelfColor: d.shelfColor || '—',
            shelfCount: d.shelfCount ? d.shelfCount + ' szt.' : '—',
            gap:        d.gapInfo || d.gap || '—',
        };

        // Wybierz elementy dla tej karty
        const cardEls = isV2
            ? lay.elements.filter(el => (el.cardIndex || 0) === idx)
            : lay.elements; // stary format — wszystkie elementy z offsetem

        // Granice karty w pikselach — do clippingu elementów
        const cardClipX = Math.round(card.x * SC);
        const cardClipY = Math.round(card.y * SC);
        const cardClipW = Math.round(card.w * SC);
        const cardClipH = Math.round(card.h * SC);

        for (const el of cardEls) {
            // v2: el.x/y to absolutne pozycje strony A4
            // v1: el.x/y to pozycje względem card[0] → dodajemy offset aktualnej karty
            const ex = isV2 ? Math.round(el.x * SC) : Math.round((card.x + el.x) * SC);
            const ey = isV2 ? Math.round(el.y * SC) : Math.round((card.y + el.y) * SC);
            const ew = Math.round(el.w * SC);
            const eh = Math.round(Math.max(el.h, 0.5) * SC);
            const fsPx = Math.max(8, Math.round(el.fontSize * 0.37 * SC));
            const fontStr = (el.fontWeight === 'bold' ? 'bold ' : '') + fsPx + 'px ' +
                            (el.fontFamily === 'monospace' ? '"Courier New",monospace' : 'Arial,sans-serif');

            // Kadruj każdy element do granic karty
            ctx.save();
            ctx.beginPath();
            ctx.rect(cardClipX, cardClipY, cardClipW, cardClipH);
            ctx.clip();

            if (el.type === 'rect') {
                ctx.fillStyle = el.bg || '#e5e7eb';
                ctx.fillRect(ex, ey, ew, eh);
            } else if (el.type === 'image3d') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ex, ey, ew, eh);
                const img = snapImgs[idx];
                if (img) {
                    const scale = Math.min(ew / img.width, eh / img.height);
                    const sw = img.width * scale, sh = img.height * scale;
                    ctx.save();
                    ctx.beginPath(); ctx.rect(ex, ey, ew, eh); ctx.clip();
                    ctx.drawImage(img, ex + (ew - sw) / 2, ey + (eh - sh) / 2, sw, sh);
                    ctx.restore();
                }
            } else if (el.type === 'colorSwatch') {
                // Prawdziwy wzornik koloru z COLORS (wzory.js)
                const colorName = fieldData[el.field] || '';
                const swatchResult = await getSwatchImg(colorName);
                ctx.save();
                ctx.beginPath(); ctx.rect(ex, ey, ew, eh); ctx.clip();
                if (swatchResult && typeof swatchResult === 'object') {
                    // Tekstura — object-fit: cover
                    const scale = Math.max(ew / swatchResult.width, eh / swatchResult.height);
                    const sw = swatchResult.width * scale, sh = swatchResult.height * scale;
                    ctx.drawImage(swatchResult, ex - (sw - ew) / 2, ey - (sh - eh) / 2, sw, sh);
                } else {
                    // Fallback: kolor hex
                    const entry = (typeof COLORS !== 'undefined') ? COLORS.find(c => c.name === colorName) : null;
                    ctx.fillStyle = (entry && entry.value) ? entry.value : '#cccccc';
                    ctx.fillRect(ex, ey, ew, eh);
                }
                ctx.restore();
                // Cienka ramka na próbniku (widoczna na białym tle)
                ctx.strokeStyle = 'rgba(0,0,0,0.18)';
                ctx.lineWidth = 0.6;
                ctx.strokeRect(ex + 0.3, ey + 0.3, ew - 0.6, eh - 0.6);
            } else if (el.type === 'text' || el.type === 'field') {
                const txt = el.type === 'text' ? (el.content || '') : (fieldData[el.field] || '');
                if (!txt) continue;
                if (el.bg && el.bg !== 'transparent') {
                    ctx.fillStyle = el.bg;
                    ctx.fillRect(ex, ey, ew, eh);
                }
                ctx.fillStyle = el.color || '#111111';
                ctx.font = fontStr;
                ctx.textAlign = el.align || 'left';
                const tx = el.align === 'right' ? ex + ew : el.align === 'center' ? ex + ew / 2 : ex;
                ctx.save();
                ctx.beginPath(); ctx.rect(ex, ey - 2, ew, eh + 6); ctx.clip();
                ctx.fillText(txt, tx, ey + eh * 0.75);
                ctx.restore();
                ctx.textAlign = 'left';
            }

            ctx.restore(); // koniec clippingu do karty
        }
    }

    ctx.textAlign = 'left';
    return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', 0.95));
}
// ═══════════════════════════════════════════════════════

async function generateCompositeImage(shelves) {
    const N = shelves.length;
    // Kazda polka: karta pozioma — render po lewej, panel po prawej (układ B)
    const CARD_W = Math.min(1200, Math.floor(1400 / Math.max(N, 1))); // szerokość karty
    const CARD_H = 520;
    const RENDER_RATIO = 0.62; // 62% szerokości na render
    const RENDER_W = Math.floor(CARD_W * RENDER_RATIO);
    const PANEL_W = CARD_W - RENDER_W;
    const PAD = 20;
    const GAP = 16; // odstep miedzy kartami
    const PRICE_BAR_H = 110;

    const W = N * CARD_W + (N - 1) * GAP + PAD * 2;
    const H = CARD_H + PAD * 2 + PRICE_BAR_H + GAP;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Tlo
    ctx.fillStyle = '#f0f0ef';
    ctx.fillRect(0, 0, W, H);

    // Zaladuj obrazy
    const imgs = await Promise.all(shelves.map(s => new Promise((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s.snap;
    })));

    // Rysuj kazda polke jako karte B
    shelves.forEach((shelf, idx) => {
        const cardX = PAD + idx * (CARD_W + GAP);
        const cardY = PAD;

        // Biala karta z cieniem
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.07)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 3;
        ctx.beginPath(); ctx.roundRect(cardX, cardY, CARD_W, CARD_H, 14); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        // === RENDER PO LEWEJ ===
        ctx.save();
        ctx.beginPath(); ctx.roundRect(cardX, cardY, RENDER_W, CARD_H, [14,0,0,14]); ctx.clip();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(cardX, cardY, RENDER_W, CARD_H);
        ctx.drawImage(imgs[idx], cardX, cardY, RENDER_W, CARD_H);
        ctx.restore();

        // Numer #1 #2...
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(cardX + 10, cardY + 10, 30, 20, 5); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('#'+(idx+1), cardX + 25, cardY + 23);
        ctx.textAlign = 'left';

        // === SEPARATOR ===
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cardX + RENDER_W, cardY + 12); ctx.lineTo(cardX + RENDER_W, cardY + CARD_H - 12); ctx.stroke();

        // === PANEL PRAWY — parametry ===
        const px = cardX + RENDER_W + 18;
        const maxW = PANEL_W - 28;
        const d = shelf.details;
        const params = [
            ['RODZAJ', d.shelfType],
            ['WYMIARY', (d.width||d.totalWidth||'')+'×'+(d.height||'')+'×'+(d.depth||'')+' cm'],
            ['KOLOR BOKOW', d.sideColor],
            ['KOLOR POLEK', d.shelfColor],
            d.shelfCount ? ['POLKI', d.shelfCount+' szt.'] : null,
        ].filter(Boolean).filter(([,v]) => v && !v.startsWith('undefined'));

        // Ile miejsca na param
        const priceAreaH = shelf.price ? 90 : 0;
        const paramAreaH = CARD_H - PAD - priceAreaH - PAD;
        const rowH = Math.floor(paramAreaH / params.length);

        params.forEach(([label, value], ii) => {
            const py = cardY + PAD + ii * rowH;
            if (ii > 0) {
                ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + maxW, py); ctx.stroke();
            }
            ctx.fillStyle = '#aaaaaa'; ctx.font = '600 11px Arial,sans-serif';
            ctx.fillText(label, px, py + 14);
            ctx.fillStyle = '#111111';
            let fs = 17; ctx.font = 'bold '+fs+'px Arial,sans-serif';
            while (ctx.measureText(value||'—').width > maxW && fs > 11) { fs--; ctx.font = 'bold '+fs+'px Arial,sans-serif'; }
            ctx.fillText(value||'—', px, py + 36);
        });

        // Cena w karcie
        if (shelf.price) {
            const disc = (shelf.price.total * (1 - DISCOUNTS.discount1item)).toFixed(2);
            const orig = shelf.price.total.toFixed(2);
            const priceY = cardY + CARD_H - priceAreaH;
            ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px, priceY); ctx.lineTo(px + maxW, priceY); ctx.stroke();
            ctx.fillStyle = '#aaaaaa'; ctx.font = '600 11px Arial,sans-serif';
            ctx.fillText('CENA', px, priceY + 16);
            ctx.fillStyle = '#cccccc'; ctx.font = '500 13px Arial,sans-serif';
            ctx.fillText(orig+' zl', px, priceY + 36);
            const ow = ctx.measureText(orig+' zl').width;
            ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px, priceY+30); ctx.lineTo(px+ow, priceY+30); ctx.stroke();
            ctx.fillStyle = '#16a34a'; ctx.font = 'bold 28px Arial,sans-serif';
            ctx.fillText(disc+' zl', px, priceY + 72);
        }
    });

    // === PASEK LACZNEJ CENY ===
    const barY = PAD + CARD_H + GAP;
    const prices = shelves.map(s => s.price ? s.price.total : 0).filter(p => p > 0);
    const subtotal = prices.reduce((a,b) => a+b, 0);
    let discount10 = 0, discount25 = 0;
    if (prices.length === 1) { discount10 = prices[0] * 0.10; }
    else if (prices.length >= 2) { const sorted = [...prices].sort((a,b)=>b-a); discount10 = sorted[0]*0.10; discount25 = sorted[sorted.length-1]*0.25; }
    const totalDiscount = discount10 + discount25;
    const totalFinal = subtotal - totalDiscount;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.roundRect(PAD, barY, W - PAD*2, PRICE_BAR_H, 14); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(PAD, barY, W - PAD*2, PRICE_BAR_H, 14); ctx.stroke();

    const col3W = (W - PAD*4) / 3;
    const barMid = barY + PRICE_BAR_H/2;
    const c1x = PAD*2 + 16, c2x = PAD*2 + col3W + PAD + 16, c3x = W - PAD*2 - col3W + 20;

    ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c2x-20, barY+16); ctx.lineTo(c2x-20, barY+PRICE_BAR_H-16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c3x-20, barY+16); ctx.lineTo(c3x-20, barY+PRICE_BAR_H-16); ctx.stroke();

    ctx.fillStyle = '#9ca3af'; ctx.font = '600 12px Arial,sans-serif';
    ctx.fillText('SUMA CZESCIOWA', c1x, barMid - 16);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 26px Arial,sans-serif';
    ctx.fillText(subtotal.toFixed(2)+' zl', c1x, barMid + 14);

    if (totalDiscount > 0) {
        ctx.fillStyle = '#9ca3af'; ctx.font = '600 12px Arial,sans-serif';
        ctx.fillText('RABATY', c2x, barMid - 16);
        if (discount10 > 0) { ctx.fillStyle = '#16a34a'; ctx.font = '500 13px Arial,sans-serif'; ctx.fillText('✓  -'+discount10.toFixed(2)+' zl', c2x, barMid); }
        if (discount25 > 0) { ctx.fillStyle = '#16a34a'; ctx.font = '500 13px Arial,sans-serif'; ctx.fillText('✓  -'+discount25.toFixed(2)+' zl', c2x, barMid + 20); }
    }

    ctx.fillStyle = '#9ca3af'; ctx.font = '600 12px Arial,sans-serif';
    ctx.fillText('LACZNIE DO ZAPLATY', c3x, barMid - 16);
    if (totalDiscount > 0) {
        ctx.fillStyle = '#d1d5db'; ctx.font = '500 16px Arial,sans-serif';
        ctx.fillText(subtotal.toFixed(2)+' zl', c3x, barMid + 2);
        const sw = ctx.measureText(subtotal.toFixed(2)+' zl').width;
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c3x, barMid-4); ctx.lineTo(c3x+sw, barMid-4); ctx.stroke();
        ctx.fillStyle = '#16a34a'; ctx.font = 'bold 32px Arial,sans-serif';
        ctx.fillText(totalFinal.toFixed(2)+' zl', c3x, barMid + 36);
    } else {
        ctx.fillStyle = '#111827'; ctx.font = 'bold 32px Arial,sans-serif';
        ctx.fillText(totalFinal.toFixed(2)+' zl', c3x, barMid + 18);
    }

    return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', 0.95));
}

async function batchDownloadAll() {
    for (const item of _batchGeneratedBlobs) {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'polka-'+item.code.substring(0,12)+'.jpg'; a.click();
        await new Promise(r => setTimeout(r, 700));
        URL.revokeObjectURL(url);
    }
}

async function startCompositeExport() {
    const input = document.getElementById('batchCodesInput').value;
    const codes = input.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    if (!codes.length) { alert('Wklej co najmniej jeden kod.'); return; }
    if (codes.length > 4) { alert('Maksymalnie 4 półki na jednym zdjęciu.'); return; }

    const btn = document.getElementById('batchCompositeBtn');
    btn.disabled = true;
    btn.textContent = 'Generowanie...';

    document.getElementById('batchResultsList').style.display = 'block';
    document.getElementById('batchItemsContainer').innerHTML = '';

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'padding:16px;background:#f9fafb;border-radius:12px;border:1.5px solid #e5e7eb;font-size:13px;color:#6b7280;';
    statusDiv.textContent = '⚙️ Renderowanie półek...';
    document.getElementById('batchItemsContainer').appendChild(statusDiv);

    try {
        const shelves = []; // { snap, details, price }

        for (let i = 0; i < codes.length; i++) {
            statusDiv.textContent = `⚙️ Renderuję półkę ${i+1}/${codes.length}...`;
            const details = parseOrderCode(codes[i]);
            if (details.error) throw new Error(`Kod #${i+1}: ${details.error}`);

            await reconfigureFromDetails(details);
            await new Promise(r => setTimeout(r, 350));

            // Odśwież strzałki
            if (typeof refreshDimensionArrows === 'function') refreshDimensionArrows();
            await new Promise(r => setTimeout(r, 150));

            const price = computePriceDetailed();

            const snap = await new Promise((res, rej) => {
                if (!renderer || !scene || !camera) return rej(new Error("brak renderera"));
                const prevBg = scene.background ? scene.background.clone() : null;
                const prevClearColor = new THREE.Color(); renderer.getClearColor(prevClearColor);
                const prevClearAlpha = renderer.getClearAlpha();
                scene.background = new THREE.Color(0xffffff);
                renderer.setClearColor(0xffffff, 1);
                const prevW = renderer.domElement.width / (window.devicePixelRatio||1);
                const prevH = renderer.domElement.height / (window.devicePixelRatio||1);
                renderer.setSize(700, 800);
                camera.aspect = 700/800; camera.updateProjectionMatrix();
                renderer.render(scene, camera);
                const dataUrl = renderer.domElement.toDataURL('image/png');
                if (prevBg) scene.background = prevBg; else scene.background = null;
                renderer.setClearColor(prevClearColor, prevClearAlpha);
                renderer.setSize(prevW||400, prevH||500);
                camera.aspect = (prevW||400)/(prevH||500); camera.updateProjectionMatrix();
                res(dataUrl);
            });

            shelves.push({ snap, details, price });
        }

        statusDiv.textContent = '🎨 Składam zdjęcie zbiorcze...';

        await _printTemplateReady; // poczekaj na wczytanie print_template.json z serwera
        const blob = _printTemplate
            ? await generateCompositeFromTemplate(shelves, _printTemplate)
            : await generateCompositeImage(shelves);

        statusDiv.innerHTML = '';
        const successRow = document.createElement('div');
        successRow.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;background:#f0fdf4;border:1.5px solid #bbf7d0;';
        successRow.innerHTML = `
            <svg style="width:28px;height:28px;flex-shrink:0;color:#16a34a;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div style="flex:1"><div style="font-size:14px;font-weight:700;color:#15803d;">Zdjęcie zbiorcze gotowe!</div><div style="font-size:12px;color:#16a34a;margin-top:2px;">${codes.length} półk${codes.length===1?'a':codes.length<5?'i':'i'} · łącznie z rabatami</div></div>
            <button id="compositeDownloadBtn" style="padding:10px 20px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">↓ Pobierz JPG</button>
        `;
        document.getElementById('batchItemsContainer').appendChild(successRow);
        document.getElementById('compositeDownloadBtn').onclick = () => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'polki-zbiorcze-'+codes.length+'szt.jpg'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        };

    } catch(err) {
        statusDiv.style.background = '#fef2f2';
        statusDiv.style.borderColor = '#fca5a5';
        statusDiv.style.color = '#dc2626';
        statusDiv.textContent = '✗ Błąd: ' + err.message;
    }

    btn.disabled = false;
    btn.textContent = 'Jedno zdjęcie zbiorcze';
}


const _SWATCH_B64 = {
    '#FFFFFF': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwAFAwQEBAMFBAQEBQUFBgcMCAcHBwcPCwsJDBEPEhIRDxERExYcFxMUGhURERghGBodHR8fHxMXIiQiHiQcHh8e/9sAQwEFBQUHBgcOCAgOHhQRFB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e/8AAEQgAUABQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+y6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/9k=',
    '#000000': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwAFAwQEBAMFBAQEBQUFBgcMCAcHBwcPCwsJDBEPEhIRDxERExYcFxMUGhURERghGBodHR8fHxMXIiQiHiQcHh8e/9sAQwEFBQUHBgcOCAgOHhQRFB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e/8AAEQgAUABQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+PKKKK2MQooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z',
    '#8B5A2B': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwAFAwQEBAMFBAQEBQUFBgcMCAcHBwcPCwsJDBEPEhIRDxERExYcFxMUGhURERghGBodHR8fHxMXIiQiHiQcHh8e/9sAQwEFBQUHBgcOCAgOHhQRFB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e/8AAEQgAUABQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A34Ii+oCXJ+dhmtK2URM2JGx5u0s+MngYqMbFnt9g+UN+lWLXaYomJ5kBcg+uOtfIs+oZS15910pT5kCgluw7Gn2WxoRCSeJ8j3AXd/Wl12QLeQjadhG3AHAqbShH5zbRnap6nuSP6LQHQlRB5FxIPmLA8+/T+lYqRhiBKu5zIq4B6Dr/ACrdaVVtZSE7kj3xXO3Tu1zbyL8vmTbiPoCBTQI0710nLQKCZBgADtn+lSalv8xHYY2q2O/0NRWClLuR2bKtgt7HFT6hMvmqr4xjv+FIDLVI5v8AXKzIrZwD8p+vrWtYOZLKRSpC4LCqNnHI8c6gKMHDBh1Ht71eiTaRFuZV8vlOM4Ax1oYMyt6xJHHvYnd+PNadw6wqqquGVML9OB/hWbbqokjRwjOZsEnvgZq5K32qUwrHna6jPYY5/OmwH6qu66iUk5K5P9aj06aKGNmnlWMFsAt3qTU1dZN7HLbCOOnX/wDVWfCEP+kPEG8okhj/AAjvSBbG1Owa13qGZTkZ7c1jXe171IhjKL1/GtSzLmwfzABhQRzWXHEXvEmxyxFAIk0q3kgv7lS5cFgx3EkYPQDNS620iTxjYSCrKRjj1/pVmJI4mkCAqqyBcAls8D/GoNe3ySRvGp2bMknjOD2o6h1JLEgWc0pPJC8nuamBC39yDk7kAUgdOM1VsCroYihw8ysP++dx/wA+9aEKgJM4HUEHI/z6UCZzs4c31s33WLMzcevStLTQiTSuj7gThh74xVOVll1Hy8/cAHNT6Lai3uJ/KOEL5yMfPkD9BmmyizfzYuAH6Eccepx/WoLKF5IJQW27WwRgEMPQ0a15qXa45BQqeevccVYs3RbFmyMs6j6nvS6CJFVQ8i8kpHllB+UGq5dGeBkxgSD/APVU4yJ7/aCyOOD6YUf1rJMixRqqgk7tx9s//XpgjYtmUxxMeGkLN9ev9MVBr8jiaB1XI6H2HrT7qTyIEAAAC8H8MAUmqLmS3Q8kryfpikg6i6W0ZuDhQu1T19yP8KuGRxFLlMbjx+ArJs7qC0DGZyA74VRyT9K02fzLRpI04zgZNAnuZFvATdxSMMFiDzWhCqqWKRgATEAIMDGBzVcTo0kEqthVcmrVswEUG4HcUyTj2z/WhjZU11ZHuVk27BsBCHqcGn6cS+ItmQZWk+mFH9TSa60n2yF0wcfe+n+cVPpUmZHbGAFwCBx1z/hQHQsKh+zTEAqWBXn8aw02wyCIuATOq5PfvW3K8q2sgyMtuI59BXPXaOZ7ZpMht5diPypoEabu91NJAoXAIUt6D6VLqUbBlbJY7Tj2z2qtpkkD3UrQOHZMBgDn1FWNQkdJlJBICk8emRSAoW28B5NoOz5ueorSsGYWchkYfMm4Z9+lVbGAss4Zm+VuCrEf/rFXEVBcMu1WZIyWOMAUMGZBc/JHFHkBgDjnrxWlfyNGoGeMAZA6Ems+N0huYoCWXE5/Qdfzq3A73dxIhYbEcZ9SBz+XSmwJNUwbuJeMBMkn2qtZ3S2wEflSSvIxwqjp0yc9Kt6lFhvlOTsPJ6+tULcSiCSRedvzbfWkCNZ2aWz8wbRzyO+Kxp3EmoiLnaoAH1rTtGEdm8bSZYqOO+etUo7c+fE7DlmH50Ah2mwRLdTyxEeWWBBz1bHOadrqMlxGwccA5Pfn/wCvirgLNJKw+Y+b8ueOAOf61X12N5JYmchW2fKin34zQHUWycJYS8HcSqcDvmrC7jeXLooKMoDZ9h/9equmiRm8vAw0gc5HTavP6kVoxoyxTEjB5HFAmf/Z',
};

// Cache załadowanych obrazów próbek
const _swatchImgLoaded = {};

function drawColorSwatch(ctx, hex, x, y, size) {
    const h = (hex || '').toUpperCase();
    const src = _SWATCH_B64[h] || _SWATCH_B64[hex] || null;

    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5;

    if (src) {
        let img = _swatchImgLoaded[h];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.clip();
            ctx.drawImage(img, x, y, size, size);
            ctx.restore();
        } else if (!img) {
            // Załaduj i przerysuj
            img = new Image();
            img.onload = () => { _swatchImgLoaded[h] = img; };
            img.src = src;
            _swatchImgLoaded[h] = img;
            // Fallback na kolor
            ctx.fillStyle = hex || '#888'; ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.fill();
        } else {
            ctx.fillStyle = hex || '#888'; ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.fill();
        }
    } else {
        ctx.fillStyle = hex || '#888888';
        ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.fill();
    }
    ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.stroke();
}

async function drawColorSwatchAsync(ctx, hex, x, y, size) {
    const h = (hex || '').toUpperCase();
    const src = _SWATCH_B64[h] || _SWATCH_B64[hex] || null;
    if (src) {
        const img = await new Promise(res => {
            const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
        });
        if (img) {
            ctx.save();
            ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.clip();
            ctx.drawImage(img, x, y, size, size);
            ctx.restore();
        } else { ctx.fillStyle = hex||'#888'; ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.fill(); }
    } else { ctx.fillStyle = hex||'#888'; ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.fill(); }
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, size, size, 4); ctx.stroke();
}

async function generateCompositeImage(shelves) {
    const N = shelves.length;
    const SHELF_W = 580;   // szerokosc komórki z polka
    const SHELF_H = 780;   // wysokosc renderu — większe 3D
    const INFO_H = 260;    // kompaktowa sekcja parametrów
    const PAD = 16;
    const PRICE_BAR_H = 110;
    const W = N * SHELF_W + (N+1) * PAD;
    const H = SHELF_H + INFO_H + PRICE_BAR_H + PAD * 2;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Tlo
    ctx.fillStyle = '#f8f8f7';
    ctx.fillRect(0, 0, W, H);

    // Zaladuj obrazy
    const imgs = await Promise.all(shelves.map(s => new Promise((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s.snap;
    })));

    // Preload próbki z base64 (brak CORS dla data URI)
    const _swatchColors = ['#8B5A2B','#FFFFFF','#000000'];
    const _preloadedSwatches = {};
    await Promise.all(_swatchColors.map(h => new Promise(res => {
        const src = _SWATCH_B64[h];
        if (!src) return res();
        const img = new Image();
        img.onload = () => { _preloadedSwatches[h] = img; res(); };
        img.onerror = () => res();
        img.src = src;
    })));

    // Rysuj kazda polke
    shelves.forEach((shelf, idx) => {
        const x = PAD + idx * (SHELF_W + PAD);
        const y = PAD + 10;

        // Biale tlo karty polki
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
        ctx.beginPath(); ctx.roundRect(x, y, SHELF_W, SHELF_H + INFO_H, 14); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        // Render 3D
        ctx.drawImage(imgs[idx], x + 4, y + 4, SHELF_W - 8, SHELF_H - 8);

        // Maly numer polki
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(x + 10, y + 10, 32, 22, 6); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Arial,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('#'+(idx+1), x + 26, y + 25);
        ctx.textAlign = 'left';

        // Sekcja parametrow
        const infoY = y + SHELF_H;
        ctx.fillStyle = '#f9fafb';
        ctx.beginPath(); ctx.roundRect(x, infoY, SHELF_W, INFO_H, [0,0,14,14]); ctx.fill();
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, infoY); ctx.lineTo(x+SHELF_W, infoY); ctx.stroke();

        const d = shelf.details;
        const infoItems = [
            ['Rodzaj', d.shelfType],
            ['Wymiary', (d.width||d.totalWidth||'')+'×'+(d.height||'')+'×'+(d.depth||'')+' cm'],
            ['Kolor boków', d.sideColor, d.sideColorValue],
            ['Kolor półek', d.shelfColor, d.shelfColorValue],
        ].filter(([,v]) => v && !v.startsWith('undefined'));
        const mountText2 = (d.shelfType||'').toLowerCase().includes('wisz') ? 'Wisząca' :
                           (d.shelfType||'').toLowerCase().includes('stoj') ? 'Stojąca na blacie' : d.shelfType || '—';

        const colW2 = (SHELF_W - 28) / 2;
        const swatchSz = 48;
        const rowH = 68;

        // 2-column grid: Rodzaj | Wymiary, Kolor boków | Kolor półek
        infoItems.forEach(([label, value, colorHex], ii) => {
            const col = ii % 2, row = Math.floor(ii / 2);
            const ix = x + 14 + col * (colW2 + 14);
            const iy = infoY + 12 + row * rowH;

            // Label
            ctx.fillStyle = '#9ca3af'; ctx.font = '500 10px Arial,sans-serif';
            ctx.fillText(label.toUpperCase(), ix, iy);

            if (colorHex) {
                // Próbka + nazwa obok
                const h = (colorHex||'').toUpperCase();
                const swImg = _preloadedSwatches[h] || _preloadedSwatches[colorHex];
                const sy = iy + 6;
                ctx.save();
                ctx.beginPath(); ctx.roundRect(ix, sy, swatchSz, swatchSz, 4); ctx.clip();
                if (swImg) { ctx.drawImage(swImg, ix, sy, swatchSz, swatchSz); }
                else { ctx.fillStyle = colorHex||'#888'; ctx.fillRect(ix, sy, swatchSz, swatchSz); }
                ctx.restore();
                ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(ix, sy, swatchSz, swatchSz, 4); ctx.stroke();

                ctx.fillStyle = '#111827'; ctx.font = '500 15px Arial,sans-serif';
                let v = value||'—';
                const maxW = colW2 - swatchSz - 10;
                while (ctx.measureText(v).width > maxW && v.length > 4) v = v.slice(0,-2)+'…';
                ctx.fillText(v, ix + swatchSz + 8, iy + 26);
            } else {
                ctx.fillStyle = '#111827'; ctx.font = '500 14px Arial,sans-serif';
                let v = value||'—';
                while (ctx.measureText(v).width > colW2 - 8 && v.length > 4) v = v.slice(0,-2)+'…';
                ctx.fillText(v, ix, iy + 20);
            }
        });

        // Separator — po 2 wierszach parametrów
        const sepY = infoY + 12 + 2 * rowH + 4;
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 14, sepY); ctx.lineTo(x + SHELF_W - 14, sepY); ctx.stroke();

        // Montaż + Cena (inline, tylko jeśli wisząca)
        let curY = sepY + 14;
        const _stv = (d.shelfTypeValue||'').toLowerCase();
        // Montaż pokazuj tylko przy półce modułowej i na kubki
        const showMount = _stv === 'modular' || _stv === 'mug_shelf';
        const _mountVal = (d.raw?.mount || d.mountType || d.mount || '').toLowerCase();
        const isHanging = _mountVal.includes('hang') || _mountVal.includes('wisz');
        const isStanding = !isHanging;
        if (showMount) {
            ctx.fillStyle = '#9ca3af'; ctx.font = '500 10px Arial,sans-serif';
            ctx.fillText('MONTAŻ', x + 14, curY);
            const pillColor = isHanging ? '#dbeafe' : '#dcfce7';
            const pillTextColor = isHanging ? '#1d4ed8' : '#15803d';
            const pillLabel = isHanging ? 'Wisząca' : 'Stojąca na blacie';
            const pillW = isHanging ? 80 : 140;
            ctx.fillStyle = pillColor;
            ctx.beginPath(); ctx.roundRect(x + 14, curY + 4, pillW, 22, 11); ctx.fill();
            ctx.fillStyle = pillTextColor; ctx.font = '500 12px Arial,sans-serif';
            ctx.fillText(pillLabel, x + 24, curY + 19);
            curY += 34;
        }

        // Cena
        if (shelf.price) {
            const cX = x + SHELF_W - 14;
            ctx.fillStyle = '#9ca3af'; ctx.font = '500 10px Arial,sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('CENA', cX, sepY + 14);
            ctx.fillStyle = '#16a34a'; ctx.font = '500 15px Arial,sans-serif';
            ctx.fillText(shelf.price.total.toFixed(2) + ' zł', cX, sepY + 32);
            ctx.textAlign = 'left';
        }

        // Kod konfiguracyjny — szary blok poniżej montaż/cena
        const codeBoxY = sepY + 40;
        ctx.fillStyle = '#f9fafb';
        ctx.beginPath(); ctx.roundRect(x + 14, codeBoxY, SHELF_W - 28, 46, 6); ctx.fill();
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x + 14, codeBoxY, SHELF_W - 28, 46, 6); ctx.stroke();
        ctx.fillStyle = '#9ca3af'; ctx.font = '500 11px Arial,sans-serif';
        ctx.fillText('KOD KONFIGURACYJNY', x + 22, codeBoxY + 14);
        ctx.fillStyle = '#111827'; ctx.font = 'bold 16px "Courier New",monospace';
        let dCode = d.code || '—';
        while (ctx.measureText(dCode).width > SHELF_W - 44 && dCode.length > 8) dCode = dCode.slice(0,-2)+'…';
        ctx.fillText(dCode, x + 22, codeBoxY + 36);
    });

    // === KARTA CENY — jasna, jak na stronie ===
    const barY = PAD + 10 + SHELF_H + INFO_H + 16;

    // Oblicz laczna cene z rabatami (ta sama logika co koszyk)
    const prices = shelves.map(s => s.price ? s.price.total : 0).filter(p => p > 0);
    const subtotal = prices.reduce((a,b) => a+b, 0);
    let discount10 = 0, discount25 = 0;
    if (prices.length === 1) {
        discount10 = prices[0] * 0.10;
    } else if (prices.length >= 2) {
        const sorted = [...prices].sort((a,b) => b-a);
        discount10 = sorted[0] * 0.10;
        discount25 = sorted[sorted.length-1] * 0.25;
    }
    const totalDiscount = discount10 + discount25;
    const totalFinal = subtotal - totalDiscount;

    // Biale tlo karty
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.roundRect(PAD, barY, W - PAD*2, PRICE_BAR_H, 14); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

    // Delikatna ramka
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(PAD, barY, W - PAD*2, PRICE_BAR_H, 14); ctx.stroke();

    const col3W = (W - PAD*4) / 3;
    const barMid = barY + PRICE_BAR_H/2;
    const c1x = PAD*2 + 16;
    const c2x = PAD*2 + col3W + PAD + 16;
    const c3x = W - PAD*2 - col3W + 20;

    // Separatory pionowe
    ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c2x-20, barY+20); ctx.lineTo(c2x-20, barY+PRICE_BAR_H-20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c3x-20, barY+20); ctx.lineTo(c3x-20, barY+PRICE_BAR_H-20); ctx.stroke();

    // Kolumna 1: pusta

    // Kolumna 2: rabaty — tylko jesli sa
    if (totalDiscount > 0) {
        ctx.fillStyle = '#9ca3af'; ctx.font = '600 12px Arial,sans-serif';
        const discountStartY = discount10 > 0 && discount25 > 0 ? barMid - 20 : barMid - 8;
        ctx.fillText('RABATY', c2x, discountStartY - 14);
        if (discount10 > 0) {
            ctx.fillStyle = '#16a34a'; ctx.font = '500 14px Arial,sans-serif';
            ctx.fillText('✓  -'+discount10.toFixed(2)+' zł', c2x, discountStartY + 8);
        }
        if (discount25 > 0) {
            ctx.fillStyle = '#16a34a'; ctx.font = '500 14px Arial,sans-serif';
            ctx.fillText('✓  -'+discount25.toFixed(2)+' zł', c2x, discountStartY + (discount10>0 ? 32 : 8));
        }
    }

    // Kolumna 3: cena finalna
    ctx.fillStyle = '#9ca3af'; ctx.font = '600 12px Arial,sans-serif';
    ctx.fillText('ŁĄCZNIE DO ZAPŁATY', c3x, barMid - 18);
    // Przekreślona suma
    if (totalDiscount > 0) {
        ctx.fillStyle = '#d1d5db'; ctx.font = '500 17px Arial,sans-serif';
        ctx.fillText(subtotal.toFixed(2)+' zł', c3x, barMid + 2);
        const sw = ctx.measureText(subtotal.toFixed(2)+' zł').width;
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c3x, barMid-4); ctx.lineTo(c3x+sw, barMid-4); ctx.stroke();
        ctx.fillStyle = '#16a34a'; ctx.font = 'bold 34px Arial,sans-serif';
        ctx.fillText(totalFinal.toFixed(2)+' zł', c3x, barMid + 38);
    } else {
        ctx.fillStyle = '#111827'; ctx.font = 'bold 34px Arial,sans-serif';
        ctx.fillText(totalFinal.toFixed(2)+' zł', c3x, barMid + 18);
    }

    ctx.textAlign = 'left';

    return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', 0.95));
}

// 3D dimension arrows — wysokość przegródki kubkowej
function addMugShelfCompartmentHeightArrow(group, widthNum, width, depth, thickness, levelData) {
    const levelH = Math.max(0.01, levelData.top - levelData.bottom);
    if (levelH <= 0.01) return;
    const heightCm = Math.round(levelH * 100) / 10;
    const label = Number.isInteger(heightCm) ? heightCm + ' cm' : heightCm.toFixed(1) + ' cm';

    const zPos = depth / 2 + 0.015;
    // For 84cm: arrows go at right edge of the small compartments column, not full shelf edge
    let xPos;
    if (widthNum == 84) {
        const innerW = width - 2 * thickness;
        // Right edge of 3rd divider: -innerW/2 + 3*(1.25+thickness)
        xPos = (-innerW / 2 + 3 * (1.25 + thickness)) + 0.06;
    } else {
        xPos = width / 2 + 0.06;
    }
    const y1 = levelData.bottom;
    const y2 = levelData.top;
    const midY = (y1 + y2) / 2;

    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, depthTest: false });
    const T = 0.018;
    const capW = 0.13;
    const capT = 0.018;
    const ah = 0.09;

    const addBox = (name, geo, x, y, z) => {
        const m = new THREE.Mesh(geo, arrowMat);
        m.position.set(x, y, z);
        m.name = name;
        m.renderOrder = 999;
        group.add(m);
    };

    // Vertical bar
    addBox('mugHeightArrow_vLine', new THREE.BoxGeometry(T, levelH, T), xPos, midY, zPos);

    // Top cap
    addBox('mugHeightArrow_capTop', new THREE.BoxGeometry(capW, capT, capT), xPos, y2, zPos);
    // Bottom cap
    addBox('mugHeightArrow_capBot', new THREE.BoxGeometry(capW, capT, capT), xPos, y1, zPos);

    // Top arrowhead
    const coneGeo1 = new THREE.ConeGeometry(0.05, ah, 4);
    const cone1 = new THREE.Mesh(coneGeo1, arrowMat);
    cone1.rotation.z = 0; // point up
    cone1.position.set(xPos, y2 - ah / 2, zPos);
    cone1.name = 'mugHeightArrow_ah1';
    cone1.renderOrder = 999;
    group.add(cone1);

    // Bottom arrowhead
    const coneGeo2 = new THREE.ConeGeometry(0.05, ah, 4);
    const cone2 = new THREE.Mesh(coneGeo2, arrowMat);
    cone2.rotation.z = Math.PI; // point down
    cone2.position.set(xPos, y1 + ah / 2, zPos);
    cone2.name = 'mugHeightArrow_ah2';
    cone2.renderOrder = 999;
    group.add(cone2);

    // Label sprite
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(220,252,231,0.97)';
    ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.fill();
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.stroke();
    ctx.fillStyle = '#15803d'; ctx.font = 'bold 90px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 80);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(xPos + 0.75, midY, zPos + 0.02);
    sprite.scale.set(1.4, 0.44, 1);
    sprite.name = 'mugHeightArrow_label';
    sprite.renderOrder = 999;
    group.add(sprite);
}

// 3D dimension arrows — szerokość przegródki kubkowej
function addMugShelfCompartmentWidthArrow(group, widthNum, width, depth, thickness, bottomPanel, lowestInternalShelf) {
    // Calculate compartment width
    const innerWidth = width - 2 * thickness;
    let compartmentWidth;
    {
        if (widthNum == 84) {
            // 84cm: 3 dividers, fixed compartment width 12.5cm
            compartmentWidth = 1.25;
        } else {
            const numDividers = (widthNum == 60) ? 3 : ((widthNum == 44) ? 2 : 0);
            if (numDividers === 0) return;
            const dividerSpacing = innerWidth / (numDividers + 1);
            compartmentWidth = dividerSpacing - thickness;
        }
    }
    const x1 = -innerWidth / 2;
    const x2 = x1 + compartmentWidth;
    const midX = (x1 + x2) / 2;

    const compartmentWidthCm = Math.round(compartmentWidth * 10 * 10) / 10;
    const label = Number.isInteger(compartmentWidthCm) ? compartmentWidthCm + ' cm' : compartmentWidthCm.toFixed(1) + ' cm';

    // Place arrow inside the bottom compartment, slightly in front of the front face
    const zPos = depth / 2 + 0.015;
    const bottomY = bottomPanel ? bottomPanel.position.y + thickness / 2 : -width / 2 + thickness;
    const topY = lowestInternalShelf ? lowestInternalShelf.position.y - thickness / 2 : bottomY + 0.5;
    const yPos = bottomY + (topY - bottomY) * 0.22;

    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, depthTest: false });
    const T = 0.018; // bar thickness
    const capH = 0.13;
    const capT = 0.018;

    const addBox = (name, geo, x, y, z) => {
        const m = new THREE.Mesh(geo, arrowMat);
        m.position.set(x, y, z);
        m.name = name;
        m.renderOrder = 999;
        group.add(m);
    };

    // Main horizontal bar
    addBox('mugWidthArrow_hLine', new THREE.BoxGeometry(compartmentWidth, T, T), midX, yPos, zPos);

    // Left vertical cap
    addBox('mugWidthArrow_cap1', new THREE.BoxGeometry(capT, capH, capT), x1, yPos, zPos);

    // Right vertical cap
    addBox('mugWidthArrow_cap2', new THREE.BoxGeometry(capT, capH, capT), x2, yPos, zPos);

    // Left arrowhead (triangle via cone)
    const ah = 0.09;
    const coneGeo1 = new THREE.ConeGeometry(0.05, ah, 4);
    const cone1 = new THREE.Mesh(coneGeo1, arrowMat);
    cone1.rotation.z = Math.PI / 2; // point left
    cone1.position.set(x1 + ah / 2, yPos, zPos);
    cone1.name = 'mugWidthArrow_ah1';
    cone1.renderOrder = 999;
    group.add(cone1);

    const coneGeo2 = new THREE.ConeGeometry(0.05, ah, 4);
    const cone2 = new THREE.Mesh(coneGeo2, arrowMat);
    cone2.rotation.z = -Math.PI / 2; // point right
    cone2.position.set(x2 - ah / 2, yPos, zPos);
    cone2.name = 'mugWidthArrow_ah2';
    cone2.renderOrder = 999;
    group.add(cone2);

    // Label sprite
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(220,252,231,0.97)';
    ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.fill();
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.stroke();
    ctx.fillStyle = '#15803d'; ctx.font = 'bold 90px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 80);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(midX, yPos + 0.3, zPos + 0.02);
    sprite.scale.set(1.4, 0.44, 1);
    sprite.name = 'mugWidthArrow_label';
    sprite.renderOrder = 999;
    group.add(sprite);
}


function addModularDimensionArrows(mainGroup) {
    if (!mainGroup) return;
    const thickness = 0.18;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x16a34a, linewidth: 2 });

    function makeLabel(text, x, y, z, scaleX) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(220,252,231,0.97)';
        ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.fill();
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.stroke();
        ctx.fillStyle = '#15803d'; ctx.font = 'bold 90px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 80);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(x, y, z);
        sprite.scale.set(scaleX || 1.6, 0.5, 1);
        sprite.name = 'dimensionLabel_modular_' + text.replace(' ','_');
        sprite.renderOrder = 999;
        mainGroup.add(sprite);
    }

    function addVerticalArrow(y1, y2, xPos, zPos, labelX) {
        const lineLen = 0.18;
        const as = 0.10;
        const _customActive = (typeof customShelfPositionEnabled !== 'undefined' && customShelfPositionEnabled);
        let rawCm;
        if (_customActive) {
            rawCm = Math.round((y2 - y1) * 10);
        } else {
            // Uzyj wartosci nominalnych zamiast obliczania z pozycji 3D (unika bledow zaokraglenia)
            const _modH = (typeof moduleHeightSelect !== 'undefined' && moduleHeightSelect)
                ? parseInt(moduleHeightSelect.value) : 0;
            rawCm = (_modH === 40) ? 10.9 : 12.7;
        }
        if (rawCm <= 0) return;
        const label = rawCm + ' cm';
        const midY = (y1 + y2) / 2;
        mainGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xPos, y1, zPos), new THREE.Vector3(xPos, y2, zPos)]), lineMat));
        mainGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xPos-lineLen/2,y1,zPos), new THREE.Vector3(xPos+lineLen/2,y1,zPos)]), lineMat));
        mainGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xPos-lineLen/2,y2,zPos), new THREE.Vector3(xPos+lineLen/2,y2,zPos)]), lineMat));
        mainGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xPos-as/2,y2-as,zPos), new THREE.Vector3(xPos,y2,zPos), new THREE.Vector3(xPos+as/2,y2-as,zPos)]), lineMat));
        mainGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xPos-as/2,y1+as,zPos), new THREE.Vector3(xPos,y1,zPos), new THREE.Vector3(xPos+as/2,y1+as,zPos)]), lineMat));
        makeLabel(label, labelX, midY, zPos + 0.05);
    }

    ['leftModule','rightModule'].forEach(modName => {
        const mod = mainGroup.getObjectByName(modName);
        if (!mod) return;
        const shelves = mod.children.filter(ch => ch.name && ch.name.startsWith('internalShelf_'))
                          .sort((a,b) => a.position.y - b.position.y);
        const topPanel = mod.getObjectByName('topPanel');
        const bottomPanel = mod.getObjectByName('bottomPanel');
        if (shelves.length === 0) return;

        const leftSide = mod.getObjectByName('leftSide');
        const rightSide = mod.getObjectByName('rightSide');
        const modWidth = (leftSide && rightSide)
            ? Math.abs(rightSide.position.x - leftSide.position.x) + thickness
            : 0.44;
        const sideObj = leftSide || mod.children.find(ch => ch.isMesh);
        const depth = sideObj ? (sideObj.geometry.parameters.depth || 0.1) : 0.1;

        const modX = mod.position.x;
        const xPos = modX - modWidth/2 + thickness + 0.06;
        const labelX = modX;
        const zPos = depth/2 + 0.01;

        const bottomY = bottomPanel ? bottomPanel.position.y + thickness/2 : -modWidth/2;
        const topY    = topPanel    ? topPanel.position.y    - thickness/2 :  modWidth/2;

        const levels = [];
        levels.push({ y1: bottomY, y2: shelves[0].position.y - thickness/2 });
        for (let i = 0; i < shelves.length-1; i++) {
            levels.push({ y1: shelves[i].position.y + thickness/2, y2: shelves[i+1].position.y - thickness/2 });
        }
        levels.push({ y1: shelves[shelves.length-1].position.y + thickness/2, y2: topY });
        levels.forEach(lvl => addVerticalArrow(lvl.y1, lvl.y2, xPos, zPos, labelX));
    });
}

function addShelfDimensionArrows(group, internalShelves, bottomPanel, topPanel, thickness, width, height, depth) {
    const sorted = [...internalShelves].sort((a, b) => a.position.y - b.position.y);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x16a34a, linewidth: 2 });
    const xPos = width / 2 - thickness;
    const zPos = depth ? depth / 2 + 0.01 : 0.01;

    // Wykryj czy to wzór niestandardowy (isCustomLayout): krótsze półki mają position.x !== 0
    // Dla zwykłych półek wszystkie są wycentrowane na x=0.
    const _xTol = 0.01;
    const hasOffsetShelves = sorted.some(s => Math.abs(s.position.x) > _xTol);

    let activeSorted;
    if (hasOffsetShelves) {
        // Wzór niestandardowy — filtruj tylko półki sięgające prawej krawędzi
        const _rightTol = 0.05;
        const rightSorted = sorted.filter(s => {
            if (!s.geometry || !s.geometry.parameters) return true;
            const geomW = s.geometry.parameters.width;
            const actualW = geomW * (s.scale ? s.scale.x : 1);
            const rightEdge = s.position.x + actualW / 2;
            return rightEdge >= xPos - _rightTol;
        });
        activeSorted = rightSorted.length > 0 ? rightSorted : sorted;
    } else {
        // Zwykłe półki — wszystkie półki są pełnowymiarowe, użyj wszystkich
        activeSorted = sorted;
    }

    const levels = [];
    const bottomY = bottomPanel ? bottomPanel.position.y + thickness / 2 : -height / 2;
    const topY = topPanel ? topPanel.position.y - thickness / 2 : height / 2;
    if (activeSorted.length === 0) {
        levels.push({ y1: bottomY, y2: topY });
    } else {
        levels.push({ y1: bottomY, y2: activeSorted[0].position.y - thickness / 2 });
        for (let i = 0; i < activeSorted.length - 1; i++) {
            levels.push({ y1: activeSorted[i].position.y + thickness / 2, y2: activeSorted[i + 1].position.y - thickness / 2 });
        }
        levels.push({ y1: activeSorted[activeSorted.length - 1].position.y + thickness / 2, y2: topY });
    }

    levels.forEach((lvl, idx) => {
        const gapCm = Math.round((lvl.y2 - lvl.y1) * 100) / 10;
        if (gapCm <= 0) return;
        const gapLabel = (Number.isInteger(gapCm) ? gapCm : gapCm.toFixed(1)) + ' cm';
        const midY = (lvl.y1 + lvl.y2) / 2;
        const lineLen = 0.18;

        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos, lvl.y1, zPos), new THREE.Vector3(xPos, lvl.y2, zPos)]), lineMat));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos - lineLen/2, lvl.y1, zPos), new THREE.Vector3(xPos + lineLen/2, lvl.y1, zPos)]), lineMat));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos - lineLen/2, lvl.y2, zPos), new THREE.Vector3(xPos + lineLen/2, lvl.y2, zPos)]), lineMat));

        const as = 0.10;
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos-as/2,lvl.y2-as,zPos), new THREE.Vector3(xPos,lvl.y2,zPos), new THREE.Vector3(xPos+as/2,lvl.y2-as,zPos)]), lineMat));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos-as/2,lvl.y1+as,zPos), new THREE.Vector3(xPos,lvl.y1,zPos), new THREE.Vector3(xPos+as/2,lvl.y1+as,zPos)]), lineMat));

        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(220,252,231,0.97)';
        ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.fill();
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.roundRect(6, 10, 500, 140, 24); ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 90px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(gapLabel, 256, 80);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(xPos - 0.6, midY, zPos + 0.05);
        sprite.scale.set(1.6, 0.5, 1);
        sprite.name = 'dimensionLabel_' + idx;
        group.add(sprite);
    });
}
    

// ---- DESKTOP: lewy drag pionowy = przesunięcie półki, poziomy = obrót ----
(function() {
    let _pt0 = null;
    let _shelfY0 = null;
    let _isVertical = null;
    let _pointerId = null;
    const LOCK_THRESHOLD = 6;

    function onPointerDown(e) {
        if (window.innerWidth < 768) return;
        if (!shelfGroup || dragModeActive) return;
        if (e.button !== 0) return;
        _pt0 = { x: e.clientX, y: e.clientY };
        _shelfY0 = shelfGroup.position.y;
        _isVertical = null;
        _pointerId = e.pointerId;
    }
    function onPointerMove(e) {
        if (!_pt0 || !shelfGroup || dragModeActive) return;
        if (e.pointerId !== _pointerId) return;
        const dx = e.clientX - _pt0.x;
        const dy = e.clientY - _pt0.y;
        if (_isVertical === null) {
            if (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD) {
                _isVertical = Math.abs(dy) > Math.abs(dx);
                if (_isVertical) {
                    // Przejmij pointer i wyłącz OrbitControls
                    try { e.target.setPointerCapture(_pointerId); } catch(ex) {}
                    controls.enabled = false;
                }
            }
            return;
        }
        if (!_isVertical) return;
        e.stopPropagation();
        const canvasH = renderer ? renderer.domElement.clientHeight : 500;
        const sensitivity = 14 / canvasH;
        const _shelfH = (heightSelect ? parseFloat(heightSelect.value) || 60 : 60) / 10;
        const _dragLimit = _shelfH * 0.55;
        shelfGroup.position.y = Math.max(-_dragLimit, Math.min(_dragLimit, _shelfY0 - dy * sensitivity));
    }
    function onPointerUp(e) {
        if (e.pointerId !== _pointerId) return;
        if (_isVertical) controls.enabled = true;
        _pt0 = null; _shelfY0 = null; _isVertical = null; _pointerId = null;
    }

    function attachDesktopPan() {
        const canvas = renderer && renderer.domElement;
        if (!canvas) { setTimeout(attachDesktopPan, 500); return; }
        // capture phase = przed OrbitControls
        canvas.addEventListener('pointerdown', onPointerDown, true);
        canvas.addEventListener('pointermove', onPointerMove, true);
        canvas.addEventListener('pointerup', onPointerUp, true);
        canvas.addEventListener('pointercancel', onPointerUp, true);
    }
    window.addEventListener('load', () => setTimeout(attachDesktopPan, 800));
})();

// ---- MOBILE: pionowy swipe = obniżanie/podwyższanie półki ----
(function() {
    let _vt0 = null;    // startY dotyku
    let _vy0 = null;    // startowa pozycja shelfGroup.position.y
    let _isVertical = null; // null=nie ustalono, true=pionowy, false=poziomy (OrbitControls)
    const LOCK_THRESHOLD = 8; // px — po przekroczeniu blokujemy kierunek

    function onTouchStart(e) {
        if (window.innerWidth >= 768) return;
        if (!shelfGroup || dragModeActive) return;
        if (e.touches.length !== 1) return;
        _vt0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        _vy0 = shelfGroup.position.y;
        _isVertical = null;
    }

    function onTouchMove(e) {
        if (window.innerWidth >= 768) return;
        if (!shelfGroup || dragModeActive) return;
        if (e.touches.length !== 1 || _vt0 === null) return;

        const dx = e.touches[0].clientX - _vt0.x;
        const dy = e.touches[0].clientY - _vt0.y;

        // Ustal kierunek po przekroczeniu progu
        if (_isVertical === null) {
            if (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD) {
                _isVertical = Math.abs(dy) > Math.abs(dx);
            }
            return;
        }

        if (!_isVertical) return; // poziomy — oddaj OrbitControls

        e.preventDefault(); // blokuj scroll przeglądarki
        e.stopPropagation();

        // Przelicz piksele na jednostki 3D — 1px ≈ 0.015 jednostki przy obecnym zoom
        const canvasH = renderer ? renderer.domElement.clientHeight : 400;
        const sensitivity = 12 / canvasH; // 12 jednostek na pełną wysokość canvasa
        const _shelfH = (heightSelect ? parseFloat(heightSelect.value) || 60 : 60) / 10;
        const _dragLimit = _shelfH * 0.55;
        shelfGroup.position.y = Math.max(-_dragLimit, Math.min(_dragLimit, _vy0 - dy * sensitivity));
    }

    function onTouchEnd() {
        _vt0 = null;
        _vy0 = null;
        _isVertical = null;
    }

    // Podepnij po inicjalizacji renderera
    function attachVerticalTouch() {
        const canvas = renderer && renderer.domElement;
        if (!canvas) { setTimeout(attachVerticalTouch, 500); return; }
        // capture phase = przed OrbitControls
        canvas.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    }
    // Czekaj na init3D
    window.addEventListener('load', () => setTimeout(attachVerticalTouch, 800));
})();

