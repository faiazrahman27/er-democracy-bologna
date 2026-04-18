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
    expect(directTopicMatch.weightUsed).toBeGreaterThan(
      unrelatedGenericExpert.weightUsed + 0.25,
    );
    expect(unrelatedGenericExpert.weightUsed).toBeLessThan(1.5);
  });
});
