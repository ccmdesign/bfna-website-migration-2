<!-- Extracted from Google Doc 1ASUJAtfhDdnxk1R12z2vSKAKWo28HOQdXbTDcMsPBRw ("GGS + BFNA Website Refresh: Accessibility Audit") on 2026-08-06. The source doc contains 41 embedded screenshots, none with alt text in the doc itself; each is marked inline as [figure: ...] with its surrounding caption preserved. -->

# GGS x Bertelsmann Foundation North America
# Accessibility Audit


**To:**	Irene Braam, Bertelsmann Foundation North America (BFNA)	Claudio Mendonca + Juliana Andrade, CCM Design
**From:**	Lilia LaGesse + Danielle Veira, Greater Good Strategy (GGS)
**Date:**	January 13, 2026


---


[Table of contents omitted — see headings below]


---


# 1. Executive Summary

## Purpose of This Audit

This accessibility audit was conducted to evaluate the BFNA website against current accessibility standards and to provide clear, actionable guidance for improvement. The goal was to identify high-impact issues that affect real users and to support efficient remediation by BFNA’s web development partner, CCM.Design.

## Scope of Review

The audit focused on the primary BFNA website and representative page templates, including navigation, content pages, publications, multimedia, and forms. BFNA-affiliated microsites were not audited directly but are occasionally referenced where similar patterns were observed. Similar audits should be performed on these microsites at a later date to ensure accessibility standards are met organization wide.

## Overall Accessibility Posture

BFNA’s website demonstrates a solid foundation, including generally clear content structure, consistent branding, and the presence of captions on video content. However, several accessibility issues were identified that may limit access for users who rely on keyboard navigation, screen readers, or assistive technologies.

Many of these issues stem from **reusable design and development patterns**, meaning they can be addressed efficiently at the system or template level. However, existing content such as project resources (PDFs, infographics, videos, etc.) may require manual remediation.

## Key Accessibility Themes

Across the audit, the most significant themes included:
- **Keyboard access and focus visibility** issues that may prevent some users from navigating the site
- **Inconsistent clarity around images, PDFs, and links**, particularly for screen reader users
- **Color contrast and typography choices** that reduce readability in specific contexts
- **Form error messages and confirmation feedback** that lack clarity or sufficient emphasis
- **Implementation complexity identified through automated testing**, particularly related to structural and ARIA patterns

## Why This Matters

Accessibility directly affects who can engage with BFNA’s work. Improving accessibility supports inclusion, usability, and clarity for all users—not just those with disabilities.

Additionally, WCAG 2.1 AA is the technical standard underlying the European Accessibility Act (EAA), which went into effect in 2025. Given BFNA’s transatlantic focus, aligning with these standards helps reduce future risk while reinforcing BFNA’s commitment to equitable access.

## Recommended Next Steps

- Prioritize remediation of high-impact, pattern-based issues (navigation, forms, contrast, content alternatives)
- Coordinate implementation with CCM.Design, focusing on shared components and templates
- Integrate accessibility expectations into CMS workflows to support sustainable improvement
- Plan for targeted re-testing after remediation to validate progress


# 2. Audit Scope + Approach
## Pages + Templates Reviewed

To conduct a focused and representative accessibility audit, a set of core page templates was identified and reviewed. These pages reflect the primary ways users interact with BFNA content and include navigation, long-form content, documents, media, and forms.

The following pages were reviewed as part of this audit:
- **Homepage**
[https://www.bfna.org/](https://www.bfna.org/) 
- **Section / Theme Landing Page**
[https://www.bfna.org/democracy/](https://www.bfna.org/democracy/) 
- **Content Summary with PDF Download (Transponder Magazine)**
[https://www.bfna.org/politics-society/transponder-magazine/](https://www.bfna.org/politics-society/transponder-magazine/) 
- **Media / Video Page**
[https://www.bfna.org/future-leadership/season-3-episode-3-tzipi-livni/](https://www.bfna.org/future-leadership/season-3-episode-3-tzipi-livni/) 
- **Sample Form (Newsletter Sign-Up)**
[https://bfna.us20.list-manage.com/subscribe?u=53fc7e266c23506906a0a602f&id=4447bf4515](https://bfna.us20.list-manage.com/subscribe?u=53fc7e266c23506906a0a602f&id=4447bf4515) 
- **Content Listings / Updates Page**
[https://www.bfna.org/updates/](https://www.bfna.org/updates/) 

These pages were selected to represent shared templates and interaction patterns used across the site. Findings from these pages are intended to inform remediation efforts across similar content and components.

## Standards Referenced

This audit evaluated the BFNA website against the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA**, the internationally recognized standard for accessible digital content.

WCAG 2.1 AA also serves as the primary technical benchmark for compliance with the **European Accessibility Act (EAA)**, which comes into effect in June 2025. While BFNA is a U.S.-based organization, the EAA is relevant because BFNA’s work, audience, and partnerships extend across transatlantic contexts. Digital content that does not meet WCAG 2.1 AA standards may create access barriers for users in the European Union and introduce regulatory or reputational risk.

By using WCAG 2.1 AA as the evaluation standard, this audit provides a practical framework for:
- Improving accessibility for all users
- Supporting alignment with emerging international accessibility requirements
- Reducing future compliance and remediation risk as accessibility expectations continue to evolve

## Testing Approach

A combination of manual testing and automated tools was used to identify accessibility issues and implementation patterns.

Manual testing included:
- Keyboard-only navigation
- Visual focus tracking
- Review of heading structure, link clarity, and content hierarchy
- Review of form behavior, error messaging, and confirmation states
- Spot review of PDFs and multimedia content
Automated testing was used to surface patterns and potential issues for further review.

## Tools Used

The following tools were used as part of the audit process:

- **WAVE Web Accessibility Evaluation Tool**
[https://wave.webaim.org/](https://wave.webaim.org/) 
Used to identify structural, contrast, and ARIA-related flags and to highlight patterns across representative pages.

- **WebAIM Color Contrast Checker**
[https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/) 
Used to evaluate text and background color combinations against WCAG contrast requirements.

- **Browser-based developer tools**
Used for basic inspection of page structure, focus behavior, and interactive elements (non-code review).

- **Manual keyboard testing**
Used to assess navigability, focus order, and operability of interactive components.

These tools were used to **inform**, not replace, manual review and professional judgment.

## Known Limitations

- Automated tools cannot fully evaluate usability, context, or user experience and may surface false positives or incomplete results.
- This audit does not constitute a formal accessibility certification or legal compliance review.
- Accessibility of third-party tools and embedded services may be constrained by vendor limitations.
Despite these limitations, the approach used provides a reliable, practical foundation for prioritizing and addressing accessibility issues.


# 3. Accessibility Audit Findings + Recommendations 
## 3.1 Keyboard Navigation + Focus

Keyboard accessibility is foundational for users who navigate without a mouse, including screen reader users and users with motor impairments. During testing, several keyboard navigation and focus visibility issues were identified that may prevent users from effectively navigating or understanding their position on the page.

### Findings


| **Primary navigation is not fully keyboard accessible.**<br>Key elements of the main navigation, including the hamburger menu, cannot be reliably opened or navigated using a keyboard alone. |  |
| --- | --- |
| [figure: image, no alt text in doc]<br>*Hamburger menu* | [figure: image, no alt text in doc]<br>*Website footer* |
| *Hamburger menu not opening or responding via keyboard navigation (we realize that it matches the footer but a new visitor does not know that). Users navigating by keyboard cannot access this navigation pathway, which limits access to site content and features.* |  |


| **Keyboard focus indicators disappear or are difficult to see in multiple locations.**<br>In several areas, focus styling is either removed or insufficiently visible, making it difficult for keyboard users to track where they are on the page. |
| --- |
| [figure: image, no alt text in doc] |
| *Without a visible focus state, keyboard users can lose track of their position on the page.* |


| **Excessive tab stops before reaching main content.**<br>Users must tab through a large number of links (40+ in some cases) before reaching primary page content, increasing cognitive load and navigation fatigue. |
| --- |
| [figure: image, no alt text in doc] |
| *Users must tab through more than 40 interactive elements before reaching primary page content. This creates unnecessary navigation fatigue and makes content difficult to access for keyboard users.* |


| **Video modal creates a keyboard trap.**<br>When opening the video modal, focus becomes trapped inside the modal with no clear or consistent way to exit using a keyboard. |
| --- |
| [figure: image, no alt text in doc] |
| *Keyboard focus remains trapped inside the video modal, preventing users from closing the modal or returning to page content.* |


| **Focus order is inconsistent across page types.**<br>The sequence in which focus moves through interactive elements does not always match the visual or logical reading order, particularly on pages with sidebars or multiple navigation systems. |
| --- |
| [figure: image, no alt text in doc] |
| *Keyboard focus moves unpredictably between navigation, footer, and content areas rather than following a clear reading order.* |


| **Form elements do not always display a clear focus state.**<br>On form fields and interactive controls, focus styling is subtle or difficult to perceive, particularly against darker backgrounds. |
| --- |
| [figure: image, no alt text in doc] |
| *[Screenshot: Form field with low-contrast or unclear focus state]* |


### Why This Matters

When keyboard focus is unclear or navigation requires excessive tabbing, users may:
- Lose track of their position on the page
- Be unable to access core content or features
- Become trapped in interactive elements without a clear way to proceed

These issues affect screen reader users, keyboard-only users, and users with low vision, and can make otherwise well-structured content effectively unusable.

### Recommendations for CCM.Design
- Ensure all interactive elements are reachable and operable via keyboard.
- Restore or strengthen visible focus indicators across navigation, content, modals, and forms.
- Review focus order to ensure it follows a logical, predictable sequence aligned with visual layout.
- Add a clear keyboard-accessible method to exit modals (e.g., close button with visible focus).
- Reduce unnecessary tab stops or provide a reliable skip-to-content mechanism.

### Priority Level
**  HIGH  ** — These issues can prevent users from navigating the site at all and should be addressed early in the remediation process.

## 3.2 Headings, Structure + Orientation

Clear structure and predictable page organization help users understand where they are on a site and how content is organized. Overall, BFNA’s site demonstrates several strong structural practices; however, some orientation and predictability issues were identified that may be confusing for users navigating with assistive technologies or relying on consistent page behavior.

### Findings


| **Overall heading hierarchy is generally clear and well-structured.**<br>Most pages use a single, descriptive page title and rely on a limited number of subheadings. This supports readability, scanning, and navigation for screen reader users. |
| --- |


| **Pop-ups and overlays visually compete with primary page headings.**<br>On some pages, pop-up content appears visually similar in size or prominence to the main page heading, which may make it difficult for users to distinguish primary content from secondary or temporary content. |
| --- |
| [figure: image, no alt text in doc] |
| *Pop-up content appears visually similar to the main page heading, potentially obscuring content hierarchy and page orientation.* |


| **Page titles and labels are not always consistent across similar page types.**<br>Pages such as Updates, Topic areas, and content listings use similar layouts but different naming conventions, which may make it harder for users to understand how content is organized or how pages relate to one another. |
| --- |
| [figure: image, no alt text in doc] |
| *Similar page layouts use different labels and titles, which may create confusion about page purpose and content hierarchy.* |


| **Navigation behavior differs between desktop and mobile experiences.**<br>The structure and presentation of navigation elements change significantly between desktop and mobile views, requiring users to re-learn navigation patterns depending on device. |  |  |
| --- | --- | --- |
| [figure: image, no alt text in doc] | [figure: image, no alt text in doc] | [figure: image, no alt text in doc] |
| [figure: image, no alt text in doc] |  |  |
| *Navigation elements are presented differently on desktop and mobile, reducing predictability for users navigating across devices. The mobile nav bar is also very long and gives priority to different sections of the website than the desktop view* |  |  |


| **Transitions to external microsites are not clearly communicated.**<br>Links to BFNA-affiliated microsites open within the same tab and introduce entirely new visual and navigational systems without clear notice. This abrupt context shift can be disorienting, particularly for screen reader users and users with cognitive disabilities. |  |
| --- | --- |
| [figure: image, no alt text in doc] | [figure: image, no alt text in doc] |
| *Users are redirected to a separate microsite with a different design and navigation model without clear indication that they are leaving the primary BFNA site.* |  |


### Why This Matters

When page structure and navigation patterns are predictable, users can focus on content rather than orientation. Inconsistent labeling, competing visual hierarchy, and unannounced context changes increase cognitive load and may make it difficult for users—especially those using assistive technologies—to understand where they are or how to return to previous content.

### Recommendations for CCM.Design
- Maintain a consistent visual distinction between primary page headings and secondary content such as pop-ups or overlays.
- Review and standardize naming conventions for similar page types (e.g., Updates, Topic pages, content listings).
- Minimize unnecessary differences between desktop and mobile navigation patterns where possible.
- Clearly indicate when links will take users to external or BFNA-affiliated microsites, particularly when the visual and navigational experience will change.

### Priority Level
**  Medium  ** — These issues do not typically block access but may cause confusion or disorientation and should be addressed to improve overall usability and clarity.


## 3.3 Images, PDFs + Link Clarity

Images, linked documents, and calls to action play a significant role in how users access BFNA content. Several issues were identified that may limit access for users relying on screen readers, keyboard navigation, or context-aware navigation.

### Findings


| **Images frequently lack descriptive alternative text**<br>Many images across the site either have missing alt text or rely on non-descriptive placeholders. This prevents screen reader users from understanding the purpose or content of images, particularly when images convey meaning or context. |
| --- |
| [figure: image, no alt text in doc] |
| *Example of a content image presented without sufficient alt text, limiting access to visual information for screen reader users. In this case, the Transponder magazine cover is described as “alt=" \| ." *<br>*A better alt text description might be “Cover image of Transponder magazine issue 7 features an illustration of a control panel connected by wires to a glowing globe showing Africa and Europe.”* |


| **Complex visual content is not supported by long descriptions**<br>Highly detailed visuals—such as infographics and data-rich graphics—are presented as single images without accompanying text-based explanations. This makes the underlying information inaccessible to users who cannot perceive the visual layout. |
| --- |
| [figure: image, no alt text in doc] |
| *A multi-layered infographic presents key regional data visually, but lacks a long description or text-based equivalent conveying the same information. Posting an accessible PDF version would allow you to guide readers using assistive devices through the content and give them a more equitable experience of the infographic.* |


| **PDF links are not always clearly identified or descriptive**<br>Links that open PDF documents are often labeled with generic text (e.g., “Open full report”), without indicating file type or providing context about the destination. When encountered out of context—such as in a list of links or by a screen reader—these links may be unclear. |
| --- |
| [figure: image, no alt text in doc] |
| *A call-to-action labeled “Open full report” links directly to a PDF without indicating file type or content context.* |


| **Repeated link labels rely on surrounding visual context**<br>Buttons such as “Learn More” are reused across pages and content cards. While often visually associated with descriptive text, identical link labels can be ambiguous for screen reader users navigating via links lists. |
| --- |
| [figure: image, no alt text in doc] |
| *Multiple “Learn More” buttons appear on the same page, relying on nearby visual context rather than unique, descriptive link text.* |


| **PDF accessibility issues extend beyond the website**<br>PDF publications linked from the site contain accessibility issues, including missing alternate text and structural tagging problems. These issues impact users even after they leave the website interface. |  |
| --- | --- |
| [figure: image, no alt text in doc] |  |
| *Adobe Acrobat’s accessibility checker highlights missing alternate text and structural issues within a linked PDF publication.* |  |


### Why This Matters

When images, links, and documents lack clear descriptions or context, users may not understand what content is available or how to access it. These issues disproportionately affect screen reader users, keyboard-only users, and users navigating content non-visually.

### Recommendations for CCM.Design
- Ensure all meaningful images include descriptive alt text aligned with content purpose.
- Provide long descriptions or text-based summaries for complex visuals such as infographics.
- Update PDF links to clearly indicate file type and destination (e.g., “Download Transponder Issue #7 (PDF)”).
- Replace generic link text with descriptive labels that are understandable out of context.
- Address accessibility issues within PDFs as part of the broader remediation effort.

### Priority Level
**  HIGH  ** — These issues directly affect content comprehension and access and should be addressed early in remediation efforts.


## 3.4 Color Contrast + Typography

Color contrast and typographic choices directly affect readability for users with low vision, color vision deficiencies, or those viewing content on low-quality displays. While BFNA’s core brand palette generally supports accessibility, several contrast and readability issues were identified in specific use cases.

### Findings


| **Primary brand colors need minor adjustments to meet contrast requirements**<br>The core BFNA dark teal color used for headings, body copy, and key interface elements meets contrast standards. This provides a strong foundation for accessible design across the site. However, two of the accent colors—orange and green—need to be adjusted to ensure compliance. |  |
| --- | --- |
|  |  |
|  | With a very strong contrast ratio, BFNA dark teal passes both AA and AAA contrast standards for all text sizes. |
| **BFNA Teal: #09435e**<br>*10.6:1 contrast ratio* |  |
|  |  |
|  | The orange color used primarily for Politics & Society content is inaccessible. It fails AA at both large and small sizes. If you’re wedded to the orange, a darker version such as **  #d47a0b  ** could work for large scale text (at least 18pt/24px or bold 14pt/18.5px).  **  #a65c00  ** could work for large and regular sized text. |
| **BFNA Orange: #​​fa8900**<br>*2.43 contrast ratio* |  |
|  | This color works at a large size but fails for smaller text and body copy.<br>Example: The “DEMOCRACY” text in the box fails color contrast standards. The “Demonstrations…” title text passes.<br>[figure: image, no alt text in doc] |
| **BFNA Green: #4f8d71**<br>*3.9:1 contrast ratio* |  |
|  | With a strong contrast ratio, BFNA’s red passes AA contrast threshold for regular and large text. It even passes AAA for large text! |
| **BFNA Red: #C53540**<br>*5.3:1 contrast ratio* |  |
|  | With a very strong contrast ratio, BFNA purple passes both AA and AAA contrast standards for all text sizes. |
| **BFNA Purple: #631764**<br>*11.4:1 contrast ratio* |  |
|  |  |
| [figure: image, no alt text in doc]<br>*Portions of the Democracy introductory body copy fail due to the small font size (16px) and poor color contrast against the background image. “Our Platforms” on the right is completely lost due to poor color contrast between the dark teal and the dark background image. * |  |
| [figure: image, no alt text in doc][figure: image, no alt text in doc]<br>*Poor color contrast ratio (1.4:1) in GDPR Compliance section and confirmation page of the newsletter sign-up form.* |  |
| [figure: image, no alt text in doc]<br>*Sample from current BFNA accents color palette as seen on the Updates webpage:* |  |


| **Accent colors create contrast issues when used for text**<br>Accent colors, particularly orange, are used in ways that reduce readability when applied to body text or placed against light backgrounds. In these instances, text contrast does not consistently meet WCAG minimum requirements. |
| --- |
| [figure: image, no alt text in doc] |
| *Orange accent text appears against a light background, reducing legibility and making the content difficult to read for users with low vision.* |


| **Thin font weights reduce readability at smaller sizes**<br>Light-weight typefaces are used in some body text and interface elements. When paired with lower-contrast colors or smaller font sizes, this reduces readability and increases strain for users with low vision or cognitive disabilities. |
| --- |
| [figure: image, no alt text in doc] |
| *Body text set in a light-weight font combined with muted color contrast makes reading more difficult, particularly at smaller sizes.* |


| **Notification and system messages do not always meet contrast standards**<br>System-generated messages, such as alerts or notifications, use color combinations that do not consistently meet contrast requirements. Because these messages communicate important state changes, insufficient contrast may cause users to miss critical information. |
| --- |
| [figure: image, no alt text in doc] |
| *A system notification appears with insufficient contrast between text and background, making it difficult to perceive.* |


| **Links and underlines lack sufficient visual distinction in some contexts**<br>In certain areas, links rely on color alone or use underlines with insufficient contrast, making them harder to identify as interactive elements. |
| --- |
| [figure: image, no alt text in doc]<br>[figure: image, no alt text in doc] |
| *Link text and underlines do not clearly stand out from surrounding text, reducing discoverability for users with low vision or color blindness.* |


### Why This Matters

Insufficient contrast and subtle typography make content harder to read and interact with, particularly for users with low vision, color vision deficiencies, or cognitive fatigue. These issues can prevent users from perceiving important information or identifying interactive elements.

### Recommendations for CCM.Design
- Validate all text and background color combinations against WCAG 2.1 AA contrast requirements.
- Avoid using accent colors for body text unless contrast requirements are met.
- Increase font weight or size for body copy and key interface elements where readability is reduced.
- Ensure system messages and notifications meet contrast standards and are visually distinct.
- Reinforce link styling with sufficient contrast and non-color indicators (e.g., underlines).

### Priority Level
**  Medium  ** – **  HIGH  ** — These issues may not always block access, but they significantly impact readability and usability and should be addressed as part of core remediation work.


## 3.5 Forms, Errors + User Feedback

Forms are a key interaction point for users engaging with BFNA content, particularly for newsletter subscriptions and updates. While the form structure is relatively simple, several issues were identified related to error clarity, feedback visibility, and accessibility of required interactions.

### Findings


| **Error messages are present but not sufficiently descriptive**<br>When required fields are left incomplete, error messages appear, but the language does not clearly explain what information is missing or how to correct the issue. Generic messages such as “Please enter a value” provide limited guidance, particularly for screen reader users or users encountering the message out of context. |
| --- |
| [figure: image, no alt text in doc] |
| *A required field error is displayed, but the message does not specify which field needs attention or what type of value is expected.* |


| **Error feedback relies heavily on visual styling**<br>Error states are communicated primarily through visual cues such as color changes or outlines. While some error text is present, relying on color alone can make it difficult for users with color vision deficiencies to identify which fields require correction. The error notification style is also inconsistent depending on the field. |
| --- |
| [figure: image, no alt text in doc] |
| *(top) An input field is visually highlighted to indicate an error, relying heavily on color and styling rather than clear instructional text. (bottom)* |


| **Human verification introduces an accessibility barrier**<br>The newsletter subscription form requires users to complete a reCAPTCHA challenge before submission. While common, this interaction can be difficult or impossible for some users with visual, cognitive, or motor disabilities, particularly if an accessible alternative is not clearly available. |  |
| --- | --- |
| [figure: image, no alt text in doc] | *A visual verification challenge is required to submit the form, which may pose accessibility challenges for some users.* |


| **Confirmation messaging lacks clear emphasis**<br>After successful form submission, users receive a confirmation message. However, the message does not use strong visual hierarchy or clear headings, which may make it difficult for users to immediately recognize that their action was successful. |  |
| --- | --- |
| [figure: image, no alt text in doc] | *The confirmation message appears without strong visual emphasis or structural distinction, reducing clarity around successful submission.* |


### Why This Matters

Clear, descriptive error messages and recognizable confirmation states help users understand what went wrong, how to fix it, and when an action has been completed successfully. When feedback is unclear or overly visual, users may become confused, abandon forms, or submit incomplete information.

### Recommendations for CCM.Design
- Replace generic error messages with specific, instructional language that explains how to resolve the issue.
- Ensure error states are not communicated by color alone and include clear text guidance.
- Evaluate alternatives or mitigations for reCAPTCHA to better support users with disabilities.
- Strengthen confirmation messaging using clear headings, contrast, or programmatic announcements to signal success.

### Priority Level
**  HIGH  ** — These issues directly affect task completion and user engagement and should be addressed as part of early remediation efforts.


## 3.6 Video + Multimedia

Video and multimedia content play an important role in BFNA’s storytelling and thought leadership. While some accessibility best practices are in place, several issues were identified that may limit access for users relying on captions, keyboard navigation, or assistive technologies.

### Findings


| **Captions are present. Continue checking to ensure quality and accuracy.**<br>Video content includes captions, which is a strong baseline practice. However, caption accuracy, timing, and completeness vary, which may affect comprehension for Deaf and hard-of-hearing users. |
| --- |
| [figure: image, no alt text in doc] |
| *The auto-captions on YouTube for this video in the Future Leadership section of the website show how names can often be misspelled when using autogenerated captions. In this case “Tzipi Livni” is spelled “TP Livy”...close but not quite. *<br>*(Note: As AI is trained on a wider variety of speech patterns and vernaculars, these issues are starting to abate.)* |


| **Video player controls present keyboard navigation challenges**<br>Users navigating video content by keyboard encounter difficulty accessing or exiting video players, particularly when videos open in overlays or modal contexts. This can prevent users from controlling playback or returning to page content. |
| --- |
| [figure: image, no alt text in doc] |
| *Keyboard focus becomes difficult to manage within the video player, limiting user control of playback and navigation. The close mechanism for the video modal is not clearly emphasized, increasing the risk that users become disoriented or stuck.* |


### Why This Matters

Accessible video and multimedia ensure that all users can engage with BFNA’s content, regardless of sensory or mobility differences. Inconsistent captions, unclear controls, or difficult navigation can prevent users from accessing information or completing tasks.

### Recommendations for CCM.Design
- Review caption quality for accuracy, timing, and completeness across all video content.
- Ensure video players and controls are fully operable via keyboard.
- Provide clear, visible, and keyboard-accessible controls for closing video modals.
- Supplement multimedia content with text-based context or summaries where appropriate.

### Priority Level
**  Low  ** — These issues may not block access entirely but can significantly affect usability and content comprehension for users engaging with video and multimedia. Based on our initial scan of the main BFNA website, most of the videos are hosted on platforms that provide automatic captioning.


## 3.7 Automated Findings

Automated accessibility testing tools were used to supplement manual review and help identify patterns that may not be immediately apparent through visual inspection alone. These tools are effective for surfacing potential issues but cannot fully evaluate usability, context, or user experience.

### Findings

We focused on three of the selected six representative audit pages. These pages offer a better sense about how page complexity influences accessibility. Although by no means the end of your accessibility journey, the entire website should eventually be audited at a later date to get a more comprehensive view of accessibility issues.
 

| **Homepage analysis:** |  |
| --- | --- |
| [figure: image, no alt text in doc] | **AIM Score: 2.6 out of 10**<br>[https://wave.webaim.org/report#/https://www.bfna.org/](https://wave.webaim.org/report#/https://www.bfna.org/)<br>ARIA and Structure issues were the most flagged topics with 154 and 197 incidents respectively.<br>Click the link above for further details. |


| **Transponder Magazine page analysis:** |  |
| --- | --- |
| [figure: image, no alt text in doc] | **AIM Score: 4.6 out of 10**<br>[https://wave.webaim.org/report#/https://www.bfna.org/politics-society/transponder-magazine/](https://wave.webaim.org/report#/https://www.bfna.org/politics-society/transponder-magazine/)<br>This page was deemed more accessible than the homepage. ARIA issues were the most flagged topic.<br>Although alt text issues weren’t flagged, they still need to be addressed because the descriptive text is often lacking or just a line. This is an example of why we do manual AND automated testing.<br>Click the link above for further details on the report. |


| **Newsletter form sign-up analysis:** |  |
| --- | --- |
| [figure: image, no alt text in doc] | **AIM Score: 9 out of 10**<br>[https://wave.webaim.org/report#/https://bfna.us20.list-manage.com/subscribe?u=53fc7e266c23506906a0a602f&id=4447bf4515](https://wave.webaim.org/report#/https://bfna.us20.list-manage.com/subscribe?u=53fc7e266c23506906a0a602f&id=4447bf4515)<br>Given the simplicity of this page, there were many fewer issues detected by the analysis. However, only the first step in completing this form was analyzed by WAVE and the issues flagged in Phase 5 still need to be addressed. Yet another example of why we do manual AND automated testing.<br>Click the link above for further details. |


Here are some consistent themes that arose across the three reviewed pages:


| **Automated testing identified a high volume of structural and ARIA-related flags**<br>Automated scans of content-heavy pages surfaced a large number of alerts related to ARIA usage, structural markup, and contrast. These findings do not necessarily indicate that content is unusable, but they do point to underlying implementation patterns that warrant review. |
| --- |
| [figure: image, no alt text in doc] |
| *Automated testing highlights a high number of alerts and ARIA-related flags on a representative content page, indicating potential structural and semantic issues.* |


| **Third-party forms show fewer automated issues**<br>Automated testing of the third-party newsletter subscription form surfaced significantly fewer errors and alerts. This contrast suggests that some accessibility challenges may stem from custom site implementation rather than embedded external tools. Ideally the CMS system will allow you to more easily address these issues. |
| --- |


| **Automated ARIA flags reflect implementation complexity, not isolated failures**<br>Many ARIA-related alerts point to situations where accessibility attributes may be unnecessary, redundant, or inconsistently applied. These flags typically indicate opportunities to simplify markup and rely more heavily on native HTML semantics rather than signaling critical errors. |
| --- |
| **What is ARIA and why does it matter?**<br>- ARIA is extra information added to a webpage to help screen readers understand interactive elements.<br>- WAVE is flagging that ARIA is being used in places where it’s either unnecessary, inconsistent, or doesn’t match how the page actually behaves. In practical terms, this means:<br>- Some elements are labeled as interactive for screen readers but don’t behave clearly or consistently.<br>- In other cases, ARIA duplicates what standard HTML already does, which can confuse assistive technologies.<br>- A few elements have overlapping or conflicting labels, so screen readers may announce redundant or unclear information.<br>- Some ARIA attributes suggest interactions (like expanding content) that aren’t obvious or fully supported.<br>- Why this matters:<br>- Screen reader users rely on ARIA signals to understand:<br>- What they can interact with<br>- What changed after an action<br>- Where they are on the page<br>- When ARIA doesn’t line up with actual behavior, it creates confusion—even if the page looks fine.<br>- What to do about it (high level):<br>- Use native HTML elements whenever possible.<br>- Only use ARIA when HTML alone isn’t enough.<br>- Make sure ARIA labels and roles match real behavior. |


### Why This Matters

Automated findings help identify patterns and areas of risk, but they cannot assess whether content is understandable, usable, or navigable by real users. Interpreting these results without context may lead to over- or under-prioritizing issues. **Manual testing remains essential for evaluating actual user impact.**

### Recommendations for CCM.Design
- Use automated findings as a guide for identifying structural patterns rather than as a standalone checklist.
- Review ARIA usage to ensure attributes are necessary, consistent, and aligned with actual element behavior.
- Prioritize fixes based on user impact identified through manual testing, not raw error counts.
- Where possible, simplify markup and rely on native HTML semantics to reduce complexity.

### Priority Level
**  Medium  ** — Automated findings highlight implementation patterns that should be reviewed, but remediation should be guided by manual testing and user impact.


# 4. Implementation Notes for CCM.Design

This section is intended to support efficient implementation of the accessibility findings outlined in Section 3. Rather than repeating individual issues, it highlights priority patterns, sequencing considerations, and implementation guidance to support sustainable remediation.
## Priority Issues to Address First
Based on manual testing and observed user impact, the following issue areas should be prioritized early in remediation:

- **Keyboard accessibility and focus visibility**
Issues that prevent users from navigating or understanding their position on the page (e.g., inaccessible navigation, focus loss, keyboard traps) should be addressed first, as they can block access entirely.

- **Forms, errors, and confirmation feedback**
Improving error clarity, confirmation visibility, and required interactions (e.g., reCAPTCHA) will directly support successful task completion for users engaging with BFNA content.

- **Critical contrast failures affecting readability or system feedback**
Address contrast issues where users may miss important information, such as system messages, alerts, or links.

These fixes are likely to improve accessibility across multiple pages and components simultaneously.

## Patterns Affecting Multiple Pages
Many of the accessibility issues identified during the audit reflect **shared patterns**, rather than isolated page-level problems. Addressing these patterns centrally will improve accessibility across the site more efficiently than applying one-off fixes. Key patterns include:
- **Navigation and shared interface components** Issues related to keyboard access, focus visibility, and focus order recur across navigation elements and reusable components.
- **Images, documents, and text alternatives** Images, infographics, and PDFs are used extensively across the site, but do not consistently include appropriate alternative text or accessible document structure.
- **Links and calls to action** Repeated link labels and PDF links rely on surrounding visual context rather than descriptive text that works out of context.
- **Forms and feedback patterns** Error messaging, validation, and confirmation behaviors are reused and exhibit similar accessibility challenges.
- **Global color and typography styles** Contrast and readability issues stem from shared design styles and should be addressed at the system level.
Where possible, remediation should focus on updating these shared components rather than applying one-off fixes.

## CMS + Content Model Considerations
BFNA is transitioning to Directus CMS, which presents an opportunity to embed accessibility best practices into future workflows. Key considerations include:

- **Content models that support accessibility by default**
For example, ensuring image fields prompt for meaningful alt text and support long descriptions for complex visuals.

- **Editorial guidance and guardrails**
Providing clear guidance for content authors on headings, link text, and document uploads can reduce future accessibility issues.

- **Template-level enforcement**
Where possible, accessibility requirements (e.g., heading structure, focus states, link behavior) should be addressed at the template or component level rather than relying on manual author intervention.

## Microsites + Related Properties
While this audit focuses exclusively on the primary BFNA website, similar accessibility patterns were observed across BFNA-affiliated microsites. Applying the same remediation approach and standards to these properties would support consistency and reduce future risk.

Clear signaling when users transition between the primary site and microsites will also improve orientation and usability.

## Validation + Ongoing Review
After remediation:
- Conduct targeted re-testing of high-impact areas (navigation, forms, media).
- Use automated tools to confirm reductions in structural and contrast flags.
- Periodically review new content and features to ensure accessibility practices are maintained.
Accessibility should be treated as an ongoing practice rather than a one-time fix.


# 5. Next Steps + Validation
## Recommended Next Steps
- Review the findings and recommendations in Section 3 and confirm priority areas for remediation.
- Coordinate implementation planning between BFNA and CCM.Design, focusing first on high-impact, pattern-based fixes.
- Align remediation efforts with upcoming CMS changes to avoid duplicating work.
- Establish clear expectations for accessibility as part of ongoing content creation and updates.
- Apply accessibility best practices to BFNA microsites (can be completed once main website issues are addressed).

## Validation + Re-Testing
After remediation:
- Conduct targeted re-testing of high-impact areas, including navigation, forms, and multimedia.
- Use automated tools to confirm reductions in contrast, structural, and ARIA-related flags.
- Perform spot checks on newly updated or added content to ensure accessibility practices are maintained.
- Treat accessibility validation as an ongoing practice rather than a one-time milestone.
