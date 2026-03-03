const SUPABASE_FUNCTION_URL = 'https://utughkmxxfwrsctqcktn.supabase.co/functions/v1/get-angel-meaning';

const numberInput = document.getElementById('numberInput');
const searchBtn = document.getElementById('searchBtn');
const inputArea = document.getElementById('inputArea');
const result = document.getElementById('result');
const resultNumber = document.getElementById('resultNumber');
const meanings = document.getElementById('meanings');
const sources = document.getElementById('sources');
const cached = document.getElementById('cached');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorText = document.getElementById('errorText');

const cache = {};

numberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') search();
});

searchBtn.addEventListener('click', search);

async function search() {
    const number = numberInput.value.trim().replace(/\s/g, '');
    
    if (!number || !/^\d+$/.test(number)) {
        showError('Please enter a valid number');
        return;
    }

    if (cache[number]) {
        displayResult(number, cache[number].meanings, cache[number].sources, true);
        return;
    }

    showLoading();
    hideError();
    result.classList.add('hidden');
    result.classList.remove('animate-manifest');

    try {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch meaning');
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        cache[number] = { meanings: data.meanings, sources: data.sources };
        
        setTimeout(() => {
            inputArea.classList.add('opacity-50');
            displayResult(number, data.meanings, data.sources, data.cached || false);
        }, 300);
    } catch (err) {
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        hideLoading();
    }
}

function displayResult(number, meaningsList, sourcesList, isCached) {
    resultNumber.textContent = `Angel Number ${number}`;
    
    meanings.innerHTML = meaningsList
        .map(meaning => `<p class="text-lg text-spirit-deep/80 leading-relaxed border-l-2 border-spirit-accent pl-4">${meaning}</p>`)
        .join('');

    if (sourcesList && sourcesList.length > 0) {
        const sourcesHtml = sourcesList
            .map(source => `<a href="https://${source}" target="_blank" rel="noopener" class="text-spirit-glow hover:underline">${source}</a>`)
            .join(', ');
        sources.innerHTML = `<p class="text-xs text-spirit-accent/60 mt-4">Sources: ${sourcesHtml}</p>`;
        sources.classList.remove('hidden');
    } else {
        sources.classList.add('hidden');
    }

    cached.classList.toggle('hidden', !isCached);
    cached.textContent = isCached ? 'From cache' : '';
    
    result.classList.remove('hidden');
    result.classList.add('animate-manifest');
}

function showLoading() {
    loading.classList.remove('hidden');
    searchBtn.disabled = true;
    searchBtn.classList.add('opacity-50', 'cursor-not-allowed');
}

function hideLoading() {
    loading.classList.add('hidden');
    searchBtn.disabled = false;
    searchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

function showError(message) {
    errorText.textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}
