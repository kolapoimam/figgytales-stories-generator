
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AIRequest, AIResponse, UserStory, AcceptanceCriterion } from "./types.ts";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the GOOGLE_AI_API_KEY from environment variable
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
    }

    // Parse the request body
    const requestData: AIRequest = await req.json();
    
    if (!requestData.images || requestData.images.length === 0) {
      throw new Error('No images provided in the request');
    }
    
    console.log(`Generating ${requestData.storyCount} user stories with ${requestData.criteriaCount} acceptance criteria each`);
    console.log(`Number of images: ${requestData.images.length}`);

    // Prepare the request for Google AI API
    const content = [
      {
        role: "user",
        parts: [
          { text: requestData.prompt || `Generate ${requestData.storyCount} user stories with ${requestData.criteriaCount} acceptance criteria each based on these design screens.` },
          ...requestData.images.map(image => ({
            inline_data: {
              mime_type: image.split(';')[0].split(':')[1] || 'image/jpeg',
              data: image.split(',')[1]
            }
          }))
        ]
      }
    ];

    // Call Google AI API (Gemini Pro Vision)
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" + GOOGLE_AI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: content,
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI API error:", errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No content generated by AI");
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log("Generated text length:", generatedText.length);

    // Parse the AI response into structured user stories
    const userStories = parseAIResponseToStories(generatedText, requestData.storyCount, requestData.criteriaCount);

    // Prepare the response
    const aiResponse: AIResponse = {
      stories: userStories,
    };

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during story generation",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseAIResponseToStories(text: string, expectedStoryCount: number, expectedCriteriaCount: number): UserStory[] {
  // Split the text by common user story delimiters
  // This is a simplified parsing logic that would need to be adjusted based on actual AI output format
  const storyBlocks = text.split(/(?:User Story|Story) #?\d+:?\s*/).filter(Boolean);
  const stories: UserStory[] = [];

  // Process each story block
  for (let i = 0; i < Math.min(storyBlocks.length, expectedStoryCount); i++) {
    const block = storyBlocks[i].trim();
    
    // Extract title, description and criteria
    const titleMatch = block.match(/(?:Title|As a|I want|So that).*?\n/i);
    const title = titleMatch ? titleMatch[0].trim() : `User Story ${i + 1}`;
    
    // Extract description (everything up to acceptance criteria)
    let description = block;
    const criteriaIndex = block.toLowerCase().indexOf("acceptance criteria");
    
    if (criteriaIndex !== -1) {
      description = block.substring(0, criteriaIndex).trim();
    }
    
    // Extract acceptance criteria
    const criteria: AcceptanceCriterion[] = [];
    const criteriaMatches = block.match(/(?:\d+\.\s.*?(?=\d+\.|$))|(?:- .*?(?=- |$))/gs);
    
    if (criteriaMatches) {
      // Take only the expected number of criteria
      for (let j = 0; j < Math.min(criteriaMatches.length, expectedCriteriaCount); j++) {
        criteria.push({
          id: uuidv4(),
          description: criteriaMatches[j].replace(/^\d+\.\s*|- /, '').trim(),
        });
      }
    }
    
    // Add default criteria if none were found
    while (criteria.length < expectedCriteriaCount) {
      criteria.push({
        id: uuidv4(),
        description: `Acceptance criterion ${criteria.length + 1}`,
      });
    }
    
    // Create the user story
    stories.push({
      id: uuidv4(),
      title: title.length > 100 ? title.substring(0, 97) + '...' : title,
      description: description.length > 500 ? description.substring(0, 497) + '...' : description,
      criteria,
    });
  }
  
  // Add default stories if we didn't get enough
  while (stories.length < expectedStoryCount) {
    const index = stories.length + 1;
    stories.push({
      id: uuidv4(),
      title: `User Story ${index}`,
      description: `This is a placeholder for User Story ${index}.`,
      criteria: Array.from({ length: expectedCriteriaCount }, (_, j) => ({
        id: uuidv4(),
        description: `Acceptance criterion ${j + 1} for story ${index}`,
      })),
    });
  }
  
  return stories;
}
