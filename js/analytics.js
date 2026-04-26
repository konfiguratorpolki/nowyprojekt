/* ===== ŚLEDZENIE GA4 – FUNNEL KONFIGURACJI ===== */
(function() {

    function getDevice() {
        var ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
        if (/Android/.test(ua)) return 'Android';
        return window.innerWidth < 768 ? 'mobile_inne' : 'desktop';
    }

    function sendGA4(eventName, params) {
        if (typeof gtag !== 'function') return;
        params = params || {};
        params.urzadzenie = getDevice();
        params.czas_od_startu_s = Math.round(performance.now() / 1000);
        gtag('event', eventName, params);
    }

    var ukonczone = {};
    function krokJesliNowy(krok, params) {
        if (ukonczone[krok]) return;
        ukonczone[krok] = true;
        params = params || {};
        params.krok = krok;
        sendGA4('konfiguracja_krok', params);
    }

    var krokoweSelecty = {
        'shelfType'           : 'typ_polki',
        'width'               : 'szerokosc',
        'height'              : 'wysokosc',
        'depth'               : 'glebokosc',
        'shelfCount'          : 'liczba_polek',
        'sideColor'           : 'kolor_bokow',
        'shelfColor'          : 'kolor_polek',
        'moduleWidth'         : 'szerokosc_modulu',
        'moduleHeight'        : 'wysokosc_modulu',
        'connectingShelfWidth': 'szerokosc_lacznika'
    };

    window.addEventListener('load', function() {

        /* 1. KROKI KONFIGURACJI */
        Object.keys(krokoweSelecty).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', function() {
                var wartosc = this.options ? (this.options[this.selectedIndex] ? this.options[this.selectedIndex].text : this.value) : this.value;
                krokJesliNowy(krokoweSelecty[id], { wartosc: wartosc });
                sendGA4('zmiana_opcji', { pole: krokoweSelecty[id], wartosc: wartosc });
            });
        });

        /* 2. SLIDER SZEROKOŚCI CUSTOM */
        var customW = document.getElementById('customWidthInput');
        if (customW) {
            var customWTimer;
            customW.addEventListener('input', function() {
                clearTimeout(customWTimer);
                var val = this.value;
                customWTimer = setTimeout(function() {
                    krokJesliNowy('szerokosc_custom', { wartosc: val + ' cm' });
                    sendGA4('zmiana_opcji', { pole: 'szerokosc_custom', wartosc: val + ' cm' });
                }, 600);
            });
        }

        /* 3. CHECKBOXY */
        ['dividersTop','dividersMiddle','dividersBottom','noTopShelf','noBottomShelf'].forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', function() {
                sendGA4('zmiana_opcji', { pole: id, wartosc: this.checked ? 'wlaczona' : 'wylaczona' });
            });
        });

        /* 4. STICKY BAR */
        var bar = document.getElementById('stickyFooterBar');
        if (bar) {
            bar.querySelectorAll('button').forEach(function(btn) {
                var span = btn.querySelector('span');
                var label = span ? span.textContent.trim() : (btn.id || 'nieznany');
                btn.addEventListener('click', function() {
                    var mapa = {
                        'Wymiary'  : 'klik_wymiary',
                        'Kolory'   : 'klik_kolory',
                        'P\u00f3\u0142ki': 'klik_polki',
                        'Zobacz 3D': 'klik_zobacz_3d',
                        'Koszyk'   : 'klik_koszyk'
                    };
                    var eventName = mapa[label] || 'klik_nawigacja';
                    sendGA4(eventName, { button_label: label });
                    if (label === 'Zobacz 3D') krokJesliNowy('otworzyl_3d', {});
                });
            });
        }

        /* 5. DODAJ DO KOSZYKA */
        var addBtn = document.getElementById('addToCartBtn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                sendGA4('klik_dodaj_do_koszyka', { button_label: 'Dodaj do koszyka' });
            });
        }

        /* 6. WIDOCZNOŚĆ PRZYCISKU KOSZYKA */
        if (addBtn && 'IntersectionObserver' in window) {
            var widocznyWyslany = false;
            var obsKoszyk = new IntersectionObserver(function(entries) {
                entries.forEach(function(e) {
                    if (e.isIntersecting && !widocznyWyslany) {
                        widocznyWyslany = true;
                        sendGA4('widoczny_przycisk_koszyka', { button_label: 'Dodaj do koszyka' });
                        obsKoszyk.disconnect();
                    }
                });
            }, { threshold: 0.5 });
            obsKoszyk.observe(addBtn);
        }

        /* 7. SCROLL DEPTH */
        var progiScroll = [25, 50, 75, 90];
        var wyslaneProgi = {};
        window.addEventListener('scroll', function() {
            var scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
            progiScroll.forEach(function(prog) {
                if (!wyslaneProgi[prog] && scrolled >= prog) {
                    wyslaneProgi[prog] = true;
                    sendGA4('scroll_glebokosc', { procent: prog });
                }
            });
        }, { passive: true });

        /* 8. CZAS NA STRONIE */
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                sendGA4('czas_na_stronie', {
                    sekundy: Math.round(performance.now() / 1000),
                    ukonczone_kroki: Object.keys(ukonczone).join(',') || 'brak'
                });
            }
        });

        /* 9. FRUSTRACJA MOBILE */
        var dotyknieciaMap = {};
        document.querySelectorAll('select, input[type="range"]').forEach(function(el) {
            if (!el.id) return;
            dotyknieciaMap[el.id] = 0;
            el.addEventListener('touchstart', function() {
                dotyknieciaMap[el.id] = (dotyknieciaMap[el.id] || 0) + 1;
            }, { passive: true });
            el.addEventListener('change', function() {
                if (dotyknieciaMap[el.id] >= 4) {
                    sendGA4('frustracja_mobile', { pole: el.id, dotkniec: dotyknieciaMap[el.id] });
                }
                dotyknieciaMap[el.id] = 0;
            });
        });

        /* 10. PRZYCISKI IKONKI – ŚLEDZENIE KLIKNIĘĆ */
        var przyciskiIkonki = [
            /* panel koszyka */
            { id: 'cartPanelCloseBtn',         event: 'klik_zamknij_koszyk' },
            { id: 'cartCheckoutButton',         event: 'klik_przejdz_do_zamowienia' },
            { id: 'mobileCartButton',           event: 'klik_ikona_koszyka_mobile' },
            { id: 'copyAllCodesBtn',            event: 'klik_kopiuj_kody' },
            { id: 'downloadCartSummaryBtn',     event: 'klik_pobierz_podsumowanie' },
            { id: 'cartSummaryGoToAllegroBtn',  event: 'klik_przejdz_allegro' },
            { id: 'scrollToCodesBtn',           event: 'klik_scroll_do_kodow' },
            /* podgląd 3D */
            { id: 'show3dButton',               event: 'klik_zobacz_3d' },
            { id: 'collapse3dPanelButton',      event: 'klik_zwij_3d' },
            { id: 'topBarCollapse',             event: 'klik_zwij_3d_topbar' },
            { id: 'topBarDalej',                event: 'klik_dalej_3d_topbar' },
            { id: 'rotateToggleMobile',         event: 'klik_obrót_toggle' },
            /* zdjęcia / lightbox */
            { id: 'lightboxClose',              event: 'klik_zamknij_lightbox' },
            /* przegrody mobile */
            { id: 'addTopDividerBtn',           event: 'klik_przegroda_gora' },
            { id: 'addMiddleDividerBtn',        event: 'klik_przegroda_srodek' },
            { id: 'addBottomDividerBtn',        event: 'klik_przegroda_dol' },
            { id: 'dividerFabBtn',              event: 'klik_fab_przegrody' },
            { id: 'mountFabBtn',                event: 'klik_fab_montaz' },
            /* montaż mobile */
            { id: 'mobileMountHangingStripBtn', event: 'klik_montaz_wiszaca' },
            { id: 'mobileMountStandingStripBtn',event: 'klik_montaz_stojaca' },
            /* modularny mobile */
            { id: 'mobileModularStandingBtn',   event: 'klik_modularny_stojacy' },
            { id: 'mobileModularHangingBtn',    event: 'klik_modularny_wiszacy' },
            { id: 'mobileModularNoTopBtn',      event: 'klik_modularny_bez_gory' },
            { id: 'mobileModularNoBottomBtn',   event: 'klik_modularny_bez_dolu' },
            /* eksport / wydruk */
            { id: 'printVisualDetailsBtn',      event: 'klik_drukuj' },
            { id: 'downloadAllegroJpgBtn',      event: 'klik_pobierz_jpg_allegro' },
            { id: 'batchCompositeBtn',          event: 'klik_eksport_zbiorczy' },
            /* panel parametrów mobile */
            { id: 'topBarParams',               event: 'klik_params_drawer_toggle' },
            /* pozycje niestandardowe */
            { id: 'visualDetailsModalCloseBtn', event: 'klik_zamknij_modal_wizualizacja' },
            { id: 'cartSummaryModalCloseBtnTop',event: 'klik_zamknij_modal_koszyk' }
        ];

        przyciskiIkonki.forEach(function(cfg) {
            var el = document.getElementById(cfg.id);
            if (!el) return;
            el.addEventListener('click', function() {
                sendGA4(cfg.event, { przycisk: cfg.id });
            });
        });

        /* 11. PRZYCISKI GALERII (strzałki) */
        document.querySelectorAll('.gallery-arrow').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var kierunek = btn.classList.contains('gallery-prev-arrow') ? 'poprzednie' : 'nastepne';
                sendGA4('klik_galeria_strzalka', { kierunek: kierunek });
            });
        });

        /* 12. ZAKŁADKI GALERII */
        document.querySelectorAll('#galleryTabsContainer [data-tab], #galleryTabsContainer button').forEach(function(tab) {
            tab.addEventListener('click', function() {
                sendGA4('klik_galeria_zakladka', { zakladka: tab.textContent.trim() || tab.dataset.tab || 'nieznana' });
            });
        });

        /* 13. PRZYCISKI +/- ILOŚCI W KOSZYKU */
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('increaseQuantity') !== -1) {
                sendGA4('klik_zwieksz_ilosc', {});
            }
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('decreaseQuantity') !== -1) {
                sendGA4('klik_zmniejsz_ilosc', {});
            }
            if (btn.classList.contains('cart-item-remove')) {
                sendGA4('klik_usun_z_koszyka', {});
            }
        });

    });
})();
/* ===== KONIEC ŚLEDZENIA GA4 ===== */


/* ===== ŚLEDZENIE GA4 – ROZSZERZONE ===== */
(function() {

    /* ── pomocnicze (sendGA4 i getDevice zdefiniowane wyżej w IIFE,
          tutaj tworzymy lokalne kopie żeby działały niezależnie) ── */
    function getDevice() {
        var ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
        if (/Android/.test(ua)) return 'Android';
        return window.innerWidth < 768 ? 'mobile_inne' : 'desktop';
    }
    function track(eventName, params) {
        if (typeof gtag !== 'function') return;
        params = params || {};
        params.urzadzenie = getDevice();
        params.czas_s = Math.round(performance.now() / 1000);
        gtag('event', eventName, params);
    }

    /* ─────────────────────────────────────────────────
       A. CZAS MIĘDZY KROKAMI KONFIGURACJI
    ───────────────────────────────────────────────── */
    var _czasKrokow = {};
    var _kolejnoscKrokow = [];
    function zapiszCzasKroku(krok) {
        var teraz = performance.now();
        _czasKrokow[krok] = teraz;
        _kolejnoscKrokow.push(krok);
        if (_kolejnoscKrokow.length >= 2) {
            var poprzedni = _kolejnoscKrokow[_kolejnoscKrokow.length - 2];
            var roznica = Math.round((teraz - (_czasKrokow[poprzedni] || teraz)) / 1000);
            track('czas_miedzy_krokami', {
                od: poprzedni,
                do: krok,
                sekundy: roznica
            });
        }
    }

    /* ─────────────────────────────────────────────────
       B. POWROTY DO POPRZEDNICH KROKÓW
    ───────────────────────────────────────────────── */
    var _wybrane = {};
    var _liczbaZmian = 0;
    function sledźZmiane(pole, wartosc) {
        _liczbaZmian++;
        if (_wybrane[pole] && _wybrane[pole] !== wartosc) {
            track('powrot_do_kroku', { pole: pole, stara: _wybrane[pole], nowa: wartosc, nr_zmiany: _liczbaZmian });
        }
        _wybrane[pole] = wartosc;
        zapiszCzasKroku(pole);
    }

    /* ─────────────────────────────────────────────────
       C. LICZBA WSZYSTKICH ZMIAN PRZED KOSZYKIEM
    ───────────────────────────────────────────────── */
    var _addBtn = document.getElementById('addToCartBtn');
    if (_addBtn) {
        _addBtn.addEventListener('click', function() {
            track('konfiguracja_liczba_zmian', { ilosc_zmian: _liczbaZmian });
        });
    }

    /* Nasłuch zmian selectów */
    window.addEventListener('load', function() {
        var pola = ['shelfType','width','height','depth','shelfCount','sideColor','shelfColor','moduleWidth','moduleHeight','connectingShelfWidth'];
        pola.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', function() {
                var wartosc = this.options && this.options[this.selectedIndex] ? this.options[this.selectedIndex].text : this.value;
                sledźZmiane(id, wartosc);
            });
        });

        /* ─────────────────────────────────────────────────
           D. OBRÓT MODELU 3D – czy ktoś w ogóle obraca
        ───────────────────────────────────────────────── */
        var canvas3d = document.getElementById('threeJsCanvasWrapper');
        if (canvas3d) {
            var obrocono = false;
            var obrotTimer;
            function onObrot() {
                if (!obrocono) {
                    obrocono = true;
                    track('obrot_3d_pierwszy', {});
                }
                clearTimeout(obrotTimer);
                obrotTimer = setTimeout(function() {
                    track('obrot_3d_aktywny', {});
                    obrotTimer = null;
                }, 2000);
            }
            canvas3d.addEventListener('mousemove', function(e) {
                if (e.buttons === 1) onObrot();
            });
            canvas3d.addEventListener('touchmove', function() {
                onObrot();
            }, { passive: true });
        }

        /* ─────────────────────────────────────────────────
           E. CZAS SPĘDZONY NA PANELU 3D
        ───────────────────────────────────────────────── */
        var _czas3dStart = null;
        var _show3d = document.getElementById('show3dButton');
        var _collapse3d = document.getElementById('collapse3dPanelButton');
        var _collapseTop = document.getElementById('topBarCollapse');
        if (_show3d) {
            _show3d.addEventListener('click', function() {
                _czas3dStart = performance.now();
            });
        }
        function zamknij3d() {
            if (_czas3dStart !== null) {
                var sek = Math.round((performance.now() - _czas3dStart) / 1000);
                track('czas_na_panelu_3d', { sekundy: sek });
                _czas3dStart = null;
            }
        }
        if (_collapse3d) _collapse3d.addEventListener('click', zamknij3d);
        if (_collapseTop) _collapseTop.addEventListener('click', zamknij3d);

        /* ─────────────────────────────────────────────────
           F. DRAG & DROP PÓŁEK – czy ktoś używa
        ───────────────────────────────────────────────── */
        var _dragBtns = document.querySelectorAll('.sp-edit-btn, .drag-btn-done, .drag-btn-reset');
        _dragBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var akcja = btn.classList.contains('drag-btn-done') ? 'zatwierdz'
                          : btn.classList.contains('drag-btn-reset') ? 'resetuj'
                          : 'edytuj';
                track('drag_drop_polek', { akcja: akcja });
            });
        });

        /* ─────────────────────────────────────────────────
           G. PORZUCONY KOSZYK
        ───────────────────────────────────────────────── */
        var _koszyk_dodano = false;
        var _zamowiono = false;
        var _addBtnG = document.getElementById('addToCartBtn');
        var _checkoutBtn = document.getElementById('cartCheckoutButton');
        if (_addBtnG) {
            _addBtnG.addEventListener('click', function() { _koszyk_dodano = true; });
        }
        if (_checkoutBtn) {
            _checkoutBtn.addEventListener('click', function() { _zamowiono = true; });
        }
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden' && _koszyk_dodano && !_zamowiono) {
                var koszykEl = document.getElementById('cartTotalPrice');
                var cena = koszykEl ? koszykEl.textContent.trim() : 'nieznana';
                track('porzucony_koszyk', { cena_laczna: cena });
            }
        });

        /* ─────────────────────────────────────────────────
           H. LICZBA PRODUKTÓW PRZY ZAMÓWIENIU
        ───────────────────────────────────────────────── */
        if (_checkoutBtn) {
            _checkoutBtn.addEventListener('click', function() {
                var badges = document.querySelectorAll('.cart-badge, #cartBadge');
                var ile = badges.length > 0 ? parseInt(badges[0].textContent) || 1 : 1;
                var cena = document.getElementById('cartTotalPrice') ? document.getElementById('cartTotalPrice').textContent.trim() : '';
                track('zamowienie_kliknięcie', { ilosc_produktow: ile, cena_laczna: cena });
            });
        }

        /* ─────────────────────────────────────────────────
           I. KOD ZAMÓWIENIA – popularne konfiguracje
        ───────────────────────────────────────────────── */
        var _addBtnI = document.getElementById('addToCartBtn');
        if (_addBtnI) {
            _addBtnI.addEventListener('click', function() {
                if (typeof generateOrderCode === 'function') {
                    var kod = generateOrderCode();
                    if (kod) track('kod_zamowienia', { kod: kod });
                }
            });
        }

        /* ─────────────────────────────────────────────────
           J. PRÓBA DODANIA Z NIEKOMPLETNĄ KONFIGURACJĄ
        ───────────────────────────────────────────────── */
        var _origAlert = window.alert;
        window.alert = function(msg) {
            if (msg && msg.indexOf('dokończ konfigurację') !== -1) {
                track('blad_niekompletna_konfiguracja', { komunikat: msg.substring(0, 80) });
            }
            return _origAlert.apply(this, arguments);
        };

        /* ─────────────────────────────────────────────────
           K. LIGHTBOX – które zdjęcie otwarto
        ───────────────────────────────────────────────── */
        document.querySelectorAll('.gallery-zoom-btn, [onclick*="openLightbox"], .zoom-btn').forEach(function(btn, idx) {
            btn.addEventListener('click', function() {
                var src = btn.dataset.src || btn.getAttribute('onclick') || ('zdjecie_' + idx);
                var nazwa = src.split('/').pop().split('?')[0].substring(0, 60);
                track('lightbox_otwarty', { zdjecie: nazwa, numer: idx });
            });
        });

        /* ─────────────────────────────────────────────────
           L. PRÓBKI MATERIAŁÓW – czy ktoś otwiera
        ───────────────────────────────────────────────── */
        var probki = document.getElementById('materialSamplesDetails');
        if (probki) {
            probki.addEventListener('toggle', function() {
                track('probki_materialow', { akcja: probki.open ? 'otwarto' : 'zamknieto' });
            });
        }

        /* ─────────────────────────────────────────────────
           M. ORIENTACJA EKRANU (mobile)
        ───────────────────────────────────────────────── */
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                var orient = (window.innerWidth > window.innerHeight) ? 'pozioma' : 'pionowa';
                track('zmiana_orientacji', { orientacja: orient });
            }, 300);
        });

        /* ─────────────────────────────────────────────────
           N. PINCH-TO-ZOOM na modelu 3D
        ───────────────────────────────────────────────── */
        var canvas3dPinch = document.getElementById('threeJsCanvasWrapper');
        if (canvas3dPinch) {
            var _pinchStart = null;
            canvas3dPinch.addEventListener('touchstart', function(e) {
                if (e.touches.length === 2) {
                    var dx = e.touches[0].clientX - e.touches[1].clientX;
                    var dy = e.touches[0].clientY - e.touches[1].clientY;
                    _pinchStart = Math.sqrt(dx*dx + dy*dy);
                }
            }, { passive: true });
            canvas3dPinch.addEventListener('touchend', function(e) {
                if (_pinchStart !== null) {
                    track('pinch_zoom_3d', {});
                    _pinchStart = null;
                }
            }, { passive: true });
        }

        /* ─────────────────────────────────────────────────
           O. KLIKNIĘCIE W TŁO MODALA (szukanie przycisku X)
        ───────────────────────────────────────────────── */
        ['batchExportOverlay','imageLightbox','cartSummaryModalOverlay'].forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', function(e) {
                if (e.target === el) {
                    track('zamkniecie_modalu_tlem', { modal: id });
                }
            });
        });

        /* ─────────────────────────────────────────────────
           P. CZAS ŁADOWANIA STRONY (wydajność)
        ───────────────────────────────────────────────── */
        window.addEventListener('load', function() {
            setTimeout(function() {
                if (window.performance && window.performance.timing) {
                    var t = window.performance.timing;
                    var czas = t.loadEventEnd - t.navigationStart;
                    if (czas > 0) {
                        track('czas_ladowania_strony', {
                            milisekundy: czas,
                            kategoria: czas < 2000 ? 'szybko' : czas < 5000 ? 'sredni' : 'wolno'
                        });
                    }
                }
            }, 0);
        });

        /* ─────────────────────────────────────────────────
           R. BŁĘDY JAVASCRIPT
        ───────────────────────────────────────────────── */
        window.addEventListener('error', function(e) {
            track('blad_javascript', {
                komunikat: (e.message || '').substring(0, 100),
                plik: (e.filename || '').split('/').pop(),
                linia: e.lineno || 0
            });
        });

    }); /* koniec load */

})();
/* ===== KONIEC ROZSZERZONEGO ŚLEDZENIA GA4 ===== */


/* ===== ŚLEDZENIE GA4 – POWROTY I ZAAWANSOWANE ===== */
(function() {

    function getDevice() {
        var ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
        if (/Android/.test(ua)) return 'Android';
        return window.innerWidth < 768 ? 'mobile_inne' : 'desktop';
    }
    function track(eventName, params) {
        if (typeof gtag !== 'function') return;
        params = params || {};
        params.urzadzenie = getDevice();
        params.czas_s = Math.round(performance.now() / 1000);
        gtag('event', eventName, params);
    }

    /* ─────────────────────────────────────────────────
       1. POWRÓT UŻYTKOWNIKA
       localStorage zapamiętuje między sesjami (nie czyści się po zamknięciu karty)
       sessionStorage zapamiętuje tylko w tej sesji
    ───────────────────────────────────────────────── */
    try {
        var wizyty = parseInt(localStorage.getItem('ga4_wizyty') || '0') + 1;
        localStorage.setItem('ga4_wizyty', wizyty);
        var ostatniaWizyta = localStorage.getItem('ga4_ostatnia_wizyta');
        var teraz = Date.now();
        var typUzytkownika = wizyty === 1 ? 'nowy' : 'powracajacy';
        var dniBezWizyty = ostatniaWizyta ? Math.floor((teraz - parseInt(ostatniaWizyta)) / 86400000) : 0;
        localStorage.setItem('ga4_ostatnia_wizyta', teraz);

        track('typ_uzytkownika', {
            typ: typUzytkownika,
            numer_wizyty: wizyty,
            dni_od_ostatniej: dniBezWizyty
        });

        /* Powrót po porzuceniu koszyka */
        var porzucilKoszyk = localStorage.getItem('ga4_porzucil_koszyk');
        if (porzucilKoszyk === '1') {
            track('powrot_po_porzuceniu_koszyka', {
                dni_od_porzucenia: dniBezWizyty
            });
        }
    } catch(e) {}

    /* Ustaw flagę porzuconego koszyka przy zamknięciu */
    window.addEventListener('load', function() {
        var dodanoDoKoszyka = false;
        var zamowiono = false;
        var addBtn = document.getElementById('addToCartBtn');
        var checkoutBtn = document.getElementById('cartCheckoutButton');
        if (addBtn) addBtn.addEventListener('click', function() {
            dodanoDoKoszyka = true;
            try { localStorage.setItem('ga4_porzucil_koszyk', '1'); } catch(e) {}
        });
        if (checkoutBtn) checkoutBtn.addEventListener('click', function() {
            zamowiono = true;
            try { localStorage.setItem('ga4_porzucil_koszyk', '0'); } catch(e) {}
        });
    });

    /* ─────────────────────────────────────────────────
       2. CZAS OD WEJŚCIA DO PIERWSZEGO KLIKNIĘCIA
    ───────────────────────────────────────────────── */
    var _starStrony = performance.now();
    var _pierwszeKlikniecie = false;
    document.addEventListener('click', function() {
        if (_pierwszeKlikniecie) return;
        _pierwszeKlikniecie = true;
        var sek = Math.round((performance.now() - _starStrony) / 1000);
        track('czas_do_pierwszego_klikniecia', { sekundy: sek });
    }, { once: false });

    var _pierwszyKonfigurator = false;
    window.addEventListener('load', function() {
        var sekcjaKonfig = document.getElementById('shelfTypeSectionAnchor');
        if (sekcjaKonfig) {
            sekcjaKonfig.addEventListener('click', function() {
                if (_pierwszyKonfigurator) return;
                _pierwszyKonfigurator = true;
                var sek = Math.round((performance.now() - _starStrony) / 1000);
                track('czas_do_konfiguracji', { sekundy: sek });
            });
        }

        /* ─────────────────────────────────────────────────
           3. CZAS OD KOSZYKA DO ZAMÓWIENIA
        ───────────────────────────────────────────────── */
        var _czasDodaniaDoKoszyka = null;
        var addBtnT = document.getElementById('addToCartBtn');
        var checkoutBtnT = document.getElementById('cartCheckoutButton');
        if (addBtnT) {
            addBtnT.addEventListener('click', function() {
                _czasDodaniaDoKoszyka = performance.now();
            });
        }
        if (checkoutBtnT) {
            checkoutBtnT.addEventListener('click', function() {
                if (_czasDodaniaDoKoszyka) {
                    var sek = Math.round((performance.now() - _czasDodaniaDoKoszyka) / 1000);
                    track('czas_koszyk_do_zamowienia', { sekundy: sek });
                }
            });
        }

        /* ─────────────────────────────────────────────────
           4. CZAS NA KAŻDEJ SEKCJI KONFIGURACJI
        ───────────────────────────────────────────────── */
        var sekcje = [
            { id: 'shelfTypeSectionAnchor', nazwa: 'typ_polki' },
            { id: 'dimensionSectionAnchor', nazwa: 'wymiary' },
            { id: 'colorSectionAnchor',     nazwa: 'kolory' },
            { id: 'shelfCountSection',      nazwa: 'liczba_polek' }
        ];
        var _aktywnaSekcja = null;
        var _czasSekcji = {};
        if ('IntersectionObserver' in window) {
            var obsSekcje = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    var nazwa = entry.target.dataset.ga4nazwa;
                    if (entry.isIntersecting) {
                        _aktywnaSekcja = nazwa;
                        _czasSekcji[nazwa] = performance.now();
                    } else if (_czasSekcji[nazwa]) {
                        var sek = Math.round((performance.now() - _czasSekcji[nazwa]) / 1000);
                        if (sek > 1) track('czas_na_sekcji', { sekcja: nazwa, sekundy: sek });
                        _czasSekcji[nazwa] = null;
                    }
                });
            }, { threshold: 0.3 });
            sekcje.forEach(function(s) {
                var el = document.getElementById(s.id);
                if (el) { el.dataset.ga4nazwa = s.nazwa; obsSekcje.observe(el); }
            });
        }

        /* ─────────────────────────────────────────────────
           5. WIDOCZNOŚĆ SEKCJI – czy użytkownik w ogóle tam dotarł
        ───────────────────────────────────────────────── */
        if ('IntersectionObserver' in window) {
            var widoczneSekcje = {};
            var obsWidocznosc = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    var id = entry.target.id;
                    if (widoczneSekcje[id]) return;
                    widoczneSekcje[id] = true;
                    track('sekcja_widoczna', { sekcja: id });
                });
            }, { threshold: 0.4 });
            ['shelfTypeSectionAnchor','dimensionSectionAnchor','colorSectionAnchor','shelfCountSection','priceAndActionsContainer'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) obsWidocznosc.observe(el);
            });
        }

        /* ─────────────────────────────────────────────────
           6. REAKCJA NA ZOBACZENIE CENY
        ───────────────────────────────────────────────── */
        var priceEl = document.getElementById('priceAndActionsContainer');
        if (priceEl && 'IntersectionObserver' in window) {
            var _cenaWyslana = false;
            var obsCena = new IntersectionObserver(function(entries) {
                entries.forEach(function(e) {
                    if (!e.isIntersecting || _cenaWyslana) return;
                    _cenaWyslana = true;
                    var cenaEl = document.getElementById('totalPriceDisplay') ||
                                 document.querySelector('.total-price, #priceDisplay, [id*="price" i]');
                    var cena = cenaEl ? cenaEl.textContent.trim() : 'nieznana';
                    track('zobaczyl_cene', { cena: cena });
                    obsCena.disconnect();
                });
            }, { threshold: 0.5 });
            obsCena.observe(priceEl);
        }

        /* ─────────────────────────────────────────────────
           7. WIDOCZNOŚĆ INFORMACJI O RABACIE
        ───────────────────────────────────────────────── */
        var rabatEl = document.getElementById('cartDiscountReminder');
        if (rabatEl && 'IntersectionObserver' in window) {
            var _rabatWyslany = false;
            var obsRabat = new IntersectionObserver(function(entries) {
                entries.forEach(function(e) {
                    if (!e.isIntersecting || _rabatWyslany) return;
                    _rabatWyslany = true;
                    track('zobaczyl_rabat', {});
                    obsRabat.disconnect();
                });
            }, { threshold: 0.5 });
            obsRabat.observe(rabatEl);
        }

        /* ─────────────────────────────────────────────────
           8. CENA PRZY DODANIU DO KOSZYKA
        ───────────────────────────────────────────────── */
        var addBtnC = document.getElementById('addToCartBtn');
        if (addBtnC) {
            addBtnC.addEventListener('click', function() {
                var cenaEl = document.querySelector('#totalPriceDisplay, .total-price, [id*="Price"]:not([id*="cart"]):not([id*="Cart"])');
                var cena = cenaEl ? cenaEl.textContent.trim() : 'nieznana';
                var przedzialy = ['0-199','200-299','300-399','400-499','500-699','700+'];
                var wartosc = parseFloat((cena || '0').replace(/[^0-9,]/g,'').replace(',','.')) || 0;
                var przedzial = wartosc < 200 ? '0-199' : wartosc < 300 ? '200-299' : wartosc < 400 ? '300-399' : wartosc < 500 ? '400-499' : wartosc < 700 ? '500-699' : '700+';
                track('cena_przy_dodaniu', { cena: cena, przedzial: przedzial });
            });
        }

        /* ─────────────────────────────────────────────────
           9. ROZDZIELCZOŚĆ EKRANU (dokładna)
        ───────────────────────────────────────────────── */
        track('rozdzielczosc_ekranu', {
            szerokosc: window.screen.width,
            wysokosc: window.screen.height,
            szerokosc_okna: window.innerWidth,
            pixel_ratio: window.devicePixelRatio || 1
        });

        /* ─────────────────────────────────────────────────
           10. JAKOŚĆ POŁĄCZENIA INTERNETOWEGO
        ───────────────────────────────────────────────── */
        if (navigator.connection) {
            track('jakosc_polaczenia', {
                typ: navigator.connection.effectiveType || 'nieznany',
                szybkosc_mbps: navigator.connection.downlink || 0,
                oszczedny_transfer: navigator.connection.saveData ? 'tak' : 'nie'
            });
        }

        /* ─────────────────────────────────────────────────
           11. STRONA OTWARTA W TLE (zaburza czas sesji)
        ───────────────────────────────────────────────── */
        var _bylWTle = false;
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                _bylWTle = true;
            } else if (document.visibilityState === 'visible' && _bylWTle) {
                track('powrot_z_tla', { czas_s: Math.round(performance.now() / 1000) });
            }
        });

        /* ─────────────────────────────────────────────────
           12. HOVER NA PRZYCISKU KOSZYKA BEZ KLIKNIĘCIA (desktop)
        ───────────────────────────────────────────────── */
        var addBtnH = document.getElementById('addToCartBtn');
        if (addBtnH) {
            var _hoverStart = null;
            var _hoverKlikniety = false;
            addBtnH.addEventListener('mouseenter', function() {
                _hoverStart = performance.now();
                _hoverKlikniety = false;
            });
            addBtnH.addEventListener('mouseleave', function() {
                if (_hoverStart && !_hoverKlikniety) {
                    var ms = Math.round(performance.now() - _hoverStart);
                    if (ms > 500) {
                        track('hover_koszyk_bez_klikniecia', { ms: ms });
                    }
                }
                _hoverStart = null;
            });
            addBtnH.addEventListener('click', function() { _hoverKlikniety = true; });
        }

        /* ─────────────────────────────────────────────────
           13. CZY KTOŚ UŻYWA NIESTANDARDOWYCH POZYCJI PÓŁEK
        ───────────────────────────────────────────────── */
        var dragToggle = document.querySelector('.sp-custom-toggle');
        if (dragToggle) {
            dragToggle.addEventListener('click', function() {
                track('wlaczyl_custom_pozycje_polek', {});
            });
        }

        /* ─────────────────────────────────────────────────
           14. EKSPORT ZBIORCZY – czy ktoś używa
        ───────────────────────────────────────────────── */
        var batchBtn = document.querySelector('[onclick*="openBatchExportModal"]');
        if (batchBtn) {
            batchBtn.addEventListener('click', function() {
                track('otworzyl_eksport_zbiorczy', {});
            });
        }

        /* ─────────────────────────────────────────────────
           15. KOPIOWANIE KODU ZAMÓWIENIA
        ───────────────────────────────────────────────── */
        var copyBtn = document.getElementById('copyAllCodesBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var ile = document.querySelectorAll('.cart-item, [data-code]').length;
                track('skopiowano_kody', { ilosc_kodow: ile });
            });
        }

    }); /* koniec load */

})();
/* ===== KONIEC ŚLEDZENIA POWROTÓW I ZAAWANSOWANEGO ===== */
