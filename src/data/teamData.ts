export interface TeamMember {
  id: string
  name: string
  title: string
  qualifications?: string
"AHPRA registration number": string
  specialties?: string
  bio?: string
  /**
   * Path to photo relative to the /public folder.
   * e.g. "/team/michael.jpg"  →  place the file at public/team/michael.jpg
   * Leave as undefined to show the initial-letter placeholder.
   */
  photo?: string
  order: number
}

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Micheal Ghattas',
    title: 'Principal Physiotherapist',
    qualifications: 'BPhty, DPT, AHPRA Registered',
    AHPRA registration number: PHY0002634794
    specialties: 'Musculoskeletal, Neurological, Orthopaedic, Aged Care, Cervicogenic Dizziness',
    bio: 'Michael is an experienced physiotherapist with over 15 years of experience in physiotherapy. His career has taken him across several countries, including Egypt, Kuwait, and Australia, where he has worked with a wide range of patients and conditions. This experience has shaped his practical, results-focused approach to rehabilitation. Through Physio to Home, Michael focuses on delivering high-quality physiotherapy in the comfort of patients\u2019 homes. His goal is to help people improve mobility, manage pain, and maintain independence in their everyday lives. Outside of work, Michael enjoys spending time with family, listening to music, and cooking.',
    photo: '/team/micheal.webp',
    order: 4,
  },
  {
    id: '2',
    name: 'Neveen Wahba',
    title: 'Practice Manager',
    qualifications: 'BPhty, Practice Administration',
    specialties: 'Team Coordination and Staff Support',
    bio: 'Neveen brings a unique perspective to her role as Practice Manager \u2014 having worked as a physiotherapist herself, she understands the clinical side of patient care as well as the operational. She ensures every patient experience is smooth from the first phone call to the final appointment, coordinating schedules, supporting the clinical team, and making sure nothing falls through the cracks. Her background in physiotherapy means she can speak the same language as both patients and clinicians, which makes all the difference in a small, patient-focused practice like Physio to Home.',
    photo: '/team/neveen.webp',
    order: 2,
  },
  {
    id: '3',
    name: 'Jackline Moawad',
    title: 'Physiotherapist',
    qualifications: 'BPhty, DPT, AHPRA Registered',
  AHPRA registration number: PHY0004065439
    specialties: 'Musculoskeletal, Orthopaedics, Pain Management, Home Exercise Programs, Electrotherapy',
    bio: 'Jackline brings over 10 years of physiotherapy experience across hospital and rehabilitation settings in Egypt and Australia. She holds a Bachelor of Physiotherapy and a Doctor of Physical Therapy from Cairo University, and is AHPRA registered. Jackline has worked across orthopaedic, acute, and chronic care settings, with a strong focus on manual therapy, pain management, and individually tailored exercise programs. She is known for building genuine rapport with her patients and taking the time to ensure they fully understand their condition and treatment. Jackline speaks both English and Arabic, making her especially well placed to support patients from Arabic-speaking backgrounds.',
    photo: '/team/jackline-moawad.jpg',
    order: 1,
  },
  {
    id: '4',
    name: 'Blessed Justin',
    title: 'Senior Physiotherapist',
    qualifications: 'BPhty, MPT, AHPRA Registered',
   AHPRA registration number: PHY0002588727
    specialties: 'Neurological Rehabilitation, Musculoskeletal, Aged Care, Cardiopulmonary, NDIS & Home Care',
    bio: "Blessed brings over 16 years of physiotherapy experience across hospital, aged care, and community settings in India and Australia. He holds a Bachelor and Master of Physiotherapy from Tamil Nadu Dr. MGR Medical University and is AHPRA registered. Blessed has worked extensively with neurological conditions including stroke, Parkinson's disease, cerebral palsy and spinal injuries, as well as musculoskeletal and cardiopulmonary rehabilitation. Most recently he has been based in Launceston, working with NDIS and home care participants \u2014 making him a natural fit for the Physio to Home model. He is known for his patient-centred approach and his ability to design individualised programs that meet people where they are.",
   photo: '/team/blessed.jpg',
    order: 6,
  },
   {
    id: '5',
    name: 'Kanza Nadeem',
    title: 'Physiotherapist',
    qualifications: 'BPhty, DPT, AHPRA Registered',
    AHPRA registration number: PHY0002768198
     specialties: 'Musculoskeletal, neurological rehabilitation, Manual Therapy, Dry Needling',
    bio: 'Kanza is AHPRA registered Physiotherapist, did her Doctor of physical therapy from LMDC, with advanced training in neurological rehabilitation and musculoskeletal. She works with conditions such as cerebral palsy and hemiplegia, focusing on improving mobility, function, and quality of life. She also integrates musculoskeletal rehabilitation and post operative rehabilitation and women’s health physiotherapy into her holistic approach to care. Kanza is trained and competent physiotherapy with her expertise in Mobilisation and Manual Therapy , Dry Needling, Kineso Tapping. Her treatment is more research based clinical approaches',
    photo: '/team/kanza.jpg',
    order: 5,
  },
       {
  id: '6',
  name: 'Rafik Morqos',
  title: 'Senior Physiotherapist',
  qualifications: 'BPhysio, MPhysio, AHPRA General Registration (PHY0004006279)',
  specialties: [
    'Home visit physiotherapy',
    'Musculoskeletal physiotherapy',
    'Neurological rehabilitation',
    'Orthopaedic rehabilitation',
    'Dry needling & manual therapy',
    'NDIS & aged care physiotherapy',
    'Post-operative rehabilitation',
    'Falls prevention & mobility training'
  ],
  bio: `Rafik Morqos is an AHPRA-registered physiotherapist with over 15 years of clinical experience, including senior leadership.He has extensive experience managing complex musculoskeletal, neurological, and orthopaedic conditions, with a strong focus on manual therapy, dry needling, kinesio taping, and individualised rehabilitation programs.
Rafik has led multidisciplinary teams, supervised junior physiotherapists, and contributed to quality improvement initiatives within hospital settings. He is highly experienced in developing structured rehabilitation pathways that transition patients from hospital to home-based care.
Rafik provides home visit physiotherapy with Physio To Home, supporting patients to improve mobility, independence, and quality of life in their own environment.
He is known for his clear communication, patient education, and ability to adapt treatment plans to individual goals and home environments.`,
  photo: '/team/rafik.jpg',
  order: 3,
}
 
]
