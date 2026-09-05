const axios = require('axios');

const WATSONX_API_KEY    = process.env.WATSONX_API_KEY    || '';
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID || '';
const WATSONX_URL        = process.env.WATSONX_URL        || 'https://us-south.ml.cloud.ibm.com';

let cachedToken = null;
let tokenExpiry  = 0;

/**
 * Get IBM Cloud IAM token (cached for 55 min)
 */
async function getIAMToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const res = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSONX_API_KEY}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    cachedToken = res.data.access_token;
    tokenExpiry  = Date.now() + 55 * 60 * 1000;
    return cachedToken;
  } catch (err) {
    console.error('[WatsonX] Token error:', err.message);
    return null;
  }
}

/**
 * Generate text via IBM Granite LLM
 */
async function generateText(prompt, maxTokens = 512) {
  if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID) {
    return getMockResponse(prompt);
  }
  try {
    const token = await getIAMToken();
    if (!token) return getMockResponse(prompt);

    const endpoint = `${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`;
    const payload = {
      model_id: 'ibm/granite-13b-instruct-v2',
      input: prompt,
      parameters: {
        decoding_method: 'greedy',
        max_new_tokens: maxTokens,
        min_new_tokens: 30,
        stop_sequences: [],
        repetition_penalty: 1.1
      },
      project_id: WATSONX_PROJECT_ID
    };

    const res = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const text = res.data?.results?.[0]?.generated_text || getMockResponse(prompt);
    return text.trim();
  } catch (err) {
    console.error('[WatsonX] Generation error:', err.message);
    return getMockResponse(prompt);
  }
}

/**
 * Mock response fallback when WatsonX is unavailable
 */
function getMockResponse(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes('violation') || lower.includes('compliance')) {
    return `Compliance Analysis (AI Mock): Based on the submitted pollution data, the identified readings exceed CPCB thresholds. Immediate corrective action is recommended. The facility should review its effluent treatment plant (ETP) operations, ensure proper stack emission controls are active, and submit a compliance action plan within 48 hours to the Gujarat Pollution Control Board (GPCB). Failure to comply may result in closure notices under the Environment Protection Act, 1986.`;
  }
  if (lower.includes('health') || lower.includes('risk')) {
    return `Public Health Risk Summary (AI Mock): Current pollution levels in the monitored zone indicate MODERATE to HIGH risk for nearby residential populations. Elevated PM2.5 and SO₂ levels may cause respiratory irritation, particularly for children and elderly individuals. Citizens are advised to limit outdoor activities, use N95 masks if going outside, and consult healthcare providers if experiencing respiratory symptoms. Authorities should consider issuing advisory notices.`;
  }
  if (lower.includes('air') || lower.includes('pm2.5') || lower.includes('so2')) {
    return `Air Quality Report (AI Mock): Air quality monitoring in the Vapi–Ankleshwar corridor shows elevated levels of SO₂, NO₂ and PM2.5 exceeding the National Ambient Air Quality Standards (NAAQS). Primary sources are identified as chemical manufacturing plants and dye industries. Stack emissions from Units V-04 and A-02 are the likely contributors to the observed spike. Immediate stack scrubber maintenance and process optimization are recommended.`;
  }
  if (lower.includes('water') || lower.includes('effluent') || lower.includes('cod') || lower.includes('bod')) {
    return `Water Quality Report (AI Mock): Effluent monitoring data indicates elevated COD (Chemical Oxygen Demand) and BOD (Biological Oxygen Demand) values in discharge channels. pH levels are outside the permissible range of 6.5–8.5. TDS values suggest inadequate treatment before discharge into the Ambica river basin. The facility must upgrade its ETP capacity, conduct urgent maintenance checks, and retest discharge samples within 24 hours.`;
  }
  if (lower.includes('summary') || lower.includes('incident')) {
    return `Incident Summary (AI Mock): A pollution spike was detected at sensor cluster in the industrial zone at ${new Date().toLocaleTimeString()}. Anomaly detection algorithms flagged readings 2.3× above normal baseline. The event lasted approximately 45 minutes. Root cause analysis suggests a process upset at a nearby chemical facility. The Regulatory Alert Agent has notified the GPCB duty officer. Follow-up inspection is scheduled.`;
  }
  return `EcoGuard AI Report (AI Mock): Environmental monitoring analysis complete. All critical parameters have been evaluated against CPCB and GPCB standards. The system is operating in mock mode — connect IBM WatsonX credentials to enable live Granite LLM responses. Current data indicates mixed compliance status across monitored industrial units in the Vapi–Ankleshwar–Vatva corridor.`;
}

module.exports = { generateText, getMockResponse };
