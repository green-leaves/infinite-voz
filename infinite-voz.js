//infinite-voz.js
// ==UserScript==
// @name         Infinite Scroll VOZ
// @namespace    http://vozforums.com/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        https://vozforums.com/forumdisplay.php?f=*
// @match        https://vozforums.com/showthread.php?t=*
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(".hide {display: none} .show{display: block} ");

(function() {
    'use strict';
    var parser = new DOMParser();
    var threads = document.getElementById('threadslist');
    var posts = document.getElementById('posts');
    var currentPage = +getCurrentPage();
    var lastPage = +getLastPage();
    var isLoading = false;
    const PAGE_REG = /Page \d+/;
    const BUFFER_HEIGHT = 300; // Magic number, to load next page before reach the end.
    const loadingSpinHTML = '<div class="" style="width: 100px; margin: 0 auto;">Loading... <img src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="/></div>';
    const loadingSpin = document.createElement("div");
    loadingSpin.innerHTML = loadingSpinHTML;
    loadingSpin.className = "hide";

    //==========================================================================
    // Load Thread
    //==========================================================================
    if (threads) {
        var boxId = getParameterByName('f', window.location.href);
        var innerThreadList = document.getElementById('threadbits_forum_' + boxId);
        var threadListOffsetTop = getCoords(threads).top;

        insertAfter(threads, loadingSpin);
        window.addEventListener('scroll', function() {
            if (window.scrollY + window.innerHeight + BUFFER_HEIGHT >= threads.offsetHeight + threadListOffsetTop) {
                if (isLoadable()) {
                    loadingSpin.className = "show";
                    isLoading = true;
                    loadBoxPage(boxId, ++currentPage,function(loadedDoc) {
                        pushState(currentPage);
                        innerThreadList.innerHTML += '<div>Page' + currentPage + '</div>';
                        innerThreadList.innerHTML += loadedDoc.getElementById('threadbits_forum_' + boxId).innerHTML;
                        lastPage = getLastPage(loadedDoc);
                        updatePageNavigator(loadedDoc.querySelector("div.pagenav").innerHTML);
                        isLoading = false;
                        loadingSpin.className = "hide";
                    });
                }
            }
        });
    //==========================================================================
    // Load Post
    //==========================================================================
    } else if (posts) {
        var postsOffsetTop = getCoords(posts).top;

        var threadId = getParameterByName('t', window.location.href);
        insertAfter(posts, loadingSpin);
        window.addEventListener('scroll', function() {
            if (window.scrollY + window.innerHeight + BUFFER_HEIGHT >= posts.offsetHeight + postsOffsetTop) {
                if (isLoadable()) {
                    loadingSpin.className = "show";
                    isLoading = true;
                    loadThreadPage(threadId, ++currentPage, function(loadedDoc) {
                        pushState(currentPage);

                        posts.innerHTML += '<div>Page' + currentPage + '</div>';
                        posts.innerHTML += loadedDoc.getElementById('posts').innerHTML;
                        lastPage = getLastPage(loadedDoc);
                        updatePageNavigator(loadedDoc.querySelector("div.pagenav").innerHTML);
                        isLoading = false;
                        loadingSpin.className = "hide";
                    });
                }
            }
        });
    }

    function pushState(currentPage) {
        const query = location.search.slice(1).split('&').reduce((o, v) => { const [key, val] = v.split('='); o[key] = val; return o;}, {});
        const { origin, pathname } = location;

        query.page = currentPage;
        const search = Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
        let path = `${origin}${pathname}?${search}`, title = document.title;

        if (PAGE_REG.test(title)) {
            title = title.replace(PAGE_REG, 'Page ' + currentPage);
        } else {
            title = `${title} Page ${currentPage}`;
        }
        history.pushState({}, title, path);
        document.title = title;
    }


    function isLoadable() {
        return (!isLoading && currentPage < lastPage);
    }

    function getCurrentPage() {
      return document.querySelector("div.pagenav tbody").querySelectorAll('tr:first-child td.alt2 strong')[0].innerHTML;
    }

    function updatePageNavigator(newHtmlNav) {
        var pageNavs = document.querySelectorAll("div.pagenav");
        for (var i = 0; i < pageNavs.length; i++) {
            pageNavs[i].innerHTML = newHtmlNav;
        }
    }

    function getLastPage(doc) {
        if (!doc) doc = document;
        var pageInfo = doc.querySelector("div.pagenav tbody").querySelector('tr:first-child td.vbmenu_control').innerText;
        var pageInfoWords = pageInfo.split(" ");
        return (pageInfoWords[pageInfoWords.length - 1]);
    }

    function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function getCoords(elem) { // crossbrowser version
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docEl = document.documentElement;

        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    }

    function loadBoxPage(boxId, pageNo, callback) {
        ajax('GET', 'https://vozforums.com/forumdisplay.php?f=' + boxId + '&order=desc&page=' + pageNo, loadSuccess);
        function loadSuccess(xhr) {
            callback(parser.parseFromString(xhr.responseText, "text/html"));
        }
	}

    function loadThreadPage(threadId, pageNo, callback) {
        ajax('GET', 'https://vozforums.com/showthread.php?t=' + threadId + '&page=' + pageNo, loadSuccess);

        function loadSuccess(xhr) {
            callback(parser.parseFromString(xhr.responseText, "text/html"));
        }
    }

    function ajax(method, url, callback) {
        var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.send(null);
		xhr.onreadystatechange = function () {
			var DONE = 4; // readyState 4 means the request is done.
			var OK = 200; // status 200 is a successful return.
			if (xhr.readyState === DONE) {
				if (xhr.status === OK) {
                    callback(xhr);
				} else {
					console.log('Error: ' + xhr.status); // An error occurred during the request.
				}
			}
		};
    }

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

})();
