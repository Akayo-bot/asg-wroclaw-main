import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface CursorPosition {
    x: number;
    y: number;
}

interface CursorContextType {
    position: React.MutableRefObject<CursorPosition>;
    isInitialized: React.MutableRefObject<boolean>;
}

const CursorContext = createContext<CursorContextType | null>(null);

export const CursorProvider = ({ children }: { children: ReactNode }) => {
    const position = useRef<CursorPosition>({ x: 0, y: 0 });
    const isInitialized = useRef<boolean>(false);

    return (
        <CursorContext.Provider value={{ position, isInitialized }}>
            {children}
        </CursorContext.Provider>
    );
};

export const useCursor = () => {
    const context = useContext(CursorContext);
    if (!context) {
        throw new Error('useCursor must be used within a CursorProvider');
    }
    return context;
};



