import { useEffect, useState } from 'react';

type OS = 'mac' | 'windows' | 'linux' | 'unknown';

export const useOperatingSystem = (): OS => {
    const [os, setOS] = useState<OS>('unknown');

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const platform = window.navigator.platform.toLowerCase();

        if (platform.includes('mac') || userAgent.includes('mac')) {
            setOS('mac');
        } else if (platform.includes('win') || userAgent.includes('win')) {
            setOS('windows');
        } else if (platform.includes('linux') || userAgent.includes('linux')) {
            setOS('linux');
        } else {
            setOS('unknown');
        }
    }, []);

    return os;
};

export const getModifierKey = (os: OS): string => {
    switch (os) {
        case 'mac':
            return '⌘';
        case 'windows':
        case 'linux':
            return 'Ctrl';
        default:
            return 'Ctrl';
    }
};

export const getModifierKeyLabel = (os: OS): string => {
    switch (os) {
        case 'mac':
            return 'Cmd';
        case 'windows':
            return 'Ctrl';
        case 'linux':
            return 'Ctrl';
        default:
            return 'Ctrl';
    }
};
