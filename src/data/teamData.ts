export interface TeamMember {
  id: string
  name: string
  title: string
  qualifications?: string
  "AHPRA registration number"?: string
  specialties?: string
  bio?: string
  photo?: string
  order: number
}

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Micheal Ghattas',
    title: 'Principal Physiotherapist',
    qualifications: 'BPhty, DPT, AHPRA Registered',
    "AHPRA registration number": 'PHY0002634794',
    specialties: 'Musculoskeletal, Neurological, Orthopaedic, Aged Care, Cervicogenic Dizziness',
    bio: 'Michael is an experienced physiotherapist with over 15 years of experience in physiotherapy. His career has taken him across several countries, including Egypt, Kuwait, and Australia, where he has worked with a wide range of patients and conditions. This experience has shaped his practical, results-focused approach to rehabilitation. Through Physio to Home, Michael focuses on delivering high-quality physiotherapy in the comfort of patients’ homes. His goal is to help people improve mobility, manage pain, and maintain independence in their everyday lives. Outside of work, Michael enjoys spending time with family, listening to music, and cooking.',
    photo: '/team/micheal.webp',
    order: 4,
  },
  {
    id: '2',
    name: 'Neveen Wahba',
    title: 'Practice Manager',
    qualifications: 'BPhty, Practice Administration',
    specialties: 'Team Coordination and Staff Support',
    bio: 'Neveen brings a unique perspective to her role as Practice Manager — having worked as a physiotherapist herself, she understands the clinical side of patient care as well as the operational. She ensures every patient experience is smooth from the first phone call to the final appointment, coordinating schedules, supporting the clinical team, and making sure nothing falls through the cracks. Her background in physiotherapy means she can speak the same language as both patients and clinicians, which makes all the difference in a small, patient-focused practice like Physio to Home.',
    photo: '/team/neveen.webp',
    order: 2,
  },
  {
    id: '3',
    name: 'Jackline Moawad',
    title: 'Physiotherapist',
    qualifications: 'BPhty, DPT, AHPRA Registered',
    "AHPRA registration number": 'PHY0004065439',
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
    "AHPRA registration number": 'PHY0002588727',
    specialties: 'Neurological Rehabilitation, Musculoskeletal, Aged Care, Cardiopulmonary, NDIS & Home Care',
    bio: "Blessed brings over 16 years of physiotherapy experience across hospital, aged care, and community settings in India and Australia. He holds a Bachelor and Master of Physiotherapy from Tamil Nadu Dr. MGR Medical University and is AHPRA registered. Blessed has worked extensively with neurological conditions including stroke, Parkinson's disease, cerebral palsy and spinal injuries, as well as musculoskeletal and cardiopulmonary rehabilitation. Most recently he has been based in Launceston, working with NDIS and home care participants — making him a natural fit for the Physio to Home model. He is known for his patient-centred approach and his ability to design individualised programs that meet people where they are.",
    photo: '/team/blessed.jpg',
    order: 6,
  },
  {
    id: '5',
    name: 'Kanza Nadeem',
    title: 'Physiotherapist',
    qualifications: 'BPhty, DPT, AHPRA Registered',
    "AHPRA registration number": 'PHY0002768198',
    specialties: 'Musculoskeletal, Neurological Rehabilitation, Manual Therapy, Dry Needling',
    bio: "Kanza is an AHPRA registered Physiotherapist who completed her Doctor of Physical Therapy from LMDC, with advanced training in neurological rehabilitation and musculoskeletal physiotherapy. She works with conditions such as cerebral palsy and hemiplegia, focusing on improving mobility, function, and quality of life. She also integrates musculoskeletal rehabilitation, post-operative rehabilitation, and women's health physiotherapy into her holistic approach to care. Kanza is trained and competent in Mobilisation and Manual Therapy, Dry Needling, and Kinesio Taping, with a research-based clinical approach.",
    photo: '/team/kanza.jpg',
    order: 5,
  },
  {
    id: '6',
    name: 'Rafik Morqos',
    title: 'Senior Physiotherapist',
    qualifications: 'BPhysio, MPhysio, AHPRA Registered',
    "AHPRA registration number": 'PHY0004006279',
    specialties: 'Home Visit Physiotherapy, Musculoskeletal, Neurological Rehabilitation, Orthopaedic Rehabilitation, Dry Needling & Manual Therapy, NDIS & Aged Care, Post-Operative Rehabilitation, Falls Prevention & Mobility Training',
    bio: `Rafik Morqos is an AHPRA-registered physiotherapist with over 15 years of clinical experience, including senior leadership. He has extensive experience managing complex musculoskeletal, neurological, and orthopaedic conditions, with a strong focus on manual therapy, dry needling, kinesio taping, and individualised rehabilitation programs. Rafik has led multidisciplinary teams, supervised junior physiotherapists, and contributed to quality improvement initiatives within hospital settings. He is highly experienced in developing structured rehabilitation pathways that transition patients from hospital to home-based care. Rafik provides home visit physiotherapy with Physio To Home, supporting patients to improve mobility, independence, and quality of life in their own environment. He is known for his clear communication, patient education, and ability to adapt treatment plans to individual goals and home environments.`,
    photo: '/team/rafik.jpg',
    order: 3,
  },
  {
    id: '7',
    name: 'Christine Girgis',
    title: 'Physiotherapist',
    qualifications: 'BPhty, AHPRA Registered',
    "AHPRA registration number": ' PHY0002184461',
    specialties: 'Musculoskeletal, Chronic Pain, Neurological Rehabilitation, Aged Care, NDIS, WorkCover',
    bio: "Christine enjoys helping people improve mobility, reduce pain, and build independence in everyday life. Her approach is calm, supportive, and focused on achievable long-term progress. She has worked across musculoskeletal clinics, community rehabilitation, aged care, WorkCover programs, and NDIS services both overseas and throughout Australia, including nearly seven years in Queensland. Christine has extensive experience supporting people living with chronic pain, mobility challenges, neurological conditions, and functional limitations. She was inspired to pursue physiotherapy after seeing firsthand how rehabilitation positively transformed the life of a close family member, and values the combination of movement, problem-solving, and genuine human connection the profession offers.",
    photo: '/team/christine.jpg',
    order: 7,
  },
  {
    id: '8',
    name: 'Cheng Hsiang',
    title: 'Physiotherapist',
    qualifications: 'BPhty, AHPRA Registered',
    "AHPRA registration number": ' PHY0002640758',
    specialties: 'Vestibular Rehabilitation, Falls Prevention, Geriatric Care, Acute & Inpatient Care, Intensive Care, NDIS',
    bio: "Cheng is a dedicated physiotherapist with over a decade of clinical experience helping individuals rebuild their strength, mobility, and confidence. Cheng graduated with a Bachelor of Physiotherapy (Honours) from The University of Queensland. With extensive experience working in a large acute care hospital, Cheng brings deep expertise in inpatient general medicine, emergency care, and intensive care settings. Her clinical background includes specialised work in vestibular rehabilitation, fall prevention, and geriatric care, alongside ongoing experience working within the NDIS sector to support community-based functional goals. Outside the clinic, she stays active and practices what she preaches—you'll often find her exploring the great outdoors, running, cycling, or playing tennis. Whether you are recovering from an injury, managing a chronic condition, or working to improve your balance and mobility, Cheng is committed to guiding you every step of the way.",
    photo: '/team/cheng.jpg',
    order: 8,
  },
]
