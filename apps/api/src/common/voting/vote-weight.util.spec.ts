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

  it('prioritizes title alignment over weaker category-only support', () => {
    const teacherAssessment = {
      ...baseAssessment,
      stakeholderRole: 'TEACHER',
      backgroundCategory: 'TEACHING_AND_TRAINING',
      experienceLevel: 'ADVANCED',
    };

    const titleAligned = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'Teacher training and school support plan',
      summary: 'Consultation on education services for teachers and schools',
      methodologySummary: 'Teacher participation workshops',
      assessment: teacherAssessment,
    });

    const categoryOnly = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'Consultation on service delivery and operations',
      summary: 'Education services review for the university community',
      methodologySummary: 'General participation workshops',
      assessment: teacherAssessment,
    });

    expect(titleAligned.weightUsed).toBeGreaterThan(
      categoryOnly.weightUsed + 0.12,
    );
  });

  it('gives specialized votes a clearly higher weight for direct stakeholder and context matches than for unrelated generic expertise', () => {
    const directTopicMatch = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University student academic support and campus services',
      summary: 'Education consultation for students and university services',
      methodologySummary: 'Student participation and academic service review',
      assessment: baseAssessment,
    });

    const unrelatedGenericExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University student academic support and campus services',
      summary: 'Education consultation for students and university services',
      methodologySummary: 'Student participation and academic service review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'PUBLIC_SECTOR_EMPLOYEE',
        backgroundCategory: 'PUBLIC_ADMINISTRATION',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(directTopicMatch.calculationType).toBe('SPECIALIZED');
    expect(directTopicMatch.weightUsed).toBeGreaterThan(1.3);
    expect(directTopicMatch.weightUsed).toBeGreaterThan(
      unrelatedGenericExpert.weightUsed + 0.35,
    );
    expect(unrelatedGenericExpert.weightUsed).toBeLessThan(1);
  });

  it('keeps genuinely irrelevant specialized participants below baseline without over-penalizing', () => {
    const irrelevantGenericExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'healthcare',
      title: 'Healthcare access and public health services',
      summary: 'Medical and wellbeing consultation for care delivery',
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

  it('does not let experience rescue weakly relevant specialized matches', () => {
    const weaklyRelevantExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'Education consultation for community learning access',
      summary: 'Review of school support and learning resources',
      methodologySummary: 'Community participation planning',
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
      summary: 'Review of school support and learning resources',
      methodologySummary: 'Community participation planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'VOLUNTEER',
        backgroundCategory: 'SOCIAL_SCIENCES',
        relationshipToArea: 'RESIDENT',
        experienceLevel: 'BEGINNER',
      },
    });

    expect(weaklyRelevantExpert.weightUsed).toBeLessThan(1);
    expect(weaklyRelevantBeginner.weightUsed).toBeLessThan(1);
    expect(
      weaklyRelevantExpert.weightUsed - weaklyRelevantBeginner.weightUsed,
    ).toBeLessThanOrEqual(0.04);
  });

  it('keeps backgroundCategory nearly neutral on broad consultations where it is not clearly relevant', () => {
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

    expect(informationSystemsStudent.weightUsed).toBeGreaterThan(1.2);
    expect(
      Math.abs(
        informationSystemsStudent.weightUsed - engineeringStudent.weightUsed,
      ),
    ).toBeLessThanOrEqual(0.03);
  });

  it('only gives backgroundCategory meaningful influence when the consultation is field-specific', () => {
    const informationSystemsStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title:
        'Digital learning systems and IT support for University of Bologna students',
      summary:
        'Consultation on software platforms, data services, and technical learning tools',
      methodologySummary: 'Digital systems review for academic operations',
      assessment: {
        ...baseAssessment,
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
      },
    });

    const engineeringStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title:
        'Digital learning systems and IT support for University of Bologna students',
      summary:
        'Consultation on software platforms, data services, and technical learning tools',
      methodologySummary: 'Digital systems review for academic operations',
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

  it('keeps strongly relevant users distinguishable through secondary refinements', () => {
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

    expect(advancedResident.weightUsed).toBeGreaterThan(
      beginnerNonResident.weightUsed + 0.04,
    );
    expect(beginnerNonResident.weightUsed).toBeGreaterThan(1);
  });

  it('applies a resident > non-resident > visitor ordering for location-specific consultations', () => {
    const resident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University of Bologna student life and academic support',
      summary:
        'Consultation on Bologna campus facilities, local student services, and university experience',
      methodologySummary:
        'Student participation on place-based campus planning',
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
        'Consultation on Bologna campus facilities, local student services, and university experience',
      methodologySummary:
        'Student participation on place-based campus planning',
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
        'Consultation on Bologna campus facilities, local student services, and university experience',
      methodologySummary:
        'Student participation on place-based campus planning',
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
    expect(visitor.weightUsed).toBeGreaterThan(1);
  });

  it('keeps relationshipToArea neutral when the consultation is not location-specific', () => {
    const resident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title: 'Digital learning systems and academic support',
      summary:
        'Consultation on software tools, online learning platforms, and student IT support',
      methodologySummary: 'Technical review of digital university services',
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
      methodologySummary: 'Technical review of digital university services',
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
