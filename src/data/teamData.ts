export interface TeamMember {
  id: string
  name: string
  title: string
  qualifications?: string
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
    name: 'Michael Ghattas',
    title: 'Principal Physiotherapist',
    qualifications: 'DPT, AHPRA Registered',
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
    specialties: 'Neurological Rehabilitation, Musculoskeletal, Aged Care, Cardiopulmonary, NDIS & Home Care',
    bio: "Blessed brings over 16 years of physiotherapy experience across hospital, aged care, and community settings in India and Australia. He holds a Bachelor and Master of Physiotherapy from Tamil Nadu Dr. MGR Medical University and is AHPRA registered. Blessed has worked extensively with neurological conditions including stroke, Parkinson's disease, cerebral palsy and spinal injuries, as well as musculoskeletal and cardiopulmonary rehabilitation. Most recently he has been based in Launceston, working with NDIS and home care participants \u2014 making him a natural fit for the Physio to Home model. He is known for his patient-centred approach and his ability to design individualised programs that meet people where they are.",
    photo: undefined,
    order: 3,
  },
]
