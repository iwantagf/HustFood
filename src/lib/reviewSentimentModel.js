import path from 'path';
import { analyzeReviewSentimentByRule } from '@/lib/reviews';

const ONNX_MODEL_PATH = path.join(process.cwd(), 'public', 'models', 'sentiment', 'tfidf-logreg-sentiment.onnx');
const ONNX_MODEL_SHA256 = '9e2e548e31e5fe54ab860b35d1e1bcd610a35567cbada2427a02bf0f22a84fce';
const ONNX_MODEL_SOURCE = 'pieandai-grenoble/2024-02-23-ml-models-web';

let sessionPromise = null;

function getAverageRating(foodRating, shipperRating) {
  const ratings = [foodRating, shipperRating]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!ratings.length) return 0;
  return ratings.reduce((total, value) => total + value, 0) / ratings.length;
}

function normalizeOnnxLabel(label) {
  const value = String(label || '').toLowerCase();
  if (value === 'neg' || value === 'negative') return 'negative';
  if (value === 'pos' || value === 'positive') return 'positive';
  return 'neutral';
}

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = import('onnxruntime-node').then((ort) => (
      ort.InferenceSession.create(ONNX_MODEL_PATH).then((session) => ({ ort, session }))
    ));
  }

  return sessionPromise;
}

function blendOnnxWithRatings(onnxSentiment, averageRating, confidence) {
  if (averageRating > 0 && averageRating <= 2) return 'negative';
  if (averageRating >= 4.5 && onnxSentiment !== 'negative') return 'positive';
  if (confidence > 0 && confidence < 0.62 && averageRating >= 2.5 && averageRating <= 4.2) return 'neutral';
  return onnxSentiment;
}

export async function analyzeReviewSentiment({ comment = '', foodRating = 0, shipperRating = null } = {}) {
  const ruleResult = analyzeReviewSentimentByRule({ comment, foodRating, shipperRating });
  const text = String(comment || '').trim();
  const averageRating = getAverageRating(foodRating, shipperRating);

  if (!text) {
    return {
      ...ruleResult,
      sentimentReason: `${ruleResult.sentimentReason} | fallback:no-comment`
    };
  }

  try {
    const { ort, session } = await getSession();
    const inputName = session.inputNames[0];
    const outputs = await session.run({
      [inputName]: new ort.Tensor('string', [text], [1])
    });
    const labelTensor = outputs.label || outputs[session.outputNames[0]];
    const probabilityTensor = outputs.probabilities || outputs[session.outputNames[1]];
    const rawLabel = Array.from(labelTensor?.data || [])[0];
    const probabilities = Array.from(probabilityTensor?.data || []);
    const onnxSentiment = normalizeOnnxLabel(rawLabel);
    const confidence = probabilities.length ? Math.max(...probabilities) : 0;
    const finalSentiment = blendOnnxWithRatings(onnxSentiment, averageRating, confidence);
    const signedScore = finalSentiment === 'negative' ? -confidence : finalSentiment === 'positive' ? confidence : 0;

    return {
      sentiment: finalSentiment,
      sentimentScore: Number(signedScore.toFixed(2)),
      sentimentReason: [
        `onnx:${ONNX_MODEL_SOURCE}`,
        `sha256:${ONNX_MODEL_SHA256.slice(0, 12)}`,
        `label:${rawLabel || 'unknown'}`,
        `confidence:${confidence.toFixed(2)}`,
        averageRating ? `rating:${averageRating.toFixed(1)}` : '',
        finalSentiment !== onnxSentiment ? `rating_override:${finalSentiment}` : ''
      ].filter(Boolean).join(' | ')
    };
  } catch (error) {
    return {
      ...ruleResult,
      sentimentReason: `${ruleResult.sentimentReason} | fallback:onnx-error`
    };
  }
}
