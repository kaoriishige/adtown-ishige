export function calculateMatchScore(user: any, job: any, company: any) {
  let score = 0;
  const reasons: string[] = [];

  if ((job.salaryMax || 0) >= (user.desiredAnnualSalary || 0)) {
    score += 30;
    reasons.push("希望給与に合致");
  }

  if ((user.desiredJobTypes || []).includes(job.jobCategory)) {
    score += 25;
    reasons.push("希望職種に一致");
  }

  const matched = (user.skills || []).filter((s: string) =>
    (job.requiredSkills || []).includes(s)
  );
  if (matched.length > 0) {
    score += Math.min(20, matched.length * 5);
    reasons.push("スキル一致");
  }

  if (user.location && job.location && user.location === job.location) {
    score += 15;
    reasons.push("勤務地一致");
  }

  return { score: Math.min(99, Math.round(score)), reasons };
}
