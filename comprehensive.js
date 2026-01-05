class ComprehensiveDiglotWeaveApp {
    constructor() {
        // Core data
        this.vocabulary = [];
        this.storyText = '';
        this.currentText = '';
        this.currentChunk = 0;
        this.chunkSize = 500;
        this.difficulty = 1;
        
        // Audio system
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPlaying = false;
        this.selectedVoice = null;
        this.speechRate = 0.8;
        
        // Learning system
        this.knownWords = new Set();
        this.learningWords = new Map(); // word -> {exposures, lastSeen, contexts}
        this.introducedWords = new Set();
        this.wordsLearnedToday = 0;
        this.totalExposures = 0;
        this.autoPromoteThreshold = 30;
        this.autoPromoteEnabled = true;
        
        // Progress tracking
        this.totalWordsProcessed = 0;
        this.chineseWordsInCurrentText = 0;
        
        // UI state
        this.currentTooltipWord = null;
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoading('Loading vocabulary and story...');
            
            // Load data
            await this.loadVocabulary();
            await this.loadStoryText();
            
            // Setup UI
            this.setupEventListeners();
            this.loadAvailableVoices();
            this.updateStats();
            
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
            
            // Initialize known words
            this.knownWords = new Set(this.vocabulary.filter(w => w.known).map(w => w.word));
            
            console.log(`Loaded ${this.vocabulary.length} vocabulary items`);
            console.log(`Known words: ${this.knownWords.size}`);
            
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            throw error;
        }
    }
    
    async loadStoryText() {
        try {
            const response = await fetch('story.txt');
            this.storyText = await response.text();
            
            console.log(`Loaded story: ${this.storyText.length} characters`);
            
        } catch (error) {
            console.error('Error loading story:', error);
            // Use a fallback story
            this.storyText = this.getFallbackStory();
        }
    }
    
    getFallbackStory() {
        return `Chapter 1 - Rebirth

A raw, primal scream was being wrenched from my throat, my mind and body wracked by pain, the pain of loss, the pain of death. I felt a strange force invade my mind, grab something, twist, and rip. I cried out in pain, a sense of loss washing over me. My mouth closed, and every breath sent flames of torment through me as it came in my sore throat.

I looked around the room and saw a man standing there. He seemed to be waiting for something. I wanted to ask him what he was doing here, but I couldn't speak. The time passed slowly and I felt very afraid. I needed to find a way to understand what was happening to me.

This was not my world. I had died and been reborn in a strange place. The memories of my old life were fading, but I could still remember some things. I wanted to live, to love, to work and be happy again. But first, I needed to learn how to exist in this new world.

The man approached me slowly. He looked at me with curious eyes and spoke in a language I didn't understand. I shook my head, trying to communicate that I couldn't understand him. He seemed to realize this and began using gestures to communicate.

We spent hours trying to understand each other. He taught me simple words for things around us. I learned to say water, food, and help in his language. He was patient and kind, and I began to feel less afraid.

Days turned into weeks, and I learned more each day. The man, whose name I learned was Li, became my teacher and friend. He taught me about this new world I had entered, about the people and their customs.

I discovered that I had been reborn in a world very different from my own. Here, people had abilities that seemed like magic to me. They could manipulate elements, heal with touch, and communicate through thoughts.

Li explained that I had potential within me, but it would take time to awaken. He encouraged me to be patient and to continue learning. Every day brought new discoveries and challenges, but I was determined to make the most of this second chance at life.`;
    }
    
    setupEventListeners() {
        // File upload
        const uploadSection = document.getElementById('upload-section');
        const fileInput = document.getElementById('file-input');
        
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });
        
        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('dragover');
        });
        
        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
        
        // Controls
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
            this.generateText();
        });
        
        document.getElementById('chunk-size').addEventListener('change', (e) => {
            const size = e.target.value;
            this.chunkSize = size === 'all' ? Infinity : parseInt(size);
            this.currentChunk = 0;
            this.generateText();
        });
        
        document.getElementById('speech-rate').addEventListener('input', (e) => {
            this.speechRate = parseFloat(e.target.value);
            document.getElementById('rate-value').textContent = this.speechRate + 'x';
        });
        
        document.getElementById('exposure-threshold-input').addEventListener('change', (e) => {
            this.autoPromoteThreshold = parseInt(e.target.value);
            document.getElementById('threshold-display').textContent = this.autoPromoteThreshold;
            document.getElementById('exposure-threshold').textContent = this.autoPromoteThreshold;
        });
        
        document.getElementById('auto-promote-enabled').addEventListener('change', (e) => {
            this.autoPromoteEnabled = e.target.checked;
        });
        
        document.getElementById('voice-select').addEventListener('change', (e) => {
            this.selectedVoice = this.availableVoices.find(v => v.name === e.target.value);
        });
        
        // Buttons
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateText();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playAudio();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseAudio();
        });
        
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousChunk();
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
                this.recordWordExposure(e.target.dataset.word);
            }
        });
    }
    
    async handleFileUpload(file) {
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            this.showUploadStatus('Please upload a .txt or .md file', 'error');
            return;
        }
        
        try {
            const text = await file.text();
            this.storyText = text;
            this.currentChunk = 0;
            this.showUploadStatus(`Loaded: ${file.name} (${text.length} characters)`, 'success');
            this.generateText();
        } catch (error) {
            console.error('File upload error:', error);
            this.showUploadStatus('Error reading file', 'error');
        }
    }
    
    showUploadStatus(message, type) {
        const status = document.getElementById('upload-status');
        status.textContent = message;
        status.style.color = type === 'error' ? '#e53e3e' : '#38a169';
        setTimeout(() => {
            status.textContent = '';
        }, 5000);
    }
    
    loadAvailableVoices() {
        const populateVoices = () => {
            this.availableVoices = this.speechSynthesis.getVoices();
            const voiceSelect = document.getElementById('voice-select');
            
            // Filter for English voices
            const englishVoices = this.availableVoices.filter(voice => 
                voice.lang.startsWith('en') || voice.lang.startsWith('en-US')
            );
            
            voiceSelect.innerHTML = englishVoices.map(voice => 
                `<option value="${voice.name}">${voice.name} (${voice.lang})</option>`
            ).join('');
            
            // Set default voice
            if (englishVoices.length > 0) {
                this.selectedVoice = englishVoices[0];
                voiceSelect.value = this.selectedVoice.name;
            }
        };
        
        populateVoices();
        this.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    }
    
    generateText() {
        this.showLoading('Generating diglot weave text...');
        
        // Get text chunk
        const words = this.storyText.split(/\s+/);
        const totalChunks = Math.ceil(words.length / this.chunkSize);
        
        if (this.currentChunk >= totalChunks) {
            this.currentChunk = 0;
        }
        
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
        
        // Update navigation
        this.updateNavigation(totalChunks);
        
        this.hideLoading();
    }
    
    createDiglotWeave(text, difficulty) {
        const englishWordMap = this.getEnglishWordMapping();
        const words = text.split(/(\s+)/); // Split preserving spaces
        const result = [];
        const newWords = [];
        let chineseWordCount = 0;
        
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
                
                if (vocabEntry && !this.knownWords.has(chosenWord)) {
                    // Get exposure count
                    const exposureCount = this.learningWords.get(chosenWord)?.exposures || 0;
                    const isNew = !this.introducedWords.has(chosenWord);
                    
                    // Create Chinese word with exposure counter
                    const exposureTag = exposureCount > 0 ? `<span class="exposure-counter">${exposureCount}</span>` : '';
                    const chineseHtml = `<span class="chinese-word ${isNew ? 'new-word' : ''}" 
                        data-pinyin="${vocabEntry.pinyin}" 
                        data-definition="${vocabEntry.definition}" 
                        data-word="${chosenWord}">${chosenWord}${exposureTag}</span>`;
                    
                    result.push(chineseHtml);
                    chineseWordCount++;
                    
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
            chineseWords: chineseWordCount
        };
    }
    
    getEnglishWordMapping() {
        // Create mapping from English words to Chinese translations
        // Uses only words that are in our vocabulary and not yet known
        const availableWords = this.vocabulary.filter(v => !this.knownWords.has(v.word));
        const availableChineseWords = new Set(availableWords.map(v => v.word));
        
        const createMapping = (englishWords, chineseOptions) => {
            return chineseOptions.filter(word => availableChineseWords.has(word));
        };
        
        return {
            'I': createMapping(['I'], ['我']),
            'you': createMapping(['you'], ['你', '您']),
            'he': createMapping(['he'], ['他']),
            'she': createMapping(['she'], ['她']),
            'we': createMapping(['we'], ['我们']),
            'they': createMapping(['they'], ['他们']),
            'is': createMapping(['is'], ['是']),
            'am': createMapping(['am'], ['是']),
            'are': createMapping(['are'], ['是']),
            'was': createMapping(['was'], ['是']),
            'were': createMapping(['were'], ['是']),
            'be': createMapping(['be'], ['是']),
            'have': createMapping(['have'], ['有']),
            'has': createMapping(['has'], ['有']),
            'had': createMapping(['had'], ['有']),
            'do': createMapping(['do'], ['做']),
            'does': createMapping(['does'], ['做']),
            'did': createMapping(['did'], ['做']),
            'will': createMapping(['will'], ['会', '将']),
            'would': createMapping(['would'], ['会']),
            'could': createMapping(['could'], ['能']),
            'can': createMapping(['can'], ['能', '可以']),
            'should': createMapping(['should'], ['应该']),
            'may': createMapping(['may'], ['可以', '也许']),
            'might': createMapping(['might'], ['可能']),
            'must': createMapping(['must'], ['必须']),
            'need': createMapping(['need'], ['需要']),
            'want': createMapping(['want'], ['想', '要']),
            'like': createMapping(['like'], ['喜欢']),
            'love': createMapping(['love'], ['爱']),
            'hate': createMapping(['hate'], ['讨厌']),
            'know': createMapping(['know'], ['知道']),
            'think': createMapping(['think'], ['想', '认为']),
            'believe': createMapping(['believe'], ['相信']),
            'feel': createMapping(['feel'], ['感觉']),
            'see': createMapping(['see'], ['看']),
            'look': createMapping(['look'], ['看']),
            'watch': createMapping(['watch'], ['看', '观看']),
            'hear': createMapping(['hear'], ['听']),
            'listen': createMapping(['listen'], ['听']),
            'speak': createMapping(['speak'], ['说']),
            'say': createMapping(['say'], ['说']),
            'tell': createMapping(['tell'], ['告诉']),
            'ask': createMapping(['ask'], ['问']),
            'answer': createMapping(['answer'], ['回答']),
            'go': createMapping(['go'], ['去']),
            'come': createMapping(['come'], ['来']),
            'leave': createMapping(['leave'], ['离开']),
            'arrive': createMapping(['arrive'], ['到达']),
            'good': createMapping(['good'], ['好']),
            'bad': createMapping(['bad'], ['坏']),
            'well': createMapping(['well'], ['好']),
            'better': createMapping(['better'], ['更好']),
            'best': createMapping(['best'], ['最好']),
            'big': createMapping(['big'], ['大']),
            'small': createMapping(['small'], ['小']),
            'large': createMapping(['large'], ['大']),
            'little': createMapping(['little'], ['小']),
            'long': createMapping(['long'], ['长']),
            'short': createMapping(['short'], ['短']),
            'high': createMapping(['high'], ['高']),
            'low': createMapping(['low'], ['低']),
            'old': createMapping(['old'], ['老']),
            'new': createMapping(['new'], ['新']),
            'young': createMapping(['young'], ['年轻']),
            'here': createMapping(['here'], ['这里']),
            'there': createMapping(['there'], ['那里']),
            'where': createMapping(['where'], ['哪里']),
            'now': createMapping(['now'], ['现在']),
            'then': createMapping(['then'], ['然后']),
            'when': createMapping(['when'], ['什么时候']),
            'why': createMapping(['why'], ['为什么']),
            'how': createMapping(['how'], ['怎么']),
            'what': createMapping(['what'], ['什么']),
            'who': createMapping(['who'], ['谁']),
            'which': createMapping(['which'], ['哪个']),
            'this': createMapping(['this'], ['这个']),
            'that': createMapping(['that'], ['那个']),
            'all': createMapping(['all'], ['全部']),
            'some': createMapping(['some'], ['一些']),
            'any': createMapping(['any'], ['任何']),
            'every': createMapping(['every'], ['每个']),
            'each': createMapping(['each'], ['每个']),
            'person': createMapping(['person'], ['人']),
            'people': createMapping(['people'], ['人们']),
            'man': createMapping(['man'], ['男人']),
            'woman': createMapping(['woman'], ['女人']),
            'child': createMapping(['child'], ['孩子']),
            'time': createMapping(['time'], ['时间']),
            'day': createMapping(['day'], ['天']),
            'year': createMapping(['year'], ['年']),
            'month': createMapping(['month'], ['月']),
            'week': createMapping(['week'], ['周']),
            'hour': createMapping(['hour'], ['小时']),
            'minute': createMapping(['minute'], ['分钟']),
            'second': createMapping(['second'], ['秒']),
            'morning': createMapping(['morning'], ['早上']),
            'afternoon': createMapping(['afternoon'], ['下午']),
            'evening': createMapping(['evening'], ['晚上']),
            'night': createMapping(['night'], ['晚上']),
            'today': createMapping(['today'], ['今天']),
            'yesterday': createMapping(['yesterday'], ['昨天']),
            'tomorrow': createMapping(['tomorrow'], ['明天']),
            'world': createMapping(['world'], ['世界']),
            'country': createMapping(['country'], ['国家']),
            'city': createMapping(['city'], ['城市']),
            'place': createMapping(['place'], ['地方']),
            'home': createMapping(['home'], ['家']),
            'house': createMapping(['house'], ['房子']),
            'room': createMapping(['room'], ['房间']),
            'water': createMapping(['water'], ['水']),
            'fire': createMapping(['fire'], ['火']),
            'air': createMapping(['air'], ['空气']),
            'food': createMapping(['food'], ['食物']),
            'eat': createMapping(['eat'], ['吃']),
            'drink': createMapping(['drink'], ['喝']),
            'walk': createMapping(['walk'], ['走']),
            'run': createMapping(['run'], ['跑']),
            'sit': createMapping(['sit'], ['坐']),
            'stand': createMapping(['stand'], ['站']),
            'sleep': createMapping(['sleep'], ['睡觉']),
            'work': createMapping(['work'], ['工作']),
            'study': createMapping(['study'], ['学习']),
            'read': createMapping(['read'], ['读']),
            'write': createMapping(['write'], ['写']),
            'book': createMapping(['book'], ['书']),
            'money': createMapping(['money'], ['钱']),
            'buy': createMapping(['buy'], ['买']),
            'sell': createMapping(['sell'], ['卖']),
            'help': createMapping(['help'], ['帮助']),
            'find': createMapping(['find'], ['找到']),
            'lose': createMapping(['lose'], ['失去']),
            'get': createMapping(['get'], ['得到']),
            'give': createMapping(['give'], ['给']),
            'take': createMapping(['take'], ['拿']),
            'life': createMapping(['life'], ['生命', '生活']),
            'death': createMapping(['death'], ['死']),
            'health': createMapping(['health'], ['健康']),
            'sick': createMapping(['sick'], ['生病']),
            'pain': createMapping(['pain'], ['痛']),
            'happy': createMapping(['happy'], ['高兴']),
            'sad': createMapping(['sad'], ['难过']),
            'angry': createMapping(['angry'], ['生气']),
            'afraid': createMapping(['afraid'], ['害怕']),
            'hope': createMapping(['hope'], ['希望']),
            'wish': createMapping(['wish'], ['希望']),
            'dream': createMapping(['dream'], ['梦想']),
            'yes': createMapping(['yes'], ['是']),
            'no': createMapping(['no'], ['不']),
            'hello': createMapping(['hello'], ['你好']),
            'goodbye': createMapping(['goodbye'], ['再见'])
        };
    }
    
    updateTextStats(result) {
        // Update current text statistics
        document.getElementById('total-words').textContent = result.totalWords;
        document.getElementById('chinese-words').textContent = result.chineseWords;
        document.getElementById('new-words').textContent = result.newWords.length;
        
        const comprehension = ((result.totalWords - result.chineseWords) / result.totalWords * 100).toFixed(1);
        document.getElementById('comprehension').textContent = comprehension + '%';
        
        this.chineseWordsInCurrentText = result.chineseWords;
    }
    
    updateVocabularyPanels(newWords) {
        // Update current vocabulary panel
        const vocabPanel = document.getElementById('current-vocab');
        
        if (newWords.length === 0) {
            vocabPanel.innerHTML = '<p>No new Chinese words in this section</p>';
        } else {
            const vocabHtml = newWords.map(word => {
                const exposureCount = this.learningWords.get(word.word)?.exposures || 0;
                return `
                    <div class="vocab-item">
                        <span class="vocab-chinese">${word.word}</span>
                        <span class="vocab-pinyin">${word.pinyin}</span>
                        <span class="vocab-definition">${word.definition}</span>
                        <span class="exposure-counter">${exposureCount}</span>
                    </div>
                `;
            }).join('');
            vocabPanel.innerHTML = vocabHtml;
        }
        
        // Update recent words panel
        this.updateRecentWordsPanel();
    }
    
    updateRecentWordsPanel() {
        const recentPanel = document.getElementById('recent-words');
        const recentWords = Array.from(this.introducedWords).slice(-10);
        
        if (recentWords.length === 0) {
            recentPanel.innerHTML = '<p>No new words introduced yet</p>';
        } else {
            const recentHtml = recentWords.map(word => {
                const vocabEntry = this.vocabulary.find(v => v.word === word);
                const exposureData = this.learningWords.get(word);
                const exposureCount = exposureData?.exposures || 0;
                const isLearned = this.knownWords.has(word);
                
                return vocabEntry ? `
                    <div class="recent-word-item">
                        <span class="recent-chinese">${word}</span>
                        <span class="recent-pinyin">${vocabEntry.pinyin}</span>
                        <span class="recent-definition">${vocabEntry.definition}</span>
                        <span class="exposure-counter">${exposureCount}</span>
                        ${isLearned ? '<span class="learned-badge">✓</span>' : ''}
                    </div>
                ` : '';
            }).join('');
            recentPanel.innerHTML = recentHtml;
        }
    }
    
    updateNavigation(totalChunks) {
        // Update progress ring
        const progress = ((this.currentChunk + 1) / totalChunks * 100);
        const circumference = 2 * Math.PI * 26;
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = document.getElementById('progress-circle');
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = offset;
        
        document.getElementById('progress-text').textContent = Math.round(progress) + '%';
        document.getElementById('story-progress').textContent = Math.round(progress) + '%';
        
        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.currentChunk === 0;
        document.getElementById('next-btn').disabled = this.currentChunk >= totalChunks - 1;
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
        
        // Update exposure count
        const exposureCount = this.learningWords.get(word)?.exposures || 0;
        tooltip.querySelector('.tooltip-exposures').textContent = exposureCount;
        
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
    
    recordWordExposure(word) {
        if (!this.learningWords.has(word)) {
            this.learningWords.set(word, {
                exposures: 0,
                lastSeen: Date.now(),
                contexts: []
            });
        }
        
        const wordData = this.learningWords.get(word);
        wordData.exposures++;
        wordData.lastSeen = Date.now();
        
        this.totalExposures++;
        
        // Check for auto-promotion
        if (this.autoPromoteEnabled && wordData.exposures >= this.autoPromoteThreshold) {
            this.markWordAsLearned(word);
            this.showAutoPromotionMessage(word);
        }
        
        this.updateStats();
        this.updateRecentWordsPanel();
    }
    
    showAutoPromotionMessage(word) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = `"${word}" has been promoted to known! (${this.autoPromoteThreshold} exposures)`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    speakChineseWord(word) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.7;
        utterance.pitch = 1;
        this.speechSynthesis.speak(utterance);
    }
    
    markWordAsLearned(word) {
        if (!this.knownWords.has(word)) {
            this.knownWords.add(word);
            this.wordsLearnedToday++;
            
            // Add visual feedback
            const wordElements = document.querySelectorAll(`[data-word="${word}"]`);
            wordElements.forEach(el => {
                el.style.background = '#c6f6d5';
                el.style.borderRadius = '4px';
                el.classList.add('learned');
                
                // Remove exposure counter
                const counter = el.querySelector('.exposure-counter');
                if (counter) {
                    counter.remove();
                }
            });
            
            this.updateStats();
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
                
                if (this.selectedVoice) {
                    this.currentUtterance.voice = this.selectedVoice;
                }
                
                this.currentUtterance.rate = this.speechRate;
                this.currentUtterance.pitch = 1;
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
    
    previousChunk() {
        if (this.currentChunk > 0) {
            this.currentChunk--;
            this.generateText();
        }
    }
    
    nextChunk() {
        const words = this.storyText.split(/\s+/);
        const totalChunks = Math.ceil(words.length / this.chunkSize);
        
        if (this.currentChunk < totalChunks - 1) {
            this.currentChunk++;
            this.generateText();
        }
    }
    
    updateStats() {
        document.getElementById('known-count').textContent = this.knownWords.size;
        document.getElementById('learning-count').textContent = this.introducedWords.size - this.knownWords.size;
        document.getElementById('words-learned-today').textContent = this.wordsLearnedToday;
        document.getElementById('total-exposures').textContent = this.totalExposures;
        document.getElementById('auto-promoted').textContent = this.getAutoPromotedCount();
    }
    
    getAutoPromotedCount() {
        // This would track words automatically promoted
        // For now, we'll estimate based on exposure patterns
        let count = 0;
        for (const [word, data] of this.learningWords) {
            if (data.exposures >= this.autoPromoteThreshold && !this.knownWords.has(word)) {
                count++;
            }
        }
        return count;
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .recent-word-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        transition: background 0.3s;
    }
    
    .recent-word-item:hover {
        background: #f7fafc;
    }
    
    .recent-chinese {
        font-size: 1.5em;
        color: #e53e3e;
        font-weight: bold;
        min-width: 60px;
    }
    
    .recent-pinyin {
        color: #718096;
        font-style: italic;
        min-width: 80px;
    }
    
    .recent-definition {
        color: #4a5568;
        flex: 1;
    }
    
    .learned-badge {
        background: #48bb78;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
    }
`;
document.head.appendChild(style);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ComprehensiveDiglotWeaveApp();
});