// Configuration for community links and contact details.
// Update these links with your actual URLs whenever you're ready!

export const COMMUNITY_LINKS = {
  // Replace with your actual WhatsApp community or group invite link
  whatsappCommunityUrl: 'https://chat.whatsapp.com/YOUR_COMMUNITY_INVITE_CODE',

  // Official Instagram profile
  instagramUrl: 'https://instagram.com/lead_tiet',
  instagramHandle: '@lead_tiet',

  // Official society contact email
  contactEmail: 'lead_sc@thapar.edu',

  // Society branding
  societyName: 'LEAD Society',
  institution: 'Thapar Institute of Engineering & Technology (TIET), Patiala',
}

// True once whatsappCommunityUrl above has been replaced with a real invite.
// The success screen hides the join button while it is still the placeholder,
// so applicants are never shown a dead link.
export const HAS_WHATSAPP_COMMUNITY_URL =
  !COMMUNITY_LINKS.whatsappCommunityUrl.includes('YOUR_COMMUNITY_INVITE_CODE')
