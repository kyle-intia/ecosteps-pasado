// server/services/aiRecommendationService.js
// Hugging Face AI integration service for generating personalized carbon footprint recommendations

require('dotenv').config();

class AIRecommendationService {
  static API_URL = 'https://api.openai.com/v1/chat/completions';
  static API_TOKEN = process.env.OPEN_AI_KEY;;
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 2000; // 2 seconds

  /**
   * Generate personalized recommendations based on carbon footprint data
   * @param {Object} footprintData - User's carbon footprint breakdown and details
   * @returns {Promise<Object>} Generated recommendations with metadata
   */
  static async generateRecommendations(footprintData) {
    const startTime = Date.now();
    
    try {
      // Validate API token
      if (!this.API_TOKEN) {
        throw new Error('OpenAI API key not configured. Please set OPEN_AI_KEY in your .env file');
      }

      // Build the prompt for AI generation
      const prompt = this.buildRecommendationPrompt(footprintData);
      console.log('Generated AI prompt:', prompt.substring(0, 200) + '...');

      // Call OpenAI API with retry logic
      let aiResponse;
      let attempt = 1;

      while (attempt <= this.MAX_RETRIES) {
        try {
          aiResponse = await this.callOpenAIAPI(prompt);
          break; // Success, exit retry loop
        } catch (error) {
          console.log(`AI API attempt ${attempt} failed:`, error.message);
          
          if (attempt === this.MAX_RETRIES) {
            throw error; // Final attempt failed
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
          attempt++;
        }
      }

      // Parse and structure the AI response
      const recommendations = this.parseAIResponse(aiResponse, footprintData);
      const processingTime = Date.now() - startTime;

      console.log(`AI recommendations generated in ${processingTime}ms`);

      return {
        recommendations,
        model: 'gpt-4o-mini',
        processingTime,
        prompt,
        rawResponse: aiResponse
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('AI recommendation generation failed:', error);
      
      // Return fallback recommendations instead of failing completely
      return this.generateFallbackRecommendations(footprintData, processingTime, error.message);
    }
  }

  /**
   * Build a structured prompt for AI recommendation generation
   * @param {Object} footprintData - User's footprint data
   * @returns {string} Formatted prompt for AI
   */
static buildRecommendationPrompt(footprintData) {
  const { breakdown, transportModes, homeType, occupants, appliances, meals } = footprintData;
  let { breakfastFood, lunchFood, dinnerFood } = footprintData.food || {};


    const foodKeywords = [
  // Common Filipino dishes
  "adobo", "sinigang", "lechon", "pandesal", "longganisa", "tocino", "bangus", "monggo",
  "kare-kare", "halo-halo", "pancit", "lugaw", "tinola", "dinuguan", "sisig", "paksiw",
  "bulalo", "pinakbet", "kilawin", "batchoy", "laing", "bistek", "mechado", "caldereta",
  "arroz caldo", "embutido", "ginataang", "kamayan", "pinaputok na tilapia",
  // Common Filipino ingredients and food types
  "rice", "pastil", "fish", "chicken", "pork", "beef", "vegetable", "fruit", "banana", "mango",
  "camote", "egg", "salad", "seafood", "shrimp", "crab", "fast-food", "fried", "grilled",
  // Popular Filipino fast-food chains and dishes
  "jollibee", "chicken joy", "mcdonald's", "kfc", "pizza", "burger", "fried chicken",
  // Snacks and desserts
  "puto", "kutsinta", "bibingka", "leche flan", "taho", "polvoron", "halo-halo", "skipped"
  ];

  function containsFoodKeyword(foodString) {
    if (!foodString || typeof foodString !== 'string') return false;
    const lower = foodString.toLowerCase();
    return foodKeywords.some(keyword => lower.includes(keyword));
  }

  function isValidFood(food) {
    return food && typeof food === 'string' 
      && food.trim() !== '' 
      && food.toLowerCase() !== 'skipped' 
      && containsFoodKeyword(food);
  }

  // Simplify and keep the validation logic (can enhance later)
 breakfastFood = isValidFood(breakfastFood) ? breakfastFood : meals.breakfastFood || meals.dinner || 'no data';
  lunchFood = isValidFood(lunchFood) ? lunchFood : meals.lunchFood || meals.lunch || 'no data';
  dinnerFood = isValidFood(dinnerFood) ? dinnerFood : meals.dinnerFood || meals.dinner || 'no data';

  const total = breakdown.total || 0;
  const transportPercent = total > 0 ? ((breakdown.transport / total) * 100).toFixed(1) : 0;
  const homePercent = total > 0 ? ((breakdown.homeEnergy / total) * 100).toFixed(1) : 0;
  const foodPercent = total > 0 ? ((breakdown.food / total) * 100).toFixed(1) : 0;

  const transportContext = transportModes.length > 0
    ? transportModes.map(mode => `${mode.id} (${mode.distance} km)`).join(', ')
    : 'no transport recorded';

  const applianceContext = appliances.length > 0
    ? appliances.join(', ')
    : 'no high-energy appliances used';

  const mealContext = `Breakfast: ${breakfastFood}, Lunch: ${lunchFood}, Dinner: ${dinnerFood}`;

  console.log(mealContext)

  return `
You are a sustainability advisor specializing in low-carbon Filipino lifestyles. Your job is to give down-to-earth, practical advice that makes sense in the Philippine context.

User’s carbon footprint summary:
- Total emissions: ${total.toFixed(2)} kg CO2e
- Transport: ${breakdown.transport.toFixed(2)} kg CO2e (${transportPercent}%)
- Home energy: ${breakdown.homeEnergy.toFixed(2)} kg CO2e (${homePercent}%)
- Food: ${breakdown.food.toFixed(2)} kg CO2e (${foodPercent}%)

User context:
- Home: ${homeType}, ${occupants} occupants
- Appliances: ${applianceContext}
- Transport modes and distances: ${transportContext}
- Meals consumed: ${mealContext}

Your task:
Generate exactly 3 personalized, practical, and culturally Filipino-specific recommendations to reduce this user’s carbon footprint.

❗Only suggest actions relevant to the Philippines — e.g., jeepneys, tricycles, rice-heavy meals, AC use, local fast food (Jollibee, etc.). Avoid Western references (like electric cars or quinoa). Focus on daily habits common in urban or rural areas of the Philippines.

Each recommendation should:
  1. Focus on the highest emission categories.
  2. Suggest realistic daily changes.
  3. Include an estimate of potential CO2 savings.
  4. Reference the user's specific habits and items (e.g., transport modes, meals, appliances).
✅ Return ONLY a clean JSON array like this:
[
  {
    "title": "Short title",
    "description": "Detailed, practical advice based on user data.",
    "category": "transport | home | food | general",
    "estimatedSavings": 1.5
  },
  ...
]

DO NOT include anything outside the JSON array.

`;
}



  /**
   * Call OpenAI Chat Completions API
   * @param {string} prompt - The prompt to send to AI
   * @returns {Promise<string>} AI generated text
   */
static async callOpenAIAPI(prompt) {
  const response = await fetch(this.API_URL, {
    headers: {
      Authorization: `Bearer ${this.API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful environmental advisor generating carbon-reduction recommendations based on user lifestyle in the Philippines.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 700,
      temperature: 0.7,
      top_p: 0.95
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (result.choices && result.choices[0]?.message?.content) {
    return result.choices[0].message.content;
  } else {
    throw new Error('Unexpected OpenAI API response format');
  }
}


  /**
   * Parse AI response into structured recommendations
   * @param {string} aiResponse - Raw AI generated text
   * @param {Object} footprintData - Original footprint data for context
   * @returns {Array<Object>} Structured recommendations
   */
static parseAIResponse(aiResponse, footprintData) {
  try {
    const trimmed = aiResponse.trim();

    // Check if it's a valid JSON-like response
    if (!trimmed.startsWith('[')) {
      throw new Error('AI response is not a JSON array');
    }

    const parsed = JSON.parse(trimmed);

    // Ensure it's an array of objects with required fields
    const recommendations = parsed
      .filter(rec => typeof rec.title === 'string' && typeof rec.description === 'string')
      .map((rec, index) => ({
        id: `ai_rec_${index + 1}`,
        title: rec.title.trim(),
        description: rec.description.trim(),
        category: rec.category || 'general',
        estimatedSavings: Math.min(Math.round((rec.estimatedSavings || 0.5) * 100) / 100, 50),
        priority: index + 1,
        source: 'ai_generated',
        actionable: true
      }));

    // If the model gave less than 3, fill with fallback
    if (recommendations.length < 3) {
      const fallback = this.createFallbackRecommendations(footprintData);
      recommendations.push(...fallback.slice(0, 3 - recommendations.length));
    }

    return recommendations;
  } catch (error) {
    console.error('Failed to parse AI JSON response:', error);
    return this.createFallbackRecommendations(footprintData);
  }
}


  /**
   * Parse a single recommendation line
   * @param {string} line - Single recommendation text
   * @param {Object} breakdown - Emissions breakdown
   * @param {number} priority - Recommendation priority
   * @returns {Object|null} Structured recommendation or null
   */
  static parseRecommendationLine(line, breakdown, priority) {
    if (!line || line.length < 15) return null;

    // Determine category based on keywords
    let category = 'general';
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('transport') || lowerLine.includes('car') || lowerLine.includes('bike') || 
        lowerLine.includes('walk') || lowerLine.includes('public') || lowerLine.includes('commute')) {
      category = 'transport';
    } else if (lowerLine.includes('home') || lowerLine.includes('energy') || lowerLine.includes('electric') || 
               lowerLine.includes('appliance') || lowerLine.includes('heating') || lowerLine.includes('cooling')) {
      category = 'home';
    } else if (lowerLine.includes('food') || lowerLine.includes('meat') || lowerLine.includes('diet') || 
               lowerLine.includes('meal') || lowerLine.includes('plant')) {
      category = 'food';
    }

    // Estimate savings based on category and content
    let estimatedSavings = 0.5; // Default savings
    if (category === 'transport' && breakdown.transport > 2) {
      estimatedSavings = Math.min(breakdown.transport * 0.3, 3.0);
    } else if (category === 'home' && breakdown.homeEnergy > 1) {
      estimatedSavings = Math.min(breakdown.homeEnergy * 0.2, 2.0);
    } else if (category === 'food' && breakdown.food > 2) {
      estimatedSavings = Math.min(breakdown.food * 0.25, 2.5);
    }

    return {
      id: `ai_rec_${priority}`,
      title: this.extractTitle(line),
      description: line,
      category,
      estimatedSavings: Math.min(Math.round(estimatedSavings * 100) / 100, 50),
      priority,
      source: 'ai_generated',
      actionable: true
    };
  }

  /**
   * Extract a concise title from a recommendation line
   * @param {string} line - Full recommendation text
   * @returns {string} Extracted title
   */
  static extractTitle(line) {
    // Take first meaningful part of the sentence as title
    const sentences = line.split(/[.!]/);
    let title = sentences[0].trim();
    
    // Limit title length
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title || 'Reduce Carbon Footprint';
  }

  /**
   * Generate fallback recommendations when AI fails or returns poor results
   * @param {Object} footprintData - User's footprint data
   * @param {number} processingTime - Time taken for processing
   * @param {string} errorMessage - Error that occurred
   * @returns {Object} Fallback recommendation response
   */
  static generateFallbackRecommendations(footprintData, processingTime, errorMessage) {
    console.log('Generating fallback recommendations due to AI failure');
    
    const recommendations = this.createFallbackRecommendations(footprintData);
    
    return {
      recommendations,
      model: 'fallback',
      processingTime: processingTime || 0,
      prompt: null,
      rawResponse: null,
      fallback: true,
      error: errorMessage
    };
  }

  /**
   * Create rule-based fallback recommendations
   * @param {Object} footprintData - User's footprint data
   * @returns {Array<Object>} Structured recommendations
   */
  static createFallbackRecommendations(footprintData) {
    const { breakdown, transportModes, homeType, appliances, meals } = footprintData;
    const recommendations = [];
    
    // Transport recommendations
    if (breakdown.transport > 2) {
      if (transportModes.some(mode => mode.id === 'car')) {
        recommendations.push({
          id: 'fallback_transport_1',
          title: 'Switch to Public Transportation',
          description: 'Replace car trips with public transport, cycling, or walking for short distances to significantly reduce your transport emissions.',
          category: 'transport',
          estimatedSavings: Math.min(Math.round(breakdown.transport * 0.4 * 100) / 100, 50),
          priority: 1,
          source: 'rule_based',
          actionable: true
        });
      } else {
        recommendations.push({
          id: 'fallback_transport_2',
          title: 'Optimize Your Commute',
          description: 'Combine multiple trips into one journey and consider carpooling or working from home when possible.',
          category: 'transport',
          estimatedSavings: Math.min(Math.round(breakdown.transport * 0.2 * 100) / 100, 50),
          priority: 1,
          source: 'rule_based',
          actionable: true
        });
      }
    }
    
    // Home energy recommendations
    if (breakdown.homeEnergy > 1) {
      if (appliances.includes('ac_heating') || appliances.includes('aircon')) {
        recommendations.push({
          id: 'fallback_home_1',
          title: 'Optimize Air Conditioning Usage',
          description: 'Set your AC to 26°C (78°F) or higher, use fans to circulate air, and turn off AC when leaving rooms for extended periods.',
          category: 'home',
          estimatedSavings: Math.min(Math.round(breakdown.homeEnergy * 0.3 * 100) / 100, 50),
          priority: 2,
          source: 'rule_based',
          actionable: true
        });
      } else {
        recommendations.push({
          id: 'fallback_home_2',
          title: 'Reduce Standby Power Consumption',
          description: 'Unplug electronics when not in use and use power strips to easily turn off multiple devices at once.',
          category: 'home',
          estimatedSavings: Math.min(Math.round(breakdown.homeEnergy * 0.15 * 100) / 100, 50),
          priority: 2,
          source: 'rule_based',
          actionable: true
        });
      }
    }
    
    // Food recommendations
    if (breakdown.food > 2) {
      const hasMeat = meals.breakfast === 'meat' || meals.lunch === 'meat' || meals.dinner === 'meat';
      if (hasMeat) {
        recommendations.push({
          id: 'fallback_food_1',
          title: 'Try Meatless Monday',
          description: 'Replace one meat-based meal per week with plant-based alternatives like beans, lentils, or vegetables.',
          category: 'food',
          estimatedSavings: Math.min(Math.round(breakdown.food * 0.25 * 100) / 100, 50),
          priority: 3,
          source: 'rule_based',
          actionable: true
        });
      } else {
        recommendations.push({
          id: 'fallback_food_2',
          title: 'Reduce Food Waste',
          description: 'Plan your meals, store food properly, and use leftovers creatively to minimize food waste.',
          category: 'food',
          estimatedSavings: Math.min(Math.round(breakdown.food * 0.2 * 100) / 100, 50),
          priority: 3,
          source: 'rule_based',
          actionable: true
        });
      }
    }
    
    // General recommendations if specific categories are low
    if (recommendations.length < 3) {
      const generalRecs = [
        {
          id: 'fallback_general_1',
          title: 'Use LED Light Bulbs',
          description: 'Replace incandescent bulbs with energy-efficient LED bulbs to reduce electricity consumption.',
          category: 'home',
          estimatedSavings: 0.5,
          priority: 4,
          source: 'rule_based',
          actionable: true
        },
        {
          id: 'fallback_general_2',
          title: 'Take Shorter Showers',
          description: 'Reduce shower time by 2-3 minutes to save hot water and the energy used to heat it.',
          category: 'home',
          estimatedSavings: 0.8,
          priority: 5,
          source: 'rule_based',
          actionable: true
        },
        {
          id: 'fallback_general_3',
          title: 'Buy Local and Seasonal Food',
          description: 'Choose locally grown, seasonal produce to reduce transportation emissions from your food.',
          category: 'food',
          estimatedSavings: 0.6,
          priority: 6,
          source: 'rule_based',
          actionable: true
        }
      ];
      
      const needed = 5 - recommendations.length;
      recommendations.push(...generalRecs.slice(0, needed));
    }
    
    return recommendations.slice(0, 5);
  }

  /**
   * Validate API configuration
   * @returns {boolean} True if API is properly configured
   */
  static isConfigured() {
    return !!this.API_TOKEN;
  }

  /**
   * Get API status and configuration info
   * @returns {Object} API status information
   */
  static getStatus() {
      return {
        configured: this.isConfigured(),
        apiUrl: this.API_URL,
        model: 'gpt-4o-mini',
        hasToken: !!this.API_TOKEN,
        maxRetries: this.MAX_RETRIES,
        retryDelay: this.RETRY_DELAY
      };
  }
}

module.exports = AIRecommendationService;