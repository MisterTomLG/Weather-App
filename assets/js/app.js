'use strict';

import { fetchData, url } from "./api.js";
import * as module from "./module.js";

/**
 * Add event listener on multiple elements
 * @param {NodeList} elements Elements node array
 * @param {string} evenType Event Type e.g.: "click", "mouseover"
 * @param {Function} callback Callback function
 */

const addEventOnElements = function(elements, evenType, callback) {
    for(const element of elements) element.addEventListener(evenType, callback);
}

/* Toggle search in mobile devices */

const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => searchView.classList.toggle("active");
addEventOnElements(searchTogglers, "click", toggleSearch);

/* SEARCH INTEGRATION */
const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

searchField.addEventListener("input", function () {
    searchTimeout ?? clearTimeout(searchTimeout);

    if (!searchField.value) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        searchField.classList.remove("searching");
    } else {
        searchField.classList.add("searching");
    }

    if(searchField.value) {
        searchTimeout = setTimeout(() => {
            fetchData(url.geo(searchField.value), function (locations) {
                searchField.classList.remove("searching");
                searchResult.classList.add("active");
                searchResult.innerHTML = `
                    <ul class="view-list" data-search-list></ul>
                `;

                const /** {NodeList} | [] */ items = [];

                for (const { name, lat, lon, country, state } of locations) {
                    const searchItem = document.createElement("li");
                    searchItem.classList.add("view-item");

                    searchItem.innerHTML = `
                    <span class="m-icon">location_on</span>

                    <div>
                        <p class="item-title">${name}</p>
                        <p class="label-2 item-subtitle">${state || ""} ${country}</p>
                    </div>

                    <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
                    `;

                    searchResult.querySelector("[data-search-list]").appendChild(searchItem);
                    items.push(searchItem.querySelector("[data-search-toggler]"));
                }

                addEventOnElements(items, "click", function () {
                    toggleSearch();
                    searchResult.classList.remove("active");
                })
            });
        }, searchTimeoutDuration);
    }

});


const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");


/**
 * Render all weather data in html page
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
export const updateWeather = function (lat, lon) {

    loading.style.display = "grid";
    container.style.overflowY = "hidden";
    container.classList.remove("fade-in");
    errorContent.style.display = "none";

    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightSection = document.querySelector("[data-highlights]");
    const forecastSection = document.querySelector("[data-5-day-forecast]");

    currentWeatherSection.innerHTML = "";
    highlightSection.innerHTML = "";
    forecastSection.innerHTML = "";

    if(window.location.hash === "#/current-location") {
        currentLocationBtn.setAttribute("disabled", "");
    } else {
        currentLocationBtn.removeAttribute("disabled");
    }

    /* CURRENT WEATHER SECTION */
    fetchData(url.currentWeather(lat, lon), function(currentWeather) {

        const {
            weather,
            dt: dateUnix,
            sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
            main: { temp, feels_like, pressure, humidity },
            visibility,
            timezone
        } = currentWeather
        const [{ description, icon }] = weather;

        const card = document.createElement("div");
        card.classList.add("card", "card-lg", "current-weather-card");

        card.innerHTML = `
            <h2 class="title-2 card-title">

                    <p class="title-3 meta-text" data-location></p>
            </h2>

            <div class="weapper">
                <p class="heading">${parseInt(temp)}°<sup>c</sup></p>

                <img src="./assets/images/weather_icons/${icon}.png" width="64"
                height="64" alt="${description}" class="weather-icon">
            </div>

            <p class="body-3">${description}</p>

            
        `;

        fetchData(url.reverseGeo(lat, lon), function([{name, country}]) {
            card.querySelector("[data-location]").innerHTML = `${name}, ${country}`
        });

        currentWeatherSection.appendChild(card);

        /* TODAYS HIGHLIGHTS */
        fetchData(url.forecast(lat, lon), function(forecast) {

            const {
                list: forecastList,
                city: { timezone }
            } = forecast;

            const card = document.createElement("div");
            card.classList.add("card", "card-lg");

            card.innerHTML = `
                        
                        <div class="highlight-list">

                            <div class="card card-sm highlight-card one">

                            <h3 class="title-3">Todays Date</h3>

                                <span class="m-icon">calendar_today</span>

                                <p class="title-1 meta-text">${module.getDate(dateUnix, timezone)}</p>

                            </div>

                            <div class="card card-sm highlight-card two">

                                <h3 class="title-3">Sunrise & Sunset</h3>

                                <div class="card-list">

                                    <div class="card-item">
                                        <span class="m-icon">clear_day</span>

                                        <div>
                                            <p class="label-1">Sunrise</p>

                                            <p class="title-1">${module.getTime(sunriseUnixUTC, timezone)}</p>
                                        </div>
                                    </div>

                                    <div class="card-item">
                                        <span class="m-icon">clear_night</span>

                                        <div>
                                            <p class="label-1">Sunset</p>

                                            <p class="title-1">${module.getTime(sunsetUnixUTC, timezone)}</p>
                                        </div>
                                    </div>

                                </div>

                            </div>

                            <div class="card card-sm highlight-card">

                                <h3 class="title-3">Humidity</h3>

                                <div class="wrapper">
                                    <span class="m-icon">humidity_percentage</span>

                                    <p class="title-1">${humidity}<sub>%</sub></p>
                                </div>


                            </div>

                            <div class="card card-sm highlight-card">

                                <h3 class="title-3">Pressure</h3>

                                <div class="wrapper">
                                    <span class="m-icon">airwave</span>

                                    <p class="title-1">${pressure}<sub>hPa</sub></p>
                                </div>


                            </div>

                            <div class="card card-sm highlight-card">

                                <h3 class="title-3">Visibility</h3>

                                <div class="wrapper">
                                    <span class="m-icon">visibility</span>

                                    <p class="title-1">${visibility / 1000}<sub>km</sub></p>
                                </div>


                            </div>

                            <div class="card card-sm highlight-card">

                                <h3 class="title-3">Feels Like</h3>

                                <div class="wrapper">
                                    <span class="m-icon">thermostat</span>

                                    <p class="title-1">${parseInt(feels_like)}°<sup>c</sup></p>
                                </div>


                            </div>

                        </div>
            `;

            highlightSection.appendChild(card);

        });

        /* FORECAST SECTION */
        fetchData(url.forecast(lat, lon), function(forecast) {

            const {
                list: forecastList,
                city: { timezone }
            } = forecast;

            /* 5 DAY FORECAST SECTION */

            forecastSection.innerHTML = `
            <div class="card card-lg forecast-card">
                <ul data-forecast-list></ul>
            </div>
            `;

            for (let i = 9, len = forecastList.length; i < len; i+=10) {

                const {
                    main: { temp_max },
                    weather,
                    dt_txt

                } = forecastList[i];
                const [{ icon, description }] = weather
                const date = new Date(dt_txt);

                const li = document.createElement("li");
                li.classList.add("card-item");

                li.innerHTML = `
                <div class="icon-wrapper">
                    <img src="./assets/images/weather_icons/${icon}.png" 
                    width="36" height="36" alt="${description}" class="weather-icon" title="${description}">

                    <span class="span">
                                <p class="title-2">${parseInt(temp_max)}°c</p>
                    </span>
                </div>

                <p class="label-1">${date.getDate()} ${module.monthNames[date.getUTCMonth()]}</p>

                <p class="label-1">${module.weekDayNames[date.getUTCDay()]}</p>
                `;

                forecastSection.querySelector("[data-forecast-list]").appendChild(li);

            }

            loading.style.display = "none";
            container.style.overflowY = "overlay";
            container.classList.add("fade-in");


        });

    });


}


export const error404 = () => errorContent.style.display = "flex";