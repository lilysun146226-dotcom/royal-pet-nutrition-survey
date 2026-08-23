const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const multiFields = ["healthStatus", "concerns", "feedingIssue", "trustSource"];
const singleFields = ["petType", "ageStage", "royalUsage", "priceAttitude"];

function asList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim()).slice(0, 3);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function parseStored(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return [String(value)];
  }
}

function countInto(target, values) {
  for (const value of values) target[value] = (target[value] || 0) + 1;
}

function personas(row) {
  const stage = row.age_stage;
  const health = parseStored(row.health_status);
  const concerns = parseStored(row.concerns);
  const trust = parseStored(row.trust_source);
  const result = [];
  if (stage === "幼年期（1岁以内）") result.push("成长守护型");
  if (stage === "老年期（7岁以上）" || health.some((x) => /慢性|术后|特殊|肾脏|泌尿/.test(x))) result.push("老龄／特殊关怀型");
  if (health.some((x) => /肠胃|皮肤|泌尿|过敏/.test(x)) || concerns.some((x) => /肠胃|软便|毛发|精准营养/.test(x))) result.push("敏感健康管理型");
  if (trust.some((x) => /兽医|科学|专业/.test(x)) || row.royal_usage === "正在喂食") result.push("专业信任型");
  if (/比较|促销|价格/.test(row.price_attitude || "") || concerns.some((x) => /价格|性价比/.test(x))) result.push("理性价值型");
  return result.length ? result : ["一般营养关注型"];
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/responses" && request.method === "POST") {
        const body = await request.json();
        for (const field of singleFields) {
          if (typeof body[field] !== "string" || !body[field].trim()) return json({ error: `请完成必答项：${field}` }, 400);
        }
        const lists = Object.fromEntries(multiFields.map((field) => [field, asList(body[field])]));
        for (const field of multiFields) {
          if (!lists[field].length) return json({ error: `请至少选择一项：${field}` }, 400);
        }
        await env.DB.prepare(`INSERT INTO survey_responses
          (pet_type, age_stage, health_status, concerns, feeding_issue, royal_usage, trust_source, price_attitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.petType, body.ageStage, JSON.stringify(lists.healthStatus), JSON.stringify(lists.concerns), JSON.stringify(lists.feedingIssue), body.royalUsage, JSON.stringify(lists.trustSource), body.priceAttitude)
          .run();
        return json({ ok: true }, 201);
      }

      if (url.pathname === "/api/stats" && request.method === "GET") {
        const result = await env.DB.prepare(`SELECT pet_type, age_stage, health_status, concerns, feeding_issue, royal_usage, trust_source, price_attitude FROM survey_responses ORDER BY created_at DESC`).all();
        const rows = result.results || [];
        const stages = {}, concerns = {}, health = {}, sentiment = {}, segments = {};
        for (const row of rows) {
          countInto(stages, [row.age_stage]);
          countInto(concerns, parseStored(row.concerns));
          countInto(health, parseStored(row.health_status));
          const feeling = row.royal_usage === "正在喂食" ? "正向" : row.royal_usage === "曾经喂过" ? "负向／流失" : "中性／潜在";
          countInto(sentiment, [feeling]);
          countInto(segments, personas(row));
        }
        return json({ total: rows.length, stages, concerns, health, sentiment, segments, updatedAt: new Date().toISOString() });
      }

      if (url.pathname === "/" && request.method === "GET") return json({ service: "Royal Pet Nutrition Survey API", status: "ok" });
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: "服务暂时不可用", detail: String(error?.message || error) }, 500);
    }
  },
};
