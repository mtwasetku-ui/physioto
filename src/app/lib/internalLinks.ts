/**
 * Internal linking config for blog posts.
 *
 * Each entry maps a keyword (as it appears in post content) to a blog post slug.
 * The keyword match is case-insensitive and links the first occurrence only.
 *
 * To add a new keyword: add a line below following the same pattern.
 * To disable a keyword: delete or comment out its line.
 *
 * IMPORTANT: longer/more specific phrases should come first so they match
 * before a shorter keyword inside them does (e.g. "frozen shoulder pain" before "frozen shoulder").
 */

export const internalLinks: Record<string, string> = {
  // Falls & balance
  'falls prevention exercises':        'falls-prevention-balance-exercises',
  'falls prevention':                  'falls-prevention-home-physiotherapy',
  'balance exercises for seniors':     'how-to-improve-balance-at-home-older-adults',
  'improve balance':                   'how-to-improve-balance-at-home-older-adults',
  'dizziness and falls':               'falls-prevention-dizziness',
  'falls risk':                        'falls-risk-ageing-parents-family-guide',
  'footwear and falls':                'falls-prevention-footwear',

  // Conditions
  'frozen shoulder pain at night':     'how-to-manage-frozen-shoulder-pain-at-night',
  'frozen shoulder':                   'frozen-shoulder-adhesive-capsulitis-home-physiotherapy',
  'cervicogenic dizziness':            'cervicogenic-dizziness-misdiagnosed-clinical-overview',
  'cervicogenic headache':             'neck-pain-cervicogenic-headache-home-physiotherapy',
  'neck pain':                         'neck-pain-cervicogenic-headache-home-physiotherapy',
  'chronic pain':                      'chronic-pain-home-physiotherapy',
  'lower back pain':                   'lower-back-pain-home-treatment',
  'sciatica':                          'sciatica-lumbar-radiculopathy-home-physiotherapy',
  'plantar fasciitis':                 'plantar-fasciitis-heel-pain-home-physiotherapy',
  'heel pain':                         'plantar-fasciitis-heel-pain-home-physiotherapy',
  'tennis elbow':                      'tennis-elbow-golfers-elbow-home-physiotherapy',
  'rotator cuff':                      'rotator-cuff-shoulder-rehabilitation',
  'hip osteoarthritis':                'hip-osteoarthritis-home-physiotherapy',
  'knee osteoarthritis':               'knee-osteoarthritis-home-physiotherapy',
  'osteoarthritis':                    'osteoarthritis-home-physiotherapy',
  'osteoporosis':                      'osteoporosis-bone-health-home-physiotherapy',
  'multiple sclerosis':                'multiple-sclerosis-home-physiotherapy',
  "parkinson's disease":               'parkinsons-disease-home-physiotherapy',
  'parkinsons':                        'parkinsons-disease-home-physiotherapy',
  'stroke rehabilitation':             'stroke-rehabilitation-home-physiotherapy',
  'post-covid fatigue':                'post-covid-fatigue-deconditioning-home-physiotherapy',
  'arthritis':                         'how-to-exercise-safely-with-arthritis',

  // Surgery & rehab
  'hip replacement':                   'post-surgery-hip-replacement',
  'knee replacement':                  'post-surgery-knee-replacement',
  'hip fracture':                      'hip-fracture-rehabilitation-home-physiotherapy',
  'physiotherapy vs surgery':          'physiotherapy-vs-surgery-knee-osteoarthritis',

  // Funding
  'NDIS physiotherapy':                'ndis-home-physiotherapy-funding',
  'NDIS':                              'ndis-home-physiotherapy-funding',
  'My Aged Care':                      'my-aged-care-home-physiotherapy-funding',
  'GP Management Plan':                'medicare-gp-management-plan-physiotherapy-funding',
  'private health insurance':          'private-health-insurance-home-physiotherapy',
  'aged care physiotherapy':           'hidden-cost-inconsistent-physiotherapy-rural-aged-care',

  // General / home physio
  'home physiotherapy':                'benefits-of-home-physiotherapy',
  'home-based physiotherapy':          'benefits-of-home-physiotherapy',
  'mobile physiotherapy':              'mobile-physiotherapy-home-visits',
  'home physio vs clinic':             'home-physiotherapy-vs-clinic-physiotherapy-comparison',
  'rural Tasmania':                    'rural-tasmania-physiotherapy-access-analysis',

  // Booking & services (link to site pages, not blog posts)
  'book an appointment':               '/booking',
  'book a home visit':                 '/booking',
  'request an appointment':            '/booking',
  'get in touch':                      '/booking',
  'musculoskeletal pain':              '/services',
  'post-surgery rehabilitation':       '/services',
  'neurological rehabilitation':       '/services',
  'aged care mobility':                '/services',
  'equipment prescription':            '/services',
  'our services':                      '/services',
}
