<script lang="ts">
  import AIQueryAnalyticsTable from '$lib/components/AIQueryAnalyticsTable.svelte';
  import type { AIQueryRecord } from '$lib/types/ai-query.js';

  // Models mapped to their correct providers
  const modelProviderMap: Record<string, 'openai' | 'gemini'> = {
    'gpt-4': 'openai',
    'gpt-4o-mini': 'openai',
    'gemini-pro': 'gemini'
  };

  const models = Object.keys(modelProviderMap);

  // Sample inputs for variety
  const inputs = [
    'Summarize the following text about Svelte...',
    'Translate this paragraph into Spanish.',
    'Generate a product description for a smart lamp.',
    'Write a motivational paragraph for a fitness app homepage.',
    'Explain quantum computing in simple terms.',
    'Draft an email announcing a new company policy on remote work.',
    'Create a short story about a time traveler visiting the future.',
    'Give me 10 creative blog title ideas for a cooking website.',
    'What are the top 5 benefits of mindfulness?',
    'Summarize the latest advancements in AI for healthcare.',
    'Write a LinkedIn post about leadership qualities in tech.',
    'Write a detailed plan for a social media marketing campaign for a new product launch.',
    'Generate 5 witty captions for a coffee shop Instagram post.',
    'Explain the difference between machine learning and deep learning.',
    'List 10 key tips for remote team collaboration.',
    'Draft a professional bio for a software engineer specializing in AI.',
    'Write a FAQ section for a language learning app.',
    'Generate a summary for an academic article on climate change mitigation strategies.',
    'Suggest ideas for an online course on digital marketing.',
    'Explain the concept of blockchain in non-technical terms.'
  ];

  // Sample outputs (longer text for realism)
  const outputs = [
    'Svelte is a compiler that turns declarative components into efficient JavaScript at build time. Unlike frameworks that use a virtual DOM, Svelte writes minimal code and updates the DOM surgically for faster performance and smaller bundle sizes.',
    'Este párrafo describe cómo la inteligencia artificial está revolucionando múltiples industrias mediante la automatización, la personalización y la optimización de procesos, permitiendo mayor eficiencia y nuevas oportunidades en todo el mundo.',
    'The SmartGlow Lamp offers dynamic brightness and color adjustments to match your environment. With voice assistant compatibility, app control, and energy-saving features, it provides convenience and comfort for every mood and activity.',
    'Your fitness journey starts now! Our app gives you personalized workouts, expert guidance, and progress tracking tools to keep you motivated. Every workout is a step closer to your goals—let’s make fitness fun and sustainable together!',
    'Quantum computing uses quantum bits, or qubits, which can represent both 0 and 1 simultaneously due to a property called superposition. This allows quantum computers to process complex problems much faster than traditional computers for specific tasks like encryption or simulations.',
    'Dear Team,\n\nWe are implementing a new remote work policy starting next month. Employees can work from home up to three days per week to support flexibility and work-life balance. We believe this will boost productivity and overall job satisfaction.\n\nThank you,\nManagement',
    'In 2150, Alex stepped out of the portal into a world of vertical gardens and floating cities. Humanity had achieved harmony with AI, and creativity thrived like never before. As Alex explored this new era, they realized the future wasn’t about technology alone—it was about connection, empathy, and endless imagination.',
    '1. From Pantry to Plate: Quick & Delicious Recipes\n2. The Art of Flavor: Cooking Tips for Every Chef\n3. 15-Minute Meals for Busy Foodies\n4. Exploring World Cuisines from Home\n5. Seasonal Ingredients and How to Use Them\n6. Baking Secrets for Perfect Pastries\n7. Plant-Based Plates That Wow\n8. Comfort Foods with a Gourmet Twist\n9. Cooking Hacks for Everyday Success\n10. Flavorful Journeys: A Culinary Blog'
  ];

  // Utility to pick a random value from an array
  function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Generate 100 mock records with correct model-provider mapping
  const sampleData: AIQueryRecord[] = Array.from({ length: 100 }, (_, i) => {
    const model = randomChoice(models);
    const provider = modelProviderMap[model]; // ensure correct provider
    const input = randomChoice(inputs);
    const output = randomChoice(outputs);
    const now = Date.now();

    return {
      id: (i + 1).toString(),
      model,
      provider,
      input,
      output,
      inputTokens: Math.floor(Math.random() * 150) + 50, // 50-200
      outputTokens: Math.floor(Math.random() * 250) + 100, // 100-350
      cost: parseFloat((Math.random() * 0.03 + 0.005).toFixed(4)), // 0.005-0.035
      timestamp: new Date(now - Math.floor(Math.random() * 1000 * 60 * 60 * 48)), // last 48 hrs
      responseTime: Math.floor(Math.random() * 300) + 200 // 200-500 ms
    };
  });
</script>

<AIQueryAnalyticsTable data={sampleData} />
