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
    qualifications: 'BPhty, AHPRA Registered',
    specialties: 'Musculoskeletal, Neurological, Orthopaedic, Aged Care, Cervicogenic Dizziness',
    bio: 'Michael is an experienced physiotherapist, with over 15 years of experience in physiotherapy. His career has taken him across several countries, including Egypt, Kuwait, and Australia, where he has worked with a wide range of patients and conditions. This experience has shaped his practical, results-focused approach to rehabilitation. Through Physio to Home, Michael focuses on delivering high-quality physiotherapy in the comfort of patients’ homes. His goal is to help people improve mobility, manage pain, and maintain independence in their everyday lives.Outside of work, Michael enjoys spending time with family, listening to music, and cooking..',
    photo: '/team/micheal.webp',  
        order: 1,
  },
    {
    id: '2',
    name: 'Neveen Wahba',
    title: 'Practice Manager',
    qualifications: 'Former Physio, Admin',
    specialties: 'Team Coordination and Staff Support',
    bio: 'Our Practice Manager ensures the clinic runs smoothly and efficiently while providing a welcoming experience for every patient. They coordinate appointments, manage daily operations, and support both clients and clinicians to ensure high-quality care. With a strong focus on organisation and patient service, they help create a friendly and professional environment where patients feel supported throughout their physiotherapy journey.',
    photo: '/team/neveen.webp',  
      order: 2,
  },
  ]
