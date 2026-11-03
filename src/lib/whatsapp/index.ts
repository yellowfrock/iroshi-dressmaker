/**
 * WhatsApp URL builder utility.
 *
 * Generates properly URL-encoded WhatsApp links for:
 * - General enquiries (no specific dress)
 * - Dress-specific enquiries (pre-fills dress name + ID in message)
 *
 * The phone number is read from site_settings — NEVER hard-coded.
 */

/**
 * Generate a WhatsApp URL for a general enquiry.
 *
 * @param whatsappNumber - International format without '+' (e.g. '94771234567')
 * @returns WhatsApp URL or null if number is not configured
 */
export function getWhatsAppUrl(whatsappNumber: string | null | undefined): string | null {
  if (!whatsappNumber || whatsappNumber.trim() === '') return null
  const cleanNumber = whatsappNumber.replace(/\D/g, '') // strip non-digits
  return `https://wa.me/${cleanNumber}`
}

/**
 * Generate a WhatsApp URL with a pre-filled dress enquiry message.
 *
 * @param whatsappNumber - International format without '+' (e.g. '94771234567')
 * @param dressCode - The dress ID/code (e.g. 'DR001')
 * @param dressName - The dress name (e.g. 'Elegant Bridal Dress')
 * @param imageUrl - Optional photo URL of the dress
 * @param isRental - If true or dressCode starts with RN, formats as a rental booking message
 * @returns WhatsApp URL with encoded message, or null if number not configured
 */
export function getDressEnquiryWhatsAppUrl(
  whatsappNumber: string | null | undefined,
  dressCode: string,
  dressName: string,
  imageUrl?: string | null,
  isRental?: boolean
): string | null {
  if (!whatsappNumber || whatsappNumber.trim() === '') return null
  const cleanNumber = whatsappNumber.replace(/\D/g, '')

  if (isRental || dressCode.toUpperCase().startsWith('RN')) {
    return getRentalBookingWhatsAppUrl(cleanNumber, dressCode, dressName, imageUrl)
  }

  let message = `Hello, I am interested in Dress ID ${dressCode} - ${dressName}. I would like to know more about its availability and pricing. Thank you!`
  if (imageUrl && imageUrl.trim()) {
    message += `\n\nPhoto: ${imageUrl.trim()}`
  }

  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}

/**
 * Generate a WhatsApp URL for Rental Collection bookings.
 * Pre-fills: " RENT OUT BOOKING - WEB " followed by the dress code, name, and image URL.
 *
 * @param whatsappNumber - International format without '+' (e.g. '94771234567')
 * @param dressCode - The rental dress code (e.g. 'RN001')
 * @param dressName - The dress name
 * @param imageUrl - The public image URL of the specific dress
 * @returns WhatsApp URL with encoded message, or null if number not configured
 */
export function getRentalBookingWhatsAppUrl(
  whatsappNumber: string | null | undefined,
  dressCode: string,
  dressName: string,
  imageUrl?: string | null
): string | null {
  if (!whatsappNumber || whatsappNumber.trim() === '') return null
  const cleanNumber = whatsappNumber.replace(/\D/g, '')

  let message = `RENT OUT BOOKING - WEB\n\nDress: ${dressCode} - ${dressName}`
  if (imageUrl && imageUrl.trim()) {
    message += `\nPhoto: ${imageUrl.trim()}`
  }

  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}



