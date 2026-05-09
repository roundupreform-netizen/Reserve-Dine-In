
import { toPng } from 'html-to-image';

/**
 * Converts a DOM node to a PNG data URL.
 */
export const generateVoucherImage = async (node: HTMLElement): Promise<string | null> => {
  try {
    const dataUrl = await toPng(node, {
      quality: 0.95,
      pixelRatio: 2,
      cacheBust: true,
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating voucher image:', error);
    return null;
  }
};

/**
 * Trigger browser download for a data URL.
 */
export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

/**
 * Shares via WhatsApp. 
 * Note: Browser WhatsApp API doesn't support direct file attachment via URL in all cases,
 * so we provide a message and suggest downloading the voucher if the file share isn't supported.
 */
export const shareToWhatsApp = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
