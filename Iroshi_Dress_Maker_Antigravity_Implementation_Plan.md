# Iroshi Dress Maker — Website Implementation Plan

## 1. Project Overview

Build a modern, responsive website for **Iroshi Dress Maker**, a bridal dress making and rental business.

This is NOT a simple static portfolio website.

The website must have a small content-management/admin system so the owner can regularly:

- Add new dresses
- Upload dress photos
- Edit dress information
- Categorize dresses
- Change availability
- Remove/archive dresses
- Manage the bridal and rental collections

Customers will NOT purchase dresses online.

The primary customer action is:

**View dress → Check availability → Contact Iroshi Dress Maker through WhatsApp**

The website should be designed so that the business owner can manage the collection without coding knowledge.

---

# 2. Most Important Homepage Feature — 300-Frame Dress Rotation

The homepage must contain a premium interactive 360-degree-style dress presentation.

There are approximately **300 sequential images** of one dress.

Current image naming format:

```text
ezgif-frame-001
ezgif-frame-002
ezgif-frame-003
...
ezgif-frame-300
```

Assume the actual extension may be `.jpg`, `.jpeg`, `.png`, or `.webp`. Make the implementation configurable rather than hard-coding the extension everywhere.

## Desired interaction

When the visitor reaches the hero/360 section:

1. The dress image is displayed prominently.
2. The dress remains visually fixed/stable within the hero section while the visitor scrolls.
3. Scrolling DOWN progresses through the 300 frames.
4. Scrolling UP reverses through the frames.
5. The result should feel like the visitor is physically rotating/viewing the dress.
6. The page should continue naturally into the rest of the homepage after the animation section.
7. The animation must work on desktop, tablet, and mobile.

Conceptually:

```text
Scroll ↓
Frame 001
Frame 002
Frame 003
...
Frame 150
...
Frame 300

Scroll ↑
Frame 300
Frame 299
...
Frame 001
```

Do NOT implement this as a video unless technically necessary. The preferred implementation is frame-by-frame image rendering controlled by scroll progress.

---

# 3. 360 Animation Technical Requirements

Use a scroll-driven frame sequence.

Preferred architecture:

- A dedicated `Dress360Viewer` / `ScrollFrameAnimation` component
- Preload or intelligently load the image sequence
- Calculate scroll progress within the hero section
- Convert scroll progress into a frame index
- Render the corresponding frame
- Smoothly update the displayed frame
- Avoid unnecessary React re-renders
- Use `requestAnimationFrame` where appropriate
- Do not load all 300 full-resolution images simultaneously if that causes excessive memory usage

Example logic:

```text
scroll progress = 0.00 → frame 001
scroll progress = 0.25 → approximately frame 075
scroll progress = 0.50 → approximately frame 150
scroll progress = 0.75 → approximately frame 225
scroll progress = 1.00 → frame 300
```

Use clamping so the frame index can never exceed 001–300.

The frame sequence must remain reversible.

## Hero pinning

Use a tall scroll container and a sticky/pinned inner viewer.

Conceptually:

```text
360 SECTION
│
├── tall scroll area
│
└── sticky viewport
      └── dress frame
```

The sticky viewport allows the dress to remain in place while the page scroll position controls the frame.

The exact scroll height should be configurable.

Do not make the entire website permanently pinned.

---

# 4. 360 Image Performance

This is a critical requirement.

300 images can be large and may cause:

- Slow initial page loading
- High memory usage
- Mobile crashes
- Slow frame switching
- Network congestion

Therefore implement performance optimization from the beginning.

Recommended strategy:

### Step 1 — Image optimization

Create optimized versions of the 300 source images.

Prefer:

```text
WebP
```

or, where appropriate:

```text
AVIF
```

Keep the original files separately.

Do not force the browser to download unnecessarily large source images.

### Step 2 — Responsive image dimensions

Use appropriate image dimensions for:

- Desktop
- Tablet
- Mobile

Do not serve a 4000px-wide image to a mobile phone if it is unnecessary.

### Step 3 — Loading strategy

Implement a controlled loading strategy.

At minimum:

- Load the first frame immediately.
- Preload nearby frames.
- Progressively load additional frames.
- Ensure scrolling remains responsive.
- Display a polished loading indicator while the sequence initializes.

### Step 4 — Caching

Configure appropriate browser caching for static image assets.

### Step 5 — Mobile optimization

Mobile devices are especially important.

Do not assume that a desktop implementation will automatically work well on mobile.

If necessary, use a lower-resolution mobile frame sequence.

---

# 5. Homepage Structure

Create the homepage with a flexible structure.

Initial structure:

```text
HEADER
│
├── Logo / Iroshi Dress Maker
├── Home
├── Bridal Collection
├── Rental Collection
├── About
├── Contact
└── WhatsApp CTA

HERO / 360 DRESS EXPERIENCE
│
└── 300-frame scroll animation

INTRODUCTION
│
└── Short introduction to Iroshi Dress Maker

BRIDAL COLLECTION
│
└── Featured bridal dresses

RENTAL COLLECTION
│
└── Featured rental dresses

WHY IROSHI DRESS MAKER
│
└── Short business/service information

WHATSAPP CTA
│
└── Contact through WhatsApp

FOOTER
```

Do not lock the final visual style yet.

The visual design should be easy to modify later.

---

# 6. Collection Categories

The system must support categories.

Initial categories:

```text
Bridal
Rental
```

Design the database so additional categories can be added later without changing the application architecture.

Possible future categories:

```text
Bridesmaid
Engagement
Reception
Evening
Custom Made
Accessories
```

Do not necessarily create these now.

---

# 7. Dress Data Structure

Each dress should contain at minimum:

```text
Dress ID
Dress Name
Category
Description
Availability
Photos
Created Date
Updated Date
```

Recommended database structure:

```text
dresses
---------
id
dress_code
name
category_id
description
availability
created_at
updated_at
```

Availability should initially be simple.

Recommended values:

```text
Available
Unavailable
```

Do not build a complex booking calendar.

The owner will communicate with customers through WhatsApp.

---

# 8. Dress Photos

A dress may have multiple photos.

Do not store multiple image URLs in one database field.

Use a separate image table.

Example:

```text
dress_images
------------
id
dress_id
image_url
image_order
created_at
```

This allows each dress to have:

- Main image
- Front view
- Back view
- Side view
- Detail photographs
- Additional photographs

The owner should be able to upload multiple photos when creating/editing a dress.

---

# 9. Dress Collection Page

Create a dedicated collection page.

Example:

```text
/bridal
/rental
```

or:

```text
/collections/bridal
/collections/rental
```

Each collection should display dress cards.

Each card should show:

- Dress image
- Dress name
- Dress ID
- Category
- Availability
- View Details button

Do not show prices because the business does not sell online and pricing will be discussed through WhatsApp.

---

# 10. Dress Detail Page

Each dress should have its own detail page.

Example:

```text
/dress/DR001
```

or a slug such as:

```text
/dress/elegant-lace-bridal-dress
```

The page should contain:

- Large main photograph
- Image gallery
- Dress name
- Dress ID
- Category
- Availability
- Description
- WhatsApp inquiry button

Example CTA:

```text
ENQUIRE ON WHATSAPP
```

---

# 11. WhatsApp Integration

There is no online purchasing.

There is no online payment.

There is no checkout.

There is no shopping cart.

The main conversion action is WhatsApp.

The WhatsApp button should open a conversation with the business.

The phone number must NOT be hard-coded throughout the application.

Create a configurable site setting:

```text
whatsapp_number
```

The owner can later provide the number.

---

# 12. Dress-Specific WhatsApp Message

When a customer clicks WhatsApp from a particular dress page, automatically prepare a useful message.

Example:

```text
Hello, I am interested in Dress ID DR001 - Elegant Bridal Dress. 
I would like to know more about its availability and rental/custom pricing.
```

The dress name and ID should be dynamically inserted.

The WhatsApp message should be URL encoded correctly.

---

# 13. Admin Dashboard

Create a simple protected admin dashboard.

The owner is not expected to know coding.

The dashboard should allow:

## Dashboard

Display:

```text
Total Dresses
Available Dresses
Unavailable Dresses
Bridal Collection Count
Rental Collection Count
```

## Dress Management

Actions:

```text
Add Dress
Edit Dress
View Dress
Change Availability
Delete/Archive Dress
```

## Add Dress

Form fields:

```text
Dress ID
Dress Name
Category
Description
Availability
Photos
```

The photo uploader should support multiple images.

## Edit Dress

The owner should be able to change:

- Name
- ID
- Category
- Description
- Availability
- Photos

without editing code.

---

# 14. Authentication

The admin area must NOT be publicly accessible.

Implement authentication.

Only an authorized administrator should access:

```text
/admin
```

Customers should only see the public website.

Do not expose database credentials or private API keys in frontend code.

Use environment variables for secrets.

---

# 15. Recommended Technology Architecture

Use a modern full-stack architecture that is beginner-friendly and easy for Antigravity to maintain.

Recommended:

### Frontend

```text
Next.js
React
TypeScript
```

### Styling

Use a flexible styling system such as:

```text
Tailwind CSS
```

Do not establish a fixed visual identity yet.

Create clean design tokens/variables so colors, fonts, spacing, and other design decisions can easily be changed later.

### Backend / Database

Prefer:

```text
Supabase
```

for:

- PostgreSQL database
- Authentication
- Image/file storage
- Admin data
- API access

This keeps the project relatively simple and avoids building a custom backend server unnecessarily.

### Hosting

The implementation should be deployment-ready for a modern hosting provider such as:

```text
Vercel
```

Do not purchase or configure the final domain yet.

---

# 16. Suggested Database

Create the following initial tables.

## categories

```text
id
name
slug
created_at
```

Examples:

```text
Bridal
Rental
```

## dresses

```text
id
dress_code
name
category_id
description
availability
created_at
updated_at
```

## dress_images

```text
id
dress_id
image_url
storage_path
image_order
created_at
```

## site_settings

```text
id
whatsapp_number
business_name
contact_email
phone_number
address
instagram_url
facebook_url
updated_at
```

Keep contact fields optional because the owner will provide these later.

---

# 17. Image Storage

Do not store uploaded dress photographs directly inside the source-code repository.

Use cloud/object storage.

If Supabase is used, create storage buckets such as:

```text
dress-images
360-sequence
```

The 300 homepage frames can be stored separately from normal collection photographs.

Example:

```text
360-sequence/
    ezgif-frame-001.webp
    ezgif-frame-002.webp
    ...
    ezgif-frame-300.webp
```

The exact final storage structure can be adjusted during implementation.

---

# 18. 360 Sequence Configuration

Do not hard-code the sequence in multiple components.

Create a single configuration.

Example concept:

```text
FRAME_COUNT = 300
FRAME_PREFIX = "ezgif-frame-"
FRAME_PADDING = 3
FRAME_EXTENSION = ".webp"
```

The application should generate:

```text
ezgif-frame-001.webp
ezgif-frame-002.webp
...
ezgif-frame-300.webp
```

This will make future replacement of the 360 sequence much easier.

---

# 19. 360 Loading Experience

Before the 360 sequence is ready, show a clean loading state.

Example:

```text
Loading collection...
```

or a percentage:

```text
Loading 360° Experience — 62%
```

Do not block the entire website if the 360 sequence is still loading.

The rest of the page should remain usable where practical.

---

# 20. Accessibility

The animation must not be the only way to understand the product.

Provide:

- Accessible image alt text
- Keyboard-accessible navigation
- Normal collection pages
- Reduced-motion support

If the user has enabled reduced motion:

```text
prefers-reduced-motion: reduce
```

provide a simpler/static experience instead of forcing a large scroll animation.

---

# 21. Mobile Behavior

The mobile experience must be intentionally designed.

Do NOT simply shrink the desktop version.

On mobile:

- Keep the dress visually prominent.
- Ensure the frame sequence remains responsive.
- Avoid excessive scroll length.
- Prevent horizontal overflow.
- Ensure WhatsApp CTA is easy to reach.
- Make dress cards touch-friendly.
- Optimize image sizes.

Consider a sticky bottom WhatsApp CTA on mobile if it improves usability.

Keep this feature configurable.

---

# 22. SEO

Implement basic SEO from the beginning.

The site should have:

- Proper page titles
- Meta descriptions
- Open Graph metadata
- Semantic HTML
- Descriptive image alt text
- Clean URLs
- Sitemap
- Robots.txt
- Canonical URLs where appropriate

Each dress detail page should be indexable if desired.

Do not expose private admin pages to search engines.

---

# 23. Performance

Performance is especially important because the homepage contains 300 frames.

Target:

- Fast first contentful display
- Optimized images
- Lazy loading where appropriate
- Efficient frame switching
- No unnecessary React re-renders
- Proper caching
- Responsive image delivery
- Minimal JavaScript where possible

Do not sacrifice the 360 experience unnecessarily, but do not allow it to make the whole website slow.

---

# 24. Error Handling

The application should gracefully handle:

### Missing dress image

Display a fallback image/placeholder.

### Missing 360 frame

Do not crash the homepage.

Log the missing frame and continue gracefully where possible.

### Failed image upload

Show a clear error message in the admin dashboard.

### Failed database request

Show a user-friendly error state.

Do not expose technical database errors to customers.

### Invalid WhatsApp configuration

Hide/disable the WhatsApp action until a valid number is configured.

---

# 25. Admin UX

The admin interface should be simple enough for a non-technical business owner.

Avoid unnecessary technical terminology.

Prefer:

```text
Add New Dress
```

instead of:

```text
Create Database Record
```

Use clear buttons:

```text
Save Dress
Update Dress
Change Availability
Upload Photos
Delete Dress
```

Show confirmation before destructive actions.

---

# 26. Delete vs Archive

Do not immediately permanently delete dresses from the database.

Prefer an archive approach.

Example field:

```text
is_active
```

or:

```text
status
```

This allows old dresses to be removed from the public collection without losing historical information.

---

# 27. Security Requirements

The application must:

- Protect admin routes
- Secure authentication
- Keep database credentials server-side
- Keep storage credentials private
- Validate uploaded files
- Restrict allowed image file types
- Restrict excessively large uploads
- Sanitize/validate user-entered data
- Use secure database access policies
- Prevent unauthorized modification of dresses

Never place secret keys directly in client-side JavaScript.

---

# 28. Future Expansion

Do not build these features now, but structure the application so they can be added later:

```text
Customer accounts
Online booking
Date-based availability
Appointment scheduling
Online payments
Dress rental pricing
Custom dress orders
Reviews/testimonials
Instagram feed
Blog
Promotions
Multiple administrators
```

The current implementation should remain simple.

---

# 29. No E-Commerce

Explicitly DO NOT build:

- Shopping cart
- Checkout
- Product purchasing
- Online payment
- Shipping
- Order processing
- Customer payment accounts

This is a dress showcase/rental inquiry website.

The customer contacts Iroshi Dress Maker through WhatsApp.

---

# 30. Initial Content Placeholders

Because the business information will be provided later, use placeholders for:

```text
Business address
Phone number
WhatsApp number
Email
Instagram
Facebook
Business description
Logo
Business hours
```

Do not invent business information.

Create a centralized settings/configuration area so these can be updated easily.

---

# 31. Suggested Project Structure

Use a clean project structure similar to:

```text
src/
├── app/
│   ├── page.tsx
│   ├── bridal/
│   ├── rental/
│   ├── dress/
│   ├── admin/
│   └── ...
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── dresses/
│   ├── collections/
│   ├── whatsapp/
│   └── 360/
│
├── lib/
│   ├── supabase/
│   ├── whatsapp/
│   ├── images/
│   └── utils/
│
├── types/
│
└── config/
```

The exact structure may be adjusted to follow the framework's best practices.

---

# 32. Development Phases

Build the project in phases.

## Phase 1 — Foundation

Create:

- Next.js project
- TypeScript
- Tailwind CSS
- Basic routing
- Responsive layout
- Header
- Footer
- Placeholder homepage

Do not spend excessive time on visual styling yet.

---

## Phase 2 — Database

Create:

- Supabase project integration
- Database schema
- Categories
- Dresses
- Dress images
- Site settings
- Storage buckets

Test database operations.

---

## Phase 3 — Admin

Build:

- Admin authentication
- Admin dashboard
- Dress list
- Add dress
- Edit dress
- Availability control
- Image upload
- Archive/delete functionality

Test the complete CRUD workflow.

---

## Phase 4 — Public Collections

Build:

```text
/bridal
/rental
```

Create:

- Dress cards
- Availability labels
- Filtering/category support where appropriate
- Dress detail pages
- Image galleries
- WhatsApp buttons

---

## Phase 5 — WhatsApp

Implement:

- Central WhatsApp configuration
- Dress-specific inquiry messages
- URL encoding
- Desktop WhatsApp handling
- Mobile WhatsApp handling

Example generated message:

```text
Hello, I am interested in Dress ID DR001 - Elegant Bridal Dress.
I would like to know about availability and pricing.
```

---

## Phase 6 — 360 Homepage

Implement the 300-frame scroll animation.

This phase should be treated as a major technical feature.

Requirements:

- Sticky hero
- Scroll progress tracking
- Frame calculation
- Frame preloading
- Loading progress
- Mobile optimization
- Reverse scrolling
- Reduced-motion fallback
- Missing-frame handling
- Performance optimization

Test with the actual 300 images rather than only placeholder images.

---

## Phase 7 — Performance

Test:

- Desktop
- Android mobile
- iPhone/mobile Safari
- Slow network
- Fast network
- Different screen sizes

Measure:

- Initial page load
- Frame loading time
- Scroll smoothness
- Memory usage
- Mobile stability

Optimize accordingly.

---

## Phase 8 — SEO and Accessibility

Add:

- Metadata
- Sitemap
- Robots.txt
- Open Graph
- Alt text
- Semantic HTML
- Keyboard navigation
- Reduced-motion behavior

---

## Phase 9 — Final Content

The owner will later provide:

- Logo
- Business description
- Address
- WhatsApp number
- Phone
- Social links
- Collection images
- Dress information

Create a simple process for adding this information.

---

## Phase 10 — Deployment

Prepare production deployment.

Recommended initial deployment approach:

```text
GitHub
   ↓
Vercel
   ↓
Supabase
```

Do not purchase or connect a final domain yet.

Initially deploy using the hosting provider's temporary URL.

Later the owner can purchase a domain and connect it.

---

# 33. Important Antigravity Development Rules

Antigravity should follow these rules throughout development:

### Rule 1

Do not create a fake/static admin dashboard.

The admin dashboard must actually modify the database.

### Rule 2

Do not hard-code dress collections.

Dress data must come from the database.

### Rule 3

Do not hard-code availability.

Availability must be editable through the admin dashboard.

### Rule 4

Do not hard-code WhatsApp information in multiple files.

Keep it in site settings/environment configuration.

### Rule 5

Do not build an e-commerce system.

This website is for viewing and contacting through WhatsApp.

### Rule 6

Do not implement the 300-frame animation as 300 unrelated `<img>` elements visible at once.

Use an optimized frame-rendering strategy.

### Rule 7

Do not compromise the original frame sequence.

The order must remain:

```text
001 → 002 → 003 → ... → 300
```

and reverse correctly.

### Rule 8

Do not make the homepage unusable while the frame sequence loads.

Provide a proper loading experience.

### Rule 9

Do not finalize visual branding before the owner provides the desired style.

Use a clean neutral foundation.

### Rule 10

Keep important settings configurable.

---

# 34. Acceptance Criteria

The project is considered functionally complete when all of the following work:

## Homepage

- [x] Homepage loads correctly
- [x] 360 hero section exists
- [x] 300 frames are connected sequentially
- [x] Scrolling down rotates the dress forward
- [x] Scrolling up rotates the dress backward
- [x] Animation works on desktop
- [x] Animation works on mobile
- [x] Loading state works
- [x] Missing frame does not crash the site

## Collection

- [x] Bridal collection works
- [x] Rental collection works
- [x] Dress cards display correctly
- [x] Availability is visible
- [x] Dress detail page works
- [x] Multiple dress images work

## Admin

- [x] Admin login works
- [x] Admin can add a dress
- [x] Admin can edit a dress
- [x] Admin can upload multiple images
- [x] Admin can change availability
- [x] Admin can archive/remove a dress
- [x] Changes appear on the public website

## WhatsApp

- [x] WhatsApp button works
- [x] Dress-specific message is generated
- [x] Correct dress name is included
- [x] Correct dress ID is included

## Security

- [x] Public users cannot access admin functionality
- [x] Secrets are not exposed
- [x] Database permissions are configured correctly
- [x] Image upload validation works

## Performance

- [x] 300 images do not make the website unusably slow
- [x] Mobile remains usable
- [x] Images are optimized
- [x] Frame animation remains smooth

---

# 35. Important First Instruction to Antigravity

Before writing large amounts of code, inspect the project environment and establish the architecture.

Then implement the project incrementally.

Do NOT attempt to generate the entire application as one giant file.

After each major phase:

1. Run the application.
2. Test the relevant functionality.
3. Fix errors.
4. Continue to the next phase.

Prioritize functional correctness over visual polish initially.

The final visual identity will be developed later.

---

# 36. First Development Task

Start with:

1. Create the project foundation.
2. Configure Next.js + TypeScript.
3. Configure Tailwind CSS.
4. Establish the project structure.
5. Create the basic homepage.
6. Create placeholder navigation.
7. Create the database schema plan.
8. Connect Supabase.
9. Confirm the application runs successfully.
10. Then proceed to the admin system.

Do NOT implement the final visual design yet.

The most technically important feature to validate early is the **300-image scroll-controlled 360° dress animation**. Create a working prototype of that feature with the actual `ezgif-frame-001` through `ezgif-frame-300` sequence as early as possible, because its performance characteristics will influence the final homepage architecture.
