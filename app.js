// API Keys from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const UNSPLASH_API_KEY = import.meta.env.VITE_UNSPLASH_API_KEY;
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// DOM Elements remain the same
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const resultsSection = document.getElementById('results-section');
const cityName = document.getElementById('city-name');
const cityImage = document.getElementById('city-image');
const weatherInfo = document.getElementById('weather-info');
const eventSuggestions = document.getElementById('event-suggestions');
const travelTips = document.getElementById('travel-tips');
const planTripBtn = document.querySelector('.plan-trip-btn');

// Event Listeners remain the same
searchBtn.addEventListener('click', handleSearch);
planTripBtn.addEventListener('click', () => {
    cityInput.classList.add('shake');
    setTimeout(() => cityInput.classList.remove('shake'), 820);
});

// Helper function to clean markdown formatting
function cleanMarkdownFormatting(text) {
    // Remove bold formatting
    text = text.replace(/\*\*/g, '');
    // Remove italic formatting
    text = text.replace(/\*/g, '');
    // Remove markdown list symbols
    text = text.replace(/^-\s+/gm, '');
    // Remove numbered lists
    text = text.replace(/^\d+\.\s+/gm, '');
    // Remove extra newlines
    text = text.replace(/\n+/g, '\n').trim();
    return text;
}

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    try {
        resultsSection.classList.remove('hidden');
        cityName.textContent = city;

        // Fetch all data concurrently
        const [weatherData, cityImageUrl] = await Promise.all([
            fetchWeather(city),
            fetchCityImage(city)
        ]);

        // Update UI with weather data
        displayWeather(weatherData);

        // Set city image
        cityImage.src = cityImageUrl;

        // Fetch and display AI-generated content
        const weatherCondition = weatherData.current.condition.text;
        await Promise.all([
            generateEventSuggestions(city, weatherCondition),
            generateTravelTips(city)
        ]);

    } catch (error) {
        console.error('Error:', error);
        alert('Error fetching data. Please try again.');
    }
}

// Weather and Image fetch functions remain the same
async function fetchWeather(city) {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city}`);
    if (!response.ok) throw new Error('Weather data fetch failed');
    return response.json();
}

async function fetchCityImage(city) {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${city}&client_id=${UNSPLASH_API_KEY}`);
    if (!response.ok) throw new Error('Image fetch failed');
    const data = await response.json();
    return data.results[0]?.urls.regular || 'default-city-image.jpg';
}

function displayWeather(data) {
    const weather = data.current;
    weatherInfo.innerHTML = `
        <p>Temperature: ${weather.temp_c}°C</p>
        <p>Condition: ${weather.condition.text}</p>
        <p>Humidity: ${weather.humidity}%</p>
        <p>Wind: ${weather.wind_kph} km/h</p>
    `;
}

async function generateEventSuggestions(city, weatherCondition) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Suggest two to three activities or events in ${city} that are ideal for the current weather conditions: ${weatherCondition}. Provide the response in plain text without any formatting or markdown symbols. Keep the response concise and practical.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200,
                }
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const cleanedText = cleanMarkdownFormatting(data.candidates[0].content.parts[0].text);
            eventSuggestions.innerHTML = cleanedText.split('\n').map(line => `<p>${line}</p>`).join('');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error generating event suggestions:', error);
        eventSuggestions.innerHTML = '<p>Error generating suggestions. Please try again.</p>';
    }
}

async function generateTravelTips(city) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Provide three essential travel tips for someone visiting ${city}. Include practical advice, local customs, and cultural insights. Provide the response in plain text without any formatting or markdown symbols. Keep the response concise and practical.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200,
                }
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const cleanedText = cleanMarkdownFormatting(data.candidates[0].content.parts[0].text);
            travelTips.innerHTML = cleanedText.split('\n').map(line => `<p>${line}</p>`).join('');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error generating travel tips:', error);
        travelTips.innerHTML = '<p>Error generating travel tips. Please try again.</p>';
    }
}