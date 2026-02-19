require("dotenv").config();

class AIRecommendationService {
  static API_URL = "https://api.openai.com/v1/chat/completions";
  static API_TOKEN = process.env.OPEN_AI_KEY;
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 2000;

  static async generateRecommendations(footprintData) {
    const startTime = Date.now();

    try {
      if (!this.API_TOKEN) {
        throw new Error(
          "OpenAI API key not configured. Please set OPEN_AI_KEY in your .env file",
        );
      }

      const prompt = this.buildRecommendationPrompt(footprintData);
      console.log("Generated AI prompt:", prompt.substring(0, 200) + "...");

      let aiResponse;
      let attempt = 1;

      while (attempt <= this.MAX_RETRIES) {
        try {
          aiResponse = await this.callOpenAIAPI(prompt);
          break;
        } catch (error) {
          console.log(`AI API attempt ${attempt} failed:`, error.message);

          if (attempt === this.MAX_RETRIES) {
            throw error;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY * attempt),
          );
          attempt++;
        }
      }

      const recommendations = this.parseAIResponse(aiResponse, footprintData);
      const processingTime = Date.now() - startTime;

      console.log(`AI recommendations generated in ${processingTime}ms`);

      return {
        recommendations,
        model: "gpt-4o-mini",
        processingTime,
        prompt,
        rawResponse: aiResponse,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("AI recommendation generation failed:", error);

      return this.generateFallbackRecommendations(
        footprintData,
        processingTime,
        error.message,
      );
    }
  }

  static buildRecommendationPrompt(footprintData) {
    const {
      breakdown,
      transportModes,
      homeType,
      occupants,
      appliances,
      meals,
      travelContext,
      mobilityConsiderations,
      mobilityDetails,
    } = footprintData;
    let { breakfastFood, lunchFood, dinnerFood } = footprintData.food || {};

    const foodKeywords = [
      "adobo",
      "sinigang",
      "lechon",
      "pandesal",
      "longganisa",
      "tocino",
      "bangus",
      "monggo",
      "kare-kare",
      "halo-halo",
      "pancit",
      "lugaw",
      "tinola",
      "dinuguan",
      "sisig",
      "paksiw",
      "bulalo",
      "pinakbet",
      "kilawin",
      "batchoy",
      "laing",
      "bistek",
      "mechado",
      "caldereta",
      "arroz caldo",
      "embutido",
      "ginataang",
      "kamayan",
      "pinaputok na tilapia",

      "rice",
      "pastil",
      "fish",
      "chicken",
      "pork",
      "beef",
      "vegetable",
      "fruit",
      "banana",
      "mango",
      "camote",
      "egg",
      "salad",
      "seafood",
      "shrimp",
      "crab",
      "fast-food",
      "fried",
      "grilled",

      "jollibee",
      "chicken joy",
      "mcdonald's",
      "kfc",
      "pizza",
      "burger",
      "fried chicken",

      "puto",
      "kutsinta",
      "bibingka",
      "leche flan",
      "taho",
      "polvoron",
      "halo-halo",
      "skipped",
    ];

    function containsFoodKeyword(foodString) {
      if (!foodString || typeof foodString !== "string") return false;
      const lower = foodString.toLowerCase();
      return foodKeywords.some((keyword) => lower.includes(keyword));
    }

    function isValidFood(food) {
      return (
        food &&
        typeof food === "string" &&
        food.trim() !== "" &&
        food.toLowerCase() !== "skipped" &&
        containsFoodKeyword(food)
      );
    }

    breakfastFood = isValidFood(breakfastFood)
      ? breakfastFood
      : meals.breakfastFood || meals.breakfast || "no data";
    lunchFood = isValidFood(lunchFood)
      ? lunchFood
      : meals.lunchFood || meals.lunch || "no data";
    dinnerFood = isValidFood(dinnerFood)
      ? dinnerFood
      : meals.dinnerFood || meals.dinner || "no data";

    const total = breakdown.total || 0;
    const transportPercent =
      total > 0 ? ((breakdown.transport / total) * 100).toFixed(1) : 0;
    const homePercent =
      total > 0 ? ((breakdown.homeEnergy / total) * 100).toFixed(1) : 0;
    const foodPercent =
      total > 0 ? ((breakdown.food / total) * 100).toFixed(1) : 0;

    const transportContext =
      transportModes.length > 0
        ? transportModes
            .map((mode) => `${mode.id} (${mode.distance} km)`)
            .join(", ")
        : "no transport recorded";

    const applianceContext =
      appliances.length > 0
        ? appliances.join(", ")
        : "no high-energy appliances used";

    const mealContext = `Breakfast: ${breakfastFood}, Lunch: ${lunchFood}, Dinner: ${dinnerFood}`;

    const travelContextDescriptions = {
      commute_fixed:
        "Commutes to a fixed workplace (e.g., Office Worker, Teacher, Nurse)",
      professional_driver:
        "Professional driver (e.g., Bus, Jeepney, Taxi, Grab Driver)",
      delivery_rider: "Delivery rider using own vehicle",
      remote_work: "Works remotely or from home",
      non_standard_hours: "Works non-standard hours (late night/early morning)",
      student: "Student",
      other_context: "Other/unspecified work context",
    };
    const travelContextStr = travelContext
      ? travelContextDescriptions[travelContext] ||
        "No travel context specified"
      : "No travel context specified";

    const mobilityDescriptions = {
      respiratory: "Has respiratory condition (e.g., asthma)",
      wheelchair: "Uses wheelchair/mobility scooter",
      walking_difficulty: "Has difficulty walking long distances",
      heart_condition: "Has heart condition",
      visual_impairment: "Has visual impairment",
      none_mobility: "No mobility considerations",
    };

    let mobilityStr = "No mobility considerations specified";
    if (mobilityConsiderations && mobilityConsiderations.length > 0) {
      const mobilityList = mobilityConsiderations
        .filter((item) => item !== "none_mobility")
        .map((item) => mobilityDescriptions[item] || item);

      if (mobilityList.length > 0) {
        mobilityStr = mobilityList.join("; ");
        if (mobilityDetails && mobilityDetails.trim() !== "") {
          mobilityStr += `; Additional details: ${mobilityDetails}`;
        }
      } else if (mobilityConsiderations.includes("none_mobility")) {
        mobilityStr = "No mobility considerations";
      }
    }

    console.log(mealContext);

    return `
Daily User's carbon footprint summary:
- Total emissions: ${total.toFixed(2)} kg CO2e
- Transport: ${breakdown.transport.toFixed(2)} kg CO2e (${transportPercent}%)
- Home energy: ${breakdown.homeEnergy.toFixed(2)} kg CO2e (${homePercent}%)
- Food: ${breakdown.food.toFixed(2)} kg CO2e (${foodPercent}%)

User context:
- Home: ${homeType}, ${occupants} occupants
- Appliances: ${applianceContext}
- Transport modes and distances: ${transportContext}
- Meals consumed: ${mealContext}
- Travel context: ${travelContextStr}
- Mobility/health considerations: ${mobilityStr}

Your task:
Generate exactly 3 personalized, practical, and culturally Filipino-specific recommendations to reduce this user's carbon footprint.

IMPORTANT CONTEXTUAL CONSIDERATIONS:
1. Travel Context: Consider the user's work situation when making transportation recommendations. For example:
   - Professional drivers or delivery riders may have limited flexibility to change their primary transport mode
   - Remote workers may benefit from different advice than daily commuters
   - Students may have different transportation options and constraints
   - Non-standard hours workers may have limited public transport options

2. Mobility/Health Considerations: CRITICAL - When suggesting any transportation or physical activity recommendations:
   - If the user has respiratory conditions: Avoid suggesting cycling/walking in heavy traffic; prioritize air-conditioned or well-ventilated transport
   - If the user uses wheelchair/mobility aids: Only suggest accessible transport options (e.g., specific ride-sharing, accessible public transport)
   - If the user has difficulty walking: Don't suggest walking or cycling; focus on optimizing current transport
   - If the user has heart conditions: Avoid strenuous physical activity recommendations
   - If the user has visual impairment: Consider safety and accessibility in all suggestions
   - Always be respectful and provide practical alternatives that accommodate their situation

■Only suggest actions relevant to the Philippines – e.g., jeepneys, tricycles, rice-heavy meals, AC use, local fast food (Jollibee, etc.). Avoid Western references (like electric cars or quinoa). Focus on daily habits common in urban or rural areas of the Philippines.

Each recommendation should:
  1. Focus on the highest emission categories.
  2. Suggest realistic daily changes that respect the user's context and constraints.
  3. Include an estimate of potential CO2 savings.
  4. Reference the user's specific habits and items (e.g., transport modes, meals, appliances).
  5. Be sensitive to mobility and health considerations without being patronizing.
  
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

  static async callOpenAIAPI(prompt) {
    const response = await fetch(this.API_URL, {
      headers: {
        Authorization: `Bearer ${this.API_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful environmental advisor generating carbon-reduction recommendations based on user lifestyle in the Philippines.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 700,
        temperature: 0.2,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.choices && result.choices[0]?.message?.content) {
      return result.choices[0].message.content;
    } else {
      throw new Error("Unexpected OpenAI API response format");
    }
  }

  static parseAIResponse(aiResponse, footprintData) {
    try {
      const trimmed = aiResponse.trim();

      if (!trimmed.startsWith("[")) {
        throw new Error("AI response is not a JSON array");
      }

      const parsed = JSON.parse(trimmed);

      const recommendations = parsed
        .filter(
          (rec) =>
            typeof rec.title === "string" &&
            typeof rec.description === "string",
        )
        .map((rec, index) => ({
          id: `ai_rec_${index + 1}`,
          title: rec.title.trim(),
          description: rec.description.trim(),
          category: rec.category || "general",
          estimatedSavings: Math.min(
            Math.round((rec.estimatedSavings || 0.5) * 100) / 100,
            50,
          ),
          priority: index + 1,
          source: "ai_generated",
          actionable: true,
        }));

      if (recommendations.length < 3) {
        const fallback = this.createFallbackRecommendations(footprintData);
        recommendations.push(...fallback.slice(0, 3 - recommendations.length));
      }

      return recommendations;
    } catch (error) {
      console.error("Failed to parse AI JSON response:", error);
      return this.createFallbackRecommendations(footprintData);
    }
  }

  static parseRecommendationLine(line, breakdown, priority) {
    if (!line || line.length < 15) return null;

    let category = "general";
    const lowerLine = line.toLowerCase();

    if (
      lowerLine.includes("transport") ||
      lowerLine.includes("car") ||
      lowerLine.includes("bike") ||
      lowerLine.includes("walk") ||
      lowerLine.includes("public") ||
      lowerLine.includes("commute")
    ) {
      category = "transport";
    } else if (
      lowerLine.includes("home") ||
      lowerLine.includes("energy") ||
      lowerLine.includes("electric") ||
      lowerLine.includes("appliance") ||
      lowerLine.includes("heating") ||
      lowerLine.includes("cooling")
    ) {
      category = "home";
    } else if (
      lowerLine.includes("food") ||
      lowerLine.includes("meat") ||
      lowerLine.includes("diet") ||
      lowerLine.includes("meal") ||
      lowerLine.includes("plant")
    ) {
      category = "food";
    }

    let estimatedSavings = 0.5;
    if (category === "transport" && breakdown.transport > 2) {
      estimatedSavings = Math.min(breakdown.transport * 0.3, 3.0);
    } else if (category === "home" && breakdown.homeEnergy > 1) {
      estimatedSavings = Math.min(breakdown.homeEnergy * 0.2, 2.0);
    } else if (category === "food" && breakdown.food > 2) {
      estimatedSavings = Math.min(breakdown.food * 0.25, 2.5);
    }

    return {
      id: `ai_rec_${priority}`,
      title: this.extractTitle(line),
      description: line,
      category,
      estimatedSavings: Math.min(Math.round(estimatedSavings * 100) / 100, 50),
      priority,
      source: "ai_generated",
      actionable: true,
    };
  }

  static extractTitle(line) {
    const sentences = line.split(/[.!]/);
    let title = sentences[0].trim();

    if (title.length > 60) {
      title = title.substring(0, 57) + "...";
    }

    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title || "Reduce Carbon Footprint";
  }

  static generateFallbackRecommendations(
    footprintData,
    processingTime,
    errorMessage,
  ) {
    console.log("Generating fallback recommendations due to AI failure");

    const recommendations = this.createFallbackRecommendations(footprintData);

    return {
      recommendations,
      model: "fallback",
      processingTime: processingTime || 0,
      prompt: null,
      rawResponse: null,
      fallback: true,
      error: errorMessage,
    };
  }

  static createFallbackRecommendations(footprintData) {
    const {
      breakdown,
      transportModes,
      homeType,
      appliances,
      meals,
      mobilityConsiderations,
    } = footprintData;
    const recommendations = [];

    const hasMobilityConstraints =
      mobilityConsiderations &&
      mobilityConsiderations.some((item) =>
        [
          "wheelchair",
          "walking_difficulty",
          "respiratory",
          "heart_condition",
        ].includes(item),
      );

    if (breakdown.transport > 2) {
      if (transportModes.some((mode) => mode.id === "car")) {
        if (hasMobilityConstraints) {
          recommendations.push({
            id: "fallback_transport_mobility",
            title: "Optimize Your Car Usage",
            description:
              "Combine multiple errands into single trips, maintain proper tire pressure, and consider carpooling when possible to reduce your transport emissions while maintaining your mobility needs.",
            category: "transport",
            estimatedSavings: Math.min(
              Math.round(breakdown.transport * 0.2 * 100) / 100,
              50,
            ),
            priority: 1,
            source: "rule_based",
            actionable: true,
          });
        } else {
          recommendations.push({
            id: "fallback_transport_1",
            title: "Switch to Public Transportation",
            description:
              "Replace car trips with public transport, cycling, or walking for short distances to significantly reduce your transport emissions.",
            category: "transport",
            estimatedSavings: Math.min(
              Math.round(breakdown.transport * 0.4 * 100) / 100,
              50,
            ),
            priority: 1,
            source: "rule_based",
            actionable: true,
          });
        }
      } else {
        recommendations.push({
          id: "fallback_transport_2",
          title: "Optimize Your Commute",
          description:
            "Combine multiple trips into one journey and consider carpooling or working from home when possible.",
          category: "transport",
          estimatedSavings: Math.min(
            Math.round(breakdown.transport * 0.2 * 100) / 100,
            50,
          ),
          priority: 1,
          source: "rule_based",
          actionable: true,
        });
      }
    }

    if (breakdown.homeEnergy > 1) {
      if (appliances.includes("ac_heating") || appliances.includes("aircon")) {
        recommendations.push({
          id: "fallback_home_1",
          title: "Optimize Air Conditioning Usage",
          description:
            "Set your AC to 26°C (78°F) or higher, use fans to circulate air, and turn off AC when leaving rooms for extended periods.",
          category: "home",
          estimatedSavings: Math.min(
            Math.round(breakdown.homeEnergy * 0.3 * 100) / 100,
            50,
          ),
          priority: 2,
          source: "rule_based",
          actionable: true,
        });
      } else {
        recommendations.push({
          id: "fallback_home_2",
          title: "Reduce Standby Power Consumption",
          description:
            "Unplug electronics when not in use and use power strips to easily turn off multiple devices at once.",
          category: "home",
          estimatedSavings: Math.min(
            Math.round(breakdown.homeEnergy * 0.15 * 100) / 100,
            50,
          ),
          priority: 2,
          source: "rule_based",
          actionable: true,
        });
      }
    }

    if (breakdown.food > 2) {
      const hasMeat =
        meals.breakfast === "meat" ||
        meals.lunch === "meat" ||
        meals.dinner === "meat";
      if (hasMeat) {
        recommendations.push({
          id: "fallback_food_1",
          title: "Try Meatless Monday",
          description:
            "Replace one meat-based meal per week with plant-based alternatives like beans, lentils, or vegetables.",
          category: "food",
          estimatedSavings: Math.min(
            Math.round(breakdown.food * 0.25 * 100) / 100,
            50,
          ),
          priority: 3,
          source: "rule_based",
          actionable: true,
        });
      } else {
        recommendations.push({
          id: "fallback_food_2",
          title: "Reduce Food Waste",
          description:
            "Plan your meals, store food properly, and use leftovers creatively to minimize food waste.",
          category: "food",
          estimatedSavings: Math.min(
            Math.round(breakdown.food * 0.2 * 100) / 100,
            50,
          ),
          priority: 3,
          source: "rule_based",
          actionable: true,
        });
      }
    }

    if (recommendations.length < 3) {
      const generalRecs = [
        {
          id: "fallback_general_1",
          title: "Use LED Light Bulbs",
          description:
            "Replace incandescent bulbs with energy-efficient LED bulbs to reduce electricity consumption.",
          category: "home",
          estimatedSavings: 0.5,
          priority: 4,
          source: "rule_based",
          actionable: true,
        },
        {
          id: "fallback_general_2",
          title: "Take Shorter Showers",
          description:
            "Reduce shower time by 2-3 minutes to save hot water and the energy used to heat it.",
          category: "home",
          estimatedSavings: 0.8,
          priority: 5,
          source: "rule_based",
          actionable: true,
        },
        {
          id: "fallback_general_3",
          title: "Buy Local and Seasonal Food",
          description:
            "Choose locally grown, seasonal produce to reduce transportation emissions from your food.",
          category: "food",
          estimatedSavings: 0.6,
          priority: 6,
          source: "rule_based",
          actionable: true,
        },
      ];

      const needed = 5 - recommendations.length;
      recommendations.push(...generalRecs.slice(0, needed));
    }

    return recommendations.slice(0, 5);
  }

  static isConfigured() {
    return !!this.API_TOKEN;
  }

  static getStatus() {
    return {
      configured: this.isConfigured(),
      apiUrl: this.API_URL,
      model: "gpt-4o-mini",
      hasToken: !!this.API_TOKEN,
      maxRetries: this.MAX_RETRIES,
      retryDelay: this.RETRY_DELAY,
    };
  }
}

module.exports = AIRecommendationService;
