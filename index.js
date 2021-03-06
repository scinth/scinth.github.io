let currentPageIndex = 0;
let isSliding = false;
let featuredInterval = null;
let startFeaturedInterval = null;
let stopFeaturedInterval = null;

// elements
let menu = null;
let menuToggler = null;
let arrows = null;
let pagesWrapper = null;
let projectsWrapper = null;
let pages = null;
let pageLogo = null;
let links = null;
let pageNavigation = null;
let footerToggler = null;
let footer = null;

// ACTIONS
// click keyboard
document.addEventListener('keydown', e => {
	if (e.repeat) return;
	if (isSliding) return;

	let nextIndex = null;
	switch (e.key) {
		case 'ArrowRight':
			nextIndex = getNextIndex('increment');
			activateLink(nextIndex);
			replaceHistory(nextIndex);
			renderPage(nextIndex, getAnimationSettings());
			break;
		case 'ArrowLeft':
			nextIndex = getNextIndex('decrement');
			activateLink(nextIndex);
			replaceHistory(nextIndex);
			renderPage(nextIndex, getAnimationSettings());
	}
});
// change hash
window.addEventListener('hashchange', e => {
	e.preventDefault();
	e.stopPropagation();
	let nextIndex = links.findIndex(link => {
		return link.hash == location.hash;
	});
	setTimeout(() => {
		if (nextIndex == -1) throw new Error('nextIndex is not found');
		if (nextIndex == currentPageIndex) return;
		activateLink(nextIndex);
		renderPage(nextIndex, getAnimationSettings());
	}, 0.3);
});

// HANDLERS
// render page
const renderPage = (index, animationSettings) => {
	let currentPage = pages[currentPageIndex];
	let nextPage = pages[index];
	let { name: animationName, axis, order } = animationSettings;

	pagesWrapper.setAnimationAxis(axis);
	currentPage.style.order = order.activePage;
	nextPage.style.order = order.nextPage;
	nextPage.classList.add('active');

	pagesWrapper.addEventListener(
		'animationend',
		function () {
			// featured
			if (index == 0) startFeaturedInterval();
			else stopFeaturedInterval();

			currentPage.classList.remove('active');
			this.setAttribute('class', '');
			currentPage.style.order = '';
			nextPage.style.order = '';
			nextPage.focus();
			isSliding = false;
			currentPageIndex = index;
		},
		{ once: true },
	);

	// run animation
	isSliding = true;
	pagesWrapper.classList.add(animationName);
};
// replace history
const replaceHistory = index => {
	let hash = links[index].hash;
	history.replaceState(
		{
			pageIndex: currentPageIndex,
		},
		null,
		`index.html${hash}`,
	);
};
// activate link
const activateLink = index => {
	let currentLink = links[currentPageIndex];
	let nextLink = links[index];
	currentLink.classList.remove('active');
	nextLink.classList.add('active');
};

///////////////////////////////////

const updateCustomProps = function () {
	let style = document.documentElement.style;
	let pageLogoHeight = pageLogo.clientHeight;
	let pageNavHeight = pageNavigation.clientHeight;
	let footerHeight = footer.clientHeight;
	style.setProperty('--client-height', `${window.innerHeight}px`);
	style.setProperty('--footer-height', `${pageNavHeight + pageLogoHeight + footerHeight}px`);
	style.setProperty('--page-logo-height', `${pageLogoHeight}px`);
	style.setProperty('--page-navigation-height', `${pageNavHeight}px`);
	style.setProperty('--pagenav-slide-height', `-${pageLogoHeight + footerHeight}px`);
};

const getNextIndex = function (type = 'increment') {
	if (!(type == 'increment' || type == 'decrement')) return;
	let nextIndex = type == 'decrement' ? currentPageIndex - 1 : currentPageIndex + 1;
	if (nextIndex >= pages.length) nextIndex = 0;
	else if (nextIndex < 0) nextIndex = pages.length - 1;
	return nextIndex;
};

const getAnimationSettings = () => {
	let settings = [
		{
			name: 'push-left',
			axis: 'horizontal',
			order: {
				activePage: '0',
				nextPage: '1',
			},
		},
		{
			name: 'push-right',
			axis: 'horizontal',
			order: {
				activePage: '1',
				nextPage: '0',
			},
		},
		{
			name: 'push-up',
			axis: 'vertical',
			order: {
				activePage: '0',
				nextPage: '1',
			},
		},
		{
			name: 'push-down',
			axis: 'vertical',
			order: {
				activePage: '1',
				nextPage: '0',
			},
		},
	];
	let index = Math.round(Math.random() * (settings.length - 1));
	return settings[index];
};

window.addEventListener('resize', updateCustomProps);
document.addEventListener('DOMContentLoaded', function () {
	let main = document.getElementById('pages');
	menu = document.getElementById('link-navigation');
	menuToggler = document.getElementsByClassName('menu-toggler')[0];
	pageNavigation = document.getElementById('page-navigation');
	pageLogo = document.getElementById('page-logo');
	footer = document.getElementById('info');
	setTimeout(updateCustomProps, 100);

	pages = [...document.querySelectorAll('#pages .page')];
	links = [...document.querySelectorAll('#link-navigation a')];
	pagesWrapper = document.getElementById('pages-wrapper');
	projectsWrapper = document.querySelector('#featured-section .projects-wrapper');
	footerToggler = document.getElementsByClassName('footer-toggler')[0];
	arrows = [...document.querySelectorAll('.arrow')];

	let slideNext = (function () {
		let activeBanner = 0;
		let banners = [...projectsWrapper.children];
		let bannerCount = banners.length - 1;
		return function () {
			let nextBanner = activeBanner + 1;
			if (nextBanner > bannerCount) nextBanner = 0;
			// set proper order
			banners[activeBanner].style.order = '0';
			banners[nextBanner].style.order = '1';
			// show next banner
			banners[nextBanner].classList.add('active');
			// remove prev banner
			projectsWrapper.addEventListener(
				'animationend',
				e => {
					e.target.classList.remove('slide-left');
					banners[activeBanner].classList.remove('active');
					activeBanner = nextBanner;
				},
				{ once: true },
			);
			// slide left
			projectsWrapper.classList.add('slide-left');
		};
	})();

	startFeaturedInterval = () => {
		featuredInterval = setInterval(slideNext, 7000);
	};

	stopFeaturedInterval = () => {
		clearInterval(featuredInterval);
	};

	startFeaturedInterval();

	pagesWrapper.setAnimationAxis = function (axis) {
		if (this.classList.contains(axis)) return;
		if (axis == 'horizontal') {
			this.classList.remove('vertical');
		} else if (axis == 'vertical') {
			this.classList.remove('horizontal');
		}
		this.classList.add(axis);
	};

	const [saveSwipePaths, getSwipePath] = (function () {
		let path = [];
		return [
			coord => {
				// save paths
				path.push(coord);
			},
			() => {
				// return first & last path
				if (!(path[0] && path[path.length - 1])) return [];
				let paths = [path[0], path[path.length - 1]];
				path = [];
				return paths;
			},
		];
	})();

	const getSwipeDirection = path => {
		let [touchStart, touchEnd] = path;
		let verticalSwipeLength = Math.abs(touchStart[1] - touchEnd[1]);
		if (verticalSwipeLength > 40) return 'invalid';
		let horizontalSwipeLength = Math.abs(touchStart[0] - touchEnd[0]);
		if (horizontalSwipeLength < 80) return 'invalid';
		if (touchStart[0] < touchEnd[0]) return 'right';
		if (touchStart[0] > touchEnd[0]) return 'left';
		return 'invalid';
	};

	main.addEventListener('touchmove', e => {
		let coord = [];
		coord.push(e.changedTouches[0].clientX);
		coord.push(e.changedTouches[0].clientY);
		if (coord[0] && coord[1]) saveSwipePaths(coord);
	});

	main.addEventListener('touchend', () => {
		let swipePath = getSwipePath();
		if (swipePath.length < 2) return;
		let swipeDirection = getSwipeDirection(swipePath);
		let nextIndex = null;
		switch (swipeDirection) {
			case 'left':
				nextIndex = getNextIndex('increment');
				activateLink(nextIndex);
				replaceHistory(nextIndex);
				renderPage(nextIndex, {
					name: 'push-left',
					axis: 'horizontal',
					order: {
						activePage: '0',
						nextPage: '1',
					},
				});
				break;
			case 'right':
				nextIndex = getNextIndex('decrement');
				activateLink(nextIndex);
				replaceHistory(nextIndex);
				renderPage(nextIndex, {
					name: 'push-right',
					axis: 'horizontal',
					order: {
						activePage: '1',
						nextPage: '0',
					},
				});
		}
	});

	// initial hash
	let hash = location.hash;
	if (!hash) {
		history.replaceState(
			{
				pageIndex: currentPageIndex,
			},
			null,
			'index.html#homepage',
		);
	} else {
		let nextIndex = links.findIndex(link => {
			return link.hash === hash;
		});
		setTimeout((index = nextIndex) => {
			if (index == -1) throw new Error('nextIndex not found');
			if (hash == '#homepage') return;
			history.replaceState(
				{
					pageIndex: currentPageIndex,
				},
				null,
				`index.html${hash}`,
			);
			activateLink(index);

			// render page;
			let currentPage = pages[currentPageIndex];
			let nextPage = pages[index];
			currentPage.classList.remove('active');
			nextPage.classList.add('active');
			currentPageIndex = index;
		}, 0.3);
	}

	// ACTIONS

	// toggle menu
	menuToggler.addEventListener('click', e => {
		menu.classList.toggle('active');
		if (menu.classList.contains('active')) {
			e.target.setAttribute('src', 'assets/icons/pagenav/xmark-solid.svg');
		} else {
			e.target.setAttribute('src', 'assets/icons/pagenav/bars-solid.svg');
		}
		e.stopPropagation();
	});

	// toggle footer
	footerToggler.addEventListener('click', () => {
		document.body.classList.toggle('showFooter');
	});

	// click link
	links.forEach((link, nextIndex) => {
		link.addEventListener('click', e => {
			e.preventDefault();
			if (isSliding) return;
			if (nextIndex == currentPageIndex) return;
			activateLink(nextIndex);
			replaceHistory(nextIndex);
			renderPage(nextIndex, getAnimationSettings());
		});
	});

	// click arrow buttons
	arrows.forEach(arrow => {
		arrow.addEventListener('click', () => {
			if (isSliding) return;
			let nextIndex = null;
			if (arrow.classList.contains('next-page')) nextIndex = getNextIndex('increment');
			else if (arrow.classList.contains('prev-page')) nextIndex = getNextIndex('decrement');
			activateLink(nextIndex);
			replaceHistory(nextIndex);
			renderPage(nextIndex, getAnimationSettings());
		});
	});

	// remove footer on menu click
	menu.addEventListener('click', () => {
		document.body.classList.remove('showFooter');
	});
});

// remove menu on document click
document.addEventListener('click', () => {
	menu.classList.remove('active');
	menuToggler.firstElementChild.setAttribute('src', 'assets/icons/pagenav/bars-solid.svg');
});
