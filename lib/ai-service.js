// lib/ai-service.js

// --- Intent detection ---
function detectIntent(q) {
  const s = q.toLowerCase();
  const casual =
    /^(hey|hi|hello|yo|sup|what'?s up|how('?s)? it going)/.test(s) || s.length <= 20;
  const platform =
    /(video|playlist|find|search|upload|profile|delete|comment|dashboard|browse|watch|create|navigate|how to|where|path|steps|link)/.test(
      s
    );
  const teach =
    /(explain|what is|how does|why|derive|prove|algorithm|complexity|example|code|formula|theorem)/.test(
      s
    );
  const reasoning =
    /(why|compare|analyze|evaluate|recommend|best way|should i|strategy|plan|roadmap|steps to|difference between)/.test(
      s
    );
  return { casual, platform, teach, reasoning };
}

// --- Style policy builders ---
function buildSystemPrompt(style, platformCtx) {
  if (style === 'Casual') {
    return [
      'You are a friendly assistant.',
      'Answer in one short line, plain text, no markdown, no bullets, no bold, no code fences.'
    ].join(' ');
  }

  if (style === 'Navigate') {
    const counts = platformCtx?.counts || { videos: 0, playlists: 0 };
    return [
      'You are an in-app guide for KLH Peer Learning.',
      'Write 2-5 short lines, plain text, no markdown, no bold, no code fences.',
      'Always include a step-by-step path using arrows, like: Dashboard -> Playlists.',
      'Always include a direct link path when relevant, like: /playlists or /browse.',
      `Current counts: videos=${counts.videos}, playlists=${counts.playlists}.`,
      'Prefer 2-3 example titles if available; keep answers minimal and actionable.'
    ].join(' ');
  }

  // Teach (academic)
  return [
    'You are a concise tutor.',
    'Answer in 3-6 short lines, plain text, no markdown, no bold, no code fences.',
    'Use clear structure: definition, key idea, tiny example if needed.'
  ].join(' ');
}

function buildUserPrompt(question, style, platformCtx) {
  if (style === 'Navigate') {
    const paths = [
      'Common paths:',
      'Dashboard -> Browse  (/browse)',
      'Dashboard -> Playlists  (/playlists)',
      'Dashboard -> Upload  (/upload)',
      'Dashboard -> Profile  (/profile)'
    ].join('\n');

    const featured =
      (platformCtx?.featured || [])
        .map(
          (p, i) => `${i + 1}. "${p.title}" (${p.n} videos) -> /playlists/${p.id}`
        )
        .join('\n') || 'No featured playlists.';

    return [
      'Question:', question,
      '\nUse this platform context to give exact steps and links:',
      paths,
      '\nFeatured playlists:',
      featured
    ].join('\n');
  }

  return question;
}

// --- Perplexity call (Sonar models) ---
async function callPerplexity({ prompt, system, reasoning }) {
  const model = reasoning ? 'sonar-reasoning' : 'sonar-pro';

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: reasoning ? 0.6 : 0.7,
      max_tokens: 800
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Perplexity API error: ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || '', model };
}

// --- Output normalizer ---
function normalizeAnswer(s) {
  return s
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/\*\*/g, '') // remove bold markers
    .replace(/\*([^\*]+)\*/g, '$1') // remove italics markers
    .replace(/[ \t]+\n/g, '\n') // trailing spaces
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim();
}

// --- Public API: askAI ---
export async function askAI(question, platformCtx) {
  const { casual, platform, teach, reasoning } = detectIntent(question);
  const style = casual ? 'Casual' : platform ? 'Navigate' : 'Teach';
  const system = buildSystemPrompt(style, platformCtx);
  const prompt = buildUserPrompt(question, style, platformCtx);
  const { text, model } = await callPerplexity({
    prompt,
    system,
    reasoning: style !== 'Casual' && reasoning
  });
  return { success: true, answer: normalizeAnswer(text), model };
}

// --- Public API: askPerplexity (direct, general-purpose) ---
export async function askPerplexity(prompt, context = '', useReasoning = false) {
  const system = context || 'You are a helpful assistant for KLH Peer Learning.';
  const { text, model } = await callPerplexity({
    prompt,
    system,
    reasoning: useReasoning
  });
  return { success: true, answer: normalizeAnswer(text), model };
}
