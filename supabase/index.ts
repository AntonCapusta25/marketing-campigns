import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChefData {
  brandName: string;
  cuisineType: string;
  starDish: string;
  city: string;
  menuHighlights: string;
}

interface CampaignVariant {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  imageDescription: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { chefData, imageModel } = await req.json() as {
      chefData: ChefData;
      imageModel: 'recraft' | 'gemini';
    };

    if (!chefData.brandName || !chefData.cuisineType) {
      return new Response(
        JSON.stringify({ error: "Brand name and cuisine type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Generate campaign concepts with Gemini
    const concepts = await generateCampaignConcepts(chefData);

    // Step 2: Generate images based on selected model
    const variantsWithImages = await Promise.all(
      concepts.map(async (concept) => {
        try {
          const imageUrl = imageModel === 'recraft'
            ? await generateRecraftImage(concept.imageDescription, chefData)
            : await generateGeminiImage(concept.imageDescription, chefData);

          return {
            ...concept,
            imageUrl,
            status: 'completed' as const,
          };
        } catch (error) {
          console.error(`Failed to generate image for ${concept.title}:`, error);
          return {
            ...concept,
            imageUrl: null,
            status: 'error' as const,
            error: 'Failed to generate image',
          };
        }
      })
    );

    // Optional: Save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // You can store the campaign in the campaigns table if needed
    // await supabase.from('campaigns').insert({
    //   source_type: 'generated',
    //   input_brief: chefData,
    //   variants: variantsWithImages,
    // });

    return new Response(
      JSON.stringify({ variants: variantsWithImages }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateCampaignConcepts(chefData: ChefData): Promise<CampaignVariant[]> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `You are a social media marketing expert for home restaurants and food delivery platforms.

Generate 5-7 Instagram campaign concepts for this home restaurant:
- Brand: ${chefData.brandName}
- Cuisine: ${chefData.cuisineType}
- Star Dish: ${chefData.starDish || 'not specified'}
- Location: ${chefData.city || 'not specified'}
- Menu Highlights: ${chefData.menuHighlights || 'not specified'}

For each concept, provide:
1. A short, catchy title (3-5 words)
2. An engaging Instagram caption (50-100 words) with a clear call-to-action
3. 5-8 relevant hashtags (mix of popular and niche)
4. A detailed image description for AI image generation (focus on food, ambiance, or lifestyle)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "string",
    "caption": "string with emojis and CTA",
    "hashtags": ["#tag1", "#tag2"],
    "imageDescription": "detailed prompt for food photography or marketing image"
  }
]

Make the campaigns feel authentic, appetizing, and action-oriented. Include variety: some food-focused, some lifestyle, some behind-the-scenes.`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  // Extract JSON from markdown code blocks if present
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "").trim();
  }

  const concepts = JSON.parse(jsonText);
  
  // Add unique IDs
  return concepts.map((concept: any, index: number) => ({
    id: `variant-${Date.now()}-${index}`,
    ...concept
  }));
}

async function generateRecraftImage(imageDescription: string, chefData: ChefData): Promise<string> {
  const recraftApiKey = Deno.env.get("RECRAFT_API_KEY");
  if (!recraftApiKey) {
    throw new Error("RECRAFT_API_KEY not configured");
  }

  const enhancedPrompt = `Professional food marketing photo: ${imageDescription}. ${chefData.cuisineType} cuisine style. High quality, appetizing, Instagram-worthy.`;

  const response = await fetch(
    "https://external.api.recraft.ai/v1/images/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${recraftApiKey}`,
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        style: "realistic_image",
        model: "nano_banana", // Using Nano Banana for ad-style creative imagery
        response_format: "url",
        size: "1024x1024",
        n: 1,
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Recraft API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

async function generateGeminiImage(imageDescription: string, chefData: ChefData): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const enhancedPrompt = `Professional food photography: ${imageDescription}. ${chefData.cuisineType} cuisine. High quality, appetizing, well-lit, Instagram-worthy composition.`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        instances: [{
          prompt: enhancedPrompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_some",
          personGeneration: "allow_adult"
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Imagen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Gemini returns base64 image, you might want to upload to Supabase Storage
  const base64Image = data.predictions[0].bytesBase64Encoded;
  
  // For now, return as data URL (or upload to storage)
  return `data:image/png;base64,${base64Image}`;
}
