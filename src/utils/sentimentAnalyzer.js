import * as tf from '@tensorflow/tfjs';

/**
 * Client-Side AI Sentiment Analyzer Engine (TensorFlow.js)
 * 100% In-Browser ML Evaluation at $0 Cost (Zero External Paid APIs)
 *
 * Implements token-level sentiment tensor modeling with negation scoping,
 * intensifier boosting, and TensorFlow.js tensor math.
 */

// Lexicon with polarity weights [-1.0, 1.0]
const SENTIMENT_LEXICON = {
  // Strongly Positive (+0.8 to +1.0)
  masterpiece: 1.0,
  phenomenal: 0.95,
  brilliant: 0.95,
  breathtaking: 0.95,
  extraordinary: 0.9,
  exceptional: 0.9,
  superb: 0.9,
  stellar: 0.9,
  flawless: 0.9,
  magnificent: 0.9,
  perfection: 0.9,
  outstanding: 0.85,
  inspiring: 0.85,
  insightful: 0.85,
  compelling: 0.85,
  profound: 0.85,
  gem: 0.85,
  genius: 0.85,
  unforgettable: 0.85,
  mustread: 0.85,
  fascinating: 0.8,
  delightful: 0.8,
  captivating: 0.8,
  marvelous: 0.8,
  treasure: 0.8,
  excellent: 0.8,
  wonderful: 0.8,
  fantastic: 0.8,
  amazing: 0.8,
  loved: 0.8,
  love: 0.75,

  // Moderately Positive (+0.4 to +0.7)
  great: 0.7,
  enjoyable: 0.65,
  recommend: 0.65,
  recommended: 0.65,
  informative: 0.6,
  valuable: 0.6,
  engaging: 0.6,
  articulate: 0.6,
  thorough: 0.55,
  impressive: 0.6,
  enlightening: 0.6,
  vivid: 0.5,
  sharp: 0.5,
  clarity: 0.5,
  creative: 0.5,
  good: 0.45,
  interesting: 0.45,
  pleasant: 0.45,
  helpful: 0.5,
  neat: 0.4,
  clear: 0.4,
  solid: 0.4,
  favorite: 0.7,
  favourite: 0.7,

  // Mildly Positive (+0.2 to +0.35)
  fine: 0.25,
  decent: 0.3,
  okay: 0.2,
  readable: 0.3,
  smooth: 0.3,

  // Mildly Negative (-0.2 to -0.35)
  slow: -0.25,
  dry: -0.3,
  repetitive: -0.35,
  lengthy: -0.25,
  simplistic: -0.3,

  // Moderately Negative (-0.4 to -0.7)
  boring: -0.65,
  dull: -0.6,
  tedious: -0.65,
  bland: -0.5,
  flat: -0.5,
  shallow: -0.6,
  confusing: -0.6,
  disappointing: -0.7,
  disappointed: -0.7,
  overrated: -0.6,
  pretentious: -0.65,
  cluttered: -0.5,
  monotonous: -0.55,
  poor: -0.6,
  poorly: -0.6,
  sloppy: -0.65,
  uninspired: -0.6,
  unrealistic: -0.5,
  mediocre: -0.5,
  dislike: -0.55,
  underwhelming: -0.6,
  flawed: -0.5,
  annoying: -0.6,
  tiresome: -0.6,

  // Strongly Negative (-0.8 to -1.0)
  terrible: -0.9,
  horrible: -0.9,
  awful: -0.9,
  waste: -0.85,
  pointless: -0.8,
  superficial: -0.75,
  unreadable: -0.85,
  worst: -0.95,
  bad: -0.7,
  cliche: -0.7,
  cliché: -0.7,
  hated: -0.9,
  hate: -0.85,
  trash: -0.9,
  regret: -0.8,
  frustrating: -0.75,
  mess: -0.8,
  garbage: -0.95,

  // Profanities & Vulgar insults
  fuck: -1.0,
  fucking: -1.0,
  fucker: -1.0,
  fuk: -1.0,
  bitch: -0.95,
  bithc: -0.95,
  shit: -0.9,
  shitty: -0.9,
  asshole: -0.95,
  bastard: -0.9,
  cunt: -1.0,
  dick: -0.9,
  pussy: -0.9,
  slut: -0.95,
  whore: -0.95,
  retard: -0.95
};

// Words that invert valence (negations)
const NEGATIONS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'hardly', 'scarcely', 
  'barely', "n't", 'without', 'lacks', 'lacking'
]);

// Multipliers for emotional intensity
const INTENSIFIERS = {
  very: 1.4,
  extremely: 1.6,
  truly: 1.35,
  incredibly: 1.5,
  exceptionally: 1.5,
  deeply: 1.3,
  absolutely: 1.5,
  hugely: 1.4,
  remarkably: 1.4,
  immensely: 1.5,
  completely: 1.4,
  totally: 1.4,
  highly: 1.35,
  so: 1.25,
  really: 1.3
};

const DIMINISHERS = {
  somewhat: 0.7,
  slightly: 0.65,
  barely: 0.5,
  little: 0.7,
  bit: 0.75,
  hardly: 0.5
};

/**
 * Tokenize sentence into normalized words
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/n't/g, " n't")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Analyze sentiment of input string using TensorFlow.js tensor computations
 * @param {string} text 
 * @returns {{ label: 'positive'|'negative'|'neutral', score: number, confidence: number, details: object }}
 */
export function analyzeSentiment(text) {
  if (!text || !text.trim()) {
    return {
      label: 'neutral',
      score: 0.5,
      confidence: 50,
      details: { positiveTokens: [], negativeTokens: [], intensity: 1 }
    };
  }

  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return {
      label: 'neutral',
      score: 0.5,
      confidence: 50,
      details: { positiveTokens: [], negativeTokens: [], intensity: 1 }
    };
  }

  const tokenScores = [];
  const positiveTokens = [];
  const negativeTokens = [];
  let isNegated = false;
  let negationWindow = 0;
  let currentMultiplier = 1.0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check for intensifier
    if (INTENSIFIERS[token]) {
      currentMultiplier = INTENSIFIERS[token];
      continue;
    }

    // Check for diminisher
    if (DIMINISHERS[token]) {
      currentMultiplier = DIMINISHERS[token];
      continue;
    }

    // Check for negation
    if (NEGATIONS.has(token) || token.endsWith("n't")) {
      isNegated = true;
      negationWindow = 3; // Negates following 3 tokens
      continue;
    }

    // Check lexicon
    let rawScore = SENTIMENT_LEXICON[token];

    if (rawScore !== undefined) {
      let finalTokenScore = rawScore * currentMultiplier;

      if (isNegated) {
        // Invert polarity with damping
        finalTokenScore = -finalTokenScore * 0.8;
      }

      tokenScores.push(finalTokenScore);

      if (finalTokenScore > 0.15) {
        positiveTokens.push(token);
      } else if (finalTokenScore < -0.15) {
        negativeTokens.push(token);
      }

      // Reset multiplier after applying to a polarity word
      currentMultiplier = 1.0;
    } else {
      // Neutral token adds mild damping towards zero
      tokenScores.push(0.0);
    }

    // Decrease negation window
    if (negationWindow > 0) {
      negationWindow--;
      if (negationWindow === 0) {
        isNegated = false;
      }
    }
  }

  // If no sentiment tokens detected, return neutral
  if (positiveTokens.length === 0 && negativeTokens.length === 0) {
    return {
      label: 'neutral',
      score: 0.5,
      confidence: 50,
      details: { positiveTokens: [], negativeTokens: [], intensity: 1 }
    };
  }

  // Execute TensorFlow.js Tensor Math inside tf.tidy to prevent memory leaks
  const tfResult = tf.tidy(() => {
    // 1D Tensor of token scores
    const tensorScores = tf.tensor1d(tokenScores);

    // Sum and Mean tensors
    const sumTensor = tensorScores.sum();
    const meanTensor = tensorScores.mean();
    const absSumTensor = tensorScores.abs().sum();

    const sumVal = sumTensor.dataSync()[0];
    const meanVal = meanTensor.dataSync()[0];
    const absSumVal = absSumTensor.dataSync()[0];

    // Squashing activation function: Sigmoid mapped from polarity to [0, 1]
    // score = 1 / (1 + exp(-2.2 * sumVal))
    const rawSquashed = tf.sigmoid(tf.scalar(sumVal * 1.5)).dataSync()[0];

    return {
      sumVal,
      meanVal,
      absSumVal,
      squashedScore: rawSquashed
    };
  });

  const { sumVal, absSumVal, squashedScore } = tfResult;

  // Classify label based on threshold
  let label = 'neutral';
  let normalizedScore = Number(squashedScore.toFixed(2));

  if (sumVal > 0.35 || normalizedScore >= 0.58) {
    label = 'positive';
  } else if (sumVal < -0.35 || normalizedScore <= 0.42) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  // Calculate confidence percentage
  // Higher when polarizing terms are present and decisive
  const polarityDominance = absSumVal > 0 ? Math.min(1, Math.abs(sumVal) / absSumVal) : 0.5;
  const confidence = Math.min(99, Math.max(50, Math.round(50 + polarityDominance * 45)));

  return {
    label,
    score: normalizedScore,
    confidence,
    details: {
      positiveTokens,
      negativeTokens,
      sentimentSum: Number(sumVal.toFixed(2))
    }
  };
}

/**
 * Visual styling props helper for sentiment badges
 */
export function getSentimentBadgeProps(label, score) {
  switch (label) {
    case 'positive':
      return {
        label: 'Positive',
        bgColor: 'bg-emerald-950/80',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        dotColor: 'bg-emerald-400',
        emoji: '✨',
        description: 'Optimistic & Enthusiastic'
      };
    case 'negative':
      return {
        label: 'Critical / Negative',
        bgColor: 'bg-rose-950/80',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/40',
        dotColor: 'bg-rose-400',
        emoji: '⚠️',
        description: 'Critical or Disappointed'
      };
    default:
      return {
        label: 'Neutral',
        bgColor: 'bg-amber-950/40',
        textColor: 'text-amber-300',
        borderColor: 'border-amber-500/30',
        dotColor: 'bg-amber-400',
        emoji: '⚖️',
        description: 'Balanced & Objective'
      };
  }
}

