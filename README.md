# Chinese Diglot Weave Reader

A sophisticated web application for learning Chinese through comprehensible input using the diglot weave method. This tool gradually introduces Chinese words into English text, maintaining approximately 98% comprehension while building vocabulary through context.

## Features

### 🎯 Diglot Weave Technology
- **Gradual Introduction**: Chinese words are strategically inserted into English text
- **Comprehensible Input**: Maintains ~98% comprehension rate for effective learning
- **Contextual Learning**: New words appear in meaningful contexts
- **Adaptive Difficulty**: Three difficulty levels (98%, 95%, 90% comprehension)

### 📚 Vocabulary Management
- **Personal Vocabulary**: Uses your uploaded vocabulary list with known/unknown word tracking
- **2,497 Chinese Words**: Based on SUBTLEX 2500 frequency list
- **397 Known Words**: Pre-marked vocabulary you're familiar with
- **2,100 Learning Words**: Available for gradual introduction

### 🔊 Text-to-Speech Integration
- **English Narration**: Natural English reading of the story
- **Chinese Pronunciation**: Click any Chinese word to hear native pronunciation
- **Adjustable Speed**: Control reading pace for optimal learning

### 📊 Learning Analytics
- **Progress Tracking**: Monitor words learned and reading progress
- **Comprehension Metrics**: Real-time comprehension percentage
- **Vocabulary Review**: See recently introduced words with definitions
- **Daily Goals**: Track words learned per session

### 🎨 User Interface
- **Clean Design**: Modern, distraction-free reading environment
- **Interactive Text**: Hover over Chinese words for pinyin and definitions
- **Visual Feedback**: Learned words highlighted in green
- **Responsive Layout**: Works on desktop and mobile devices

## How It Works

### The Diglot Weave Method
1. **Text Analysis**: The system analyzes English text and identifies replaceable words
2. **Strategic Replacement**: English words are replaced with Chinese equivalents
3. **Frequency Control**: Replacement rate adjusts based on difficulty level:
   - Beginner: ~2% Chinese words (98% comprehension)
   - Intermediate: ~5% Chinese words (95% comprehension)
   - Advanced: ~10% Chinese words (90% comprehension)

### Learning Process
1. **Initial State**: You know 397 basic Chinese words
2. **Word Introduction**: New words are introduced in context
3. **Repetition**: Words repeat across different contexts
4. **Mastery**: Click words to mark them as learned
5. **Progress**: System tracks learning and adjusts difficulty

## Files Included

### Main Application Files
- `index.html` - Basic diglot weave reader
- `advanced.html` - Advanced version with enhanced features
- `styles.css` - Shared styling for both versions
- `script.js` - Basic application logic
- `advanced.js` - Advanced features and interactions

### Data Files
- `vocab_cleaned.csv` - Cleaned vocabulary list (CSV format)
- `vocabulary.json` - Vocabulary data (JSON format for web app)
- `story.txt` - Complete story text
- `story_sample.txt` - Sample text for testing

## Usage Instructions

### Getting Started
1. Open `index.html` or `advanced.html` in a web browser
2. The application will load your vocabulary and story data
3. Select your preferred difficulty level
4. Click "Generate Text" to create your first diglot weave

### Reading Session
1. **Generate Text**: Creates a new section with Chinese words woven in
2. **Read Aloud**: Use the play button to hear the English narration
3. **Interact with Chinese Words**:
   - Hover to see pinyin and definition
   - Click to hear Chinese pronunciation
   - Click "Mark as Learned" when you know a word
4. **Next Section**: Move to the next chunk of text
5. **Review Progress**: Check your learning statistics

### Customization Options
- **Difficulty Level**: Adjust Chinese word density
- **Text Chunk Size**: Control how much text appears at once
- **Audio Speed**: Adjust narration speed for comfort

## Technical Implementation

### Vocabulary Processing
- Parses CSV vocabulary list with pinyin and definitions
- Separates known words (marked TRUE) from learning words
- Creates frequency-based mapping for word replacement

### Text Processing
- Preserves original text structure and punctuation
- Replaces English words with Chinese equivalents
- Maintains readability and flow

### Audio System
- Uses Web Speech API for text-to-speech
- English narration with natural voices
- Chinese pronunciation for individual words
- Sentence-by-sentence playback control

### Learning Tracking
- Tracks introduced words across sessions
- Maintains learned word database
- Calculates comprehension metrics in real-time

## Browser Compatibility

### Supported Browsers
- Chrome 66+ (recommended)
- Firefox 60+
- Safari 14+
- Edge 79+

### Required Features
- Web Speech API support
- ES6 JavaScript features
- CSS Grid and Flexbox
- Local file access (for offline use)

## Tips for Effective Learning

### Optimal Session Length
- **Beginner**: 15-20 minutes per session
- **Intermediate**: 20-30 minutes per session
- **Advanced**: 30-45 minutes per session

### Learning Strategies
1. **Start with 98% comprehension** to build confidence
2. **Don't look up every word** - use context to guess meanings
3. **Focus on high-frequency words** first
4. **Review recently learned words** regularly
5. **Gradually increase difficulty** as comfort improves

### Daily Practice
- Consistent daily practice is more effective than long sessions
- Review learned words from previous sessions
- Try different text chunks to see words in new contexts
- Use audio features to improve pronunciation recognition

## Troubleshooting

### Common Issues

**Text not loading**: Check that all files are in the same directory
**Audio not working**: Ensure browser supports Web Speech API
**Chinese words not appearing**: Verify vocabulary files are loaded
**Slow performance**: Try smaller text chunk sizes

### Browser Settings
- Enable JavaScript
- Allow audio playback
- Check microphone permissions (for speech features)

## Future Enhancements

### Planned Features
- **Spaced Repetition**: Review words at optimal intervals
- **Reading Comprehension**: Quiz questions about text content
- **Progress Export**: Save learning progress across devices
- **More Stories**: Additional text content for variety
- **Mobile App**: Native iOS/Android applications

### Customization Options
- **Custom Vocabulary**: Upload your own word lists
- **Text Import**: Use any text content for weaving
- **Learning Goals**: Set daily/weekly targets
- **Theme Selection**: Different visual themes

## Credits

### Story Content
- **Title**: Beneath the Dragoneye Moons
- **Author**: Selkie Myth
- **Source**: Royal Road (royalroad.com)

### Vocabulary Data
- **Source**: SUBTLEX 2500 Chinese Word Frequency List
- **Processing**: Custom cleaning and categorization
- **Known Words**: Based on common learning progression

### Development
- **Methodology**: Comprehensible Input (Stephen Krashen)
- **Implementation**: Modern web technologies
- **Design**: User-centered learning interface

## License

This educational tool is provided for personal learning use. The story content remains under its original copyright. The vocabulary data is based on publicly available frequency lists.

## Support

For questions or issues, please check the troubleshooting section or contact the development team. This tool is designed to make Chinese learning more effective and enjoyable through the power of comprehensible input and diglot weaving.