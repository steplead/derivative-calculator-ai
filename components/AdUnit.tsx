'use client';

import { useEffect } from 'react';

type AdUnitProps = {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
};

export default function AdUnit({ slot, format = 'auto', className = '' }: AdUnitProps) {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error', e);
        }
    }, []);

    return (
        <div className={`ad-container my-8 text-center ${className}`}>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Advertisement</div>
            {/* Replace client-id with your actual AdSense Publisher ID */}
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"></ins>
        </div>
    );
}
