class AdvancedDiglotWeaveApp {
    constructor() {
        this.vocabulary = [];
        this.storyText = '';
        this.currentText = '';
        this.currentChunk = 0;
        this.chunkSize = 200;
        this.difficulty = 1;
        this.isPlaying = false;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        
        // Learning tracking
        this.knownWords = new Set();
        this.learningWords = new Set();
        this.introducedWords = new Set();
        this.wordsLearnedToday = 0;
        this.totalWordsEncountered = 0;
        
        // Audio settings
        this.speechRate = 0.8;
        this.speechPitch = 1;
        
        this.init();
    }
    
    async init() {
        // Show loading state
        this.showLoading('Loading vocabulary and story...');
        
        try {
            // Load data
            await this.loadVocabulary();
            await this.loadStoryText();
            
            // Initialize UI
            this.setupEventListeners();
            this.updateStats();
            
            // Hide loading
            this.hideLoading();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }
    
    async loadVocabulary() {
        try {
            const response = await fetch('vocabulary.json');
            this.vocabulary = await response.json();
            
            // Separate known and unknown words
            this.knownWords = new Set(this.vocabulary.filter(w => w.known).map(w => w.word));
            this.unknownWords = this.vocabulary.filter(w => !w.known);
            
            console.log(`Loaded ${this.vocabulary.length} vocabulary items`);
            console.log(`Known: ${this.knownWords.size}, Unknown: ${this.unknownWords.length}`);
            
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            throw error;
        }
    }
    
    async loadStoryText() {
        try {
            const response = await fetch('story_sample.txt');
            this.storyText = await response.text();
            
            console.log(`Loaded story: ${this.storyText.length} characters`);
            
        } catch (error) {
            console.error('Error loading story:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Controls
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
            this.generateText();
        });
        
        document.getElementById('chunk-size').addEventListener('change', (e) => {
            this.chunkSize = parseInt(e.target.value);
            this.currentChunk = 0;
            this.generateText();
        });
        
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateText();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playAudio();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseAudio();
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextChunk();
        });
        
        // Tooltip actions
        document.getElementById('learn-word-btn').addEventListener('click', () => {
            this.markWordAsLearned(this.currentTooltipWord);
            this.hideTooltip();
        });
        
        document.getElementById('speak-word-btn').addEventListener('click', () => {
            this.speakChineseWord(this.currentTooltipWord);
        });
        
        // Word interactions
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('chinese-word')) {
                this.showTooltip(e.target, e);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('chinese-word')) {
                this.hideTooltip();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chinese-word')) {
                this.speakChineseWord(e.target.dataset.word);
            }
        });
        
        // Hide tooltip when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tooltip') && !e.target.classList.contains('chinese-word')) {
                this.hideTooltip();
            }
        });
    }
    
    generateText() {
        this.showLoading('Generating diglot weave text...');
        
        // Get text chunk
        const words = this.storyText.split(/\s+/);
        const startIndex = this.currentChunk * this.chunkSize;
        const endIndex = Math.min(startIndex + this.chunkSize, words.length);
        const chunk = words.slice(startIndex, endIndex).join(' ');
        
        // Generate diglot weave
        const result = this.createDiglotWeave(chunk, this.difficulty);
        
        // Update display
        document.getElementById('text-display').innerHTML = result.html;
        this.currentText = result.html;
        
        // Update statistics
        this.updateTextStats(result);
        
        // Update vocabulary panels
        this.updateVocabularyPanels(result.newWords);
        
        this.hideLoading();
    }
    
    createDiglotWeave(text, difficulty) {
        const englishWordMap = this.getEnglishWordMapping();
        const words = text.split(/(\s+)/); // Split preserving spaces
        const result = [];
        const newWords = [];
        
        // Target ratios for different difficulty levels
        const targetRatios = { 1: 0.02, 2: 0.05, 3: 0.10 };
        const targetRatio = targetRatios[difficulty] || 0.02;
        
        let wordCount = 0;
        
        for (const word of words) {
            // Skip punctuation and spaces
            if (word.trim() === '' || !/^[a-zA-Z]+$/.test(word)) {
                result.push(word);
                continue;
            }
            
            wordCount++;
            const wordLower = word.toLowerCase();
            
            // Check if we should replace this word
            if (Math.random() < targetRatio && englishWordMap[wordLower]) {
                const chineseOptions = englishWordMap[wordLower];
                const chosenWord = chineseOptions[Math.floor(Math.random() * chineseOptions.length)];
                
                // Find vocabulary entry
                const vocabEntry = this.vocabulary.find(v => v.word === chosenWord);
                
                if (vocabEntry) {
                    // Create highlighted Chinese word
                    const isNew = !this.introducedWords.has(chosenWord);
                    const chineseHtml = `<span class="chinese-word ${isNew ? 'new-word' : ''}" 
                        data-pinyin="${vocabEntry.pinyin}" 
                        data-definition="${vocabEntry.definition}" 
                        data-word="${chosenWord}">${chosenWord}</span>`;
                    
                    result.push(chineseHtml);
                    
                    if (isNew) {
                        newWords.push(vocabEntry);
                        this.introducedWords.add(chosenWord);
                    }
                } else {
                    result.push(word);
                }
            } else {
                result.push(word);
            }
        }
        
        return {
            html: result.join(''),
            newWords: newWords,
            totalWords: wordCount,
            chineseWords: newWords.length
        };
    }
    
    getEnglishWordMapping() {
        // Create mapping from English words to Chinese translations
        // This uses the most common Chinese words from the vocabulary
        const commonWords = this.vocabulary.slice(0, 150).map(w => w.word);
        
        return {
            'I': ['我'],
            'you': ['你', '您'],
            'he': ['他'],
            'she': ['她'],
            'we': ['我们'],
            'they': ['他们'],
            'is': ['是'],
            'am': ['是'],
            'are': ['是'],
            'was': ['是'],
            'were': ['是'],
            'be': ['是'],
            'have': ['有'],
            'has': ['有'],
            'had': ['有'],
            'do': ['做'],
            'does': ['做'],
            'did': ['做'],
            'will': ['会', '将'],
            'would': ['会'],
            'could': ['能'],
            'can': ['能', '可以'],
            'should': ['应该'],
            'may': ['可以', '也许'],
            'might': ['可能'],
            'must': ['必须'],
            'need': ['需要'],
            'want': ['想', '要'],
            'like': ['喜欢'],
            'love': ['爱'],
            'hate': ['讨厌'],
            'know': ['知道'],
            'think': ['想', '认为'],
            'believe': ['相信'],
            'feel': ['感觉'],
            'see': ['看'],
            'look': ['看'],
            'watch': ['看', '观看'],
            'hear': ['听'],
            'listen': ['听'],
            'speak': ['说'],
            'say': ['说'],
            'tell': ['告诉'],
            'ask': ['问'],
            'answer': ['回答'],
            'go': ['去'],
            'come': ['来'],
            'leave': ['离开'],
            'arrive': ['到达'],
            'good': ['好'],
            'bad': ['坏'],
            'well': ['好'],
            'better': ['更好'],
            'best': ['最好'],
            'big': ['大'],
            'small': ['小'],
            'large': ['大'],
            'little': ['小'],
            'long': ['长'],
            'short': ['短'],
            'high': ['高'],
            'low': ['低'],
            'old': ['老'],
            'new': ['新'],
            'young': ['年轻'],
            'here': ['这里'],
            'there': ['那里'],
            'where': ['哪里'],
            'now': ['现在'],
            'then': ['然后'],
            'when': ['什么时候'],
            'why': ['为什么'],
            'how': ['怎么'],
            'what': ['什么'],
            'who': ['谁'],
            'which': ['哪个'],
            'this': ['这个'],
            'that': ['那个'],
            'all': ['全部'],
            'some': ['一些'],
            'any': ['任何'],
            'every': ['每个'],
            'each': ['每个'],
            'person': ['人'],
            'people': ['人们'],
            'man': ['男人'],
            'woman': ['女人'],
            'child': ['孩子'],
            'time': ['时间'],
            'day': ['天'],
            'year': ['年'],
            'month': ['月'],
            'week': ['周'],
            'hour': ['小时'],
            'minute': ['分钟'],
            'second': ['秒'],
            'morning': ['早上'],
            'afternoon': ['下午'],
            'evening': ['晚上'],
            'night': ['晚上'],
            'today': ['今天'],
            'yesterday': ['昨天'],
            'tomorrow': ['明天'],
            'world': ['世界'],
            'country': ['国家'],
            'city': ['城市'],
            'place': ['地方'],
            'home': ['家'],
            'house': ['房子'],
            'room': ['房间'],
            'water': ['水'],
            'fire': ['火'],
            'food': ['食物'],
            'eat': ['吃'],
            'drink': ['喝'],
            'walk': ['走'],
            'run': ['跑'],
            'sit': ['坐'],
            'stand': ['站'],
            'sleep': ['睡觉'],
            'work': ['工作'],
            'study': ['学习'],
            'read': ['读'],
            'write': ['写'],
            'book': ['书'],
            'money': ['钱'],
            'buy': ['买'],
            'sell': ['卖'],
            'help': ['帮助'],
            'find': ['找到'],
            'lose': ['失去'],
            'get': ['得到'],
            'give': ['给'],
            'take': ['拿'],
            'life': ['生命', '生活'],
            'death': ['死'],
            'health': ['健康'],
            'sick': ['生病'],
            'pain': ['痛'],
            'happy': ['高兴'],
            'sad': ['难过'],
            'angry': ['生气'],
            'afraid': ['害怕'],
            'hope': ['希望'],
            'wish': ['希望'],
            'dream': ['梦想'],
            'yes': ['是'],
            'no': ['不'],
            'hello': ['你好'],
            'goodbye': ['再见']
        };
    }
    
    updateTextStats(result) {
        // Calculate Chinese ratio
        const chineseRatio = ((result.chineseWords / result.totalWords) * 100).toFixed(1);
        document.getElementById('chinese-ratio').textContent = chineseRatio + '%';
        
        // Update comprehension
        const comprehension = (100 - (result.chineseWords / result.totalWords) * 100).toFixed(1);
        document.getElementById('comprehension').textContent = comprehension + '%';
        
        // Update total words encountered
        this.totalWordsEncountered += result.totalWords;
        document.getElementById('total-words').textContent = this.totalWordsEncountered;
        
        // Update story progress
        const totalChunks = Math.ceil(this.storyText.split(/\s+/).length / this.chunkSize);
        const progress = ((this.currentChunk + 1) / totalChunks * 100).toFixed(1);
        document.getElementById('story-progress').textContent = progress + '%';
    }
    
    updateVocabularyPanels(newWords) {
        // Update current vocabulary panel
        const vocabPanel = document.getElementById('current-vocab');
        
        if (newWords.length === 0) {
            vocabPanel.innerHTML = '<p>No new Chinese words in this section</p>';
        } else {
            const vocabHtml = newWords.map(word => `
                <div class="vocab-item">
                    <span class="vocab-chinese">${word.word}</span>
                    <span class="vocab-pinyin">${word.pinyin}</span>
                    <span class="vocab-definition">${word.definition}</span>
                </div>
            `).join('');
            vocabPanel.innerHTML = vocabHtml;
        }
        
        // Update recent words panel
        this.updateRecentWordsPanel();
    }
    
    updateRecentWordsPanel() {
        const recentPanel = document.getElementById('recent-words');
        const recentWords = Array.from(this.introducedWords).slice(-10); // Last 10 words
        
        if (recentWords.length === 0) {
            recentPanel.innerHTML = '<p>No new words introduced yet</p>';
        } else {
            const recentHtml = recentWords.map(word => {
                const vocabEntry = this.vocabulary.find(v => v.word === word);
                return vocabEntry ? `
                    <div class="recent-word-item">
                        <span class="recent-chinese">${word}</span>
                        <span class="recent-pinyin">${vocabEntry.pinyin}</span>
                        <span class="recent-definition">${vocabEntry.definition}</span>
                        ${this.knownWords.has(word) ? '<span class="learned-badge">✓</span>' : ''}
                    </div>
                ` : '';
            }).join('');
            recentPanel.innerHTML = recentHtml;
        }
    }
    
    showTooltip(element, event) {
        const tooltip = document.getElementById('word-tooltip');
        const word = element.dataset.word;
        const pinyin = element.dataset.pinyin;
        const definition = element.dataset.definition;
        
        // Update tooltip content
        tooltip.querySelector('.tooltip-chinese').textContent = word;
        tooltip.querySelector('.tooltip-pinyin').textContent = pinyin;
        tooltip.querySelector('.tooltip-definition').textContent = definition;
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - 10) + 'px';
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        tooltip.style.display = 'block';
        
        this.currentTooltipWord = word;
    }
    
    hideTooltip() {
        document.getElementById('word-tooltip').style.display = 'none';
    }
    
    speakChineseWord(word) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'zh-CN';
        utterance.rate = this.speechRate;
        utterance.pitch = this.speechPitch;
        this.speechSynthesis.speak(utterance);
    }
    
    markWordAsLearned(word) {
        if (!this.knownWords.has(word)) {
            this.knownWords.add(word);
            this.wordsLearnedToday++;
            this.updateStats();
            
            // Add visual feedback
            const wordElements = document.querySelectorAll(`[data-word="${word}"]`);
            wordElements.forEach(el => {
                el.style.background = '#c6f6d5';
                el.style.borderRadius = '4px';
                el.classList.add('learned');
            });
            
            console.log(`Marked "${word}" as learned`);
        }
    }
    
    playAudio() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('play-btn').disabled = true;
        
        // Extract text content for speech
        const textContent = this.currentText.replace(/<[^>]*>/g, ' ');
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim());
        
        let currentIndex = 0;
        
        const speakNext = () => {
            if (currentIndex >= sentences.length || !this.isPlaying) {
                this.stopAudio();
                return;
            }
            
            const sentence = sentences[currentIndex].trim();
            if (sentence) {
                this.currentUtterance = new SpeechSynthesisUtterance(sentence);
                this.currentUtterance.rate = this.speechRate;
                this.currentUtterance.pitch = this.speechPitch;
                this.currentUtterance.volume = 1;
                
                this.currentUtterance.onend = () => {
                    currentIndex++;
                    setTimeout(speakNext, 300);
                };
                
                this.speechSynthesis.speak(this.currentUtterance);
            } else {
                currentIndex++;
                speakNext();
            }
        };
        
        speakNext();
    }
    
    pauseAudio() {
        if (this.currentUtterance) {
            this.speechSynthesis.cancel();
        }
        this.isPlaying = false;
        document.getElementById('play-btn').disabled = false;
    }
    
    stopAudio() {
        this.pauseAudio();
        this.currentUtterance = null;
    }
    
    nextChunk() {
        const totalChunks = Math.ceil(this.storyText.split(/\s+/).length / this.chunkSize);
        if (this.currentChunk < totalChunks - 1) {
            this.currentChunk++;
            this.generateText();
        }
    }
    
    updateStats() {
        document.getElementById('known-count').textContent = this.knownWords.size;
        document.getElementById('learning-count').textContent = this.introducedWords.size - this.knownWords.size;
        document.getElementById('words-learned-today').textContent = this.wordsLearnedToday;
        document.getElementById('total-words').textContent = this.totalWordsEncountered;
    }
    
    showLoading(message) {
        document.getElementById('text-display').innerHTML = `<div class="loading">${message}</div>`;
    }
    
    hideLoading() {
        // Loading is replaced by generated text
    }
    
    showError(message) {
        document.getElementById('text-display').innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedDiglotWeaveApp();
});