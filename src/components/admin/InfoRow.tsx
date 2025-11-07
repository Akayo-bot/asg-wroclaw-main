import React from 'react';
import { Chip } from './Chip';

interface InfoRowProps {
    label: string;
    value: string;
    tone?: 'ok' | 'warn' | 'bad';
}

export const InfoRow = ({ label, value, tone = 'ok' }: InfoRowProps) => {
    return (
        <div>
            <div className="text-neutral-400">{label}</div>
            <div className="mt-1">
                <Chip tone={tone}>{value}</Chip>
            </div>
        </div>
    );
};
