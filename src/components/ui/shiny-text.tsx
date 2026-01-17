import React from 'react';

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({
    text,
    disabled = false,
    speed = 5,
    className = '',
}) => {
    const animationDuration = `${speed}s`;

    return (
        <span
            className={`inline-block ${disabled ? '' : 'animate-shine'} ${className}`}
            style={
                {
                    color: '#B5B5B5',
                    background: disabled
                        ? 'none'
                        : 'linear-gradient(120deg, rgba(181, 181, 181, 0.6) 40%, rgba(255, 255, 255, 1) 50%, rgba(181, 181, 181, 0.6) 60%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: disabled ? '#B5B5B5' : 'transparent',
                    animationDuration,
                } as React.CSSProperties
            }
        >
            {text}
        </span>
    );
};

export default ShinyText;
