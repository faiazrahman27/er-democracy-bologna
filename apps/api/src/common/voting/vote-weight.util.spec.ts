import { calculateVoteWeight } from './vote-weight.util';

describe('calculateVoteWeight', () => {
  const baseAssessment = {
    stakeholderRole: 'UNIVERSITY_STUDENT',
    backgroundCategory: 'EDUCATION',
    experienceLevel: 'EXPERT',
    yearsOfExperience: 6,
    studyLevel: 'BACHELOR_DEGREE',
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

  it('maps SELF_ASSESSMENT scores onto the upgraded 0.5-2 scale', () => {
    const expectedWeights = [
      [1, 0.5],
      [2, 0.625],
      [3, 0.75],
      [4, 0.875],
      [5, 1],
      [6, 1.2],
      [7, 1.4],
      [8, 1.6],
      [9, 1.8],
      [10, 2],
    ] as const;

    for (const [selfAssessmentScore, weightUsed] of expectedWeights) {
      expect(
        calculateVoteWeight({
          voteType: 'SELF_ASSESSMENT',
          topicCategory: 'education',
          selfAssessmentScore,
        }),
      ).toEqual({
        weightUsed,
        calculationType: 'SELF_ASSESSMENT',
      });
    }
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

  it('infers university-student relevance from campus-life terms even without an explicit student label', () => {
    const campusResident = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'Campus housing, lecture halls, and exam scheduling in Bologna',
      summary:
        'Consultation on dormitories, laboratory spaces, and university timetables',
      methodologySummary: 'Campus operations review and timetable workshops',
      assessment: baseAssessment,
    });

    const unrelatedBusinessOwner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'Campus housing, lecture halls, and exam scheduling in Bologna',
      summary:
        'Consultation on dormitories, laboratory spaces, and university timetables',
      methodologySummary: 'Campus operations review and timetable workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'BUSINESS_OWNER',
        backgroundCategory: 'BUSINESS_AND_MANAGEMENT',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(campusResident.weightUsed).toBeGreaterThan(1.2);
    expect(campusResident.weightUsed).toBeGreaterThan(
      unrelatedBusinessOwner.weightUsed + 0.2,
    );
  });

  it('recognizes Italian urban-planning terminology when matching specialized assessments', () => {
    const planner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'territorio',
      title: 'Rigenerazione urbana e mobilita di quartiere a Bologna',
      summary:
        'Consultazione su spazio pubblico, pianificazione territoriale e accesso ai servizi locali',
      methodologySummary:
        'Workshop su urbanistica, quartieri e infrastrutture di prossimita',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'ARCHITECTURE_AND_URBAN_PLANNING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedLegalProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'territorio',
      title: 'Rigenerazione urbana e mobilita di quartiere a Bologna',
      summary:
        'Consultazione su spazio pubblico, pianificazione territoriale e accesso ai servizi locali',
      methodologySummary:
        'Workshop su urbanistica, quartieri e infrastrutture di prossimita',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    expect(planner.weightUsed).toBeGreaterThan(1.25);
    expect(planner.weightUsed).toBeGreaterThan(
      unrelatedLegalProfile.weightUsed + 0.22,
    );
  });

  it('recognizes civic-governance terminology for public-administration profiles', () => {
    const civicAdmin = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'governo locale',
      title: 'Bilancio partecipativo e servizi comunali digitali',
      summary:
        'Consultazione del comune su procedure amministrative, sportelli pubblici e accesso civico',
      methodologySummary:
        'Revisione dei processi amministrativi e partecipazione cittadina',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CIVIL_SERVANT',
        backgroundCategory: 'PUBLIC_ADMINISTRATION',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 14,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedCreative = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'governo locale',
      title: 'Bilancio partecipativo e servizi comunali digitali',
      summary:
        'Consultazione del comune su procedure amministrative, sportelli pubblici e accesso civico',
      methodologySummary:
        'Revisione dei processi amministrativi e partecipazione cittadina',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CREATIVE_PROFESSIONAL',
        backgroundCategory: 'ARTS_AND_DESIGN',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 14,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    expect(civicAdmin.weightUsed).toBeGreaterThan(1.2);
    expect(civicAdmin.weightUsed).toBeGreaterThan(
      unrelatedCreative.weightUsed + 0.24,
    );
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
    expect(irrelevantGenericExpert.weightUsed).toBeGreaterThanOrEqual(0.5);
    expect(irrelevantGenericExpert.weightUsed).toBeLessThan(1);
  });

  it('uses years of experience to create granular separation inside relevant specialized matches', () => {
    const earlyCareerPlanner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'urban planning',
      title: 'Urban planning and Bologna neighborhood design strategy',
      summary:
        'Consultation on architecture, planning, and local design priorities',
      methodologySummary:
        'Built-environment evidence review and civic workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'ARCHITECTURE_AND_URBAN_PLANNING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 2,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const veteranPlanner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'urban planning',
      title: 'Urban planning and Bologna neighborhood design strategy',
      summary:
        'Consultation on architecture, planning, and local design priorities',
      methodologySummary:
        'Built-environment evidence review and civic workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'ARCHITECTURE_AND_URBAN_PLANNING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 18,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    expect(veteranPlanner.weightUsed).toBeGreaterThan(
      earlyCareerPlanner.weightUsed + 0.02,
    );
    expect(veteranPlanner.weightUsed).toBeLessThanOrEqual(2);
  });

  it('keeps study level modest on broad consultations but relevant on field-specific ones', () => {
    const fieldSpecificDoctorate = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title:
        'Digital learning systems and software architecture for university operations',
      summary:
        'Consultation on technical platforms, data services, and engineering decisions',
      methodologySummary:
        'Technical architecture review and evidence synthesis',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'SOFTWARE_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'DOCTORATE',
      },
    });

    const fieldSpecificSecondary = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'technology',
      title:
        'Digital learning systems and software architecture for university operations',
      summary:
        'Consultation on technical platforms, data services, and engineering decisions',
      methodologySummary:
        'Technical architecture review and evidence synthesis',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'SOFTWARE_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'SECONDARY_EDUCATION',
      },
    });

    const broadDoctorate = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University student life and community support',
      summary:
        'Consultation on campus wellbeing, facilities, and student services',
      methodologySummary: 'General participation workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'SOFTWARE_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'DOCTORATE',
      },
    });

    const broadSecondary = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'education',
      title: 'University student life and community support',
      summary:
        'Consultation on campus wellbeing, facilities, and student services',
      methodologySummary: 'General participation workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'SOFTWARE_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'SECONDARY_EDUCATION',
      },
    });

    expect(fieldSpecificDoctorate.weightUsed).toBeGreaterThan(
      fieldSpecificSecondary.weightUsed + 0.01,
    );
    expect(
      Math.abs(broadDoctorate.weightUsed - broadSecondary.weightUsed),
    ).toBeLessThanOrEqual(0.03);
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
