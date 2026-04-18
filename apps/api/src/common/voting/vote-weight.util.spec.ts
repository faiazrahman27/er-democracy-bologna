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

  it('keeps backgroundCategory nearly neutral on broad student-life consultations', () => {
    const informationSystemsStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on campus facilities, general student experience, and university services',
      methodologySummary: 'Student participation and service design review',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
      },
    });

    const engineeringStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on campus facilities, general student experience, and university services',
      methodologySummary: 'Student participation and service design review',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'ENGINEERING',
        experienceLevel: 'ADVANCED',
      },
    });

    expect(informationSystemsStudent.weightUsed).toBeGreaterThanOrEqual(1.4);
    expect(
      Math.abs(
        informationSystemsStudent.weightUsed - engineeringStudent.weightUsed,
      ),
    ).toBeLessThanOrEqual(0.02);
  });

  it('only gives backgroundCategory meaningful influence when the consultation is field-specific', () => {
    const informationSystemsStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title: 'Digital learning systems and IT support for University of Bologna students',
      summary:
        'Consultation on campus software platforms, technical curriculum tools, and data services',
      methodologySummary: 'Technology audit for academic infrastructure',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
      },
    });

    const engineeringStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title: 'Digital learning systems and IT support for University of Bologna students',
      summary:
        'Consultation on campus software platforms, technical curriculum tools, and data services',
      methodologySummary: 'Technology audit for academic infrastructure',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'ENGINEERING',
        experienceLevel: 'ADVANCED',
      },
    });

    expect(informationSystemsStudent.weightUsed).toBeGreaterThan(
      engineeringStudent.weightUsed + 0.02,
    );
  });

  it('keeps strongly relevant users distinguishable through secondary factors', () => {
    const advancedResident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on campus facilities, academic support, and general student experience',
      methodologySummary: 'Student participation on university service quality',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
        relationshipToArea: 'RESIDENT',
      },
    });

    const beginnerNonResident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on campus facilities, academic support, and general student experience',
      methodologySummary: 'Student participation on university service quality',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'ENGINEERING',
        experienceLevel: 'BEGINNER',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(advancedResident.weightUsed).toBeLessThan(2);
    expect(advancedResident.weightUsed).toBeGreaterThan(
      beginnerNonResident.weightUsed + 0.035,
    );
  });

  it('applies an explicit resident > non-resident > visitor ordering for location-specific consultations', () => {
    const resident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on Bologna campus facilities, student services, and local university experience',
      methodologySummary: 'Student participation on place-based campus planning',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'EDUCATION',
        experienceLevel: 'ADVANCED',
        relationshipToArea: 'RESIDENT',
      },
    });

    const nonResident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on Bologna campus facilities, student services, and local university experience',
      methodologySummary: 'Student participation on place-based campus planning',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'EDUCATION',
        experienceLevel: 'ADVANCED',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    const visitor = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on Bologna campus facilities, student services, and local university experience',
      methodologySummary: 'Student participation on place-based campus planning',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'EDUCATION',
        experienceLevel: 'ADVANCED',
        relationshipToArea: 'VISITOR',
      },
    });

    expect(resident.weightUsed).toBeGreaterThan(nonResident.weightUsed);
    expect(nonResident.weightUsed).toBeGreaterThan(visitor.weightUsed);
    expect(resident.weightUsed - visitor.weightUsed).toBeLessThanOrEqual(0.08);
  });

  it('keeps relationshipToArea neutral when the consultation is not location-specific', () => {
    const resident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title: 'Digital learning systems and academic support',
      summary:
        'Consultation on software tools, online learning platforms, and student IT support',
      methodologySummary: 'Technical review of university digital services',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
        relationshipToArea: 'RESIDENT',
      },
    });

    const visitor = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title: 'Digital learning systems and academic support',
      summary:
        'Consultation on software tools, online learning platforms, and student IT support',
      methodologySummary: 'Technical review of university digital services',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
        relationshipToArea: 'VISITOR',
      },
    });

    expect(resident.weightUsed).toBe(visitor.weightUsed);
  });
});
