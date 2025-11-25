import { API_BASE } from './config';

export interface Channel {
  id: string;
  name: string;
  platform: 'TELEGRAM' | 'DISCORD' | 'EMAIL' | 'WHATSAPP';
  channelId: string;
  status: string;
  userId: string;
  credentialId?: string;
  credential?: {
    id: string;
    label: string;
    provider: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChannelsResponse {
  channels: Channel[];
}

export async function getChannels(): Promise<Channel[]> {
  try {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      console.warn('No auth token found');
      return [];
    }

    const response = await fetch(`${API_BASE}/user/channels`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChannelsResponse = await response.json();
    return data.channels;
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
}
