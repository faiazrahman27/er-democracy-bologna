import { calculateVoteWeight } from './vote-weight.util';

describe('calculateVoteWeight', () => {
  const baseAssessment = {
    stakeholderRole: 'UNIVERSITY_STUDENT',
    backgroundCategory: 'EDUCATION',
    experienceLevel: 'EXPERT',
    relationshipToArea: 'RESIDENT',
    city: 'BOLOGNA',
    region: 'EMILIA_ROMAGNA',
    country: 'ITALY',
    assessmentCompleted: true,
  } as const;

  it('keeps GENERAL weighting unchanged', () => {
    expect(
      calculateVoteWeight({
        voteType: 'GENERAL',
        topicCategory: 'education',
      }),
    ).toEqual({
      weightUsed: 1,
      calculationType: 'GENERAL',
    });
  });

  it('keeps SELF_ASSESSMENT weighting unchanged', () => {
    expect(
      calculateVoteWeight({
        voteType: 'SELF_ASSESSMENT',
        topicCategory: 'education',
        selfAssessmentScore: 7,
      }),
    ).toEqual({
      weightUsed: 0.7,
      calculationType: 'SELF_ASSESSMENT',
    });
  });

  it('gives specialized votes a clearly higher weight for direct topic matches than for unrelated generic expertise', () => {
    const directTopicMatch = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'governance',
      title: 'University student academic support and education policy',
      summary: 'Education consultation for campus services in Bologna',
      methodologySummary: 'Academic research and student participation',
      assessment: baseAssessment,
    });

    const unrelatedGenericExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'governance',
      title: 'University student academic support and education policy',
      summary: 'Education consultation for campus services in Bologna',
      methodologySummary: 'Academic research and student participation',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'PUBLIC_SECTOR_EMPLOYEE',
        backgroundCategory: 'PUBLIC_ADMINISTRATION',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(directTopicMatch.calculationType).toBe('SPECIALIZED');
    expect(directTopicMatch.weightUsed).toBeGreaterThanOrEqual(1.5);
    expect(directTopicMatch.weightUsed).toBeGreaterThan(
      unrelatedGenericExpert.weightUsed + 0.4,
    );
    expect(unrelatedGenericExpert.weightUsed).toBeLessThan(1.1);
  });

  it('keeps irrelevant specialized participants below baseline when title and topic category do not match', () => {
    const irrelevantGenericExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'healthcare',
      title: 'Healthcare access and public health services',
      summary: 'Medical and wellbeing consultation for local care planning',
      methodologySummary: 'Public health evidence review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'BUSINESS_OWNER',
        backgroundCategory: 'BUSINESS_AND_MANAGEMENT',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(irrelevantGenericExpert.calculationType).toBe('SPECIALIZED');
    expect(irrelevantGenericExpert.weightUsed).toBeGreaterThanOrEqual(0.6);
    expect(irrelevantGenericExpert.weightUsed).toBeLessThan(1);
  });

  it('does not let generic experience rescue weakly relevant specialized matches', () => {
    const weaklyRelevantExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'Education consultation for community learning access',
      summary: 'Consultation about school support for local residents',
      methodologySummary: 'Education outreach planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'VOLUNTEER',
        backgroundCategory: 'SOCIAL_SCIENCES',
        relationshipToArea: 'RESIDENT',
        experienceLevel: 'EXPERT',
      },
    });

    const weaklyRelevantBeginner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'Education consultation for community learning access',
      summary: 'Consultation about school support for local residents',
      methodologySummary: 'Education outreach planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'VOLUNTEER',
        backgroundCategory: 'SOCIAL_SCIENCES',
        relationshipToArea: 'RESIDENT',
        experienceLevel: 'BEGINNER',
      },
    });

    expect(weaklyRelevantExpert.weightUsed).toBeLessThanOrEqual(1.2);
    expect(
      weaklyRelevantExpert.weightUsed - weaklyRelevantBeginner.weightUsed,
    ).toBeLessThanOrEqual(0.05);
  });
});
