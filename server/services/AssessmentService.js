const Assessment = require("../models/AssessmentModel");

function average(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function classifyChange(change) {
  if (change > 0.5) return "Significant Improvement";
  if (change > 0.1) return "Moderate Improvement";
  if (change >= -0.1) return "No Significant Change";
  return "Decline";
}

async function saveAssessment(data) {
  return await Assessment.create(data);
}

async function getImprovementResult(userId) {
  const assessments = await Assessment.find({ userId }).sort({ createdAt: 1 });

  const pre = assessments.find((a) => a.type === "pre");
  const post = assessments.find((a) => a.type === "post");

  if (!pre || !post) {
    throw new Error("Both pre and post assessments are required");
  }

  const preAwareness = average(pre.awarenessAnswers);
  const postAwareness = average(post.awarenessAnswers);
  const awarenessChange = postAwareness - preAwareness;

  const preBehavior = average(pre.behaviorAnswers);
  const postBehavior = average(post.behaviorAnswers);
  const behaviorChange = postBehavior - preBehavior;

  const emissionChange = pre.monthlyEmissions - post.monthlyEmissions;
  const emissionReductionPercent =
    (emissionChange / pre.monthlyEmissions) * 100;

  const awarenessImproved = awarenessChange > 0;
  const behaviorImproved = behaviorChange > 0;
  const emissionsImproved = emissionChange > 0;

  const improvementScore = [
    awarenessImproved,
    behaviorImproved,
    emissionsImproved,
  ].filter(Boolean).length;

  return {
    awareness: {
      pre: preAwareness,
      post: postAwareness,
      change: awarenessChange,
      status: classifyChange(awarenessChange),
    },
    behavior: {
      pre: preBehavior,
      post: postBehavior,
      change: behaviorChange,
      status: classifyChange(behaviorChange),
    },
    emissions: {
      pre: pre.monthlyEmissions,
      post: post.monthlyEmissions,
      reductionKg: emissionChange,
      reductionPercent: emissionReductionPercent,
      improved: emissionsImproved,
    },
    overall: {
      improved: improvementScore >= 2,
      score: improvementScore,
    },
  };
}

module.exports = {
  saveAssessment,
  getImprovementResult,
};
