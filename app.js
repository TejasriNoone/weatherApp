document.addEventListener('DOMContentLoaded', () => {
    // API configuration
    const apiKey = "7e5739cdb60311fbb745c0826878e3bb";
    const currentUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
    const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

    // DOM elements
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const locationBtn = document.getElementById("current-location-btn");
    const errorMessage = document.getElementById("error-message");
    const weatherInfo = document.getElementById("weather-info");
    const forecastContainer = document.getElementById("forecast-container");

    const cityName = document.getElementById("city-name");
    const temperature = document.getElementById("temperature");
    const humidity = document.getElementById("humidity");
    const windSpeed = document.getElementById("wind-speed");
    const weatherIcon = document.getElementById("weather-icon");

    const forecastList = document.getElementById("forecast-list");

    const dropdown = document.getElementById("recent-cities-dropdown");
    const recentList = document.getElementById("recent-cities-list");

    // Weather icon mapping
    const weatherIcons = {
        "01d": "clear",
        "01n": "clear",
        "02d": "clouds",
        "02n": "clouds",
        "03d": "clouds",
        "03n": "clouds",
        "04d": "clouds",
        "04n": "clouds",
        "09d": "rain",
        "09n": "rain",
        "10d": "rain",
        "10n": "rain",
        "11d": "thunderstorm",
        "11n": "thunderstorm",
        "13d": "snow",
        "13n": "snow",
        "50d": "mist",
        "50n": "mist"
    };

    // Load recent cities from localStorage or initialize as empty
    let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];
    let suppressDropdownTemporarily = false; // To prevent dropdown flickering

    // Populate dropdown with recent cities
    function updateDropdown() {
        if (suppressDropdownTemporarily) return;

        recentList.innerHTML = "";
        if (recentCities.length === 0) {
            dropdown.classList.add("hidden");
            return;
        }

        // Create list items for each recent city
        recentCities.forEach(city => {
            const li = document.createElement("li");
            li.className = "px-4 py-2 hover:bg-gray-100 cursor-pointer";
            li.textContent = city;
            li.onclick = () => {
                searchInput.value = city;
                fetchWeather(city);
                dropdown.classList.add("hidden");
            };
            recentList.appendChild(li);
        });

        dropdown.classList.remove("hidden");
    }

    // Add searched city to recent list
    function addToRecent(city) {
        recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
        recentCities.unshift(city);
        recentCities = recentCities.slice(0, 5); // Limit to 5 recent cities
        localStorage.setItem("recentCities", JSON.stringify(recentCities));
    }

    // Display error message
    function showError(msg) {
        errorMessage.querySelector("p").textContent = msg;
        errorMessage.classList.remove("hidden");
        weatherInfo.classList.add("hidden");
        forecastContainer.classList.add("hidden");
    }

    // Hide error message
    function hideError() {
        errorMessage.classList.add("hidden");
    }

    // Fetch API data and handle HTTP errors
    async function fetchWeatherData(url) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(res.status === 404 ? "City not found" : "Weather data unavailable");
        }
        return await res.json();
    }

    // Fetch both current and forecast weather
    async function fetchWeather(city) {
        try {
            const weatherData = await fetchWeatherData(`${currentUrl}${city}&appid=${apiKey}`);
            const forecastData = await fetchWeatherData(`${forecastUrl}${city}&appid=${apiKey}`);

            displayWeather(weatherData);
            displayForecast(forecastData);
            addToRecent(city);
        } catch (err) {
            showError(err.message);
        }
    }

    // Update UI with current weather data
    function displayWeather(data) {
        cityName.textContent = data.name;
        temperature.textContent = `${Math.round(data.main.temp)}°c`;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${data.wind.speed} km/h`;

        const icon = data.weather[0].icon;
        weatherIcon.src = `images/${weatherIcons[icon]}.png`;
        weatherIcon.alt = data.weather[0].main;

        weatherInfo.classList.remove("hidden");
        hideError();
    }

    // Update UI with forecast data (midday entries only)
    function displayForecast(data) {
        forecastList.innerHTML = "";

        const daily = data.list.filter(f => f.dt_txt.includes("12:00:00")).slice(0, 5);

        daily.forEach(day => {
            const date = new Date(day.dt * 1000);
            const div = document.createElement("div");
            div.className = "bg-white/20 p-2 rounded-lg";
            div.innerHTML = `
                <p class="font-medium">${date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                <img src="images/${weatherIcons[day.weather[0].icon]}.png" alt="${day.weather[0].main}" class="w-12 mx-auto my-1" />
                <p class="text-xl font-medium">${Math.round(day.main.temp)}°c</p>
                <div class="flex justify-between text-sm mt-1">
                    <span><i class="fas fa-tint mr-1"></i>${day.main.humidity}%</span>
                    <span><i class="fas fa-wind mr-1"></i>${day.wind.speed} km/h</span>
                </div>
            `;
            forecastList.appendChild(div);
        });

        forecastContainer.classList.remove("hidden");
    }

    // Use browser geolocation to get weather for user's location
    function fetchLocationWeather() {
        if (!navigator.geolocation) {
            showError("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(async pos => {
            try {
                const { latitude, longitude } = pos.coords;
                const weatherData = await fetchWeatherData(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
                const forecastData = await fetchWeatherData(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);

                displayWeather(weatherData);
                displayForecast(forecastData);
                addToRecent(weatherData.name);
            } catch (err) {
                showError(err.message);
            }
        }, () => {
            showError("Unable to retrieve your location");
        });
    }

    // Hide dropdown and suppress re-showing for a short duration
    function hideDropdownTemporarily() {
        dropdown.classList.add("hidden");
        suppressDropdownTemporarily = true;
        setTimeout(() => suppressDropdownTemporarily = false, 500);
    }

    // Search button click handler
    searchBtn.onclick = () => {
        const city = searchInput.value.trim();
        if (city) {
            fetchWeather(city);
            hideDropdownTemporarily(); // Hide dropdown after search
        } else {
            showError("Please enter a city name");
        }
    };

    // Trigger search on Enter key press
    searchInput.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            searchBtn.click();
            hideDropdownTemporarily(); // Hide dropdown after Enter key is pressed
        }
    });

    // Show dropdown on input focus (if not suppressed)
    searchInput.addEventListener("focus", () => {
        if (recentCities.length > 0 && !suppressDropdownTemporarily) {
            updateDropdown();
        }
    });

    // Hide dropdown when clicking outside input or dropdown
    document.addEventListener("click", e => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });

    // Current location button click
    locationBtn.onclick = fetchLocationWeather;

    // Initialize dropdown on page load
    updateDropdown();
});