import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function cleanText(text: string): string {
  return decodeHtml(text)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AngelNumbersBot/1.0)',
      },
    });
    
    if (!response.ok) return '';
    
    const html = await response.text();
    
    const textMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (textMatch) {
      return cleanText(textMatch[1]).slice(0, 2000);
    }
    
    return '';
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
  }
}

function consolidateMeanings(texts: string[]): string[] {
  const themes: string[] = [];
  const noisePatterns = [
    /^by\s+\w+/i, /^\w+\s+(com|net|org)/i, /^\d+\s+\w+\s+\d{4}/i,
    /subscribe|newsletter|advertisement/i, /getty|illustration|photo/i,
    /today\.com|read more|click here/i, /©\s*\d{4}/i,
    /best crystals| crystals for/i, /twin flames/i
  ];
  
  for (const text of texts) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (const sentence of sentences.slice(0, 5)) {
      let cleaned = sentence.trim();
      
      cleaned = cleaned.replace(/^by\s+\w+/i, '');
      cleaned = cleaned.replace(/com\s+\w+\s+\d{4}/i, '');
      cleaned = cleaned.replace(/^\w+\s+(com|net|org)\s*/i, '');
      cleaned = cleaned.replace(/\d+\s+\w+\s+\d{4}.*?(AM|PM).*?(ET|PDT|EST|PST)?\s*/gi, '');
      cleaned = cleaned.replace(/(newsletter|subscribe|advertisement|getty|illustration|photo|today\.com|read more|click here|©\s*\d{4})/gi, '');
      cleaned = cleaned.replace(/best crystals.*$/gi, '');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      const isNoise = noisePatterns.some(p => p.test(cleaned));
      const hasSiteName = /\s(com|net|org|com\b)$/i.test(cleaned);
      
      if (!isNoise && !hasSiteName && cleaned.length > 40 && cleaned.length < 300) {
        if (!themes.some(t => t.slice(0, 30).includes(cleaned.slice(0, 30)))) {
          themes.push(cleaned);
        }
      }
    }
  }
  
  return themes.slice(0, 3);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { number } = await req.json();

    if (!number) {
      return new Response(
        JSON.stringify({ error: 'Number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cached, error: cacheError } = await supabase
      .from('angel_cache')
      .select('meanings, created_at')
      .eq('number', number)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      throw cacheError;
    }

    if (cached) {
      return new Response(
        JSON.stringify({ number, meanings: cached.meanings, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) {
      return new Response(
        JSON.stringify({ error: 'SerpAPI key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const serpUrl = `https://serpapi.com/search.json?q=angel+number+${number}+meaning&api_key=${serpApiKey}`;
    const serpResponse = await fetch(serpUrl);
    const serpData = await serpResponse.json();

    if (!serpData.organic_results || serpData.organic_results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No results from SerpAPI' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const topUrls = serpData.organic_results
      .slice(0, 3)
      .map((result: any) => result.link)
      .filter(Boolean);

    const extractedTexts = await Promise.all(
      topUrls.map(url => extractTextFromUrl(url))
    );

    const validTexts = extractedTexts.filter(t => t.length > 0);
    
    let meanings: string[];
    
    if (validTexts.length > 0) {
      meanings = consolidateMeanings(validTexts);
    } else {
      const snippets = serpData.organic_results
        .slice(0, 3)
        .map((result: any) => result.snippet?.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);
      meanings = consolidateMeanings(snippets);
    }

    if (meanings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No meanings found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const sources = topUrls.slice(0, 3).map((url: string) => {
      try {
        return new URL(url).hostname.replace('www.', '');
      } catch {
        return url;
      }
    });

    const { error: insertError } = await supabase
      .from('angel_cache')
      .insert({ number, meanings, sources });

    if (insertError) {
      console.error('Cache insert error:', insertError);
    }

    return new Response(
      JSON.stringify({ number, meanings, sources, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
