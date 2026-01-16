
/**
 * Shares content using the native Web Share API if available,
 * otherwise falls back to copying the URL to the clipboard.
 * 
 * @param title The title of the content to share
 * @param text The description or text of the content
 * @param url The URL to share (defaults to current page URL)
 * @returns Promise<'shared' | 'copied' | 'error'>
 */
export async function shareContent(
  title: string,
  text: string,
  url: string = window.location.href
): Promise<'shared' | 'copied' | 'error'> {
  try {
    // Try native share first (mobile & supported browsers)
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      });
      return 'shared';
    } 
    
    // Fallback to clipboard
    await navigator.clipboard.writeText(url);
    return 'copied';
    
  } catch (error: any) {
    // Ignore AbortError (user cancelled share)
    if (error.name === 'AbortError') {
      return 'error'; // distinct from actual error? usually we just ignore
    }
    console.error('Error sharing content:', error);
    return 'error';
  }
}
