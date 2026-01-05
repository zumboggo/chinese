class DiglotWeaveApp {
    constructor() {
        this.weaver = null;
        this.currentText = '';
        this.isPlaying = false;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.learnedWords = new Set();
        this.wordsLearnedToday = 0;
        this.readingProgress = 0;
        
        this.init();
    }
    
    async init() {
        // Load vocabulary data
        await this.loadVocabulary();
        
        // Load story text
        await this.loadStoryText();
        
        // Initialize the diglot weaver
        this.initializeWeaver();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Generate initial text
        this.generateText();
        
        // Update display
        this.updateDisplay();
    }
    
    async loadVocabulary() {
        try {
            const response = await fetch('vocab_cleaned.csv');
            const csvText = await response.text();
            
            // Parse CSV
            const lines = csvText.split('\n').filter(line => line.trim());
            this.vocabulary = [];
            
            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i];
                const parts = line.split(',');
                
                if (parts.length >= 3) {
                    const word = parts[0];
                    const definition = parts[1];
                    const known = parts[2].toLowerCase() === 'true';
                    
                    // Extract pinyin
                    const pinyinMatch = definition.match(/: ([^ ]+) means/);
                    const pinyin = pinyinMatch ? pinyinMatch[1] : '';
                    
                    // Clean definition
                    const cleanDef = definition.replace(/[^:]+: [^ ]+ means /, '').split('\n')[0];
                    
                    this.vocabulary.push({
                        word,
                        definition: cleanDef,
                        pinyin,
                        known
                    });
                }
            }
            
            console.log(`Loaded ${this.vocabulary.length} vocabulary items`);
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            // Fallback to sample data
            this.vocabulary = this.getSampleVocabulary();
        }
    }
    
    getSampleVocabulary() {
        return [
            { word: '我', definition: 'I, me', pinyin: 'wǒ', known: true },
            { word: '你', definition: 'you', pinyin: 'nǐ', known: true },
            { word: '是', definition: 'to be', pinyin: 'shì', known: true },
            { word: '好', definition: 'good', pinyin: 'hǎo', known: true },
            { word: '有', definition: 'to have', pinyin: 'yǒu', known: true },
            { word: '在', definition: 'at, in', pinyin: 'zài', known: true },
            { word: '说', definition: 'to speak', pinyin: 'shuō', known: false },
            { word: '想', definition: 'to think, want', pinyin: 'xiǎng', known: false },
            { word: '爱', definition: 'love', pinyin: 'ài', known: false },
            { word: '时间', definition: 'time', pinyin: 'shíjiān', known: false },
            { word: '人', definition: 'person', pinyin: 'rén', known: false },
            { word: '工作', definition: 'work', pinyin: 'gōngzuò', known: false },
            { word: '生活', definition: 'life', pinyin: 'shēnghuó', known: false },
            { word: '世界', definition: 'world', pinyin: 'shìjiè', known: false },
            { word: '问题', definition: 'question, problem', pinyin: 'wèntí', known: false }
        ];
    }
    
    async loadStoryText() {
        try {
            const response = await fetch('story.txt');
            this.storyText = await response.text();
            console.log(`Loaded story text: ${this.storyText.length} characters`);
        } catch (error) {
            console.error('Error loading story:', error);
            // Fallback to sample text
            this.storyText = this.getSampleStory();
        }
    }
    
    getSampleStory() {
        return `Chapter 1 - Rebirth

A raw, primal scream was being wrenched from my throat, my mind and body wracked by pain, the pain of loss, the pain of death. I felt a strange force invade my mind, grab something, twist, and rip. I cried out in pain, a sense of loss washing over me.

I looked around the room and saw a man standing there. He seemed to be waiting for something. I wanted to ask him what he was doing here, but I couldn't speak. The time passed slowly and I felt very afraid. I needed to find a way to understand what was happening to me.

This was not my world. I had died and been reborn in a strange place. The memories of my old life were fading, but I could still remember some things. I wanted to live, to love, to work and be happy again. But first, I needed to learn how to exist in this new world.`;
    }
    
    initializeWeaver() {
        // Create a simple weaver using the loaded data
        this.weaver = {
            vocabulary: this.vocabulary,
            knownWords: new Set(this.vocabulary.filter(w => w.known).map(w => w.word)),
            unknownWords: this.vocabulary.filter(w => !w.known),
            introducedWords: new Set(),
            
            getEnglishWordMapping: () => {
                const commonChinese = this.vocabulary.slice(0, 100).map(w => w.word);
                return {
                    'I': ['我'],
                    'you': ['你'],
                    'he': ['他'],
                    'she': ['她'],
                    'we': ['我们'],
                    'they': ['他们'],
                    'is': ['是'],
                    'am': ['是'],
                    'are': ['是'],
                    'have': ['有'],
                    'has': ['有'],
                    'do': ['做'],
                    'will': ['会'],
                    'can': ['能'],
                    'want': ['想', '要'],
                    'like': ['喜欢'],
                    'love': ['爱'],
                    'know': ['知道'],
                    'think': ['想', '认为'],
                    'feel': ['感觉'],
                    'see': ['看'],
                    'look': ['看'],
                    'say': ['说'],
                    'tell': ['告诉'],
                    'ask': ['问'],
                    'go': ['去'],
                    'come': ['来'],
                    'good': ['好'],
                    'bad': ['坏'],
                    'big': ['大'],
                    'small': ['小'],
                    'time': ['时间'],
                    'person': ['人'],
                    'people': ['人们'],
                    'work': ['工作'],
                    'life': ['生活', '生命'],
                    'world': ['世界'],
                    'question': ['问题'],
                    'answer': ['回答'],
                    'here': ['这里'],
                    'there': ['那里'],
                    'where': ['哪里'],
                    'what': ['什么'],
                    'who': ['谁'],
                    'why': ['为什么'],
                    'how': ['怎么'],
                    'this': ['这个'],
                    'that': ['那个'],
                    'all': ['全部'],
                    'some': ['一些'],
                    'every': ['每个'],
                    'day': ['天'],
                    'year': ['年'],
                    'water': ['水'],
                    'food': ['食物'],
                    'eat': ['吃'],
                    'drink': ['喝'],
                    'walk': ['走'],
                    'run': ['跑'],
                    'sleep': ['睡觉'],
                    'read': ['读'],
                    'write': ['写'],
                    'book': ['书'],
                    'money': ['钱'],
                    'buy': ['买'],
                    'sell': ['卖'],
                    'help': ['帮助'],
                    'find': ['找到'],
                    'lose': ['失去'],
                    'yes': ['是'],
                    'no': ['不'],
                    'hello': ['你好'],
                    'goodbye': ['再见']
                };
            },
            
            weaveChineseWords: (text, difficultyLevel = 1) => {
                const wordMap = this.weaver.getEnglishWordMapping();
                const words = text.split(/(\s+)/); // Split preserving spaces
                const result = [];
                const chineseWordsIntroduced = [];
                
                // Target ratios for different difficulty levels
                const targetRatios = { 1: 0.02, 2: 0.05, 3: 0.10 };
                const targetRatio = targetRatios[difficultyLevel] || 0.02;
                
                let wordCount = 0;
                
                for (const word of words) {
                    if (word.trim() === '' || !/^[a-zA-Z]+$/.test(word)) {
                        result.push(word);
                        continue;
                    }
                    
                    wordCount++;
                    const wordLower = word.toLowerCase();
                    
                    // Check if we should replace this word
                    if (Math.random() < targetRatio && wordMap[wordLower]) {
                        const chineseOptions = wordMap[wordLower];
                        const chosenWord = chineseOptions[Math.floor(Math.random() * chineseOptions.length)];
                        
                        // Find vocabulary entry
                        const vocabEntry = this.vocabulary.find(v => v.word === chosenWord);
                        
                        // Create highlighted Chinese word
                        const chineseHtml = `<span class="chinese-word" 
                            data-pinyin="${vocabEntry?.pinyin || ''}" 
                            data-definition="${vocabEntry?.definition || ''}" 
                            data-word="${chosenWord}">${chosenWord}</span>`;
                        
                        result.push(chineseHtml);
                        chineseWordsIntroduced.push(chosenWord);
                        this.weaver.introducedWords.add(chosenWord);
                    } else {
                        result.push(word);
                    }
                }
                
                return { text: result.join(''), words: chineseWordsIntroduced };
            }
        };
    }
    
    setupEventListeners() {
        document.getElementById('difficulty').addEventListener('change', () => {
            this.generateText();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playAudio();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseAudio();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetReader();
        });
        
        // Add hover listeners for Chinese words
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('chinese-word')) {
                this.showVocabulary(e.target);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chinese-word')) {
                this.speakChineseWord(e.target.dataset.word);
                this.markWordAsLearned(e.target.dataset.word);
            }
        });
    }
    
    generateText() {
        const difficulty = parseInt(document.getElementById('difficulty').value);
        
        // Get a portion of the story (first few paragraphs)
        const storyParts = this.storyText.split('\n\n');
        const selectedParts = storyParts.slice(0, 5).join('\n\n');
        
        // Generate diglot weave
        const result = this.weaver.weaveChineseWords(selectedParts, difficulty);
        this.currentText = result.text;
        
        // Update display
        document.getElementById('text-display').innerHTML = this.currentText;
        
        // Update Chinese ratio display
        const chineseWordCount = (this.currentText.match(/class="chinese-word"/g) || []).length;
        const totalWords = this.currentText.split(/\s+/).length;
        const ratio = ((chineseWordCount / totalWords) * 100).toFixed(1);
        document.getElementById('chinese-ratio').textContent = ratio + '%';
        
        // Update vocabulary panel
        this.updateVocabularyPanel(result.words);
    }
    
    updateVocabularyPanel(introducedWords) {
        const vocabPanel = document.getElementById('current-vocab');
        
        if (introducedWords.length === 0) {
            vocabPanel.innerHTML = '<p>Hover over Chinese words to see definitions</p>';
            return;
        }
        
        const uniqueWords = [...new Set(introducedWords)];
        const vocabHtml = uniqueWords.map(word => {
            const vocabEntry = this.vocabulary.find(v => v.word === word);
            if (!vocabEntry) return '';
            
            return `
                <div class="vocab-item">
                    <span class="vocab-chinese">${word}</span>
                    <span class="vocab-pinyin">${vocabEntry.pinyin}</span>
                    <span class="vocab-definition">${vocabEntry.definition}</span>
                </div>
            `;
        }).join('');
        
        vocabPanel.innerHTML = vocabHtml || '<p>Hover over Chinese words to see definitions</p>';
    }
    
    showVocabulary(element) {
        const word = element.dataset.word;
        const pinyin = element.dataset.pinyin;
        const definition = element.dataset.definition;
        
        // You could add a more sophisticated tooltip here
        console.log(`${word} (${pinyin}): ${definition}`);
    }
    
    playAudio() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('play-btn').disabled = true;
        
        // Extract text content for speech (remove HTML tags)
        const textContent = this.currentText.replace(/<[^>]*>/g, ' ');
        
        // Split into sentences for better control
        const sentences = textContent.split(/[.!?]+/);
        let currentIndex = 0;
        
        const speakNext = () => {
            if (currentIndex >= sentences.length || !this.isPlaying) {
                this.stopAudio();
                return;
            }
            
            const sentence = sentences[currentIndex].trim();
            if (sentence) {
                this.currentUtterance = new SpeechSynthesisUtterance(sentence);
                this.currentUtterance.rate = 0.8; // Slightly slower for learning
                this.currentUtterance.pitch = 1;
                this.currentUtterance.volume = 1;
                
                this.currentUtterance.onend = () => {
                    currentIndex++;
                    setTimeout(speakNext, 500); // Small pause between sentences
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
    
    resetReader() {
        this.stopAudio();
        this.generateText();
        this.wordsLearnedToday = 0;
        this.readingProgress = 0;
        this.updateDisplay();
    }
    
    speakChineseWord(word) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'zh-CN'; // Chinese
        utterance.rate = 0.7;
        utterance.pitch = 1;
        this.speechSynthesis.speak(utterance);
    }
    
    markWordAsLearned(word) {
        if (!this.learnedWords.has(word)) {
            this.learnedWords.add(word);
            this.wordsLearnedToday++;
            this.updateDisplay();
            
            // Add visual feedback
            const wordElements = document.querySelectorAll(`[data-word="${word}"]`);
            wordElements.forEach(el => {
                el.style.background = '#c6f6d5';
                el.style.borderRadius = '4px';
            });
        }
    }
    
    updateDisplay() {
        document.getElementById('learning-count').textContent = this.learnedWords.size;
        document.getElementById('words-learned').textContent = this.wordsLearnedToday;
        document.getElementById('reading-progress').textContent = this.readingProgress + '%';
        document.getElementById('progress-fill').style.width = this.readingProgress + '%';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DiglotWeaveApp();
});

// Add some utility functions for text processing
function extractTextFromHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}

function countChineseWords(text) {
    const matches = text.match(/[\u4e00-\u9fff]+/g);
    return matches ? matches.length : 0;
}

function calculateComprehensionRatio(englishWords, chineseWords) {
    const total = englishWords + chineseWords;
    if (total === 0) return 100;
    return ((englishWords / total) * 100).toFixed(1);
}