const PLAN_LIMITS = {
  free: {
    compiler_runs: 50,
    voice_minutes: 10,
  },
  pro: {
    compiler_runs: 500,
    voice_minutes: 120,
  },
  team: {
    compiler_runs: 2000,
    voice_minutes: 600,
  },
  enterprise: {
    compiler_runs: 10000,
    voice_minutes: 2400,
  },
};

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

module.exports = { PLAN_LIMITS, getPlanLimits };
