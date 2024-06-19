/*******************************************************************************

    AdNauseam - Fight back against advertising surveillance.
    Copyright (C) 2014-2021 Daniel C. Howe

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/dhowe/AdNauseam
*/

/* global vAPI, $ */

'use strict';

import { i18n$ } from '../i18n.js';
import { renderNotifications, ReloadTab, addNotification } from './notifications.js';
import { setCost, targetDomain, decodeEntities, isNonLatin, isCyrillic } from './adn-utils.js';
import { dom } from '../dom.js';
import uDom from './uDom.js';
import { broadcast, onBroadcast } from '../broadcast.js';

(function () {

  let ads, page, settings, recent; // remove? only if we can find an updated ad already in the DOM
  var currentNotifications = [];
  var ad_list_height;
  var initialButtonState = 'active';
  var updatedButtonState = '';
  var colorBlindMode = false

  // on adnRefresh event, update initialButtonState to updatedButtonState
  window.addEventListener('adnRefresh', function (e) {
    initialButtonState = updatedButtonState;
  });

  setTimeout(() => {
    ad_list_height = document.body.offsetHeight - 140;
    if (isCyrillic()) {
      // add class to document body
      document.body.classList.add('cyrilic');
    }
    if (i18n$('adnMenuActive') === 'Active') {
      document.body.classList.add('en');
    }
  }, 10)

  onBroadcast(request => {

    switch (request.what) {

      case 'adAttempt':
        setAttempting(request.ad);
        break;

      case 'adDetected':
        // for now, just re-render
        renderPage(request);
        adjustBlockHeight();
        break;

      case 'adVisited':
        updateAd(request.ad);
        break;
      case 'notifications':
        currentNotifications = request.notifications
        renderNotifications(request.notifications);
        adjustBlockHeight();
        break;
      // disable warnings option #1910
      case 'hideNotifications':
        dom.cl.add('#notifications', "hide");
        adjustBlockHeight();
        break;
      case 'showNotifications':
        dom.cl.remove('#notifications', "hide");
        adjustBlockHeight();
        break;
    }
  });

  /******************************************************************************/

  const renderPage = function (json) {
    page = json && json.pageUrl;
    settings = json && json.prefs;
    recent = json && json.recent

    console.log("[ADN] renderPage settings", settings)

    if (page) {
      // disable pause & resume buttons for options, vault, about/chrome
      if (page === vAPI.getURL("vault.html") ||
        page.indexOf(vAPI.getURL("dashboard.html")) === 0 ||
        page.indexOf("chrome") === 0 || page.indexOf("about:") === 0) {
        uDom('#state_btn-wrapper').addClass('disabled');
      }
    }

    uDom("#alert-noads").addClass('hide'); // reset state of no ads showned
    uDom("#alert-strictblock").addClass('hide'); // reset state of no ads showned
    uDom('#main').toggleClass('disabled', getIsDisabled());


    if (typeof json !== 'undefined' && json !== null) {
      ads = json.data;
      setCounts(ads, json.total, json.recent);
    } else {
      console.warn("[ADN] json null, cant make ad list")
    }

    const $items = uDom('#ad-list-items');
    $items.removeClass().empty();

    if (typeof json !== 'undefined' && json !== null) {
      layoutAds(json);
    } else {
      console.warn("[ADN] json null, cant make ad list")
    }

    vAPI.messaging.send(
      'adnauseam', {
      what: 'verifyAdBlockersAndDNT',
      url: page
    }).then(details => {
      vAPI.messaging.send(
        'adnauseam', {
        what: 'getNotifications'
      }).then((data) => {
        currentNotifications = data.notifications
        renderNotifications(data.notifications)
        adjustBlockHeight(data.disableWarnings)
        initialButtonState = getIsDisabled() ? 'disable' : getIsStrictBlocked() ? 'strict' : 'active';
        updateLabels(initialButtonState)
        // set button state
        if (getIsDisabled()) {
          // disabled 
          uDom('#disable').prop('checked', true);
        } else {
          if (getIsStrictBlocked()) {
            // strict blocked
            uDom('#strict').prop('checked', true);
            toggleStrictAlert(page, true)
          } else {
            // active
            uDom('#active').prop('checked', true);
          }
        }
      });
    });
  }

  const setCounts = function (ads, total, recent) {
    const numVisits = recent ? 0 : (visitedCount(ads) || 0);
    uDom('#vault-count').text(total || 0);
    uDom('#visited').text(i18n$("adnMenuAdsClicked").replace("{{number}}", numVisits || 0));
    uDom('#found').text(i18n$("adnMenuAdsDetected").replace("{{count}}", (ads && !recent) ? ads.length : 0));
    setCost(numVisits);
    adjustStatCSS();
  }

  const adjustStatCSS = function () {
    // adjust css if too wide
    if (uDom('.wrapper').nodes[0].clientHeight > 20) {
      uDom('.wrapper').css("float", "right");
      uDom('.wrapper').css("margin-left", "-25px");
    }
  }

  const layoutAds = function (json) {
    const $items = uDom('#ad-list-items');
    $items.removeClass().empty();

    ads = json.data;
    if (ads) {
      if (json.recent) doRecent();
      for (let i = 0, j = ads.length; i < j; i++) {
        appendAd($items, ads[i]);
      }
      setAttempting(json.current);
    }
  };

  const getTitle = function (ad) {

    let title = ad.title + ' ';
    if (ad.visitedTs < 1) {
      // adds . to title for each failed attempt
      for (let i = 0; i < ad.attempts; i++)
        title += '.';
    }
    return title;
  };

  const updateAd = function (ad) { // update class, title, counts
    // console.log(ad);
    if (verify(ad)) {

      const $ad = updateAdClasses(ad);

      // update the title
      $ad.descendants('.title').text(decodeEntities(getTitle(ad)));

      // update the url
      $ad.descendants('cite').text(targetDomain(ad));

      // update the visited count
      if (ad.pageUrl === page) { // global page here
        const numVisits = visitedCount(ads);
        uDom('#visited').text(i18n$("adnMenuAdsClicked").replace("{{number}}", numVisits || 0));
        setCost(numVisits);
        adjustStatCSS();
      }
    }
  }

  const verify = function (ad) { // uses global ads
    if (ad && ads) {
      for (let i = 0; i < ads.length; i++) {
        if (ads[i].id === ad.id) {
          ads[i] = ad;
          return true;
        }
      }
    }
    return false;
  }

  // if there are any ads on current domain, show recent
  const doRecent = function () {
    uDom("#alert-noads").removeClass('hide');
    uDom('#ad-list-items').addClass('recent-ads');
  }

  const appendAd = function ($items, ad) {
    if (ad.private && ad.adNetwork != null) return; // skip private ads after removal of content

    if (ad.contentType === 'img') {
      appendImageAd(ad, $items);
    } else if (ad.contentType === 'text') {
      appendTextAd(ad, $items);
    }
  }

  const removeClassFromAll = function (cls) {
    uDom('.ad-item').removeClass(cls);
    uDom('.ad-item-text').removeClass(cls);
  };

  const setAttempting = function (ad) {
    // one 'attempt' at a time
    removeClassFromAll('attempting');

    if (verify(ad)) {
      uDom('#ad' + ad.id).addClass('attempting');
    }
  }

  const updateAdClasses = function (ad) {
    const $ad = uDom('#ad' + ad.id); //$('#ad' + ad.id);
    // allow only one just-* at a time...
    removeClassFromAll('just-visited just-failed');
    // See https://github.com/dhowe/AdNauseam/issues/61
    const cls = ad.visitedTs > 0 ? 'just-visited' : 'just-failed';
    // Update the status
    const txt = cls === 'just-visited' ? 'visited' : 'failed';
    $ad.descendants('.adStatus').text(i18n$("adnAdClickingStatus" + txt));
    $ad.removeClass('failed visited attempting').addClass(cls);
    // timed for animation
    setTimeout(function () {
      $ad.addClass(visitedClass(ad));
    }, 300);
    return $ad;
  }

  const appendImageAd = function (ad, $items) {
    let $img;
    let $a;
    let $span;
    let $status;

    const $li = uDom(document.createElement('li'))
      .attr('id', 'ad' + ad.id)
      .addClass(('ad-item ' + visitedClass(ad)).trim());

    $a = uDom(document.createElement('a'))
      .attr('target', 'new')
      .attr('href', ad.targetUrl);

    $span = uDom(document.createElement('span')).addClass('thumb');
    $span.appendTo($a);

    appendAdStatus(ad, $a);

    let img_src = (ad.contentData.src || ad.contentData);
    var isPNGdata = img_src.includes('data:image/png');
    var cl = isPNGdata ? "ad-item-img white-bg" : "ad-item-img";

    $img = uDom(document.createElement('img'))
      .attr('src', img_src)
      .addClass(cl)
      .on('click', "this.onerror=null; this.width=50; this.height=45; this.src='img/placeholder.svg'");

    $img.on("error", function () {
      $img.css({
        width: 80,
        height: 40
      });
      $img.attr('src', 'img/placeholder.svg');
      $img.attr('alt', 'Unable to load image');
      $img.off("error");
    });

    $img.appendTo($span);

    uDom(document.createElement('span'))
      .addClass('title')
      .text(ad.title ? decodeEntities(ad.title) : "#" + ad.id)
      .appendTo($a);

    uDom(document.createElement('cite'))
      .text(targetDomain(ad))
      .appendTo($a);

    $a.appendTo($li);
    $li.appendTo($items);
  }

  const appendAdStatus = function (ad, parent) {
    const $status = uDom(document.createElement('span'))
      .addClass('adStatus').text(i18n$("adnAdClickingStatus" + adStatus(ad)));
    $status.appendTo(parent);
  }

  const adStatus = function (ad) {
    let status = settings.clickingDisabled ? "SkippedDisabled" : "Pending";
    if (!ad.noVisit) {
      if (ad.attempts > 0) {
        status = ad.visitedTs > 0 ? 'Visited' : 'Failed';
      }
    } else if (status != "SkippedDisabled") {
      if (ad.clickedByUser) status = "SkippedUser";
      else status = "Skipped" + (ad.dntAllowed ? "DNT" : "Frequency");
    }
    return status;
  }

  const appendTextAd = function (ad, $items) {
    let $cite;
    let $h3;
    let $status;

    const $li = uDom(document.createElement('li'))
      .attr('id', 'ad' + ad.id)
      .addClass(('ad-item-text ' + visitedClass(ad)).trim());

    uDom(document.createElement('span'))
      .addClass('thumb')
      .text('Text Ad').appendTo($li);

    appendAdStatus(ad, $li);

    $h3 = uDom(document.createElement('h3'));

    uDom(document.createElement('a'))
      .attr('target', 'new')
      .attr('href', ad.targetUrl)
      .addClass('title')
      .text(decodeEntities(ad.title)).appendTo($h3);

    $h3.appendTo($li);
    if (ad.contentData.site) {
      $cite = uDom(document.createElement('cite')).text(ad.contentData.site);
      $cite.text($cite.text() + ' (#' + ad.id + ')'); // testing-only
      $cite.appendTo($li);
    }
    uDom(document.createElement('div'))
      .addClass('ads-creative')
      .text(ad.contentData.text).appendTo($li);

    $li.appendTo($items);
  }

  const visitedClass = function (ad) {
    return ad.dntAllowed ? 'dnt-allowed' : (ad.visitedTs > 0 ? 'visited' :
      (ad.visitedTs < 0 && ad.attempts >= 3) ? 'failed' : '');
  }

  const visitedCount = function (arr) {
    return (!(arr && arr.length)) ? 0 : arr.filter(function (ad) {
      return ad.visitedTs > 0;
    }).length;
  }

  const toggleStrictAlert = function (pageUrl, state) {
    let hostname = (new URL(pageUrl)).hostname;
    uDom("#alert-strictblock .text").text(uDom("#alert-strictblock .text").text().replace("{{domain}}", hostname))
    if (state) {
      uDom("#alert-strictblock").removeClass('hide');
      uDom("#alert-noads").addClass('hide');
      uDom('#ad-list-items').addClass('recent-ads');
    } else {
      if (recent) {
        uDom("#alert-noads").removeClass('hide');
      } else {
        uDom('#ad-list-items').removeClass('recent-ads');
      }
      uDom("#alert-strictblock").addClass('hide');
    }
  }

  const getPopupData = function (tabId) {
    const onPopupData = function (response) {
      console.log("response", response)
      cachePopupData(response);
      vAPI.messaging.send(
        'adnauseam', {
        what: 'adsForPage',
        tabId: popupData.tabId
      }).then(details => {
        renderPage(details);
      })
    };

    vAPI.messaging.send(
      'popupPanel', {
      what: 'getPopupData',
      tabId: tabId
    }).then(details => {
      onPopupData(details);
    })
  };

  // check if current page/domain is whitelisted
  const getIsDisabled = function () {
    return popupData.pageURL === '' || !popupData.netFilteringSwitch ||
      (popupData.pageHostname === 'behind-the-scene' && !popupData.advancedUserEnabled);
  }

  // check if current page/domain is on strictBlockList
  const getIsStrictBlocked = function () {
    return popupData.strictBlocked
  }

  /******************************************************************************/
  const cachedPopupHash = '';

  let hostnameToSortableTokenMap = {};
  let popupData = {};

  const scopeToSrcHostnameMap = {
    '/': '*',
    '.': ''
  };

  const cachePopupData = function (data) {
    popupData = {};
    scopeToSrcHostnameMap['.'] = '';
    hostnameToSortableTokenMap = {};
    
    // implement colorBlind style
    colorBlindMode = data.colorBlindFriendly || false;
    document.documentElement.classList.toggle(
      'colorBlind',
      data.colorBlindFriendly === true
    );

    if (typeof data !== 'object') {
      return popupData;
    }
    popupData = data;
    scopeToSrcHostnameMap['.'] = popupData.pageHostname || '';
    const hostnameDict = popupData.hostnameDict;
    if (typeof hostnameDict !== 'object') {
      return popupData;
    }

    let domain, prefix;
    for (const hostname in hostnameDict) {
      if (hostnameDict.hasOwnProperty(hostname) === false) {
        continue;
      }
      domain = hostnameDict[hostname].domain;
      prefix = hostname.slice(0, 0 - domain.length);
      // Prefix with space char for 1st-party hostnames: this ensure these
      // will come first in list.
      if (domain === popupData.pageDomain) {
        domain = '\u0020';
      }
      hostnameToSortableTokenMap[hostname] = domain + prefix.split('.').reverse().join('.');
    }
    return popupData;
  };

  uDom('#vault-button').on('click', function () {
    vAPI.messaging.send(
      'default',
      {
        what: 'gotoURL',
        details: {
          url: "vault.html",
          select: true,
          index: -1
        }
      }
    )
    vAPI.closePopup();
  });

  uDom('#btn-settings').on('click', function () {
    vAPI.messaging.send(
      'default',
      {
        what: 'gotoURL',
        details: {
          url: "dashboard.html#options.html",
          select: true,
          index: -1
        }
      }
    );
    vAPI.closePopup();
  });

  uDom('#help-button').on('click', function () {
    vAPI.messaging.send(
      'default',
      {
        what: 'gotoURL',
        details: {
          url: "https://github.com/dhowe/AdNauseam/wiki/FAQ",
          select: true,
          index: -1
        }
      }
    );
    vAPI.closePopup();
  });

  uDom('#settings-close').on('click', function () {
    uDom('.page').toggleClass('hide');
    uDom('.settings').toggleClass('hide');
  });

  const AboutURL = "https://github.com/dhowe/AdNauseam/wiki/"; // keep

  uDom('#btn-ublock').on('click', function () {
    window.open("./popup-fenix.html", '_self');
    //window.open(AboutURL);
  });

  const onHideTooltip = function () {
    uDom.nodeFromId('tooltip').classList.remove('show');
  };

  const onShowTooltip = function () {
    if (popupData.tooltipsDisabled) {
      return;
    }

    const target = this;

    // Tooltip container
    const ttc = uDom(target).ancestors('.tooltipContainer').nodeAt(0) ||
      document.body;
    const ttcRect = ttc.getBoundingClientRect();

    // Tooltip itself
    const tip = uDom.nodeFromId('tooltip');
    tip.textContent = target.getAttribute('data-tip');
    tip.style.removeProperty('top');
    tip.style.removeProperty('bottom');
    ttc.appendChild(tip);

    // Target rect
    const targetRect = target.getBoundingClientRect();

    // Default is "over"
    let pos;

    const over = target.getAttribute('data-tip-position') !== 'under';
    if (over) {
      pos = ttcRect.height - targetRect.top + ttcRect.top;
      tip.style.setProperty('bottom', pos + 'px');
    } else {
      pos = targetRect.bottom - ttcRect.top;
      tip.style.setProperty('top', pos + 'px');
    }

    // Tooltip's horizontal position
    tip.style.setProperty('left', targetRect.left + 'px');

    tip.classList.add('show');
  };

  const updateRefreshNotification = function (notifications) {
    const notificationData = {
      name: 'RefreshTab',
      text: 'adnRefreshNotification',
      prop: 'ReloadTab',
      button: 'adnRefreshButton',
    }
    notifications.push(notificationData)
    renderNotifications(notifications);
    adjustBlockHeight();
  }

  const hideRefreshNotification = function () {
    let refreshTab = document.querySelector('#RefreshTab')
    if (refreshTab) refreshTab.classList.add('hide')
    adjustBlockHeight();
  }

  // on change state of toggle button
  const onChangeState = function (evt) {
    updatedButtonState = this.value;
    updateLabels(this.value)
    switch (this.value) {
      case 'strict':
        onClickStrict();
        if (initialButtonState === 'active') {
          updateRefreshNotification(currentNotifications)
        } else {
          hideRefreshNotification()
        }        
        break;
      case 'active':
        toggleStrictAlert(popupData.pageURL, false)
        uDom("#on_domain").prop('checked', true);
        toggleEnabled(evt, true)
        if (initialButtonState === 'strict') {
          updateRefreshNotification(currentNotifications)
        } else {
          hideRefreshNotification()
        }
        break;
      case 'disable':
        toggleStrictAlert(popupData.pageURL, false)
        toggleEnabled(evt, false)
        // open dropdown menu
        onClickDisableArrow()
        hideRefreshNotification()
        break;
      default:
        break;
    }
  }

  const updateLabels = function (val) {
    switch (val) {
      case 'strict':
          uDom("#active-lbl").text('activate')
          uDom("#disable-lbl  .btn_radio_label-text").text('disable')
        break;
        case 'active':
          uDom("#active-lbl").text('active')
          uDom("#disable-lbl  .btn_radio_label-text").text('disable')
        break;
      case 'disable':
          uDom("#active-lbl").text('activate')
          uDom("#disable-lbl  .btn_radio_label-text").text('disabled')
        break;
    }
  }

  // when changing "page" and "domain" scope from the popup menu on the "disable button" 
  const onChangeDisabledScope = function (evt) {
    // check if url is domain home
    let url = new URL(popupData.pageURL)
    // let isDomainHome = url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/index.php'
    var scope = uDom(".disable_type_radio:checked") ? uDom(".disable_type_radio:checked").val() : ''
    // first remove previous whichever previous scope from whitelist 
    vAPI.messaging.send(
      'adnauseam', {
      what: 'toggleEnabled',
      url: popupData.pageURL,
      scope: scope == '' ? 'page' : '', // remove the inverted scope
      state: true,
      tabId: popupData.tabId
    }).then(() => {
      // then re-add it with current scope
      vAPI.messaging.send(
        'adnauseam', {
        what: 'toggleEnabled',
        url: popupData.pageURL,
        scope: scope,
        state: false,
        tabId: popupData.tabId
      });
      setTimeout(function () {
        // always close popup after selecting
        closePopup()
      }, 500)
    });
  }

  // keep in mind:
  // state == false -> disabled 
  // state == true -> active 
  const toggleEnabled = function (evt, state, _scope) {
    if (!popupData || !popupData.pageURL || (popupData.pageHostname ===
      'behind-the-scene' && !popupData.advancedUserEnabled)) {
      return;
    }
    uDom('#main').toggleClass('disabled', !state)
    let url = new URL(popupData.pageURL)
    let isDomainHome = url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/index.php'
    vAPI.messaging.send(
      'adnauseam', {
      what: 'toggleEnabled',
      url: popupData.pageURL,
      scope: '',
      state: state,
      tabId: popupData.tabId
    });
  };

  // always close popup after any click outside of it 
  const onAnyClickAfterOpen = function (event) {
    if (event.target.name == 'disable_type') {
      // here deal with choices of disable type
    } else {
      // here close the popup
      closePopup()
    }
  }

  const closePopup = function () {
    uDom("#disable").removeClass("popup_open")
    uDom(".popup_arrow").removeClass("open")
    uDom(".inner-popup_wrapper").addClass("hidden")
    document.removeEventListener('click', onAnyClickAfterOpen)
    var msg = i18n$('adnMenuDisableScopeDomain')
    uDom("#on_domain-lbl span").text(msg)
  }

  const openPopup = function () {
    uDom("#disable").addClass("popup_open")
    uDom(".popup_arrow").addClass("open")
    uDom(".inner-popup_wrapper").removeClass("hidden");
    document.addEventListener('click', onAnyClickAfterOpen)
    var msg = i18n$('adnMenuDisableScopeDomain').replace("{{domain}}", popupData.pageDomain)
    uDom("#on_domain-lbl span").text(msg)
  }

  const onClickDisableArrow = function () {
    uDom("#disable").prop('checked', true);
    var isOpen = uDom(".popup_arrow").hasClass('open')
    if (isOpen) {
      closePopup()
    } else {
      openPopup()
    }
  }

  const adjustBlockHeight = function (disableWarnings) {
    // recalculate the height of ad-list
    let notification = document.getElementById('notifications')
    var h = notification.offsetHeight;
    // if disable warning is enable, don't count height of notifications strip
    if (disableWarnings) {
      h = 0;
    }
    const newh = ad_list_height - h;
    uDom('#ad-list').css('height', newh + 'px');
  };

  const setBackBlockHeight = function () {
    let height = document.getElementById('ad-list').offsetHeight;
    let top = parseInt(uDom('#paused-menu').css('top'));
    const unit = 39; // ?
    height += unit;
    top -= unit;
    uDom('#ad-list').css('height', height + 'px');
    uDom('#paused-menu').css('top', top + 'px');
  };

  /*******************************************************************
   Adn on click strict block
   ********************************************************************/

  function onClickStrict() {
    if (!popupData || !popupData.pageURL || (popupData.pageHostname ===
      'behind-the-scene' && !popupData.advancedUserEnabled)) {
      return;
    }
    // enable alert
    toggleStrictAlert(popupData.pageURL, true)
    uDom('#main').removeClass('disabled')
    vAPI.messaging.send(
      'adnauseam', {
      what: 'toggleStrictBlockButton',
      url: popupData.pageURL,
      scope: '',
      state: true,
      tabId: popupData.tabId
    });
  }

  /********************************************************************/

  (function () {

    let tabId = null;

    // Extract the tab id of the page this popup is for
    const matches = window.location.search.match(/[\?&]tabId=([^&]+)/);
    if (matches && matches.length === 2) {
      tabId = matches[1];
    }
    getPopupData(tabId);

    // add click events
    uDom('.adn_state_radio').on('change', onChangeState)
    uDom('.disable_type_radio').on('change', onChangeDisabledScope)
    uDom('.popup_arrow').on('click', onClickDisableArrow)
    /*
    uDom('#pause-button').on('click', toggleEnabled);
    uDom('#resume-button').on('click', toggleEnabled);
    uDom('#strict-button').on('click', onClickStrict);
    */

    uDom('#notifications').on('click', setBackBlockHeight);
    uDom('body').on('mouseenter', '[data-tip]', onShowTooltip)
      .on('mouseleave', '[data-tip]', onHideTooltip);

    // Mobile device?
    // https://github.com/gorhill/uBlock/issues/3032
    // - If at least one of the window's viewport dimension is larger than the
    //   corresponding device's screen dimension, assume uBO's popup panel sits in
    //   its own tab.
    if (
      /[\?&]mobile=1/.test(window.location.search) ||
      window.innerWidth >= window.screen.availWidth ||
      window.innerHeight >= window.screen.availHeight
    ) {
      document.body.classList.add('mobile');
    }
  })();

  /********************************************************************/
})();
