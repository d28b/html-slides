var iframe = slide.getElementsByTagName('iframe')[0];

slide.onSlideAppears = function() {
	iframe.src = 'https://www.meteoblue.com/en/weather/week/zurich_switzerland_2657896';
};

slide.onSlideDisappears = function() {
	iframe.src = 'about:blank';
};
