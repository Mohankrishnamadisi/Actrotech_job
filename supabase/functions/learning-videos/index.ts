import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY') || '';
const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY') || '';
const cacheHours = Number(Deno.env.get('LEARNING_VIDEO_CACHE_HOURS') || '24');
const cacheMaxAgeMs = (Number.isFinite(cacheHours) ? cacheHours : 24) * 60 * 60 * 1000;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

const normalizeQuery = (value: unknown) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 160);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Only POST requests are supported' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const userClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const searchKey = normalizeQuery(body?.searchKey || body?.query);
    if (!searchKey) return json({ error: 'searchKey is required' }, 400);

    const cutoff = new Date(Date.now() - cacheMaxAgeMs).toISOString();
    const { data: cached, error: cacheError } = await adminClient
      .from('learning_videos_cache')
      .select('id, search_key, video_id, title, description, thumbnail_url, channel_name, published_at, video_url, embed_url, source_platform, created_at, updated_at')
      .eq('search_key', searchKey)
      .gte('updated_at', cutoff)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(12);

    if (!cacheError && cached?.length) return json({ videos: cached, cached: true, searchKey });
    if (!youtubeApiKey) return json({ error: 'Learning video provider is not configured' }, 503);

    const params = new URLSearchParams({
      part: 'snippet',
      q: searchKey,
      type: 'video',
      maxResults: '12',
      relevanceLanguage: 'en',
      videoEmbeddable: 'true',
      key: youtubeApiKey,
    });
    const providerResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!providerResponse.ok) return json({ error: 'Learning video provider request failed' }, 502);

    const providerPayload = await providerResponse.json();
    const videos = (providerPayload.items || [])
      .map((item: any) => {
        const videoId = item?.id?.videoId;
        if (!videoId) return null;
        return {
          search_key: searchKey,
          video_id: videoId,
          title: item.snippet?.title || 'Untitled video',
          description: item.snippet?.description || '',
          thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || null,
          channel_name: item.snippet?.channelTitle || 'YouTube',
          published_at: item.snippet?.publishedAt || null,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          embed_url: `https://www.youtube.com/embed/${videoId}`,
          source_platform: 'youtube',
        };
      })
      .filter(Boolean);

    if (videos.length) {
      await adminClient.from('learning_videos_cache').upsert(videos, { onConflict: 'search_key,video_id' });
    }
    return json({ videos, cached: false, searchKey });
  } catch (error) {
    console.error('[learning-videos]', error);
    return json({ error: 'Unable to load learning videos' }, 500);
  }
});
