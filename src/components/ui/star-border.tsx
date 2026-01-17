import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
    color?: string;
    speed?: React.CSSProperties['animationDuration'];
    thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
    as,
    className = '',
    color = 'white',
    speed = '5s',
    thickness = 2,
    children,
    ...rest
}: StarBorderProps<T>) => {
    const Component = as || 'button';

    return (
        <Component
            className={`relative inline-block overflow-hidden rounded-full ${className}`}
            {...(rest as React.ComponentPropsWithoutRef<T>)}
            style={{
                padding: `${thickness}px 0`,
                ...((rest as React.ComponentPropsWithoutRef<T>)
                    .style as React.CSSProperties),
            }}
        >
            <div
                className="absolute w-[300%] h-[50%] opacity-90 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 15%)`,
                    animationDuration: speed,
                }}
            ></div>
            <div
                className="absolute w-[300%] h-[50%] opacity-90 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 15%)`,
                    animationDuration: speed,
                }}
            ></div>
            {children}
        </Component>
    );
};

export default StarBorder;
