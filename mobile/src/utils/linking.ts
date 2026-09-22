import { Linking } from 'react-native';

/** Opens an external URL (videos, policies). Returns false instead of throwing when it cannot. */
export async function openUrl(url: string): Promise<boolean> {
  try {
    if (!/^https?:\/\//i.test(url)) return false; // only ever open web links from server data
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
