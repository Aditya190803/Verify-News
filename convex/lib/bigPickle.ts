/** OpenCode Zen — Big Pickle (OpenAI-compatible chat completions). */

const DEFAULT_BASE = 'https://opencode.ai/zen/v1';
const DEFAULT_MODEL = 'big-pickle';

export async function chatJson(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error('OPENCODE_API_KEY missing');

  const base = (process.env.OPENCODE_ZEN_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '');
  const model = process.env.BIGPICKLE_MODEL ?? DEFAULT_MODEL;

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Big Pickle ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Big Pickle: empty response');
  return content;
}