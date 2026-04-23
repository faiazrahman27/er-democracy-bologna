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

  const applySpecializedModifier = (baseWeight: number, modifier: number) =>
    Number(Math.min(Math.max(baseWeight + modifier, 0.5), 2).toFixed(4));

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

  it('favors university students and education backgrounds on teaching-quality consultations while keeping researchers as secondary matches', () => {
    const studentProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality, exam scheduling, and study spaces',
      summary:
        'Consultation on tutoring services, student wellbeing, and learning outcomes across degree programmes',
      methodologySummary:
        'Research evaluation, survey research, and academic service review',
      assessment: baseAssessment,
    });

    const researcherProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality, exam scheduling, and study spaces',
      summary:
        'Consultation on tutoring services, student wellbeing, and learning outcomes across degree programmes',
      methodologySummary:
        'Research evaluation, survey research, and academic service review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'RESEARCHER',
        backgroundCategory: 'SOCIAL_SCIENCES',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'DOCTORATE',
      },
    });

    const unrelatedEngineer = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality, exam scheduling, and study spaces',
      summary:
        'Consultation on tutoring services, student wellbeing, and learning outcomes across degree programmes',
      methodologySummary:
        'Research evaluation, survey research, and academic service review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'PRIVATE_SECTOR_EMPLOYEE',
        backgroundCategory: 'MECHANICAL_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(studentProfile.weightUsed).toBeGreaterThan(1.35);
    expect(studentProfile.weightUsed).toBeGreaterThan(
      researcherProfile.weightUsed + 0.08,
    );
    expect(researcherProfile.weightUsed).toBeGreaterThan(
      unrelatedEngineer.weightUsed + 0.16,
    );
    expect(unrelatedEngineer.weightUsed).toBeLessThan(1);
  });

  it('favors healthcare and public-health profiles on preparedness consultations while keeping policy makers as secondary matches', () => {
    const healthcareProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'public health',
      title: 'Public health preparedness and hospital coordination in Bologna',
      summary:
        'Consultation on emergency triage, outbreak response, epidemiological surveillance, and care continuity',
      methodologySummary:
        'Healthcare resilience review and institutional coordination workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'HEALTHCARE_WORKER',
        backgroundCategory: 'PUBLIC_HEALTH',
        ageRange: 'AGE_35_44',
        gender: 'FEMALE',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 12,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const policyProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'public health',
      title: 'Public health preparedness and hospital coordination in Bologna',
      summary:
        'Consultation on emergency triage, outbreak response, epidemiological surveillance, and care continuity',
      methodologySummary:
        'Healthcare resilience review and institutional coordination workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'POLICY_MAKER',
        backgroundCategory: 'PUBLIC_ADMINISTRATION',
        ageRange: 'AGE_35_44',
        gender: 'MALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedCreative = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'public health',
      title: 'Public health preparedness and hospital coordination in Bologna',
      summary:
        'Consultation on emergency triage, outbreak response, epidemiological surveillance, and care continuity',
      methodologySummary:
        'Healthcare resilience review and institutional coordination workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CREATIVE_PROFESSIONAL',
        backgroundCategory: 'ARTS_AND_DESIGN',
        ageRange: 'AGE_25_34',
        gender: 'OTHER',
        experienceLevel: 'INTERMEDIATE',
        yearsOfExperience: 4,
        studyLevel: 'BACHELOR_DEGREE',
        relationshipToArea: 'VISITOR',
        city: 'RIMINI',
      },
    });

    expect(healthcareProfile.weightUsed).toBeGreaterThan(1.4);
    expect(healthcareProfile.weightUsed).toBeGreaterThan(
      policyProfile.weightUsed + 0.06,
    );
    expect(policyProfile.weightUsed).toBeGreaterThan(
      unrelatedCreative.weightUsed + 0.16,
    );
    expect(unrelatedCreative.weightUsed).toBeLessThan(1);
  });

  it('keeps legal and public-administration profiles both relevant on regulatory-enforcement consultations', () => {
    const legalProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'law and local governance',
      title:
        'Municipal regulation, administrative enforcement, and legal compliance in Bologna',
      summary:
        'Consultation on permit processing, regulatory enforcement, public office procedures, and legal obligations',
      methodologySummary:
        'Administrative law review and civic administration workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        ageRange: 'AGE_35_44',
        gender: 'FEMALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 9,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const civilServantProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'law and local governance',
      title:
        'Municipal regulation, administrative enforcement, and legal compliance in Bologna',
      summary:
        'Consultation on permit processing, regulatory enforcement, public office procedures, and legal obligations',
      methodologySummary:
        'Administrative law review and civic administration workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CIVIL_SERVANT',
        backgroundCategory: 'PUBLIC_ADMINISTRATION',
        ageRange: 'AGE_45_54',
        gender: 'MALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 11,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedStudent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'law and local governance',
      title:
        'Municipal regulation, administrative enforcement, and legal compliance in Bologna',
      summary:
        'Consultation on permit processing, regulatory enforcement, public office procedures, and legal obligations',
      methodologySummary:
        'Administrative law review and civic administration workshops',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'UNIVERSITY_STUDENT',
        backgroundCategory: 'COMPUTER_SCIENCE',
        ageRange: 'AGE_18_24',
        gender: 'MALE',
        experienceLevel: 'BEGINNER',
        yearsOfExperience: 1,
        studyLevel: 'BACHELOR_DEGREE',
      },
    });

    expect(legalProfile.weightUsed).toBeGreaterThan(
      unrelatedStudent.weightUsed + 0.28,
    );
    expect(civilServantProfile.weightUsed).toBeGreaterThan(
      unrelatedStudent.weightUsed + 0.24,
    );
    expect(Math.abs(legalProfile.weightUsed - civilServantProfile.weightUsed))
      .toBeLessThanOrEqual(0.2);
  });

  it('favors civil-engineering backgrounds on infrastructure consultations', () => {
    const civilEngineer = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'infrastructure',
      title: 'Bridge maintenance, drainage systems, and road safety engineering',
      summary:
        'Consultation on transport corridors, water infrastructure, and structural inspections',
      methodologySummary:
        'Public works assessment and rete stradale planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'CIVIL_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const mechanicalEngineer = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'infrastructure',
      title: 'Bridge maintenance, drainage systems, and road safety engineering',
      summary:
        'Consultation on transport corridors, water infrastructure, and structural inspections',
      methodologySummary:
        'Public works assessment and rete stradale planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'MECHANICAL_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedLegal = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'infrastructure',
      title: 'Bridge maintenance, drainage systems, and road safety engineering',
      summary:
        'Consultation on transport corridors, water infrastructure, and structural inspections',
      methodologySummary:
        'Public works assessment and rete stradale planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    expect(civilEngineer.weightUsed).toBeGreaterThan(1.25);
    expect(civilEngineer.weightUsed).toBeGreaterThan(
      mechanicalEngineer.weightUsed + 0.08,
    );
    expect(civilEngineer.weightUsed).toBeGreaterThan(
      unrelatedLegal.weightUsed + 0.22,
    );
  });

  it('favors mechanical-engineering backgrounds on thermal-systems consultations', () => {
    const mechanicalEngineer = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'energy systems',
      title:
        'HVAC modernization, heat exchange upgrades, and thermal energy systems',
      summary:
        'Consultation on heating and cooling systems, fluid systems, and district plant efficiency',
      methodologySummary:
        'Thermodynamics review and impianti termici retrofit planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'MECHANICAL_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const civilEngineer = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'energy systems',
      title:
        'HVAC modernization, heat exchange upgrades, and thermal energy systems',
      summary:
        'Consultation on heating and cooling systems, fluid systems, and district plant efficiency',
      methodologySummary:
        'Thermodynamics review and impianti termici retrofit planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'CIVIL_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedLegal = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'energy systems',
      title:
        'HVAC modernization, heat exchange upgrades, and thermal energy systems',
      summary:
        'Consultation on heating and cooling systems, fluid systems, and district plant efficiency',
      methodologySummary:
        'Thermodynamics review and impianti termici retrofit planning',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    expect(mechanicalEngineer.weightUsed).toBeGreaterThan(1.18);
    expect(mechanicalEngineer.weightUsed).toBeGreaterThan(
      civilEngineer.weightUsed + 0.08,
    );
    expect(mechanicalEngineer.weightUsed).toBeGreaterThan(
      unrelatedLegal.weightUsed + 0.22,
    );
  });

  it('keeps sustainability-governance and urban-planning profiles relevant on mobility consultations', () => {
    const sustainabilityPolicyMaker = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'urban sustainability',
      title:
        'Bologna sustainable mobility, street design, and climate adaptation strategy',
      summary:
        'Consultation on walkability, cycling infrastructure, decarbonization, and neighborhood planning',
      methodologySummary:
        'Urban mobility planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'POLICY_MAKER',
        backgroundCategory: 'ENVIRONMENT_AND_SUSTAINABILITY',
        ageRange: 'AGE_35_44',
        gender: 'FEMALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 7,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const urbanPlanner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'urban sustainability',
      title:
        'Bologna sustainable mobility, street design, and climate adaptation strategy',
      summary:
        'Consultation on walkability, cycling infrastructure, decarbonization, and neighborhood planning',
      methodologySummary:
        'Urban mobility planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'ARCHITECTURE_AND_URBAN_PLANNING',
        ageRange: 'AGE_35_44',
        gender: 'MALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 9,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const transportPlanner = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'urban sustainability',
      title:
        'Bologna sustainable mobility, street design, and climate adaptation strategy',
      summary:
        'Consultation on walkability, cycling infrastructure, decarbonization, and neighborhood planning',
      methodologySummary:
        'Urban mobility planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'PUBLIC_SECTOR_EMPLOYEE',
        backgroundCategory: 'TRANSPORT_AND_MOBILITY',
        ageRange: 'AGE_35_44',
        gender: 'MALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedCreative = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'urban sustainability',
      title:
        'Bologna sustainable mobility, street design, and climate adaptation strategy',
      summary:
        'Consultation on walkability, cycling infrastructure, decarbonization, and neighborhood planning',
      methodologySummary:
        'Urban mobility planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CREATIVE_PROFESSIONAL',
        backgroundCategory: 'ARTS_AND_DESIGN',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 9,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'VISITOR',
      },
    });

    expect(sustainabilityPolicyMaker.weightUsed).toBeGreaterThan(
      unrelatedCreative.weightUsed + 0.22,
    );
    expect(urbanPlanner.weightUsed).toBeGreaterThan(
      unrelatedCreative.weightUsed + 0.22,
    );
    expect(transportPlanner.weightUsed).toBeGreaterThan(
      unrelatedCreative.weightUsed + 0.22,
    );
    expect(
      Math.min(
        sustainabilityPolicyMaker.weightUsed,
        urbanPlanner.weightUsed,
        transportPlanner.weightUsed,
      ),
    ).toBeGreaterThan(1.15);
  });

  it('distinguishes business ownership and entrepreneurship from broader finance profiles on local-enterprise consultations', () => {
    const businessOwnerProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'local economy',
      title:
        'Enterprise growth, local commercial activity, and small business support in Bologna',
      summary:
        'Consultation on merchant services, commercial permits, neighborhood shops, and business continuity',
      methodologySummary:
        'Review of startup ecosystem, accelerator programmes, and economic impact for local enterprises',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'BUSINESS_OWNER',
        backgroundCategory: 'BUSINESS_AND_MANAGEMENT',
        ageRange: 'AGE_35_44',
        gender: 'MALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 9,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const entrepreneurProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'local economy',
      title:
        'Enterprise growth, local commercial activity, and small business support in Bologna',
      summary:
        'Consultation on merchant services, commercial permits, neighborhood shops, and business continuity',
      methodologySummary:
        'Review of startup ecosystem, accelerator programmes, and economic impact for local enterprises',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ENTREPRENEUR',
        backgroundCategory: 'ENTREPRENEURSHIP_AND_INNOVATION',
        ageRange: 'AGE_35_44',
        gender: 'FEMALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 7,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const financeProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'local economy',
      title:
        'Enterprise growth, local commercial activity, and small business support in Bologna',
      summary:
        'Consultation on merchant services, commercial permits, neighborhood shops, and business continuity',
      methodologySummary:
        'Review of startup ecosystem, accelerator programmes, and economic impact for local enterprises',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'BUSINESS_OWNER',
        backgroundCategory: 'ECONOMICS_AND_FINANCE',
        ageRange: 'AGE_35_44',
        gender: 'MALE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 10,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedCreative = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'local economy',
      title:
        'Enterprise growth, local commercial activity, and small business support in Bologna',
      summary:
        'Consultation on merchant services, commercial permits, neighborhood shops, and business continuity',
      methodologySummary:
        'Review of startup ecosystem, accelerator programmes, and economic impact for local enterprises',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CREATIVE_PROFESSIONAL',
        backgroundCategory: 'ARTS_AND_DESIGN',
        ageRange: 'AGE_35_44',
        gender: 'OTHER',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 9,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'VISITOR',
      },
    });

    expect(businessOwnerProfile.weightUsed).toBeGreaterThan(
      financeProfile.weightUsed + 0.03,
    );
    expect(entrepreneurProfile.weightUsed).toBeGreaterThan(
      financeProfile.weightUsed + 0.03,
    );
    expect(financeProfile.weightUsed).toBeGreaterThan(
      unrelatedCreative.weightUsed + 0.04,
    );
    expect(
      Math.abs(businessOwnerProfile.weightUsed - entrepreneurProfile.weightUsed),
    ).toBeLessThanOrEqual(0.22);
  });

  it('distinguishes AI, data, cybersecurity, and information-systems profiles on digital-governance consultations', () => {
    const cybersecurityProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'CYBERSECURITY',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const informationSystemsProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'INFORMATION_SYSTEMS',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const artificialIntelligenceProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'ARTIFICIAL_INTELLIGENCE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const dataScienceProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'DATA_SCIENCE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const softwareEngineeringProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'SOFTWARE_ENGINEERING',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const computerScienceProfile = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'ACADEMIC',
        backgroundCategory: 'COMPUTER_SCIENCE',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
      },
    });

    const unrelatedBusiness = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'digital governance',
      title:
        'Digital infrastructure, AI systems, data governance, and cyber incident response',
      summary:
        'Consultation on platform architecture, model deployment, network security, and digital service resilience',
      methodologySummary:
        'Technical review of data pipelines, security operations, and decision support algorithms',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'BUSINESS_OWNER',
        backgroundCategory: 'BUSINESS_AND_MANAGEMENT',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 8,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'NON_RESIDENT',
      },
    });

    expect(cybersecurityProfile.weightUsed).toBeGreaterThan(
      computerScienceProfile.weightUsed + 0.03,
    );
    expect(informationSystemsProfile.weightUsed).toBeGreaterThan(
      computerScienceProfile.weightUsed + 0.02,
    );
    expect(artificialIntelligenceProfile.weightUsed).toBeGreaterThan(
      computerScienceProfile.weightUsed + 0.015,
    );
    expect(dataScienceProfile.weightUsed).toBeGreaterThan(
      unrelatedBusiness.weightUsed + 0.12,
    );
    expect(softwareEngineeringProfile.weightUsed).toBeLessThan(
      informationSystemsProfile.weightUsed,
    );
    expect(computerScienceProfile.weightUsed).toBeGreaterThan(
      unrelatedBusiness.weightUsed + 0.06,
    );
  });

  it('creates weak-tail separation without letting weak profiles become competitive', () => {
    const clearlyIrrelevantVisitor = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality and student support services in Bologna',
      summary:
        'Consultation on study spaces, learning outcomes, exam scheduling, and campus services',
      methodologySummary:
        'Academic service review and curriculum governance workshop',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'CREATIVE_PROFESSIONAL',
        backgroundCategory: 'ARTS_AND_DESIGN',
        experienceLevel: 'BEGINNER',
        yearsOfExperience: 1,
        studyLevel: 'BACHELOR_DEGREE',
        relationshipToArea: 'VISITOR',
        city: 'RIMINI',
      },
    });

    const weakVisitor = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality and student support services in Bologna',
      summary:
        'Consultation on study spaces, learning outcomes, exam scheduling, and campus services',
      methodologySummary:
        'Academic service review and curriculum governance workshop',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 12,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'VISITOR',
        city: 'RIMINI',
      },
    });

    const weakLocal = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality and student support services in Bologna',
      summary:
        'Consultation on study spaces, learning outcomes, exam scheduling, and campus services',
      methodologySummary:
        'Academic service review and curriculum governance workshop',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 12,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    const weakLocalExpert = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality and student support services in Bologna',
      summary:
        'Consultation on study spaces, learning outcomes, exam scheduling, and campus services',
      methodologySummary:
        'Academic service review and curriculum governance workshop',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 18,
        studyLevel: 'DOCTORATE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    expect(clearlyIrrelevantVisitor.weightUsed).toBeLessThan(0.7);
    expect(weakVisitor.weightUsed).toBeLessThan(0.7);
    expect(weakLocal.weightUsed).toBeLessThan(0.7);
    expect(weakLocalExpert.weightUsed).toBeLessThan(0.7);
    expect(weakVisitor.weightUsed).toBeGreaterThan(
      clearlyIrrelevantVisitor.weightUsed,
    );
    expect(weakLocal.weightUsed).toBeGreaterThan(weakVisitor.weightUsed + 0.01);
    expect(weakLocalExpert.weightUsed).toBeGreaterThan(
      weakLocal.weightUsed + 0.001,
    );
  });

  it('lets near-perfect no-question specialists reach the top band on base scoring alone', () => {
    const nearPerfectSpecialist = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory:
        'Public Health Preparedness, Population Health, and Epidemiological Surveillance in Bologna',
      title:
        'Bologna public health preparedness, hospital coordination, care continuity, and epidemiological surveillance',
      summary:
        'Consultation on public health preparedness, outbreak response, emergency triage, care continuity, health surveillance, and hospital coordination for Bologna public health services.',
      methodologySummary:
        'Preparedness planning, epidemiological surveillance review, population health workshops, and Bologna hospital coordination exercises.',
      assessment: {
        ...baseAssessment,
        ageRange: 'AGE_45_54',
        stakeholderRole: 'HEALTHCARE_WORKER',
        backgroundCategory: 'PUBLIC_HEALTH',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 24,
        studyLevel: 'DOCTORATE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    const ultraExceptionalSpecialist = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory:
        'Municipal Regulation, Administrative Procedure, Legal Compliance, and Regulatory Enforcement in Bologna',
      title:
        'Bologna municipal regulation, legal compliance, administrative procedure, permit processing, and regulatory enforcement',
      summary:
        'Consultation on municipal regulation, legal compliance, administrative procedure, permit processing, regulatory enforcement, public procurement law, administrative appeals, licensing compliance, and regulatory interpretation in Bologna.',
      methodologySummary:
        'Administrative law review, municipal regulation workshops, licensing compliance analysis, public procurement law review, and Bologna public office procedure mapping.',
      assessment: {
        ...baseAssessment,
        ageRange: 'AGE_45_54',
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 30,
        studyLevel: 'POST_DOCTORATE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    expect(nearPerfectSpecialist.weightUsed).toBeGreaterThan(1.9);
    expect(ultraExceptionalSpecialist.weightUsed).toBe(2);
  });

  it('keeps ordinary strong specialists below the near-ceiling band before modifiers are applied', () => {
    const strongBase = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'public health',
      title:
        'Public health preparedness, hospital coordination, and emergency response in Bologna',
      summary:
        'Consultation on care continuity, epidemiological surveillance, and healthcare resilience',
      methodologySummary:
        'Preparedness planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'HEALTHCARE_WORKER',
        backgroundCategory: 'PUBLIC_HEALTH',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 6,
        studyLevel: 'BACHELOR_DEGREE',
        relationshipToArea: 'NON_RESIDENT',
        city: 'MODENA',
      },
    });

    const strongerRefined = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'public health',
      title:
        'Public health preparedness, hospital coordination, and emergency response in Bologna',
      summary:
        'Consultation on care continuity, epidemiological surveillance, and healthcare resilience',
      methodologySummary:
        'Preparedness planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'HEALTHCARE_WORKER',
        backgroundCategory: 'PUBLIC_HEALTH',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 16,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    expect(strongBase.weightUsed).toBeGreaterThan(1.5);
    expect(strongerRefined.weightUsed).toBeGreaterThan(
      strongBase.weightUsed + 0.05,
    );
    expect(strongerRefined.weightUsed).toBeLessThan(1.87);
  });

  it('keeps adjacent engineering domains below a true specialist after top-end tuning', () => {
    const mechanicalSpecialist = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'mechanical and thermal building systems',
      title:
        'Bologna HVAC modernization, heat exchange upgrades, and thermal energy systems',
      summary:
        'Consultation on heating and cooling systems, fluid systems, energy systems, and building services engineering in Bologna public buildings',
      methodologySummary:
        'Thermodynamics review, heat-exchange planning, and impianti termici retrofit strategy for Bologna facilities',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'PRIVATE_SECTOR_EMPLOYEE',
        backgroundCategory: 'MECHANICAL_ENGINEERING',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 14,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    const civilAdjacent = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'mechanical and thermal building systems',
      title:
        'Bologna HVAC modernization, heat exchange upgrades, and thermal energy systems',
      summary:
        'Consultation on heating and cooling systems, fluid systems, energy systems, and building services engineering in Bologna public buildings',
      methodologySummary:
        'Thermodynamics review, heat-exchange planning, and impianti termici retrofit strategy for Bologna facilities',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'PRIVATE_SECTOR_EMPLOYEE',
        backgroundCategory: 'CIVIL_ENGINEERING',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 14,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    const unrelatedLegal = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'mechanical and thermal building systems',
      title:
        'Bologna HVAC modernization, heat exchange upgrades, and thermal energy systems',
      summary:
        'Consultation on heating and cooling systems, fluid systems, energy systems, and building services engineering in Bologna public buildings',
      methodologySummary:
        'Thermodynamics review, heat-exchange planning, and impianti termici retrofit strategy for Bologna facilities',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'EXPERT',
        yearsOfExperience: 14,
        studyLevel: 'DOCTORATE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    expect(mechanicalSpecialist.weightUsed).toBeGreaterThan(
      civilAdjacent.weightUsed + 0.22,
    );
    expect(civilAdjacent.weightUsed).toBeLessThan(1.15);
    expect(civilAdjacent.weightUsed).toBeGreaterThan(
      unrelatedLegal.weightUsed + 0.01,
    );
  });

  it('keeps weighted-question headroom for strong non-exceptional specialists', () => {
    const strongBase = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'public health',
      title:
        'Public health preparedness, hospital coordination, and emergency response in Bologna',
      summary:
        'Consultation on care continuity, epidemiological surveillance, and healthcare resilience',
      methodologySummary:
        'Preparedness planning and institutional coordination review',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'HEALTHCARE_WORKER',
        backgroundCategory: 'PUBLIC_HEALTH',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 6,
        studyLevel: 'BACHELOR_DEGREE',
        relationshipToArea: 'NON_RESIDENT',
        city: 'MODENA',
      },
    });

    const moderateBoost = applySpecializedModifier(strongBase.weightUsed, 0.12);
    const strongerBoost = applySpecializedModifier(strongBase.weightUsed, 0.22);
    const cappedBoost = applySpecializedModifier(strongBase.weightUsed, 0.4);

    expect(moderateBoost).toBeGreaterThan(strongBase.weightUsed);
    expect(strongerBoost).toBeGreaterThan(moderateBoost + 0.08);
    expect(strongerBoost).toBeLessThan(2);
    expect(cappedBoost).toBe(2);
  });

  it('preserves some spread for negative modifiers before the floor is hit', () => {
    const weakBase = calculateVoteWeight({
      voteType: 'SPECIALIZED',
      topicCategory: 'higher education',
      title: 'University teaching quality and student support services in Bologna',
      summary:
        'Consultation on study spaces, learning outcomes, exam scheduling, and campus services',
      methodologySummary:
        'Academic service review and curriculum governance workshop',
      assessment: {
        ...baseAssessment,
        stakeholderRole: 'LEGAL_PROFESSIONAL',
        backgroundCategory: 'LAW',
        experienceLevel: 'ADVANCED',
        yearsOfExperience: 12,
        studyLevel: 'MASTER_DEGREE',
        relationshipToArea: 'RESIDENT',
        city: 'BOLOGNA',
      },
    });

    const mildReduction = applySpecializedModifier(weakBase.weightUsed, -0.05);
    const strongerReduction = applySpecializedModifier(
      weakBase.weightUsed,
      -0.09,
    );
    const floorReduction = applySpecializedModifier(weakBase.weightUsed, -0.16);

    expect(mildReduction).toBeGreaterThan(0.5);
    expect(strongerReduction).toBeGreaterThan(0.5);
    expect(mildReduction).toBeGreaterThan(strongerReduction);
    expect(floorReduction).toBe(0.5);
  });

  it('keeps specialized weights within clamp bounds across weak and strong scenarios', () => {
    const scenarios = [
      calculateVoteWeight({
        voteType: 'SPECIALIZED',
        topicCategory: 'higher education',
        title: 'University teaching quality and student support services in Bologna',
        summary:
          'Consultation on study spaces, learning outcomes, exam scheduling, and campus services',
        methodologySummary:
          'Academic service review and curriculum governance workshop',
        assessment: {
          ...baseAssessment,
          stakeholderRole: 'CREATIVE_PROFESSIONAL',
          backgroundCategory: 'ARTS_AND_DESIGN',
          experienceLevel: 'BEGINNER',
          yearsOfExperience: 1,
          studyLevel: 'BACHELOR_DEGREE',
          relationshipToArea: 'VISITOR',
          city: 'RIMINI',
        },
      }).weightUsed,
      calculateVoteWeight({
        voteType: 'SPECIALIZED',
        topicCategory: 'law and local governance',
        title:
          'Municipal regulation, administrative enforcement, and legal compliance in Bologna',
        summary:
          'Consultation on permit processing, regulatory enforcement, public office procedures, and legal obligations',
        methodologySummary:
          'Administrative law review and civic administration workshops',
        assessment: {
          ...baseAssessment,
          stakeholderRole: 'LEGAL_PROFESSIONAL',
          backgroundCategory: 'LAW',
          experienceLevel: 'ADVANCED',
          yearsOfExperience: 9,
          studyLevel: 'MASTER_DEGREE',
          relationshipToArea: 'RESIDENT',
          city: 'BOLOGNA',
        },
      }).weightUsed,
      calculateVoteWeight({
        voteType: 'SPECIALIZED',
        topicCategory: 'public health',
        title:
          'Public health preparedness, hospital coordination, and emergency response in Bologna',
        summary:
          'Consultation on care continuity, epidemiological surveillance, and healthcare resilience',
        methodologySummary:
          'Preparedness planning and institutional coordination review',
        assessment: {
          ...baseAssessment,
          stakeholderRole: 'HEALTHCARE_WORKER',
          backgroundCategory: 'PUBLIC_HEALTH',
          experienceLevel: 'EXPERT',
          yearsOfExperience: 16,
          studyLevel: 'MASTER_DEGREE',
          relationshipToArea: 'RESIDENT',
          city: 'BOLOGNA',
        },
      }).weightUsed,
    ];

    for (const weight of scenarios) {
      expect(weight).toBeGreaterThanOrEqual(0.5);
      expect(weight).toBeLessThanOrEqual(2);
    }
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
      beginnerNonResident.weightUsed + 0.03,
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
