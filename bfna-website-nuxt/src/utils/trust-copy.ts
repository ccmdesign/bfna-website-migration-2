/**
 * Copy for `/privacy` and `/contact`.
 *
 * Every sentence is something the repo or the live production privacy policy
 * actually shows. Nothing here is a retention period, a street address, or a
 * promise about a form handler that does not exist.
 *
 * TODO(owner): if the about-page form is later wired to email or a database,
 * name the recipient and the retention period. Today `@submit.prevent` on
 * `bfContactSection` drops the submission.
 *
 * TODO(owner): the production policy at /privacy-policy/ also describes cookies,
 * GDPR rights, and statutory retention. This website's public pages do not set
 * a first-party cookie or run analytics, so that text was not copied. Confirm
 * whether legal wants it anyway.
 *
 * TODO(owner): confirm the legal name quoted from that production policy.
 */

export interface TrustSection {
  heading: string
  paragraphs: string[]
}

export const PRIVACY_LEAD = 'How the Bertelsmann Foundation North America website handles information.'

export const PRIVACY_SECTIONS: TrustSection[] = [
  {
    heading: 'Who runs this site',
    paragraphs: [
      'The public site names the organization as the Bertelsmann Foundation North America, an independent, nonpartisan think tank based in Washington, DC. It publishes research, program pages, projects, and an archive about the transatlantic partnership.',
      'The privacy policy already published on the production site at www.bfna.org/privacy-policy identifies the organization as the Bertelsmann Foundation (North America), Inc. This page describes what this website does. It does not replace a review of that policy by the foundation.'
    ]
  },
  {
    heading: 'What a visit sends',
    paragraphs: [
      'You can read the public pages without an account. Those pages do not set a first-party cookie, and they do not load an analytics script.',
      'Every page does request a Material Symbols stylesheet from fonts.googleapis.com. That request carries the IP address and user agent your browser sends to Google. Photographs and other files may also be requested from bfna.simplyas.com, the asset host configured for this site.'
    ]
  },
  {
    heading: 'The contact form',
    paragraphs: [
      'The about page includes a form with name, email, and message fields. Submitting it does not send those fields to a server. The page cancels the submission in the browser, and this site has no mail handler and no database write for the form. Nothing typed into it is stored here.',
      'Email info@bfna.org is how a message, a correction, or a privacy request reaches the foundation. This page does not give a retention period for form submissions, because the site does not keep them.'
    ]
  },
  {
    heading: 'Other tools on this host',
    paragraphs: [
      'The /wireframes path is an internal design preview. It is not part of the public navigation. That preview can keep review notes in local storage in your browser and can load a feedback script. The public pages do not.',
      'The footer links to the foundation\'s LinkedIn, Instagram, Facebook, YouTube, and Vimeo profiles. Those are other sites, with their own policies. The public pages do not embed their video players.'
    ]
  }
]

export const CONTACT_LEAD = 'How to reach the Bertelsmann Foundation North America.'

export const CONTACT_SECTIONS: TrustSection[] = [
  {
    heading: 'Write to the foundation',
    paragraphs: [
      'The Bertelsmann Foundation North America is an independent, nonpartisan think tank based in Washington, DC. Its work is research, policy dialogue, leadership programs, and multimedia storytelling on the transatlantic partnership.',
      'Email info@bfna.org. That is the address this website publishes for general inquiries, including a question about a publication, a program, an event, or this site. The board, the staff, and the foundation\'s relationship to the Bertelsmann Stiftung are on the about page.'
    ]
  },
  {
    heading: 'The message form',
    paragraphs: [
      'The about page also shows a form with name, email, and message fields. In this version of the site the form does not transmit what you type. The browser cancels the submission, and the fields are not stored on a server. Email is the way a message actually arrives.',
      'The foundation\'s street address is not published on this website yet. The pages that describe the organization place it in Washington, DC. For how the site handles personal information, read the privacy page. Program, project, and insight pages are linked from the home page.'
    ]
  }
]

export function trustText(lead: string, sections: TrustSection[]): string {
  return [lead, ...sections.flatMap(section => [section.heading, ...section.paragraphs])].join('\n')
}
